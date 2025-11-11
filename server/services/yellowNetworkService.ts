import WebSocket from 'ws';
import {
  RPCMethod,
  parseRPCResponse,
  generateRequestId,
  getCurrentTimestamp,
  createAppSessionMessage,
  createCloseAppSessionMessage,
  type MessageSigner,
} from '@erc7824/nitrolite';
import { Wallet, getBytes } from 'ethers';
import { sessionStateManager } from './sessionStateManager.js';
import { log } from './logger.js';

interface PredictionData {
  userId: string;
  assetId: string;
  predictionType: string;
  targetPrice?: number;
  direction?: string;
  timeFrame: number;
  amount: number;
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
type RPCRequest = {
  id: string;
  method: string;
  params?: Record<string, JSONValue>;
};

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface QueuedRequest {
  request: RPCRequest;
  resolve: (v: any) => void;
  reject: (e: any) => void;
  retryCount: number;
}

export class YellowNetworkService {
  private clearNodeUrl = process.env.CLEARNODE_URL || 'wss://clearnode.yellow.network/ws';
  private ws: WebSocket | null = null;
  private isConnected = false;

  // Nitrolite session state
  private sessionId: string | null = null;
  private authToken: string | null = null;
  private sessionOpen = false;
  private lastRpcTimestamp: number | null = null;

  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void; timeout: NodeJS.Timeout }>();
  private requestQueue: QueuedRequest[] = [];

  // Retry configuration
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 16000,
    backoffMultiplier: 2,
  };

  // Reconnection state
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  // Circuit breaker state
  private failureCount = 0;
  private circuitBreakerThreshold = 5;
  private circuitBreakerResetTime = 60000; // 1 minute
  private circuitOpen = false;
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;

  // Session monitoring
  private sessionTimeout = parseInt(process.env.YELLOW_SESSION_TIMEOUT || '300000'); // 5 minutes default
  private sessionMonitorInterval: NodeJS.Timeout | null = null;

  // EIP-712/plain message signer using server-held private key
  private signer: MessageSigner;

  constructor() {
    // Initialize signer with ethers Wallet
    const pk = process.env.YELLOW_SIGNER_PRIVATE_KEY;
    if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
      console.error('Invalid or missing YELLOW_SIGNER_PRIVATE_KEY. It must be a 32-byte 0x-hex string.');
    }
    const wallet = pk ? new Wallet(pk) : null;
    this.signer = {
      address: (process.env.YELLOW_WALLET_ADDRESS || wallet?.address || '').toLowerCase(),
      async signMessage(message: string): Promise<string> {
        if (!wallet) throw new Error('Wallet not initialized. Set YELLOW_SIGNER_PRIVATE_KEY.');
        // ClearNode challenge may be raw string; if it's EIP-712 typed data, adapt here.
        return await wallet.signMessage(getBytes(message));
      },
    };

    this.connect();
    this.initSessionMonitoring();

    // Graceful shutdown to close session
    process.once('SIGINT', () => this.shutdown());
    process.once('SIGTERM', () => this.shutdown());
  }

  private async shutdown() {
    log.yellowNetwork.info('Shutting down Yellow Network service');

    // Stop session monitoring
    if (this.sessionMonitorInterval) {
      clearInterval(this.sessionMonitorInterval);
    }

    try {
      // Save session state before closing
      if (this.sessionId && this.sessionOpen) {
        const state = sessionStateManager.createInitialState(this.sessionId);
        const closedState = sessionStateManager.closeSession(state);
        await sessionStateManager.saveState(closedState);
        log.yellowNetwork.info('Session state saved', { sessionId: this.sessionId });
      }

      await this.closeAppSession();
    } catch (e) {
      log.yellowNetwork.error('Error during session close on shutdown', e as Error);
    }

    try {
      this.ws?.close();
    } catch {}
  }

  /**
   * Initialize session monitoring to detect timeouts and recover
   */
  private initSessionMonitoring() {
    // Check session every 60 seconds
    this.sessionMonitorInterval = setInterval(async () => {
      try {
        const state = await sessionStateManager.loadState();

        if (state && sessionStateManager.isSessionTimedOut(state, this.sessionTimeout)) {
          log.yellowNetwork.warn('Session timeout detected, attempting recovery', {
            sessionId: state.sessionId,
            inactiveTime: Date.now() - state.lastActivity,
          });

          // Close old session and open new one
          await this.recoverSession();
        }
      } catch (error) {
        log.yellowNetwork.error('Session monitoring error', error as Error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Recover session after timeout or failure
   */
  private async recoverSession() {
    try {
      // Close existing session if open
      if (this.sessionOpen) {
        await this.closeAppSession();
      }

      // Wait a bit before reopening
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Open new session
      if (this.isConnected) {
        await this.openAppSession();
        log.yellowNetwork.info('Session recovered successfully');
      }
    } catch (error) {
      log.yellowNetwork.error('Session recovery failed', error as Error);
    }
  }

  private connect() {
    try {
      // Prevent multiple concurrent connection attempts
      if (this.isReconnecting) {
        console.log('Already reconnecting, skipping duplicate connection attempt');
        return;
      }

      this.isReconnecting = true;
      this.ws = new WebSocket(this.clearNodeUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        console.log('✓ Connected to ClearNode');

        try {
          this.validateEnv();
          await this.authenticate();
          await this.openAppSession();

          // Process any queued requests
          await this.processRequestQueue();

          // Reset circuit breaker on successful connection
          this.resetCircuitBreaker();
        } catch (e) {
          console.error('✗ Nitrolite initialization failed:', e);
          this.incrementFailureCount();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          this.handleIncoming(event.data.toString());
        } catch (error) {
          console.error('✗ Error handling incoming message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('✗ ClearNode WebSocket error:', error);
        this.incrementFailureCount();
      };

      this.ws.onclose = () => {
        console.log('⚠ ClearNode connection closed');
        this.isConnected = false;
        this.sessionId = null;
        this.authToken = null;
        this.sessionOpen = false;
        this.isReconnecting = false;

        // Clear all pending requests with error
        this.clearPendingRequests(new Error('Connection closed'));

        // Attempt reconnection with exponential backoff
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('✗ Failed to connect to ClearNode:', error);
      this.isReconnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`✗ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`);
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, this.reconnectAttempts),
      this.retryConfig.maxDelay
    );

    this.reconnectAttempts++;
    console.log(`⟳ Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearPendingRequests(error: Error) {
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });
    this.pending.clear();
  }

  private async processRequestQueue() {
    if (this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} queued requests...`);

    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const queuedReq of queue) {
      try {
        const result = await this.sendRequest(queuedReq.request);
        queuedReq.resolve(result);
      } catch (error) {
        // Retry logic
        if (queuedReq.retryCount < this.retryConfig.maxRetries) {
          queuedReq.retryCount++;
          this.requestQueue.push(queuedReq);
          console.log(`Requeuing request (attempt ${queuedReq.retryCount}/${this.retryConfig.maxRetries})`);
        } else {
          queuedReq.reject(error);
        }
      }
    }
  }

  private incrementFailureCount() {
    this.failureCount++;

    if (this.failureCount >= this.circuitBreakerThreshold && !this.circuitOpen) {
      console.warn(`⚠ Circuit breaker OPEN: ${this.failureCount} consecutive failures`);
      this.circuitOpen = true;

      // Auto-reset circuit breaker after timeout
      if (this.circuitBreakerTimeout) {
        clearTimeout(this.circuitBreakerTimeout);
      }

      this.circuitBreakerTimeout = setTimeout(() => {
        this.resetCircuitBreaker();
      }, this.circuitBreakerResetTime);
    }
  }

  private resetCircuitBreaker() {
    if (this.circuitOpen) {
      console.log('✓ Circuit breaker CLOSED: Connection restored');
    }
    this.failureCount = 0;
    this.circuitOpen = false;

    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
      this.circuitBreakerTimeout = null;
    }
  }

  private validateEnv() {
    const required = [
      'YELLOW_WALLET_ADDRESS',
      'YELLOW_PARTICIPANT_ADDRESS',
      'YELLOW_APPLICATION_ADDRESS',
      'YELLOW_SIGNER_PRIVATE_KEY',
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
    const pk = process.env.YELLOW_SIGNER_PRIVATE_KEY!;
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
      throw new Error('YELLOW_SIGNER_PRIVATE_KEY must be a 32-byte 0x-hex string');
    }
  }

  private send(request: RPCRequest): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(request));
  }

  private sendRequest<T = any>(request: RPCRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        this.send(request);
        this.lastRpcTimestamp = Date.now();

        const timeout = setTimeout(() => {
          if (this.pending.has(request.id)) {
            this.pending.delete(request.id);
            this.incrementFailureCount();
            reject(new Error(`RPC timeout: ${request.method}`));
          }
        }, 30000);

        this.pending.set(request.id, { resolve, reject, timeout });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async request<T = any>(
    method: string,
    params?: Record<string, JSONValue>,
    retryCount = 0
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitOpen) {
      const error = new Error(`Circuit breaker is OPEN. Service temporarily unavailable.`);
      console.warn(`⚠ ${error.message}`);
      throw error;
    }

    const id = generateRequestId();
    const req: RPCRequest = { id, method, params };

    try {
      // If not connected, queue the request
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        if (retryCount === 0) {
          console.log(`Queueing request ${method} (not connected)`);
          return new Promise<T>((resolve, reject) => {
            this.requestQueue.push({ request: req, resolve, reject, retryCount: 0 });
          });
        } else {
          throw new Error('WebSocket not connected and max retries exceeded');
        }
      }

      const result = await this.sendRequest<T>(req);

      // Success - reset failure count for this request type
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }

      return result;
    } catch (error) {
      this.incrementFailureCount();

      // Retry logic with exponential backoff
      if (retryCount < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
          this.retryConfig.maxDelay
        );

        console.log(
          `⟳ Retrying ${method} (attempt ${retryCount + 1}/${this.retryConfig.maxRetries}) in ${delay}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(method, params, retryCount + 1);
      }

      console.error(`✗ RPC request failed after ${retryCount} retries:`, error);
      throw error;
    }
  }

  private handleIncoming(payload: string) {
    let msg: any;
    try {
      msg = JSON.parse(payload);
    } catch (e) {
      console.error('✗ Invalid JSON from ClearNode:', e);
      return;
    }

    // Resolve request/response style
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject, timeout } = this.pending.get(msg.id)!;

      // Clear timeout to prevent memory leak
      clearTimeout(timeout);
      this.pending.delete(msg.id);

      try {
        const parsed = parseRPCResponse(msg);
        resolve(parsed);
      } catch (err) {
        console.error('✗ Error parsing RPC response:', err);
        reject(err);
      }
      return;
    }

    // Handle subscriptions/notifications
    if (msg.method) {
      console.log('📨 Received notification:', msg.method);
      // Could emit events here for subscription handling
    }
  }

  // Authentication using Nitrolite RPC
  private async authenticate(): Promise<void> {
    // 1) Ask for auth challenge
    const challengeResp: any = await this.request(RPCMethod.AUTH_CHALLENGE, {
      wallet: process.env.YELLOW_WALLET_ADDRESS || '',
      participant: process.env.YELLOW_PARTICIPANT_ADDRESS || '',
      application: process.env.YELLOW_APPLICATION_ADDRESS || '',
      app_name: 'PredictX',
      scope: 'console',
      expire: Math.floor(getCurrentTimestamp() / 1000) + 3600,
      allowances: [],
    });

    // 2) Sign challenge using server-held key (EIP-712/plain depends on ClearNode)
    const challengeMessage = challengeResp?.result?.challengeMessage ?? challengeResp?.params?.challengeMessage;
    if (!challengeMessage) throw new Error('Missing auth challenge message');
    const signature = await this.signer.signMessage(challengeMessage);

    // 3) Verify
    const verifyResp: any = await this.request(RPCMethod.AUTH_VERIFY, {
      challenge: challengeMessage,
      signature,
    });

    const ok = verifyResp?.result?.success ?? verifyResp?.params?.success;
    if (!ok) {
      const err = verifyResp?.result?.error ?? verifyResp?.params?.error ?? 'Unknown';
      throw new Error(`Auth verify failed: ${err}`);
    }

    // Optional: set token if provided
    this.authToken = verifyResp?.result?.token ?? null;
    console.log('Authenticated with ClearNode');
  }

  private async openAppSession(): Promise<void> {
    const wallet = process.env.YELLOW_WALLET_ADDRESS || '';
    const participant = process.env.YELLOW_PARTICIPANT_ADDRESS || '';
    const application = process.env.YELLOW_APPLICATION_ADDRESS || '';

    const { method, params } = createAppSessionMessage(
      {
        wallet,
        participant,
        application,
        nonce: generateRequestId(),
        timestamp: getCurrentTimestamp(),
      },
      this.signer
    );

    const resp: any = await this.request(method, params as Record<string, JSONValue>);
    const sessionId = resp?.result?.sessionId ?? resp?.params?.sessionId;
    if (!sessionId) throw new Error('Failed to open app session');
    this.sessionId = sessionId;
    this.sessionOpen = true;
    console.log('Nitrolite app session opened:', sessionId);
  }

  private async closeAppSession(): Promise<void> {
    if (!this.sessionId) return;
    const { method, params } = createCloseAppSessionMessage(
      {
        sessionId: this.sessionId,
        timestamp: getCurrentTimestamp(),
      },
      this.signer
    );
    try {
      await this.request(method, params as Record<string, JSONValue>);
      console.log('Nitrolite app session closed');
    } catch (e) {
      console.warn('Close session failed:', e);
    } finally {
      this.sessionId = null;
      this.sessionOpen = false;
    }
  }

  // Application-level messages: wrap your app payload within Nitrolite session
  async submitPrediction(prediction: PredictionData): Promise<string> {
    if (!this.sessionId) {
      await this.openAppSession();
    }
    const id = generateRequestId();
    const appPayload = {
      type: 'predictx/submit_prediction',
      data: {
        ...prediction,
        timestamp: getCurrentTimestamp(),
      },
    };

    const resp: any = await this.request(RPCMethod.APP_MESSAGE, {
      sessionId: this.sessionId,
      requestId: id,
      payload: appPayload,
    });

    const predictionId =
      resp?.result?.predictionId ??
      resp?.result?.data?.predictionId ??
      resp?.params?.data?.predictionId;
    if (!predictionId) throw new Error('No predictionId in response');
    return predictionId;
  }

  async settlePrediction(predictionId: string, actualPrice: number, isCorrect: boolean): Promise<string> {
    if (!this.sessionId) {
      await this.openAppSession();
    }
    const id = generateRequestId();
    const appPayload = {
      type: 'predictx/settle_prediction',
      data: {
        predictionId,
        actualPrice,
        isCorrect,
        timestamp: getCurrentTimestamp(),
      },
    };

    const resp: any = await this.request(RPCMethod.APP_MESSAGE, {
      sessionId: this.sessionId,
      requestId: id,
      payload: appPayload,
    });

    const txId = resp?.result?.txId ?? resp?.result?.data?.txId ?? resp?.params?.data?.txId;
    if (!txId) throw new Error('No txId in response');
    return txId;
  }

  isYellowNetworkConnected(): boolean {
    return this.isConnected && this.sessionOpen;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.circuitOpen) return 'disconnected';
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return this.sessionOpen ? 'connected' : 'connecting';
      case WebSocket.CONNECTING:
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  getSessionOpen(): boolean {
    return this.sessionOpen;
  }

  getLastRpcTimestamp(): number | null {
    return this.lastRpcTimestamp;
  }

  getHealthStatus() {
    return {
      connected: this.isConnected,
      sessionOpen: this.sessionOpen,
      circuitOpen: this.circuitOpen,
      failureCount: this.failureCount,
      reconnectAttempts: this.reconnectAttempts,
      queuedRequests: this.requestQueue.length,
      pendingRequests: this.pending.size,
      lastRpcTimestamp: this.lastRpcTimestamp,
    };
  }

  // Force reconnect (useful for manual recovery)
  async forceReconnect(): Promise<void> {
    console.log('🔄 Forcing reconnection...');
    this.reconnectAttempts = 0;
    this.resetCircuitBreaker();

    if (this.ws) {
      this.ws.close();
    }

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.connect();
  }
}

export const yellowNetworkService = new YellowNetworkService();
