import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Challenge {
  id: string;
  challengerId: string;
  challengerUsername: string;
  opponentId: string | null;
  opponentUsername?: string;
  assetId: string;
  predictionType: string;
  amount: string;
  timeFrame: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  challengerPrediction?: string;
  opponentPrediction?: string;
  winnerId?: string;
  createdAt: string;
  expiresAt: string;
  settledAt?: string;
}

interface ChallengeStats {
  totalChallenges: number;
  won: number;
  lost: number;
  draws: number;
  winRate: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalEarnings: string;
  rank: number;
}

export default function Challenges() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const currentUserId = 'user123'; // TODO: Get from auth context

  const { data: myChallenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges/user', currentUserId],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/user/${currentUserId}`);
      if (!res.ok) throw new Error('Failed to fetch challenges');
      return res.json();
    },
  });

  const { data: openChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges/open'],
    queryFn: async () => {
      const res = await fetch('/api/challenges/open');
      if (!res.ok) throw new Error('Failed to fetch open challenges');
      return res.json();
    },
  });

  const { data: stats } = useQuery<ChallengeStats>({
    queryKey: ['/api/challenges/stats', currentUserId],
    queryFn: async () => {
      const res = await fetch(`/api/challenges/stats/${currentUserId}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/challenges/leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/challenges/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });

  const { data: recentActivity = [] } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges/recent'],
    queryFn: async () => {
      const res = await fetch('/api/challenges/recent?limit=10');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
  });

  const activeChallenges = myChallenges.filter(c => c.status === 'pending' || c.status === 'accepted');
  const completedChallenges = myChallenges.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground mb-4">
              Prediction Challenges
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Battle head-to-head with other predictors. Create challenges, accept duels, and prove your skills.
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats.totalChallenges}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Challenges</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">
                    {stats.won}
                  </div>
                  <p className="text-sm text-muted-foreground">Won</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-red-500 mb-1">
                    {stats.lost}
                  </div>
                  <p className="text-sm text-muted-foreground">Lost</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-1">
                    {stats.draws}
                  </div>
                  <p className="text-sm text-muted-foreground">Draws</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-center">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-lg px-8">
                  <i className="fas fa-plus-circle mr-2"></i>
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <CreateChallengeForm onClose={() => setCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* My Challenges */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-8">My Challenges</h2>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="active">
                Active ({activeChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedChallenges.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({myChallenges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {challengesLoading ? (
                <LoadingState />
              ) : activeChallenges.length === 0 ? (
                <EmptyState
                  icon="swords"
                  title="No active challenges"
                  description="Create or accept a challenge to get started"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedChallenges.length === 0 ? (
                <EmptyState
                  icon="trophy"
                  title="No completed challenges"
                  description="Complete a challenge to see results here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {myChallenges.length === 0 ? (
                <EmptyState
                  icon="swords"
                  title="No challenges yet"
                  description="Create your first challenge to get started"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myChallenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} currentUserId={currentUserId} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Open Challenges */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-foreground">Open Challenges</h2>
            <Badge variant="outline" className="text-base px-3 py-1">
              {openChallenges.length} Available
            </Badge>
          </div>

          {openChallenges.length === 0 ? (
            <EmptyState
              icon="users"
              title="No open challenges"
              description="Be the first to create a public challenge"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  currentUserId={currentUserId}
                  showAcceptButton
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Challenge Feed & Leaderboard */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Challenge Feed */}
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Recent Activity</h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  ) : (
                    recentActivity.map((challenge) => (
                      <ActivityItem key={challenge.id} challenge={challenge} />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard */}
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Top Challengers</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Wins</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No leaderboard data yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaderboard.slice(0, 10).map((entry) => (
                          <TableRow key={entry.userId}>
                            <TableCell className="font-medium">
                              {entry.rank <= 3 ? (
                                <span className="text-lg">
                                  {entry.rank === 1 && '🥇'}
                                  {entry.rank === 2 && '🥈'}
                                  {entry.rank === 3 && '🥉'}
                                </span>
                              ) : (
                                entry.rank
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{entry.username}</TableCell>
                            <TableCell className="text-right text-green-500 font-medium">
                              {entry.wins}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{entry.winRate.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  showAcceptButton?: boolean;
}

function ChallengeCard({ challenge, currentUserId, showAcceptButton }: ChallengeCardProps) {
  const isChallenger = challenge.challengerId === currentUserId;
  const statusColor = {
    pending: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    completed: challenge.winnerId === currentUserId ? 'bg-green-500' : 'bg-red-500',
    cancelled: 'bg-gray-500',
  }[challenge.status];

  const handleAccept = async () => {
    // TODO: Implement accept challenge logic
    console.log('Accept challenge:', challenge.id);
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {challenge.assetId.toUpperCase()} Challenge
          </CardTitle>
          <Badge className={statusColor}>
            {challenge.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Challenger</p>
            <p className="font-medium text-foreground">{challenge.challengerUsername}</p>
          </div>
          <div className="text-2xl">⚔️</div>
          <div className="text-right">
            <p className="text-muted-foreground">Opponent</p>
            <p className="font-medium text-foreground">
              {challenge.opponentUsername || 'Open'}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stake</span>
            <span className="font-medium text-foreground">{challenge.amount} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Frame</span>
            <span className="font-medium text-foreground">{challenge.timeFrame} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium text-foreground">{challenge.predictionType}</span>
          </div>
        </div>

        {challenge.status === 'completed' && challenge.winnerId && (
          <div className="pt-3 border-t border-border">
            <p className="text-center font-semibold">
              {challenge.winnerId === currentUserId ? (
                <span className="text-green-500">🎉 You Won!</span>
              ) : (
                <span className="text-red-500">You Lost</span>
              )}
            </p>
          </div>
        )}

        {challenge.status === 'completed' && !challenge.winnerId && (
          <div className="pt-3 border-t border-border">
            <p className="text-center font-semibold text-yellow-500">
              Draw
            </p>
          </div>
        )}

        {showAcceptButton && challenge.status === 'pending' && (
          <Button className="w-full" onClick={handleAccept}>
            <i className="fas fa-handshake mr-2"></i>
            Accept Challenge
          </Button>
        )}

        {!showAcceptButton && challenge.status === 'pending' && !isChallenger && (
          <Button className="w-full" variant="outline">
            <i className="fas fa-eye mr-2"></i>
            View Details
          </Button>
        )}

        {challenge.status === 'pending' && isChallenger && (
          <Button className="w-full" variant="outline">
            <i className="fas fa-times mr-2"></i>
            Cancel Challenge
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ challenge }: { challenge: Challenge }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <i className="fas fa-swords text-primary text-sm"></i>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {challenge.challengerUsername} vs {challenge.opponentUsername || 'Open'}
          </p>
          <p className="text-xs text-muted-foreground">
            {challenge.assetId.toUpperCase()} • {challenge.amount} USDC
          </p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {challenge.status}
      </Badge>
    </div>
  );
}

function CreateChallengeForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    assetId: '',
    predictionType: 'direction',
    amount: '',
    timeFrame: '60',
    opponentId: '',
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create challenge API call
    console.log('Create challenge:', formData);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Challenge</DialogTitle>
        <DialogDescription>
          Challenge another predictor or create an open challenge for anyone to accept.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="asset">Asset</Label>
          <Select value={formData.assetId} onValueChange={(v) => setFormData({ ...formData, assetId: v })}>
            <SelectTrigger id="asset">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
              <SelectItem value="sol">Solana (SOL)</SelectItem>
              <SelectItem value="avax">Avalanche (AVAX)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Prediction Type</Label>
          <Select value={formData.predictionType} onValueChange={(v) => setFormData({ ...formData, predictionType: v })}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direction">Direction (Up/Down)</SelectItem>
              <SelectItem value="price_target">Price Target</SelectItem>
              <SelectItem value="above_below">Above/Below</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Stake Amount (USDC)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="10.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeframe">Time Frame (minutes)</Label>
          <Select value={formData.timeFrame} onValueChange={(v) => setFormData({ ...formData, timeFrame: v })}>
            <SelectTrigger id="timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="240">4 hours</SelectItem>
              <SelectItem value="1440">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="opponent">Opponent (optional)</Label>
          <Input
            id="opponent"
            placeholder="Leave empty for public challenge"
            value={formData.opponentId}
            onChange={(e) => setFormData({ ...formData, opponentId: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <i className="fas fa-plus mr-2"></i>
            Create Challenge
          </Button>
        </div>
      </form>
    </>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading challenges...</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <i className={`fas fa-${icon} text-2xl text-muted-foreground`}></i>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
