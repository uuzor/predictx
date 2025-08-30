import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardEntry, User } from '@/types';

export function ReputationLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard?limit=10');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const users: User[] = await response.json();
      
      // Transform to leaderboard entries with calculated accuracy
      return users.map((user, index): LeaderboardEntry => ({
        user,
        rank: index + 1,
        accuracy: user.totalPredictions > 0 ? (user.correctPredictions / user.totalPredictions) * 100 : 0,
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <i className="fas fa-crown text-yellow-500 text-xs"></i>;
      case 2:
        return <i className="fas fa-medal text-gray-400 text-xs"></i>;
      case 3:
        return <i className="fas fa-medal text-orange-600 text-xs"></i>;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 20) return "bg-green-100 text-green-800";
    if (streak >= 10) return "bg-orange-100 text-orange-800";
    if (streak >= 5) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-600";
  };

  const getUserInitials = (user: User) => {
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.walletAddress.slice(2, 4).toUpperCase();
  };

  const getUserDisplayName = (user: User) => {
    return user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/6"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">Global Leaderboard</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">No data available</span>
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p>No predictors found. Be the first to make a prediction!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Global Leaderboard</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Live rankings</span>
            <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Predictor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Accuracy</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Predictions</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rewards</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr 
                  key={entry.user.id} 
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                  data-testid={`row-leaderboard-${entry.rank}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono text-sm px-2 py-1 rounded ${getRankBadge(entry.rank)}`}>
                        {entry.rank}
                      </span>
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">
                          {getUserInitials(entry.user)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-user-name-${entry.rank}`}>
                          {getUserDisplayName(entry.user)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Level {entry.user.level}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm" data-testid={`text-accuracy-${entry.rank}`}>
                        {entry.accuracy.toFixed(1)}%
                      </span>
                      <div className="w-12 bg-muted rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full" 
                          style={{ width: `${Math.min(entry.accuracy, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm" data-testid={`text-predictions-${entry.rank}`}>
                    {entry.user.totalPredictions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-green-600" data-testid={`text-rewards-${entry.rank}`}>
                    {parseFloat(entry.user.totalRewards).toFixed(2)} USDC
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStreakColor(entry.user.currentStreak)}`}>
                      🔥 {entry.user.currentStreak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
