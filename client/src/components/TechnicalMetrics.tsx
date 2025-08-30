import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useYellowNetwork } from '@/hooks/useYellowNetwork';

export function TechnicalMetrics() {
  const { status: yellowNetworkStatus } = useYellowNetwork();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch platform statistics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const technicalMetrics = [
    {
      label: 'Prediction Latency',
      value: '< 100ms',
      description: 'Average time to process predictions',
    },
    {
      label: 'TPS Capacity',
      value: '1,000+',
      description: 'Transactions per second via state channels',
    },
    {
      label: 'Uptime',
      value: '99.9%',
      description: 'Platform availability',
    },
    {
      label: 'Prediction Cost',
      value: '$0.00',
      description: 'Cost per prediction (gasless)',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Platform Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 text-center">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Metrics Loading */}
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-muted rounded mb-1"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-active-predictors">
              {stats?.activePredictors || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Active Predictors</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-total-volume">
              {stats?.totalVolume || '$0'}
            </div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-oracle-accuracy">
              {stats?.oracleAccuracy || '0%'}
            </div>
            <div className="text-sm text-muted-foreground">Oracle Accuracy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-2" data-testid="stat-avg-settlement">
              {stats?.avgSettlement || '0s'}
            </div>
            <div className="text-sm text-muted-foreground">Avg Settlement</div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Performance Metrics */}
      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {technicalMetrics.map((metric, index) => (
              <div key={index} data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>

          {/* Yellow Network Connection Status */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  yellowNetworkStatus === 'connected' ? 'bg-green-500' :
                  yellowNetworkStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-muted-foreground">
                  Yellow Network: {yellowNetworkStatus}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ERC-7824 State Channels Active
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
