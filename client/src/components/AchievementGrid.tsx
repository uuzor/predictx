import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Achievement } from '@/types';

export function AchievementGrid() {
  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id';

  const { data: achievementData, isLoading } = useQuery({
    queryKey: ['/api/achievements/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/achievements/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const data = await response.json();
      
      // Mark achievements as earned and calculate progress
      const earnedIds = new Set(data.earned.map((ua: any) => ua.achievementId));
      
      return data.available.map((achievement: Achievement) => {
        const isEarned = earnedIds.has(achievement.id);
        let progress = 0;
        
        // Mock progress calculation based on achievement type
        if (!isEarned) {
          switch (achievement.id) {
            case 'market-master':
              progress = 40; // 2/5 tournaments won
              break;
            case 'diamond-predictor':
              progress = 0; // Locked
              break;
            default:
              progress = 0;
          }
        }
        
        return {
          ...achievement,
          earned: isEarned,
          progress: isEarned ? 100 : progress
        };
      });
    },
  });

  const getProgressLabel = (achievement: Achievement & { earned?: boolean; progress?: number }) => {
    if (achievement.earned) {
      return "Earned";
    }
    
    if (achievement.progress === 0) {
      return "Locked";
    }
    
    switch (achievement.id) {
      case 'market-master':
        return "2/5 Progress";
      default:
        return `${achievement.progress}% Progress`;
    }
  };

  const getProgressColor = (achievement: Achievement & { earned?: boolean; progress?: number }) => {
    if (achievement.earned) {
      return "bg-green-100 text-green-800";
    }
    
    if (achievement.progress === 0) {
      return "bg-gray-100 text-gray-600";
    }
    
    return "bg-blue-100 text-blue-800";
  };

  const getCardOpacity = (achievement: Achievement & { earned?: boolean; progress?: number }) => {
    return achievement.earned || (achievement.progress || 0) > 0 ? "opacity-100" : "opacity-60";
  };

  const getGradientColor = (achievementId: string) => {
    const gradients: Record<string, string> = {
      'first-win': 'from-yellow-400 to-yellow-600',
      'hot-streak': 'from-blue-400 to-blue-600',
      'market-master': 'from-purple-400 to-purple-600',
      'diamond-predictor': 'from-red-400 to-red-600',
    };
    return gradients[achievementId] || 'from-gray-400 to-gray-600';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-3"></div>
              <div className="h-6 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!achievementData || achievementData.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">No Achievements Available</h3>
        <p className="text-muted-foreground">Start making predictions to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {achievementData.map((achievement: Achievement & { earned?: boolean; progress?: number }) => (
        <Card 
          key={achievement.id} 
          className={`text-center ${getCardOpacity(achievement)}`}
          data-testid={`card-achievement-${achievement.id}`}
        >
          <CardContent className="p-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${getGradientColor(achievement.id)} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <i className={`${achievement.icon} text-white text-xl`}></i>
            </div>
            <h3 className="font-semibold text-foreground mb-2" data-testid={`text-achievement-name-${achievement.id}`}>
              {achievement.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-achievement-description-${achievement.id}`}>
              {achievement.description}
            </p>
            <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${getProgressColor(achievement)}`}>
              {getProgressLabel(achievement)}
            </div>
            
            {achievement.progress !== undefined && achievement.progress > 0 && !achievement.earned && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${achievement.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.progress}% complete
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
