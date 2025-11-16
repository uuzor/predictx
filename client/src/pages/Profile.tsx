import { useEffect, useState } from 'react';
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
import { Progress } from '@/components/ui/progress';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  level: number;
  reputation: string;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
  totalRewards: string;
  createdAt: string;
}

interface Prediction {
  id: string;
  assetId: string;
  predictionType: string;
  targetPrice?: string;
  direction?: string;
  actualPrice?: string;
  isCorrect?: boolean;
  createdAt: string;
  settledAt?: string;
  stateChannelTx?: string;
}

export default function Profile() {
  const [, params] = useRoute('/profile/:userId');
  const userId = params?.userId;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<Prediction[]>({
    queryKey: [`/api/predictions/user/${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/predictions/user/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: achievements = { earned: [], available: [] } } = useQuery({
    queryKey: [`/api/achievements/user/${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/achievements/user/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch achievements');
      return res.json();
    },
    enabled: !!userId,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">User not found</h2>
          <p className="text-muted-foreground">The requested user profile does not exist.</p>
        </div>
      </div>
    );
  }

  const accuracy = user.totalPredictions > 0
    ? ((user.correctPredictions / user.totalPredictions) * 100).toFixed(1)
    : '0.0';

  const levelProgress = (user.reputation ? parseFloat(user.reputation) % 100 : 0);
  const nextLevelPoints = ((user.level + 1) * 100).toString();

  const wonPredictions = predictions.filter(p => p.isCorrect === true);
  const lostPredictions = predictions.filter(p => p.isCorrect === false);
  const pendingPredictions = predictions.filter(p => p.isCorrect === null || p.isCorrect === undefined);

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* User Info */}
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* User Details */}
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{user.username}</h1>
                <p className="text-sm text-muted-foreground font-mono mb-3">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    Level {user.level}
                  </Badge>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {accuracy}% Accuracy
                  </Badge>
                  {user.currentStreak > 0 && (
                    <Badge className="text-base px-3 py-1 bg-orange-500 hover:bg-orange-600">
                      🔥 {user.currentStreak} Streak
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline">
                <i className="fas fa-share mr-2"></i>
                Share Profile
              </Button>
              <Button>
                <i className="fas fa-trophy mr-2"></i>
                Challenge
              </Button>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Level {user.level} Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {user.reputation} / {nextLevelPoints} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Total Predictions */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {user.totalPredictions}
                  </div>
                  <p className="text-sm text-muted-foreground">Predictions</p>
                </div>
              </CardContent>
            </Card>

            {/* Accuracy */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">
                    {accuracy}%
                  </div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </CardContent>
            </Card>

            {/* Current Streak */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    {user.currentStreak}
                  </div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
              </CardContent>
            </Card>

            {/* Best Streak */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {user.maxStreak}
                  </div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
              </CardContent>
            </Card>

            {/* Total Rewards */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-1">
                    {parseFloat(user.totalRewards || '0').toFixed(4)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                </div>
              </CardContent>
            </Card>

            {/* Reputation */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-1">
                    {user.reputation}
                  </div>
                  <p className="text-sm text-muted-foreground">Reputation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Tabs defaultValue="predictions" className="space-y-8">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="predictions">
                Predictions ({predictions.length})
              </TabsTrigger>
              <TabsTrigger value="achievements">
                Achievements ({achievements.earned.length})
              </TabsTrigger>
              <TabsTrigger value="tournaments">
                Tournaments
              </TabsTrigger>
            </TabsList>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Prediction History</h2>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{wonPredictions.length} Won</Badge>
                  <Badge variant="destructive">{lostPredictions.length} Lost</Badge>
                  <Badge variant="outline">{pendingPredictions.length} Pending</Badge>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  {predictionsLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading predictions...
                    </div>
                  ) : predictions.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-chart-line text-2xl text-muted-foreground"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No predictions yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start making predictions to see them here
                      </p>
                      <Button>
                        <i className="fas fa-plus mr-2"></i>
                        Make First Prediction
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Asset</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Prediction</TableHead>
                          <TableHead>Actual</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>TX</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictions.map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell className="text-sm">
                              {new Date(prediction.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {prediction.assetId.toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {prediction.predictionType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {prediction.direction ? (
                                <span className={prediction.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                                  {prediction.direction === 'up' ? '↑' : '↓'} {prediction.direction}
                                </span>
                              ) : (
                                `$${parseFloat(prediction.targetPrice || '0').toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell>
                              {prediction.actualPrice ? (
                                `$${parseFloat(prediction.actualPrice).toFixed(2)}`
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {prediction.isCorrect === null || prediction.isCorrect === undefined ? (
                                <Badge variant="outline">Pending</Badge>
                              ) : prediction.isCorrect ? (
                                <Badge className="bg-green-500">Won</Badge>
                              ) : (
                                <Badge variant="destructive">Lost</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {prediction.stateChannelTx ? (
                                <a
                                  href={`#tx-${prediction.stateChannelTx.slice(0, 8)}`}
                                  className="text-primary hover:underline text-xs"
                                  title={prediction.stateChannelTx}
                                >
                                  {prediction.stateChannelTx.slice(0, 8)}...
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Achievements</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.earned.map((achievement: any) => (
                  <Card key={achievement.id} className="border-primary/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="font-semibold text-foreground mb-2">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <Badge className="bg-green-500">Unlocked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {achievements.available.length > 0 && (
                  <>
                    <div className="col-span-full">
                      <h3 className="text-xl font-semibold text-muted-foreground mb-4">Locked Achievements</h3>
                    </div>
                    {achievements.available.map((achievement: any) => (
                      <Card key={achievement.id} className="opacity-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl mb-3 grayscale">{achievement.icon}</div>
                            <h3 className="font-semibold text-foreground mb-2">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {achievement.requirement}
                            </p>
                            <Badge variant="outline">Locked</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Tournaments Tab */}
            <TabsContent value="tournaments" className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Tournament History</h2>

              <div className="p-12 text-center bg-background rounded-lg border border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No tournament history</h3>
                <p className="text-muted-foreground mb-4">
                  Join tournaments to compete with other predictors
                </p>
                <Button>
                  <i className="fas fa-trophy mr-2"></i>
                  Browse Tournaments
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
