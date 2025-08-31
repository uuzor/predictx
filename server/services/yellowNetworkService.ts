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

export class YellowNetworkService {
  private clearNodeUrl = process.env.CLEARNODE_URL || 'wss://clearnode.yellow.network/ws';
  private ws: WebSocket | null = null;
  private isConnected = false;

  // Nitrolite session state
  private sessionId: string | null = null;
  private authToken: string | null = null;
  private sessionOpen = false;
  private lastRpcTimestamp: number | null = null;

  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void }>();

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

    // Graceful shutdown to close session
    process.once('SIGINT', () => this.shutdown());
    process.once('SIGTERM', () => this.shutdown());
  }

  private async shutdown() {
    try {
      await this.closeAppSession();
    } catch (e) {
      console.warn('Error during session close on shutdown:', e);
    }
    try {
      this.ws?.close();
    } catch {}
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.clearNodeUrl);

      this.ws.onopen = async () => {
        this.isConnected = true;
        console.log('Connected to ClearNode');
        try {
          this.validateEnv();
          await this.authenticate();
          await this.openAppSession();
        } catch (e) {
          console.error('Nitrolite init failed:', e);
        }
      };

      this.ws.onmessage = (event) => {
        this.handleIncoming(event.data.toString());
      };

      this.ws.onerror = (error) => {
        console.error('ClearNode WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('ClearNode connection closed');
        this.isConnected = false;
        this.sessionId = null;
        this.authToken = null;
        setTimeout(() => this.connect(), 5000);
      };
    } catch (error) {
      console.error('Failed to connect to ClearNode:', error);
      setTimeout(() => this.connect(), 5000);
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

  private request<T = any>(method: string, params?: Record<string, JSONValue>): Promise<T> {
    const id = generateRequestId();
    const req: RPCRequest = { id, method, params };
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send(req);
      this.lastRpcTimestamp = Date.now();
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.get(id)?.reject(new Error(`${method} timeout`));
          this.pending.delete(id);
        }
      }, 30000);
    });
  }

  private handleIncoming(payload: string) {
    let msg: any;
    try {
      msg = JSON.parse(payload);
    } catch (e) {
      console.error('Invalid JSON from ClearNode', e);
      return;
    }

    // Resolve request/response style
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id)!;
      this.pending.delete(msg.id);
      try {
        const parsed = parseRPCResponse(msg);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
      return;
    }

    // Could handle subscriptions/notifications here as needed.
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
    return this.isConnected;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return 'connected';
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
}

export const yellowNetworkService = new YellowNetworkService();
