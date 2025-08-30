import { storage } from '../storage';
import type { 
  Tournament, 
  TournamentBracket, 
  TournamentStage, 
  Season,
  InsertTournament,
  InsertTournamentBracket,
  InsertTournamentStage,
  InsertSeason
} from '@shared/schema';

export interface BracketMatchup {
  id: string;
  round: number;
  matchNumber: number;
  participant1: { id: string; name: string; score: number } | null;
  participant2: { id: string; name: string; score: number } | null;
  winner: { id: string; name: string } | null;
  status: 'pending' | 'active' | 'completed';
  scheduledTime?: Date;
}

export interface TournamentSeasonStats {
  seasonId: string;
  totalTournaments: number;
  totalParticipants: number;
  totalPrizePool: string;
  leaderboard: Array<{
    userId: string;
    username: string;
    points: number;
    wins: number;
    participations: number;
  }>;
}

export class AdvancedTournamentService {
  // Create different types of tournaments
  async createStandardTournament(data: Omit<InsertTournament, 'type'>): Promise<Tournament> {
    return await storage.createTournament({
      ...data,
      type: 'standard'
    });
  }

  async createBracketTournament(
    data: Omit<InsertTournament, 'type'>,
    bracketSize: number = 16
  ): Promise<{ tournament: Tournament; brackets: TournamentBracket[] }> {
    const tournament = await storage.createTournament({
      ...data,
      type: 'bracket_elimination',
      maxParticipants: bracketSize,
      metadata: {
        bracketSize,
        rounds: Math.log2(bracketSize),
        eliminationStyle: 'single'
      }
    });

    // Create bracket structure
    const brackets = await this.generateBracketStructure(tournament.id, bracketSize);
    
    return { tournament, brackets };
  }

  async createSeasonLongTournament(
    data: Omit<InsertTournament, 'type'>,
    seasonId: string
  ): Promise<Tournament> {
    return await storage.createTournament({
      ...data,
      type: 'season_long',
      seasonId,
      metadata: {
        seasonBased: true,
        pointsSystem: 'cumulative',
        weeklyTournaments: true
      }
    });
  }

  async createMultiStageTournament(
    data: Omit<InsertTournament, 'type'>,
    stages: Array<{
      name: string;
      duration: number; // in hours
      requirements?: any;
      rewards?: any;
    }>
  ): Promise<{ tournament: Tournament; stages: TournamentStage[] }> {
    const tournament = await storage.createTournament({
      ...data,
      type: 'multi_stage',
      metadata: {
        totalStages: stages.length,
        stageProgression: 'sequential'
      }
    });

    // Create tournament stages
    const tournamentStages: TournamentStage[] = [];
    let currentTime = new Date(data.startTime);

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const endTime = new Date(currentTime.getTime() + stage.duration * 60 * 60 * 1000);
      
      const tournamentStage = await storage.createTournamentStage({
        tournamentId: tournament.id,
        stageName: stage.name,
        stageNumber: i + 1,
        startTime: currentTime,
        endTime: endTime,
        requirements: stage.requirements || {},
        rewards: stage.rewards || {}
      });

      tournamentStages.push(tournamentStage);
      currentTime = endTime;
    }

    return { tournament, stages: tournamentStages };
  }

  // Bracket Management
  async generateBracketStructure(tournamentId: string, size: number): Promise<TournamentBracket[]> {
    const brackets: TournamentBracket[] = [];
    const rounds = Math.log2(size);

    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = size / Math.pow(2, round);
      
      for (let match = 1; match <= matchesInRound; match++) {
        const bracket = await storage.createTournamentBracket({
          tournamentId,
          round,
          matchNumber: match,
          status: round === 1 ? 'pending' : 'pending'
        });
        brackets.push(bracket);
      }
    }

    return brackets;
  }

  async seedBracket(tournamentId: string, participants: string[]): Promise<void> {
    // Get first round brackets
    const firstRoundBrackets = await storage.getTournamentBracketsByRound(tournamentId, 1);
    
    // Shuffle participants for random seeding (in production, use ranking-based seeding)
    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < firstRoundBrackets.length && i * 2 + 1 < shuffledParticipants.length; i++) {
      const bracket = firstRoundBrackets[i];
      await storage.updateTournamentBracket(bracket.id, {
        participant1Id: shuffledParticipants[i * 2],
        participant2Id: shuffledParticipants[i * 2 + 1],
        status: 'active'
      });
    }
  }

  async advanceBracket(bracketId: string, winnerId: string, scores: { p1: number; p2: number }): Promise<void> {
    const bracket = await storage.getTournamentBracket(bracketId);
    if (!bracket) throw new Error('Bracket not found');

    // Update current bracket
    await storage.updateTournamentBracket(bracketId, {
      winnerId,
      participant1Score: scores.p1.toString(),
      participant2Score: scores.p2.toString(),
      status: 'completed',
      completedAt: new Date()
    });

    // Find next round bracket
    const nextRound = bracket.round + 1;
    const nextMatchNumber = Math.ceil(bracket.matchNumber / 2);
    
    const nextBrackets = await storage.getTournamentBracketsByRound(bracket.tournamentId, nextRound);
    const nextBracket = nextBrackets.find(b => b.matchNumber === nextMatchNumber);

    if (nextBracket) {
      // Determine if winner goes to participant1 or participant2 slot
      const isEvenMatch = bracket.matchNumber % 2 === 0;
      const updateData = isEvenMatch 
        ? { participant2Id: winnerId }
        : { participant1Id: winnerId };

      await storage.updateTournamentBracket(nextBracket.id, updateData);

      // Check if both participants are set for next match
      const updatedBracket = await storage.getTournamentBracket(nextBracket.id);
      if (updatedBracket?.participant1Id && updatedBracket?.participant2Id) {
        await storage.updateTournamentBracket(nextBracket.id, { status: 'active' });
      }
    }
  }

  // Season Management
  async createSeason(data: InsertSeason): Promise<Season> {
    return await storage.createSeason(data);
  }

  async getSeasonStats(seasonId: string): Promise<TournamentSeasonStats> {
    const tournaments = await storage.getTournamentsBySeason(seasonId);
    const participants = await storage.getSeasonParticipants(seasonId);
    
    return {
      seasonId,
      totalTournaments: tournaments.length,
      totalParticipants: participants.length,
      totalPrizePool: tournaments.reduce((sum, t) => sum + parseFloat(t.prizePool), 0).toString(),
      leaderboard: await this.calculateSeasonLeaderboard(seasonId)
    };
  }

  async calculateSeasonLeaderboard(seasonId: string): Promise<Array<{
    userId: string;
    username: string;
    points: number;
    wins: number;
    participations: number;
  }>> {
    // This would calculate points based on tournament performance across the season
    // For now, return mock data
    return [
      { userId: 'user1', username: 'CryptoTrader1', points: 1250, wins: 8, participations: 15 },
      { userId: 'user2', username: 'PredictionPro', points: 1180, wins: 7, participations: 12 },
      { userId: 'user3', username: 'MarketWizard', points: 1050, wins: 6, participations: 14 }
    ];
  }

  // Tournament Categories
  async getTournamentsByCategory(category: string): Promise<Tournament[]> {
    return await storage.getTournamentsByCategory(category);
  }

  async createCategoryTournament(
    category: 'crypto' | 'sports' | 'weather' | 'elections' | 'custom',
    data: Omit<InsertTournament, 'category'>
  ): Promise<Tournament> {
    const categoryConfig = this.getCategoryConfiguration(category);
    
    return await storage.createTournament({
      ...data,
      category,
      rules: {
        ...data.rules,
        ...categoryConfig.defaultRules
      },
      metadata: {
        ...data.metadata,
        categorySpecific: categoryConfig.metadata
      }
    });
  }

  private getCategoryConfiguration(category: string) {
    const configs = {
      crypto: {
        defaultRules: {
          allowedAssets: ['bitcoin', 'ethereum', 'solana'],
          predictionTypes: ['price_target', 'direction', 'above_below'],
          timeFrames: [15, 30, 60, 240, 1440] // minutes
        },
        metadata: {
          oracleSource: 'coingecko',
          updateFrequency: 60000
        }
      },
      sports: {
        defaultRules: {
          sports: ['football', 'basketball', 'soccer'],
          betTypes: ['winner', 'score', 'performance'],
          seasons: true
        },
        metadata: {
          dataProvider: 'sportsapi',
          liveUpdates: true
        }
      },
      weather: {
        defaultRules: {
          metrics: ['temperature', 'precipitation', 'wind'],
          locations: ['major_cities'],
          timeHorizons: [24, 48, 168] // hours
        },
        metadata: {
          weatherAPI: 'openweather',
          updateInterval: 3600000
        }
      },
      elections: {
        defaultRules: {
          electionTypes: ['presidential', 'congressional', 'local'],
          predictionTypes: ['winner', 'margin', 'turnout'],
          lockTime: 86400000 // 24 hours before event
        },
        metadata: {
          dataSource: 'election_apis',
          verification: 'official_results'
        }
      },
      custom: {
        defaultRules: {
          flexible: true,
          customMetrics: true,
          userDefinedOracles: true
        },
        metadata: {
          requiresApproval: true,
          manualVerification: true
        }
      }
    };

    return configs[category as keyof typeof configs] || configs.custom;
  }

  // Tournament Difficulty and Skill-based Matching
  async assignDifficulty(tournamentId: string, participantIds: string[]): Promise<string> {
    // Calculate average skill level of participants
    const participants = await Promise.all(
      participantIds.map(id => storage.getUser(id))
    );

    const avgLevel = participants
      .filter(p => p)
      .reduce((sum, p) => sum + (p!.level || 1), 0) / participants.length;

    let difficulty: string;
    if (avgLevel >= 50) difficulty = 'pro';
    else if (avgLevel >= 25) difficulty = 'expert';
    else if (avgLevel >= 10) difficulty = 'intermediate';
    else difficulty = 'beginner';

    await storage.updateTournament(tournamentId, { difficulty });
    return difficulty;
  }

  // Multi-stage Tournament Management
  async progressToNextStage(tournamentId: string, currentStage: number): Promise<boolean> {
    const stages = await storage.getTournamentStages(tournamentId);
    const currentStageData = stages.find(s => s.stageNumber === currentStage);
    const nextStageData = stages.find(s => s.stageNumber === currentStage + 1);

    if (!currentStageData || !nextStageData) return false;

    // Complete current stage
    await storage.updateTournamentStage(currentStageData.id, { 
      status: 'completed' 
    });

    // Activate next stage
    await storage.updateTournamentStage(nextStageData.id, { 
      status: 'active' 
    });

    return true;
  }

  // Tournament Analytics
  async getTournamentAnalytics(tournamentId: string) {
    const tournament = await storage.getTournament(tournamentId);
    const participants = await storage.getTournamentParticipants(tournamentId);
    const predictions = await storage.getTournamentPredictions(tournamentId);

    return {
      tournament,
      stats: {
        totalParticipants: participants.length,
        totalPredictions: predictions.length,
        averageScore: participants.reduce((sum, p) => sum + parseFloat(p.score), 0) / participants.length,
        completionRate: predictions.filter(p => p.settledAt).length / predictions.length,
        prizeDistribution: this.calculatePrizeDistribution(tournament, participants)
      }
    };
  }

  private calculatePrizeDistribution(tournament: Tournament, participants: any[]) {
    const totalPrize = parseFloat(tournament.prizePool);
    const sortedParticipants = participants.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    
    // Standard distribution: 50% to winner, 30% to 2nd, 20% to 3rd
    const distribution = [0.5, 0.3, 0.2];
    
    return sortedParticipants.slice(0, 3).map((participant, index) => ({
      userId: participant.userId,
      rank: index + 1,
      prize: (totalPrize * (distribution[index] || 0)).toFixed(8)
    }));
  }
}

export const advancedTournamentService = new AdvancedTournamentService();