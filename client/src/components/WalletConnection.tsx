import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  level: number;
  reputation: string;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
  totalRewards: string;
}

export function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const connectWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiRequest('POST', '/api/auth/wallet', { walletAddress });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setConnectedWallet(data.user.walletAddress);
      toast({
        title: "Wallet Connected",
        description: `Connected as ${data.user.username || data.user.walletAddress.slice(0, 6)}...${data.user.walletAddress.slice(-4)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      // Authenticate with backend
      await connectWalletMutation.mutateAsync(walletAddress);

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        toast({
          title: "Connection Rejected",
          description: "Please accept the connection request to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setUser(null);
    queryClient.clear();
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  if (connectedWallet && user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground">
          <div className="font-medium">
            {user.username || `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`}
          </div>
          <div className="text-xs">
            Level {user.level} • {user.totalPredictions > 0 ? 
              ((user.correctPredictions / user.totalPredictions) * 100).toFixed(1) : 0}% accuracy
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          data-testid="button-disconnect-wallet"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      data-testid="button-connect-wallet"
    >
      <i className="fas fa-wallet mr-2"></i>
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
