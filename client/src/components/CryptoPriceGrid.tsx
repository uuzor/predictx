import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useYellowNetwork } from '@/hooks/useYellowNetwork';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function CryptoPriceGrid() {
  const { cryptoAssets, isLoading, getCoinIcon, getCoinColor, getPredictionMarkets } = useCryptoData();
  const { submitPrediction, isConnected } = useYellowNetwork();
  const queryClient = useQueryClient();

  const createPredictionMutation = useMutation({
    mutationFn: async (predictionData: any) => {
      const response = await apiRequest('POST', '/api/predictions', predictionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/predictions'] });
    },
  });

  const handlePrediction = async (
    assetId: string, 
    predictionType: string,
    answer: 'yes' | 'no' | 'up' | 'down',
    targetPrice?: number,
    timeFrame: number = 24 * 60 // 24 hours in minutes
  ) => {
    try {
      // Mock user ID - in real app, get from auth context
      const userId = 'mock-user-id';
      
      const predictionData = {
        userId,
        assetId,
        predictionType,
        direction: answer === 'up' || answer === 'yes' ? 'up' : 'down',
        targetPrice: targetPrice?.toString(),
        timeFrame,
        expiresAt: new Date(Date.now() + timeFrame * 60 * 1000).toISOString(),
      };

      // Submit to Yellow Network state channel if connected
      if (isConnected) {
        await submitPrediction({
          assetId,
          predictionType,
          targetPrice,
          direction: predictionData.direction,
          timeFrame,
        });
      }

      // Store in database
      await createPredictionMutation.mutateAsync(predictionData);

      toast({
        title: "Prediction Submitted",
        description: `Your ${answer} prediction has been recorded${isConnected ? ' on Yellow Network' : ''}`,
      });

    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Failed",
        description: "Failed to submit prediction. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cryptoAssets.slice(0, 4).map((crypto) => {
        const markets = getPredictionMarkets(crypto);
        const primaryMarket = markets[0];

        return (
          <Card key={crypto.id} className="prediction-card" data-testid={`card-crypto-${crypto.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getCoinColor(crypto.symbol)} rounded-full flex items-center justify-center`}>
                    <i className={`${getCoinIcon(crypto.symbol)} text-white text-sm`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid={`text-crypto-name-${crypto.id}`}>
                      {crypto.name}
                    </h3>
                    <p className="text-xs text-muted-foreground" data-testid={`text-crypto-symbol-${crypto.id}`}>
                      {crypto.symbol.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold" data-testid={`text-crypto-price-${crypto.id}`}>
                    ${crypto.current_price.toLocaleString(undefined, {
                      minimumFractionDigits: crypto.current_price < 1 ? 4 : 2,
                      maximumFractionDigits: crypto.current_price < 1 ? 4 : 2
                    })}
                  </p>
                  <p className={`text-sm font-medium ${crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}
                     data-testid={`text-crypto-change-${crypto.id}`}>
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h?.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-muted rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1" data-testid={`text-prediction-question-${crypto.id}`}>
                    {primaryMarket.question}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Yes: {primaryMarket.yesPercentage}%</span>
                    <span className="text-red-600">No: {primaryMarket.noPercentage}%</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    onClick={() => handlePrediction(
                      crypto.id, 
                      primaryMarket.type, 
                      'yes',
                      primaryMarket.targetPrice,
                      24 * 60
                    )}
                    disabled={createPredictionMutation.isPending}
                    data-testid={`button-predict-yes-${crypto.id}`}
                  >
                    Predict Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                    onClick={() => handlePrediction(
                      crypto.id, 
                      primaryMarket.type, 
                      'no',
                      primaryMarket.targetPrice,
                      24 * 60
                    )}
                    disabled={createPredictionMutation.isPending}
                    data-testid={`button-predict-no-${crypto.id}`}
                  >
                    Predict No
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
