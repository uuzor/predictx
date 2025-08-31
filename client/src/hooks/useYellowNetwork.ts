import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useYellowNetwork() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Poll server status to reflect real Nitrolite connection/session
  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const conn = data?.yellowNetwork?.connection as 'connected' | 'connecting' | 'disconnected' | undefined;
        if (mounted && conn) setStatus(conn);
      } catch (e) {
        if (mounted) setStatus('disconnected');
      }
    };

    // initial fetch and interval
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const submitPrediction = useCallback(async (prediction: {
    assetId: string;
    predictionType: string;
    targetPrice?: number;
    direction?: string;
    timeFrame: number;
    userId?: string;
    expiresAt?: string | Date;
  }) => {
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prediction),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      toast({
        title: "Prediction Submitted",
        description: "Your prediction has been submitted.",
      });

      return data?.id ?? data?.predictionId ?? '';
    } catch (error) {
      console.error('Failed to submit prediction:', error);
      
      toast({
        title: "Submission Failed",
        description: "Failed to submit prediction",
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    submitPrediction,
  };
}
