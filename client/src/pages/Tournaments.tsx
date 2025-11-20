import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  prizePool: string;
  entryFee: string;
  maxParticipants: number | null;
  currentParticipants: number | null;
  minParticipants: number | null;
  startTime: string;
  endTime: string;
  registrationEnd: string | null;
  status: string | null;
  difficulty: string | null;
  rules: any;
  metadata: any;
  createdAt: string | null;
}

export default function Tournaments() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    },
  });

  const filteredTournaments = tournaments.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    return true;
  });

  const activeTournaments = filteredTournaments.filter(t => t.status === 'active');
  const upcomingTournaments = filteredTournaments.filter(t => t.status === 'upcoming');
  const completedTournaments = filteredTournaments.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground mb-4">
              Tournaments
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Compete in prediction tournaments and win prizes. Test your skills against the best predictors.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="elections">Elections</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Difficulty:</span>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-green-500 mb-2">
                  {activeTournaments.length}
                </div>
                <p className="text-sm text-muted-foreground">Active Tournaments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-blue-500 mb-2">
                  {upcomingTournaments.length}
                </div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  {tournaments.reduce((sum, t) => sum + parseFloat(t.prizePool || '0'), 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Prize Pool (USDC)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tournament Tabs */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Tabs defaultValue="active" className="space-y-8">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="active">
                <i className="fas fa-play-circle mr-2"></i>
                Active ({activeTournaments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <i className="fas fa-clock mr-2"></i>
                Upcoming ({upcomingTournaments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                <i className="fas fa-check-circle mr-2"></i>
                Completed ({completedTournaments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {isLoading ? (
                <LoadingState />
              ) : activeTournaments.length === 0 ? (
                <EmptyState
                  icon="trophy"
                  title="No active tournaments"
                  description="Check back soon for new tournaments to join"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcomingTournaments.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="No upcoming tournaments"
                  description="New tournaments will appear here when scheduled"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedTournaments.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="No completed tournaments"
                  description="Completed tournaments will be listed here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Featured Tournament */}
      {activeTournaments.length > 0 && (
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-foreground mb-8">Featured Tournament</h2>
            <FeaturedTournamentCard tournament={activeTournaments[0]} />
          </div>
        </section>
      )}
    </div>
  );
}

interface TournamentCardProps {
  tournament: Tournament;
}

function TournamentCard({ tournament }: TournamentCardProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-500';
      case 'intermediate':
        return 'text-blue-500';
      case 'expert':
        return 'text-orange-500';
      case 'pro':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getParticipationProgress = () => {
    if (!tournament.maxParticipants || !tournament.currentParticipants) return 0;
    return (tournament.currentParticipants / tournament.maxParticipants) * 100;
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl">{tournament.name}</CardTitle>
          <Badge className={getStatusColor(tournament.status)}>
            {tournament.status || 'pending'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tournament.description || 'No description available'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Prize Pool</span>
          <span className="font-bold text-yellow-500">
            {parseFloat(tournament.prizePool).toLocaleString()} USDC
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Entry Fee</span>
          <span className="font-semibold text-foreground">
            {parseFloat(tournament.entryFee).toFixed(2)} USDC
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Participants</span>
          <span className="font-medium text-foreground">
            {tournament.currentParticipants || 0} / {tournament.maxParticipants || '∞'}
          </span>
        </div>

        {tournament.maxParticipants && (
          <div className="space-y-1">
            <Progress value={getParticipationProgress()} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{tournament.category}</Badge>
            {tournament.difficulty && (
              <Badge variant="outline" className={getDifficultyColor(tournament.difficulty)}>
                {tournament.difficulty}
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Link href={`/tournaments/${tournament.id}`}>
            <Button className="w-full">
              <i className="fas fa-arrow-right mr-2"></i>
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedTournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Card className="border-2 border-primary">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Badge className="bg-primary mb-4">Featured</Badge>
            <h3 className="text-3xl font-bold text-foreground mb-3">{tournament.name}</h3>
            <p className="text-muted-foreground mb-6">
              {tournament.description || 'No description available'}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prize Pool</span>
                <span className="text-2xl font-bold text-yellow-500">
                  {parseFloat(tournament.prizePool).toLocaleString()} USDC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-semibold text-foreground">
                  {parseFloat(tournament.entryFee).toFixed(2)} USDC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Participants</span>
                <span className="font-semibold text-foreground">
                  {tournament.currentParticipants || 0} / {tournament.maxParticipants || '∞'}
                </span>
              </div>
            </div>

            <Link href={`/tournaments/${tournament.id}`}>
              <Button size="lg" className="w-full">
                <i className="fas fa-trophy mr-2"></i>
                Join Tournament
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Tournament Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{tournament.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <Badge variant="outline">{tournament.difficulty || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">{tournament.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Time</span>
                  <span className="font-medium">
                    {new Date(tournament.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Time</span>
                  <span className="font-medium">
                    {new Date(tournament.endTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading tournaments...</p>
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
