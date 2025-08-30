import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CryptoAsset } from '@/types';

export function useCryptoData() {
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);

  const { data: topCoins, isLoading } = useQuery({
    queryKey: ['/api/crypto/top'],
    queryFn: async () => {
      const response = await fetch('/api/crypto/top?limit=10');
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: prices } = useQuery({
    queryKey: ['/api/crypto/prices'],
    queryFn: async () => {
      const response = await fetch('/api/crypto/prices?coins=bitcoin,ethereum,solana,matic-network');
      if (!response.ok) throw new Error('Failed to fetch crypto prices');
      return response.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (topCoins) {
      setCryptoAssets(topCoins);
    }
  }, [topCoins]);

  const getCoinIcon = (symbol: string) => {
    const iconMap: Record<string, string> = {
      'BTC': 'fab fa-bitcoin',
      'ETH': 'fab fa-ethereum',
      'SOL': 'fas fa-sun',
      'MATIC': 'fas fa-shapes',
      'ADA': 'fas fa-circle',
      'DOT': 'fas fa-circle-dot',
      'LINK': 'fas fa-link',
      'UNI': 'fas fa-unicorn',
    };
    return iconMap[symbol.toUpperCase()] || 'fas fa-coins';
  };

  const getCoinColor = (symbol: string) => {
    const colorMap: Record<string, string> = {
      'BTC': 'bg-orange-500',
      'ETH': 'bg-blue-500',
      'SOL': 'bg-purple-500',
      'MATIC': 'bg-purple-600',
      'ADA': 'bg-blue-600',
      'DOT': 'bg-pink-500',
      'LINK': 'bg-blue-700',
      'UNI': 'bg-pink-600',
    };
    return colorMap[symbol.toUpperCase()] || 'bg-gray-500';
  };

  const getPredictionMarkets = (asset: CryptoAsset) => {
    const markets = [
      {
        assetId: asset.id,
        question: `Will ${asset.symbol.toUpperCase()} reach $${(asset.current_price * 1.1).toFixed(asset.current_price < 1 ? 4 : 0)} in 24h?`,
        yesPercentage: Math.floor(Math.random() * 40) + 50, // 50-90%
        noPercentage: 0,
        timeFrame: '24h',
        type: 'price_target' as const,
        targetPrice: asset.current_price * 1.1,
      },
      {
        assetId: asset.id,
        question: `${asset.symbol.toUpperCase()} price movement next hour?`,
        yesPercentage: Math.floor(Math.random() * 30) + 40, // 40-70%
        noPercentage: 0,
        timeFrame: '1h',
        type: 'direction' as const,
        direction: Math.random() > 0.5 ? 'up' : 'down' as const,
      }
    ];

    // Calculate no percentages
    markets.forEach(market => {
      market.noPercentage = 100 - market.yesPercentage;
    });

    return markets;
  };

  return {
    cryptoAssets,
    isLoading,
    getCoinIcon,
    getCoinColor,
    getPredictionMarkets,
    refetch: () => {
      // Trigger manual refetch if needed
    }
  };
}
