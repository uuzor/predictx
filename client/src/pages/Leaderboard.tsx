import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  walletAddress: string;
  level: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  reputation: string;
  currentStreak: number;
  maxStreak: number;
  totalRewards: string;
  lastActive: string;
}

export default function Leaderboard() {
  const [timePeriod, setTimePeriod] = useState('all_time');
  const [assetCategory, setAssetCategory] = useState('all');
  const [minPredictions, setMinPredictions] = useState('10');
  const currentUserId = 'user123'; // TODO: Get from auth context

  const { data: globalLeaderboard = [], isLoading: globalLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/global', { period: timePeriod, category: assetCategory, minPredictions }],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: timePeriod,
        category: assetCategory,
        minPredictions,
      });
      const res = await fetch(`/api/leaderboard/global?${params}`);
      if (!res.ok) throw new Error('Failed to fetch global leaderboard');
      return res.json();
    },
  });

  const { data: monthlyLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/monthly', { category: assetCategory, minPredictions }],
    queryFn: async () => {
      const params = new URLSearchParams({ category: assetCategory, minPredictions });
      const res = await fetch(`/api/leaderboard/monthly?${params}`);
      if (!res.ok) throw new Error('Failed to fetch monthly leaderboard');
      return res.json();
    },
  });

  const { data: tournamentChampions = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/tournament-champions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/tournament-champions');
      if (!res.ok) throw new Error('Failed to fetch tournament champions');
      return res.json();
    },
  });

  const { data: challengeChampions = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/challenge-champions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard/challenge-champions');
      if (!res.ok) throw new Error('Failed to fetch challenge champions');
      return res.json();
    },
  });

  const userPosition = globalLeaderboard.find(entry => entry.userId === currentUserId);
  const topUser = globalLeaderboard[0];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground mb-4">
              Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Top predictors ranked by accuracy, reputation, and rewards earned
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Time Period:</span>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select value={assetCategory} onValueChange={setAssetCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="layer1">Layer 1</SelectItem>
                  <SelectItem value="layer2">Layer 2</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="meme">Memecoins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Min Predictions:</span>
              <Select value={minPredictions} onValueChange={setMinPredictions}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5+</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                  <SelectItem value="25">25+</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                  <SelectItem value="100">100+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* User Position Card */}
      {userPosition && (
        <section className="py-6 bg-primary/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-xl">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Rank</p>
                    <p className="text-3xl font-bold text-primary">{getRankDisplay(userPosition.rank)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Reputation</p>
                    <p className="text-2xl font-bold text-foreground">{userPosition.reputation}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-green-500">{userPosition.accuracy.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Predictions</p>
                    <p className="text-2xl font-bold text-foreground">{userPosition.totalPredictions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Streak</p>
                    <p className="text-2xl font-bold text-orange-500">{userPosition.currentStreak}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Rewards</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {parseFloat(userPosition.totalRewards).toFixed(2)}
                    </p>
                  </div>
                </div>

                {topUser && userPosition.rank > 1 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Gap to #1 ({topUser.username}):</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Reputation</p>
                        <p className="font-semibold text-red-500">
                          -{(parseInt(topUser.reputation) - parseInt(userPosition.reputation))} pts
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Accuracy</p>
                        <p className="font-semibold text-red-500">
                          -{(topUser.accuracy - userPosition.accuracy).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Rewards</p>
                        <p className="font-semibold text-red-500">
                          -{(parseFloat(topUser.totalRewards) - parseFloat(userPosition.totalRewards)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Main Leaderboard */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Tabs defaultValue="global" className="space-y-8">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="global">
                <i className="fas fa-globe mr-2"></i>
                Global
              </TabsTrigger>
              <TabsTrigger value="monthly">
                <i className="fas fa-calendar-alt mr-2"></i>
                Monthly
              </TabsTrigger>
              <TabsTrigger value="tournaments">
                <i className="fas fa-trophy mr-2"></i>
                Tournament Champions
              </TabsTrigger>
              <TabsTrigger value="challenges">
                <i className="fas fa-swords mr-2"></i>
                Challenge Champions
              </TabsTrigger>
            </TabsList>

            {/* Global Leaderboard */}
            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Global Rankings</CardTitle>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {globalLeaderboard.length} Predictors
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {globalLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading leaderboard...</p>
                    </div>
                  ) : globalLeaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  ) : (
                    <LeaderboardTable entries={globalLeaderboard} currentUserId={currentUserId} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Leaderboard */}
            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Monthly Rankings</CardTitle>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      Resets on 1st of month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {monthlyLeaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No monthly data yet</p>
                    </div>
                  ) : (
                    <LeaderboardTable entries={monthlyLeaderboard} currentUserId={currentUserId} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournament Champions */}
            <TabsContent value="tournaments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Tournament Champions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Top predictors by tournament wins and placements
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {tournamentChampions.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-trophy text-2xl text-muted-foreground"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No champions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Complete tournaments to see champions here
                      </p>
                      <Button>
                        <i className="fas fa-trophy mr-2"></i>
                        Browse Tournaments
                      </Button>
                    </div>
                  ) : (
                    <LeaderboardTable entries={tournamentChampions} currentUserId={currentUserId} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Challenge Champions */}
            <TabsContent value="challenges">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Challenge Champions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Top predictors by challenge wins and win rate
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {challengeChampions.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-swords text-2xl text-muted-foreground"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No champions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Win challenges to see champions here
                      </p>
                      <Button>
                        <i className="fas fa-swords mr-2"></i>
                        Browse Challenges
                      </Button>
                    </div>
                  ) : (
                    <LeaderboardTable entries={challengeChampions} currentUserId={currentUserId} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Top 3 Spotlight */}
      {globalLeaderboard.length >= 3 && (
        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-foreground mb-8 text-center">
              Top 3 Predictors
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2nd Place */}
              <Card className="border-gray-400 order-2 md:order-1">
                <CardHeader className="text-center pb-3">
                  <div className="text-5xl mb-2">🥈</div>
                  <CardTitle className="text-xl">{globalLeaderboard[1].username}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {globalLeaderboard[1].walletAddress.slice(0, 6)}...
                    {globalLeaderboard[1].walletAddress.slice(-4)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-bold">{globalLeaderboard[1].reputation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold text-green-500">
                      {globalLeaderboard[1].accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rewards</span>
                    <span className="font-bold text-yellow-500">
                      {parseFloat(globalLeaderboard[1].totalRewards).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-yellow-500 border-2 md:scale-110 order-1 md:order-2">
                <CardHeader className="text-center pb-3">
                  <div className="text-6xl mb-2">🥇</div>
                  <CardTitle className="text-2xl">{globalLeaderboard[0].username}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {globalLeaderboard[0].walletAddress.slice(0, 6)}...
                    {globalLeaderboard[0].walletAddress.slice(-4)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-bold">{globalLeaderboard[0].reputation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold text-green-500">
                      {globalLeaderboard[0].accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rewards</span>
                    <span className="font-bold text-yellow-500">
                      {parseFloat(globalLeaderboard[0].totalRewards).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-orange-600 order-3">
                <CardHeader className="text-center pb-3">
                  <div className="text-5xl mb-2">🥉</div>
                  <CardTitle className="text-xl">{globalLeaderboard[2].username}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {globalLeaderboard[2].walletAddress.slice(0, 6)}...
                    {globalLeaderboard[2].walletAddress.slice(-4)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-bold">{globalLeaderboard[2].reputation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-bold text-green-500">
                      {globalLeaderboard[2].accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rewards</span>
                    <span className="font-bold text-yellow-500">
                      {parseFloat(globalLeaderboard[2].totalRewards).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Level</TableHead>
          <TableHead className="text-right">Predictions</TableHead>
          <TableHead className="text-right">Accuracy</TableHead>
          <TableHead className="text-right">Reputation</TableHead>
          <TableHead className="text-right">Streak</TableHead>
          <TableHead className="text-right">Rewards</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow
            key={entry.userId}
            className={entry.userId === currentUserId ? 'bg-primary/10 font-semibold' : ''}
          >
            <TableCell className="font-bold text-lg">
              {getRankDisplay(entry.rank)}
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">
                  {entry.username}
                  {entry.userId === currentUserId && (
                    <Badge variant="outline" className="ml-2">You</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="secondary">{entry.level}</Badge>
            </TableCell>
            <TableCell className="text-right">{entry.totalPredictions}</TableCell>
            <TableCell className="text-right">
              <Badge
                className={
                  entry.accuracy >= 80
                    ? 'bg-green-500'
                    : entry.accuracy >= 60
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                }
              >
                {entry.accuracy.toFixed(1)}%
              </Badge>
            </TableCell>
            <TableCell className="text-right font-bold text-purple-500">
              {entry.reputation}
            </TableCell>
            <TableCell className="text-right">
              {entry.currentStreak > 0 ? (
                <span className="text-orange-500 font-semibold">
                  🔥 {entry.currentStreak}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right font-semibold text-yellow-500">
              {parseFloat(entry.totalRewards).toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
