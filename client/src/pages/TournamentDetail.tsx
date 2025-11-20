import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface Tournament {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  prizePool: string;
  entryFee: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  minPredictions: number;
  eligibleAssets: string[];
  rules: string[];
  scoringSystem: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  score: number;
  rewards: string;
}

interface Activity {
  id: string;
  type: 'prediction' | 'settlement' | 'join' | 'rank_change';
  userId: string;
  username: string;
  description: string;
  timestamp: string;
}

interface Participant {
  userId: string;
  username: string;
  joinedAt: string;
  totalPredictions: number;
  accuracy: number;
  rank: number;
}

export default function TournamentDetail() {
  const [, params] = useRoute('/tournaments/:id');
  const tournamentId = params?.id;
  const [searchParticipant, setSearchParticipant] = useState('');
  const currentUserId = 'user123'; // TODO: Get from auth context

  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error('Failed to fetch tournament');
      return res.json();
    },
    enabled: !!tournamentId,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/tournaments/${tournamentId}/leaderboard`],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: activity = [] } = useQuery<Activity[]>({
    queryKey: [`/api/tournaments/${tournamentId}/activity`],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/activity?limit=20`);
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    enabled: !!tournamentId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: [`/api/tournaments/${tournamentId}/participants`],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}/participants`);
      if (!res.ok) throw new Error('Failed to fetch participants');
      return res.json();
    },
    enabled: !!tournamentId,
  });

  const filteredParticipants = participants.filter(p =>
    p.username.toLowerCase().includes(searchParticipant.toLowerCase())
  );

  const userEntry = leaderboard.find(entry => entry.userId === currentUserId);
  const isParticipating = participants.some(p => p.userId === currentUserId);

  const getTimeRemaining = () => {
    if (!tournament) return '';
    const now = new Date();
    const end = new Date(tournament.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getParticipationProgress = () => {
    if (!tournament) return 0;
    return (tournament.currentParticipants / tournament.maxParticipants) * 100;
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Tournament not found</h2>
          <p className="text-muted-foreground">The requested tournament does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tournament Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-5xl lg:text-6xl font-black text-foreground">
                  {tournament.name}
                </h1>
                <Badge
                  className={
                    tournament.status === 'active'
                      ? 'bg-green-500'
                      : tournament.status === 'upcoming'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }
                >
                  {tournament.status}
                </Badge>
              </div>
              <p className="text-xl text-muted-foreground mb-4">
                {tournament.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <i className="fas fa-clock mr-2"></i>
                  {getTimeRemaining()}
                </span>
                <span>
                  <i className="fas fa-users mr-2"></i>
                  {tournament.currentParticipants} / {tournament.maxParticipants} players
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="min-w-[280px]">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prize Pool</span>
                      <span className="text-2xl font-bold text-yellow-500">
                        {parseFloat(tournament.prizePool).toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="font-semibold text-foreground">
                        {parseFloat(tournament.entryFee).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {tournament.status === 'active' && !isParticipating && (
                <Button size="lg" className="w-full">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Join Tournament
                </Button>
              )}

              {tournament.status === 'active' && isParticipating && (
                <Button size="lg" variant="outline" className="w-full">
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Leave Tournament
                </Button>
              )}

              {tournament.status === 'upcoming' && (
                <Button size="lg" className="w-full">
                  <i className="fas fa-bell mr-2"></i>
                  Notify Me
                </Button>
              )}
            </div>
          </div>

          {/* Participation Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Participation</span>
              <span className="text-sm text-muted-foreground">
                {tournament.currentParticipants} / {tournament.maxParticipants}
              </span>
            </div>
            <Progress value={getParticipationProgress()} className="h-2" />
          </div>
        </div>
      </section>

      {/* User Position Card (if participating) */}
      {userEntry && (
        <section className="py-6 bg-primary/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Card className="border-primary">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                      <p className="text-3xl font-bold text-primary">#{userEntry.rank}</p>
                    </div>
                    <div className="h-12 w-px bg-border"></div>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Predictions</p>
                        <p className="text-xl font-semibold text-foreground">{userEntry.totalPredictions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                        <p className="text-xl font-semibold text-green-500">{userEntry.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Score</p>
                        <p className="text-xl font-semibold text-foreground">{userEntry.score}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Potential Reward</p>
                    <p className="text-2xl font-bold text-yellow-500">{userEntry.rewards} USDC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Tabs defaultValue="leaderboard" className="space-y-8">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="leaderboard">
                <i className="fas fa-trophy mr-2"></i>
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="info">
                <i className="fas fa-info-circle mr-2"></i>
                Tournament Info
              </TabsTrigger>
              <TabsTrigger value="activity">
                <i className="fas fa-stream mr-2"></i>
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="participants">
                <i className="fas fa-users mr-2"></i>
                Participants ({participants.length})
              </TabsTrigger>
            </TabsList>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Live Rankings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Updates every 10 seconds • Top 100 shown
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {leaderboardLoading ? (
                    <div className="p-12 text-center text-muted-foreground">
                      Loading leaderboard...
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No participants yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Predictions</TableHead>
                          <TableHead className="text-right">Correct</TableHead>
                          <TableHead className="text-right">Accuracy</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Reward</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.slice(0, 100).map((entry) => (
                          <TableRow
                            key={entry.userId}
                            className={entry.userId === currentUserId ? 'bg-primary/10' : ''}
                          >
                            <TableCell className="font-bold">
                              {entry.rank <= 3 ? (
                                <span className="text-xl">
                                  {entry.rank === 1 && '🥇'}
                                  {entry.rank === 2 && '🥈'}
                                  {entry.rank === 3 && '🥉'}
                                </span>
                              ) : (
                                `#${entry.rank}`
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.username}
                              {entry.userId === currentUserId && (
                                <Badge variant="outline" className="ml-2">You</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{entry.totalPredictions}</TableCell>
                            <TableCell className="text-right text-green-500">
                              {entry.correctPredictions}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{entry.accuracy.toFixed(1)}%</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold">{entry.score}</TableCell>
                            <TableCell className="text-right font-semibold text-yellow-500">
                              {parseFloat(entry.rewards).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournament Info Tab */}
            <TabsContent value="info">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {tournament.rules.map((rule, index) => (
                        <li key={index} className="flex items-start">
                          <i className="fas fa-check-circle text-green-500 mr-3 mt-0.5"></i>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scoring System</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {tournament.scoringSystem}
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Correct Prediction</span>
                        <span className="font-semibold">+100 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy Bonus</span>
                        <span className="font-semibold">+50 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Streak Multiplier</span>
                        <span className="font-semibold">×1.5 per streak</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Eligible Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tournament.eligibleAssets.map((asset) => (
                        <Badge key={asset} variant="outline" className="text-sm px-3 py-1">
                          {asset.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="font-semibold">{tournament.entryFee} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Predictions</span>
                      <span className="font-semibold">{tournament.minPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Time</span>
                      <span className="font-semibold">
                        {new Date(tournament.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Time</span>
                      <span className="font-semibold">
                        {new Date(tournament.endTime).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Feed Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Updates every 5 seconds
                  </p>
                </CardHeader>
                <CardContent>
                  {activity.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">
                      No activity yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activity.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 pb-4 border-b border-border last:border-0"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.type === 'settlement' ? 'bg-green-500/10' :
                            item.type === 'prediction' ? 'bg-blue-500/10' :
                            item.type === 'join' ? 'bg-purple-500/10' :
                            'bg-yellow-500/10'
                          }`}>
                            <i className={`fas ${
                              item.type === 'settlement' ? 'fa-check-circle text-green-500' :
                              item.type === 'prediction' ? 'fa-chart-line text-blue-500' :
                              item.type === 'join' ? 'fa-user-plus text-purple-500' :
                              'fa-arrow-up text-yellow-500'
                            }`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              <span className="font-semibold">{item.username}</span>{' '}
                              {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Participants</CardTitle>
                    <Input
                      type="search"
                      placeholder="Search participants..."
                      value={searchParticipant}
                      onChange={(e) => setSearchParticipant(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Predictions</TableHead>
                        <TableHead className="text-right">Accuracy</TableHead>
                        <TableHead className="text-right">Rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No participants found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredParticipants.map((participant) => (
                          <TableRow key={participant.userId}>
                            <TableCell className="font-medium">
                              {participant.username}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(participant.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">{participant.totalPredictions}</TableCell>
                            <TableCell className="text-right">
                              {participant.accuracy.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              #{participant.rank}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
