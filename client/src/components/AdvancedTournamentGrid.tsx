import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Clock, Star, Target, Crown, Gamepad2, Calendar } from 'lucide-react';

interface TournamentCategory {
  id: string;
  name: string;
  description: string;
  tournaments: Tournament[];
  icon: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  difficulty: string;
  prizePool: string;
  entryFee: string;
  currentParticipants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: string;
}

export function AdvancedTournamentGrid() {
  const { data: tournaments = [] } = useQuery({
    queryKey: ['/api/tournaments'],
  });

  // Mock data for advanced tournament features
  const tournamentCategories: TournamentCategory[] = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Predict crypto market movements and price targets',
      icon: '₿',
      tournaments: [
        {
          id: 'crypto-champions-weekly',
          name: 'Crypto Champions Weekly',
          description: 'Predict top 10 crypto movements',
          category: 'crypto',
          type: 'standard',
          difficulty: 'intermediate',
          prizePool: '5000.00000000',
          entryFee: '10.00000000',
          currentParticipants: 247,
          maxParticipants: 500,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          id: 'btc-bracket-challenge',
          name: 'Bitcoin Bracket Challenge',
          description: 'Single elimination Bitcoin prediction tournament',
          category: 'crypto',
          type: 'bracket_elimination',
          difficulty: 'expert',
          prizePool: '10000.00000000',
          entryFee: '50.00000000',
          currentParticipants: 14,
          maxParticipants: 16,
          startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming'
        }
      ]
    },
    {
      id: 'defi',
      name: 'DeFi Protocols',
      description: 'Decentralized finance protocol performance predictions',
      icon: '🏦',
      tournaments: [
        {
          id: 'defi-prediction-cup',
          name: 'DeFi Prediction Cup',
          description: 'Predict DeFi protocol performances',
          category: 'defi',
          type: 'multi_stage',
          difficulty: 'expert',
          prizePool: '12500.00000000',
          entryFee: '25.00000000',
          currentParticipants: 89,
          maxParticipants: 200,
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ]
    },
    {
      id: 'season',
      name: 'Season Competitions',
      description: 'Long-term seasonal prediction competitions',
      icon: '🏆',
      tournaments: [
        {
          id: 'spring-season-2025',
          name: 'Spring Season 2025',
          description: '3-month comprehensive prediction season',
          category: 'season',
          type: 'season_long',
          difficulty: 'pro',
          prizePool: '50000.00000000',
          entryFee: '100.00000000',
          currentParticipants: 456,
          maxParticipants: 1000,
          startTime: new Date('2025-03-01').toISOString(),
          endTime: new Date('2025-05-31').toISOString(),
          status: 'upcoming'
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bracket_elimination': return <Trophy className="h-4 w-4" />;
      case 'season_long': return <Calendar className="h-4 w-4" />;
      case 'multi_stage': return <Target className="h-4 w-4" />;
      default: return <Gamepad2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Advanced Tournaments</h2>
          <p className="text-muted-foreground">
            Multi-category tournaments with bracket elimination, seasonal competitions, and skill-based matching
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-advanced-tournament">
          <Crown className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      <Tabs defaultValue="crypto" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
          {tournamentCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center space-x-2"
            >
              <span className="text-lg">{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tournamentCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{category.name}</h3>
              <p className="text-muted-foreground">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {category.tournaments.map((tournament) => (
                <Card key={tournament.id} className="border-border/50 hover:border-border transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getTypeIcon(tournament.type)}
                          {tournament.name}
                        </CardTitle>
                        <CardDescription className="mt-2">{tournament.description}</CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(tournament.status)} text-xs`}>
                        {tournament.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Tournament Type & Difficulty */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tournament.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getDifficultyColor(tournament.difficulty)} text-xs`}>
                        {tournament.difficulty}
                      </Badge>
                    </div>

                    {/* Prize Pool & Entry Fee */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Prize Pool</div>
                        <div className="font-semibold text-foreground">
                          ${parseFloat(tournament.prizePool).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Entry Fee</div>
                        <div className="font-semibold text-foreground">
                          ${parseFloat(tournament.entryFee).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Participants */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Participants
                        </span>
                        <span className="font-medium">
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </span>
                      </div>
                      <Progress 
                        value={(tournament.currentParticipants / tournament.maxParticipants) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tournament.status === 'active' ? 'Time Remaining' : 'Starts In'}
                      </span>
                      <span className="font-medium">
                        {formatTimeRemaining(tournament.status === 'active' ? tournament.endTime : tournament.startTime)}
                      </span>
                    </div>

                    {/* Tournament Features */}
                    {tournament.type === 'bracket_elimination' && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Tournament Format</div>
                        <div className="text-sm font-medium">Single Elimination Bracket</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Winner takes all in head-to-head matches
                        </div>
                      </div>
                    )}

                    {tournament.type === 'season_long' && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Season Format</div>
                        <div className="text-sm font-medium">3-Month Competition</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Weekly tournaments with cumulative scoring
                        </div>
                      </div>
                    )}

                    {tournament.type === 'multi_stage' && (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Multi-Stage Format</div>
                        <div className="text-sm font-medium">Qualification → Finals</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Progress through multiple tournament stages
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full" 
                      variant={tournament.status === 'active' ? 'default' : 'outline'}
                      disabled={tournament.status === 'completed'}
                      data-testid={`button-join-tournament-${tournament.id}`}
                    >
                      {tournament.status === 'active' ? 'Join Tournament' : 
                       tournament.status === 'upcoming' ? 'Register Now' : 'View Results'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tournament Statistics */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Tournament Platform Statistics
          </CardTitle>
          <CardDescription>
            Advanced tournament system metrics and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">847</div>
              <div className="text-sm text-muted-foreground">Active Tournaments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">24,563</div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">$127K</div>
              <div className="text-sm text-muted-foreground">Weekly Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">96.8%</div>
              <div className="text-sm text-muted-foreground">Settlement Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}