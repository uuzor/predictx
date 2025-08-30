interface YellowNetworkConfig {
  clearNodeUrl: string;
  applicationAddress: string;
  participantAddress: string;
  walletAddress: string;
}

export class YellowNetworkClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private config: YellowNetworkConfig;
  private messageHandlers = new Map<string, (data: any) => void>();

  constructor(config: YellowNetworkConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use local WebSocket for development, Yellow Network in production
        const wsUrl = import.meta.env.DEV 
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
          : this.config.clearNodeUrl;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to Yellow Network');
          this.isConnected = true;
          this.authenticate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Yellow Network WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Yellow Network connection closed');
          this.isConnected = false;
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.connect(), 5000);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate() {
    if (!this.isConnected || !this.ws) return;

    // For development, we'll simulate authentication
    // In production, this would implement EIP-712 signing
    const authMessage = {
      type: 'auth_request',
      data: {
        wallet: this.config.walletAddress,
        participant: this.config.participantAddress,
        application: this.config.applicationAddress,
        timestamp: Date.now()
      }
    };

    this.ws.send(JSON.stringify(authMessage));
  }

  private handleMessage(message: any) {
    if (this.messageHandlers.has(message.type)) {
      const handler = this.messageHandlers.get(message.type)!;
      handler(message.data);
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  async submitPrediction(prediction: {
    assetId: string;
    predictionType: string;
    targetPrice?: number;
    direction?: string;
    timeFrame: number;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('Not connected to Yellow Network'));
        return;
      }

      const message = {
        type: 'submit_prediction',
        data: {
          ...prediction,
          timestamp: Date.now(),
          signature: this.mockSignature() // In production, use real EIP-712 signature
        }
      };

      // Create a temporary handler for the response
      const responseHandler = (data: any) => {
        if (data.predictionId) {
          resolve(data.predictionId);
        } else if (data.error) {
          reject(new Error(data.error));
        }
      };

      this.onMessage('prediction_submitted', responseHandler);
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Prediction submission timeout'));
      }, 30000);
    });
  }

  private mockSignature(): string {
    // In production, this would create a real ECDSA signature
    return '0x' + Math.random().toString(16).substring(2).padStart(130, '0');
  }

  subscribeToPriceUpdates() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'subscribe_prices' }));
    }
  }

  subscribeToLeaderboard() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'subscribe_leaderboard' }));
    }
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const yellowNetworkClient = new YellowNetworkClient({
  clearNodeUrl: 'wss://clearnet.yellow.com/ws',
  applicationAddress: import.meta.env.VITE_YELLOW_APPLICATION_ADDRESS || '0x0000000000000000000000000000000000000000',
  participantAddress: import.meta.env.VITE_YELLOW_PARTICIPANT_ADDRESS || '0x0000000000000000000000000000000000000000',
  walletAddress: import.meta.env.VITE_YELLOW_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000'
});
