/**
 * Multi-Party Service for Peer-to-Peer Predictions
 *
 * Enables users to challenge each other in prediction battles
 * Uses Yellow Network for instant settlement
 */

import { storage } from '../storage.js';
import { yellowNetworkService } from './yellowNetworkService.js';
import { log } from './logger.js';

export interface PredictionChallenge {
  id: string;
  challengerId: string;
  opponentId: string | null;
  assetId: string;
  predictionType: string;
  amount: string;
  timeFrame: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  challengerPrediction?: string;
  opponentPrediction?: string;
  winnerId?: string;
  createdAt: Date;
  expiresAt: Date;
  settledAt?: Date;
}

class MultiPartyService {
  /**
   * Create a prediction challenge
   */
  async createChallenge(params: {
    challengerId: string;
    opponentId?: string;
    assetId: string;
    predictionType: string;
    amount: number;
    timeFrame: number;
  }): Promise<PredictionChallenge> {
    const challenge: PredictionChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      challengerId: params.challengerId,
      opponentId: params.opponentId || null,
      assetId: params.assetId,
      predictionType: params.predictionType,
      amount: params.amount.toString(),
      timeFrame: params.timeFrame,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + params.timeFrame * 60000),
    };

    log.info('Prediction challenge created', {
      id: challenge.id,
      challenger: params.challengerId,
      opponent: params.opponentId || 'open',
      asset: params.assetId,
    });

    // Submit to Yellow Network state channel
    try {
      await yellowNetworkService.submitPrediction({
        userId: params.challengerId,
        assetId: params.assetId,
        predictionType: params.predictionType,
        timeFrame: params.timeFrame,
        amount: params.amount,
      });
    } catch (error) {
      log.error('Failed to submit challenge to Yellow Network', error as Error);
    }

    // TODO: Store in database (would need to add challenge table to schema)
    // await storage.createChallenge(challenge);

    return challenge;
  }

  /**
   * Accept a challenge
   */
  async acceptChallenge(challengeId: string, opponentId: string, prediction: string): Promise<PredictionChallenge> {
    // TODO: Implement challenge acceptance logic
    log.info('Challenge accepted', { challengeId, opponentId });

    // Submit opponent's prediction to Yellow Network
    const challenge = await this.getChallenge(challengeId);

    if (challenge && challenge.status === 'pending') {
      try {
        await yellowNetworkService.submitPrediction({
          userId: opponentId,
          assetId: challenge.assetId,
          predictionType: challenge.predictionType,
          timeFrame: challenge.timeFrame,
          amount: parseFloat(challenge.amount),
        });

        challenge.opponentId = opponentId;
        challenge.opponentPrediction = prediction;
        challenge.status = 'accepted';

        log.info('Challenge updated to accepted', { challengeId });
      } catch (error) {
        log.error('Failed to accept challenge on Yellow Network', error as Error);
        throw error;
      }
    }

    return challenge!;
  }

  /**
   * Settle a challenge and determine winner
   */
  async settleChallenge(challengeId: string, actualPrice: number): Promise<PredictionChallenge> {
    const challenge = await this.getChallenge(challengeId);

    if (!challenge || challenge.status !== 'accepted') {
      throw new Error('Challenge not found or not in accepted state');
    }

    // Determine winner based on predictions
    const challengerCorrect = this.evaluatePrediction(
      challenge.challengerPrediction!,
      actualPrice,
      challenge.predictionType
    );
    const opponentCorrect = this.evaluatePrediction(
      challenge.opponentPrediction!,
      actualPrice,
      challenge.predictionType
    );

    let winnerId: string | undefined;

    if (challengerCorrect && !opponentCorrect) {
      winnerId = challenge.challengerId;
    } else if (opponentCorrect && !challengerCorrect) {
      winnerId = challenge.opponentId!;
    }
    // If both correct or both wrong, it's a draw (no winner)

    challenge.winnerId = winnerId;
    challenge.status = 'completed';
    challenge.settledAt = new Date();

    log.info('Challenge settled', {
      challengeId,
      winner: winnerId || 'draw',
      challengerCorrect,
      opponentCorrect,
    });

    // Settle on Yellow Network
    if (winnerId) {
      try {
        await yellowNetworkService.settlePrediction(challengeId, actualPrice, true);
      } catch (error) {
        log.error('Failed to settle challenge on Yellow Network', error as Error);
      }
    }

    return challenge;
  }

  /**
   * Evaluate prediction correctness
   */
  private evaluatePrediction(prediction: string, actualPrice: number, predictionType: string): boolean {
    // Simplified evaluation logic
    switch (predictionType) {
      case 'direction':
        // Assuming prediction is "up" or "down"
        // This would need base price context in real implementation
        return true; // Placeholder

      case 'price_target':
        // Check if actual price is within tolerance of predicted price
        const targetPrice = parseFloat(prediction);
        const tolerance = targetPrice * 0.02; // 2% tolerance
        return Math.abs(actualPrice - targetPrice) <= tolerance;

      default:
        return false;
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallenge(challengeId: string): Promise<PredictionChallenge | null> {
    // TODO: Retrieve from database
    // return await storage.getChallenge(challengeId);
    return null; // Placeholder
  }

  /**
   * Get open challenges
   */
  async getOpenChallenges(assetId?: string): Promise<PredictionChallenge[]> {
    // TODO: Retrieve from database
    // return await storage.getOpenChallenges(assetId);
    return []; // Placeholder
  }

  /**
   * Get user challenges
   */
  async getUserChallenges(userId: string): Promise<PredictionChallenge[]> {
    // TODO: Retrieve from database
    // return await storage.getUserChallenges(userId);
    return []; // Placeholder
  }

  /**
   * Cancel a challenge (before acceptance)
   */
  async cancelChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await this.getChallenge(challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.challengerId !== userId) {
      throw new Error('Only challenger can cancel');
    }

    if (challenge.status !== 'pending') {
      throw new Error('Can only cancel pending challenges');
    }

    challenge.status = 'cancelled';

    log.info('Challenge cancelled', { challengeId, userId });
  }

  /**
   * Get challenge statistics
   */
  async getChallengeStats(userId: string): Promise<{
    totalChallenges: number;
    won: number;
    lost: number;
    draws: number;
    winRate: number;
  }> {
    const challenges = await this.getUserChallenges(userId);
    const completed = challenges.filter((c) => c.status === 'completed');

    const won = completed.filter((c) => c.winnerId === userId).length;
    const lost = completed.filter((c) => c.winnerId && c.winnerId !== userId).length;
    const draws = completed.filter((c) => !c.winnerId).length;

    const winRate = completed.length > 0 ? (won / completed.length) * 100 : 0;

    return {
      totalChallenges: challenges.length,
      won,
      lost,
      draws,
      winRate: parseFloat(winRate.toFixed(2)),
    };
  }
}

export const multiPartyService = new MultiPartyService();
