import { useState, useEffect, useCallback } from 'react';
import { yellowNetworkClient } from '@/lib/yellowNetwork';
import { toast } from '@/hooks/use-toast';

export function useYellowNetwork() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setStatus('connecting');
        await yellowNetworkClient.connect();
        setStatus('connected');
        setIsInitialized(true);
        
        toast({
          title: "Yellow Network Connected",
          description: "Successfully connected to Yellow Network state channels",
        });

        // Subscribe to real-time updates
        yellowNetworkClient.subscribeToPriceUpdates();
        yellowNetworkClient.subscribeToLeaderboard();

      } catch (error) {
        console.error('Failed to connect to Yellow Network:', error);
        setStatus('disconnected');
        
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Yellow Network. Using local mode.",
          variant: "destructive",
        });
      }
    };

    if (!isInitialized) {
      initializeConnection();
    }

    // Check connection status periodically
    const statusCheck = setInterval(() => {
      const currentStatus = yellowNetworkClient.getConnectionStatus();
      setStatus(currentStatus);
    }, 5000);

    return () => {
      clearInterval(statusCheck);
    };
  }, [isInitialized]);

  const submitPrediction = useCallback(async (prediction: {
    assetId: string;
    predictionType: string;
    targetPrice?: number;
    direction?: string;
    timeFrame: number;
  }) => {
    try {
      const predictionId = await yellowNetworkClient.submitPrediction(prediction);
      
      toast({
        title: "Prediction Submitted",
        description: "Your prediction has been submitted to Yellow Network state channels",
      });

      return predictionId;
    } catch (error) {
      console.error('Failed to submit prediction:', error);
      
      toast({
        title: "Submission Failed",
        description: "Failed to submit prediction to Yellow Network",
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    yellowNetworkClient.onMessage(type, handler);
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    submitPrediction,
    onMessage
  };
}
