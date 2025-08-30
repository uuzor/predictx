import { storage } from '../storage';
import { type Tournament, type TournamentParticipant, type Prediction } from '@shared/schema';

export class TournamentService {
  async updateTournamentScores(tournamentId: string): Promise<void> {
    const participants = await storage.getTournamentParticipants(tournamentId);
    
    for (const participant of participants) {
      const userPredictions = await storage.getUserPredictions(participant.userId);
      const tournamentPredictions = userPredictions.filter(p => p.tournamentId === tournamentId);
      
      if (tournamentPredictions.length === 0) continue;

      // Calculate score based on prediction accuracy and timing
      let totalScore = 0;
      let settledPredictions = 0;

      for (const prediction of tournamentPredictions) {
        if (prediction.isCorrect !== null) {
          settledPredictions++;
          
          if (prediction.isCorrect) {
            // Base score for correct prediction
            let predictionScore = 100;
            
            // Bonus for quick predictions (within first hour)
            const predictionAge = Date.now() - prediction.createdAt.getTime();
            if (predictionAge < 60 * 60 * 1000) { // 1 hour
              predictionScore *= 1.2;
            }
            
            // Bonus for difficult predictions (based on price volatility)
            if (prediction.targetPrice && prediction.actualPrice) {
              const targetPrice = parseFloat(prediction.targetPrice);
              const actualPrice = parseFloat(prediction.actualPrice);
              const accuracy = 1 - Math.abs(targetPrice - actualPrice) / targetPrice;
              predictionScore *= (0.5 + accuracy * 0.5); // Scale between 0.5x and 1x
            }
            
            totalScore += predictionScore;
          }
        }
      }

      // Average score across all settled predictions
      const averageScore = settledPredictions > 0 ? totalScore / settledPredictions : 0;
      
      await storage.updateParticipantScore(tournamentId, participant.userId, averageScore);
    }
  }

  async checkTournamentCompletion(tournamentId: string): Promise<boolean> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return false;

    const now = new Date();
    if (tournament.endTime <= now && tournament.status === 'active') {
      // Tournament has ended, update status and distribute rewards
      await storage.updateTournament(tournamentId, { status: 'completed' });
      await this.distributeTournamentRewards(tournamentId);
      return true;
    }

    return false;
  }

  private async distributeTournamentRewards(tournamentId: string): Promise<void> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return;

    const leaderboard = await storage.getTournamentLeaderboard(tournamentId, 10);
    const prizePool = parseFloat(tournament.prizePool);

    // Distribute prizes to top performers
    const prizeDistribution = [0.5, 0.3, 0.15, 0.05]; // 50%, 30%, 15%, 5%
    
    for (let i = 0; i < Math.min(leaderboard.length, prizeDistribution.length); i++) {
      const participant = leaderboard[i];
      const reward = prizePool * prizeDistribution[i];
      
      // Update user's total rewards
      const user = await storage.getUser(participant.userId);
      if (user) {
        const currentRewards = parseFloat(user.totalRewards);
        await storage.updateUser(user.id, {
          totalRewards: (currentRewards + reward).toFixed(8)
        });
      }
    }
  }

  async startTournament(tournamentId: string): Promise<void> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return;

    const now = new Date();
    if (tournament.startTime <= now && tournament.status === 'upcoming') {
      await storage.updateTournament(tournamentId, { status: 'active' });
    }
  }

  async getActiveTournamentStats(): Promise<{
    totalTournaments: number;
    totalParticipants: number;
    totalPrizePool: number;
  }> {
    const activeTournaments = await storage.getActiveTournaments();
    
    let totalParticipants = 0;
    let totalPrizePool = 0;

    for (const tournament of activeTournaments) {
      totalParticipants += tournament.currentParticipants || 0;
      totalPrizePool += parseFloat(tournament.prizePool);
    }

    return {
      totalTournaments: activeTournaments.length,
      totalParticipants,
      totalPrizePool
    };
  }
}

export const tournamentService = new TournamentService();
