import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Tournament } from '@/types';

export function TournamentGrid() {
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      return response.json();
    },
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async ({ tournamentId, userId }: { tournamentId: string; userId: string }) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/join`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament Joined",
        description: "You have successfully joined the tournament!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Could not join tournament",
        variant: "destructive",
      });
    },
  });

  const handleJoinTournament = (tournamentId: string) => {
    // Mock user ID - in real app, get from auth context
    const userId = 'mock-user-id';
    joinTournamentMutation.mutate({ tournamentId, userId });
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">No Active Tournaments</h3>
        <p className="text-muted-foreground">Check back later for new tournaments!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {tournaments.map((tournament: Tournament) => {
        const participationRate = tournament.maxParticipants 
          ? (tournament.currentParticipants / tournament.maxParticipants) * 100 
          : 0;

        return (
          <Card key={tournament.id} data-testid={`card-tournament-${tournament.id}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2" data-testid={`text-tournament-name-${tournament.id}`}>
                    {tournament.name}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid={`text-tournament-description-${tournament.id}`}>
                    {tournament.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-lg font-bold text-foreground" data-testid={`text-tournament-prize-${tournament.id}`}>
                    {parseFloat(tournament.prizePool).toLocaleString()} USDC
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-medium" data-testid={`text-tournament-participants-${tournament.id}`}>
                    {tournament.currentParticipants}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}
                  </span>
                </div>
                
                {tournament.maxParticipants && (
                  <Progress value={participationRate} className="w-full" />
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Time Remaining</span>
                  <span className={`font-medium ${
                    formatTimeRemaining(tournament.endTime.toString()).includes('d') ? 'text-green-600' : 'text-orange-600'
                  }`} data-testid={`text-tournament-time-${tournament.id}`}>
                    {formatTimeRemaining(tournament.endTime.toString())}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Tournament Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                    tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </span>
                </div>
                
                {tournament.rules && (
                  <div className="text-xs text-muted-foreground mb-3">
                    Max predictions: {tournament.rules.predictionLimit || 'Unlimited'}
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={() => handleJoinTournament(tournament.id)}
                disabled={joinTournamentMutation.isPending || tournament.status !== 'active'}
                data-testid={`button-join-tournament-${tournament.id}`}
              >
                {joinTournamentMutation.isPending ? 'Joining...' : 
                 tournament.status !== 'active' ? 'Tournament Not Active' : 
                 'Join Tournament'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
