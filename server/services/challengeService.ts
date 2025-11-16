import { storage } from '../storage';
import type { InsertChallenge, Challenge } from '@shared/schema';
import { coinGeckoService } from './coinGeckoService';
import { yellowNetworkService } from './yellowNetworkService';
import { log } from './logger';

export class ChallengeService {
  /**
   * Create a new challenge
   */
  async createChallenge(params: {
    challengerId: string;
    challengerUsername: string;
    opponentId?: string;
    assetId: string;
    predictionType: string;
    amount: number;
    timeFrame: number;
    isPublic?: boolean;
    challengerPrediction: {
      targetPrice?: number;
      direction?: string;
    };
  }): Promise<Challenge> {
    const expiresAt = new Date(Date.now() + params.timeFrame * 60 * 1000);

    // Get current price as baseline
    const currentPrice = await coinGeckoService.getCurrentPrice(params.assetId);

    const challengeData: InsertChallenge = {
      challengerId: params.challengerId,
      challengerUsername: params.challengerUsername,
      opponentId: params.opponentId || null,
      opponentUsername: null,
      assetId: params.assetId,
      predictionType: params.predictionType,
      amount: params.amount.toString(),
      timeFrame: params.timeFrame,
      status: 'pending',
      challengerPrediction: JSON.stringify(params.challengerPrediction),
      opponentPrediction: null,
      winnerId: null,
      priceAtStart: currentPrice.toString(),
      priceAtExpiry: null,
      challengerCorrect: null,
      opponentCorrect: null,
      isPublic: params.isPublic ?? true,
      expiresAt,
      stateChannelTx: null,
    };

    const challenge = await storage.createChallenge(challengeData);

    log.info(`Challenge created: ${challenge.id} by ${params.challengerUsername}`);

    // Submit to Yellow Network (optional, non-blocking)
    this.submitToYellowNetwork(challenge).catch(error => {
      log.error('Failed to submit challenge to Yellow Network', { error, challengeId: challenge.id });
    });

    return challenge;
  }

  /**
   * Accept a challenge
   */
  async acceptChallenge(params: {
    challengeId: string;
    opponentId: string;
    opponentUsername: string;
    opponentPrediction: {
      targetPrice?: number;
      direction?: string;
    };
  }): Promise<Challenge> {
    const challenge = await storage.getChallenge(params.challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.status !== 'pending') {
      throw new Error('Challenge is not available for acceptance');
    }

    if (challenge.opponentId && challenge.opponentId !== params.opponentId) {
      throw new Error('This challenge is not for you');
    }

    if (challenge.challengerId === params.opponentId) {
      throw new Error('You cannot accept your own challenge');
    }

    const now = new Date();
    if (challenge.expiresAt <= now) {
      throw new Error('Challenge has expired');
    }

    const updatedChallenge = await storage.acceptChallenge(
      params.challengeId,
      params.opponentId,
      params.opponentUsername,
      JSON.stringify(params.opponentPrediction)
    );

    if (!updatedChallenge) {
      throw new Error('Failed to accept challenge');
    }

    log.info(`Challenge accepted: ${params.challengeId} by ${params.opponentUsername}`);

    return updatedChallenge;
  }

  /**
   * Settle a challenge (determine winner)
   */
  async settleChallenge(challengeId: string): Promise<Challenge> {
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.status !== 'accepted') {
      // If still pending and expired, cancel it
      if (challenge.status === 'pending') {
        const cancelledChallenge = await storage.updateChallenge(challengeId, {
          status: 'cancelled',
          settledAt: new Date()
        });
        log.info(`Challenge expired without opponent: ${challengeId}`);
        return cancelledChallenge!;
      }
      throw new Error('Challenge is not ready for settlement');
    }

    // Get final price
    const finalPrice = await coinGeckoService.getCurrentPrice(challenge.assetId);
    const priceAtStart = parseFloat(challenge.priceAtStart || '0');

    // Parse predictions
    const challengerPred = challenge.challengerPrediction ? JSON.parse(challenge.challengerPrediction) : {};
    const opponentPred = challenge.opponentPrediction ? JSON.parse(challenge.opponentPrediction) : {};

    // Determine correctness based on prediction type
    let challengerCorrect = false;
    let opponentCorrect = false;

    switch (challenge.predictionType) {
      case 'direction':
        if (challengerPred.direction === 'up') {
          challengerCorrect = finalPrice > priceAtStart;
        } else if (challengerPred.direction === 'down') {
          challengerCorrect = finalPrice < priceAtStart;
        }

        if (opponentPred.direction === 'up') {
          opponentCorrect = finalPrice > priceAtStart;
        } else if (opponentPred.direction === 'down') {
          opponentCorrect = finalPrice < priceAtStart;
        }
        break;

      case 'price_target':
        const challengerTarget = challengerPred.targetPrice || 0;
        const opponentTarget = opponentPred.targetPrice || 0;
        const tolerance = priceAtStart * 0.02; // 2% tolerance

        challengerCorrect = Math.abs(finalPrice - challengerTarget) <= tolerance;
        opponentCorrect = Math.abs(finalPrice - opponentTarget) <= tolerance;
        break;

      case 'above_below':
        if (challengerPred.targetPrice) {
          challengerCorrect = challengerPred.direction === 'up' ?
            finalPrice > challengerPred.targetPrice :
            finalPrice < challengerPred.targetPrice;
        }

        if (opponentPred.targetPrice) {
          opponentCorrect = opponentPred.direction === 'up' ?
            finalPrice > opponentPred.targetPrice :
            finalPrice < opponentPred.targetPrice;
        }
        break;
    }

    // Determine winner
    let winnerId: string | null = null;
    if (challengerCorrect && !opponentCorrect) {
      winnerId = challenge.challengerId;
    } else if (opponentCorrect && !challengerCorrect) {
      winnerId = challenge.opponentId!;
    }
    // If both correct or both wrong, it's a draw (winnerId = null)

    // Update challenge
    const settledChallenge = await storage.updateChallenge(challengeId, {
      status: 'completed',
      priceAtExpiry: finalPrice.toString(),
      challengerCorrect,
      opponentCorrect,
      winnerId,
      settledAt: new Date()
    });

    if (!settledChallenge) {
      throw new Error('Failed to settle challenge');
    }

    // Update user stats
    await this.updateUserStats(challenge.challengerId, winnerId === challenge.challengerId, winnerId === null);
    if (challenge.opponentId) {
      await this.updateUserStats(challenge.opponentId, winnerId === challenge.opponentId, winnerId === null);
    }

    log.info(`Challenge settled: ${challengeId}`, {
      winnerId,
      challengerCorrect,
      opponentCorrect,
      finalPrice
    });

    return settledChallenge;
  }

  /**
   * Cancel a challenge
   */
  async cancelChallenge(challengeId: string, userId: string): Promise<Challenge> {
    const challenge = await storage.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.challengerId !== userId) {
      throw new Error('Only the challenger can cancel the challenge');
    }

    if (challenge.status !== 'pending') {
      throw new Error('Only pending challenges can be cancelled');
    }

    const cancelledChallenge = await storage.updateChallenge(challengeId, {
      status: 'cancelled',
      settledAt: new Date()
    });

    if (!cancelledChallenge) {
      throw new Error('Failed to cancel challenge');
    }

    log.info(`Challenge cancelled: ${challengeId} by ${userId}`);

    return cancelledChallenge;
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(limit: number = 10): Promise<{
    userId: string;
    username: string;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    totalEarnings: string;
    rank: number;
  }[]> {
    // Get all users and their challenge stats
    const allUsers = await storage.getGlobalLeaderboard(1000);

    const leaderboard = allUsers
      .filter(user => (user.challengesWon || 0) + (user.challengesLost || 0) + (user.challengesDrawn || 0) > 0)
      .map(user => {
        const wins = user.challengesWon || 0;
        const losses = user.challengesLost || 0;
        const draws = user.challengesDrawn || 0;
        const total = wins + losses + draws;
        const winRate = total > 0 ? (wins / total) * 100 : 0;

        return {
          userId: user.id,
          username: user.username || 'Unknown',
          wins,
          losses,
          draws,
          winRate,
          totalEarnings: user.totalRewards || '0.00000000',
          rank: 0
        };
      })
      .sort((a, b) => {
        // Sort by wins first, then by win rate
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        return b.winRate - a.winRate;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return leaderboard;
  }

  /**
   * Get recent challenge activity
   */
  async getRecentActivity(limit: number = 20): Promise<{
    id: string;
    type: string;
    userId: string;
    username: string;
    description: string;
    timestamp: string;
  }[]> {
    const allChallenges = Array.from((await storage.getActiveChallenges()).values());
    const completedChallenges = allChallenges
      .filter(c => c.status === 'completed')
      .sort((a, b) => (b.settledAt?.getTime() || 0) - (a.settledAt?.getTime() || 0))
      .slice(0, limit);

    const activity = completedChallenges.map(challenge => {
      let description = '';
      let username = '';
      let userId = '';

      if (challenge.winnerId) {
        const isChallenger = challenge.winnerId === challenge.challengerId;
        username = isChallenger ? challenge.challengerUsername : challenge.opponentUsername || 'Unknown';
        userId = challenge.winnerId;
        description = `won a ${challenge.assetId.toUpperCase()} challenge`;
      } else {
        username = challenge.challengerUsername;
        userId = challenge.challengerId;
        description = `drew in a ${challenge.assetId.toUpperCase()} challenge`;
      }

      return {
        id: challenge.id,
        type: 'settlement',
        userId,
        username,
        description,
        timestamp: (challenge.settledAt || challenge.createdAt || new Date()).toISOString()
      };
    });

    return activity;
  }

  /**
   * Submit challenge to Yellow Network (non-blocking)
   */
  private async submitToYellowNetwork(challenge: Challenge): Promise<void> {
    try {
      // This would integrate with Yellow Network's multi-party functionality
      // For now, we'll log it
      log.info('Submitting challenge to Yellow Network', {
        challengeId: challenge.id,
        assetId: challenge.assetId,
        amount: challenge.amount
      });

      // In production, this would call yellowNetworkService.submitChallenge()
      // which would create a multi-party state channel for the challenge
    } catch (error) {
      log.error('Yellow Network challenge submission failed', { error, challengeId: challenge.id });
      throw error;
    }
  }

  /**
   * Update user challenge statistics
   */
  private async updateUserStats(userId: string, won: boolean, draw: boolean): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const updates: Partial<typeof user> = {};

    if (won) {
      updates.challengesWon = (user.challengesWon || 0) + 1;
      updates.totalRewards = (parseFloat(user.totalRewards || '0') + 10).toString(); // Placeholder reward
    } else if (draw) {
      updates.challengesDrawn = (user.challengesDrawn || 0) + 1;
    } else {
      updates.challengesLost = (user.challengesLost || 0) + 1;
    }

    // Update reputation based on challenge performance
    const winRate = ((updates.challengesWon || user.challengesWon || 0) /
      Math.max(1, (updates.challengesWon || user.challengesWon || 0) +
      (updates.challengesLost || user.challengesLost || 0))) * 100;

    updates.reputation = (parseFloat(user.reputation || '0') + (won ? 5 : draw ? 1 : -2)).toString();

    await storage.updateUser(userId, updates);
  }
}

export const challengeService = new ChallengeService();
