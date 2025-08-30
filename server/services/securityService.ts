import crypto from 'crypto';

export interface SybilDetectionResult {
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}

export interface OracleManipulationAlert {
  assetId: string;
  suspiciousActivity: boolean;
  priceDeviation: number;
  volumeAnomaly: boolean;
  timestamp: number;
}

export class SecurityService {
  private predictionHistory: Map<string, Array<{ timestamp: number; prediction: any; walletAddress: string }>> = new Map();
  private walletBehavior: Map<string, { 
    firstSeen: number; 
    totalPredictions: number; 
    patterns: string[]; 
    riskScore: number;
  }> = new Map();
  private priceHistory: Map<string, Array<{ price: number; timestamp: number }>> = new Map();

  // Sybil Attack Detection
  async detectSybilAttack(walletAddress: string, userAgent?: string, ipAddress?: string): Promise<SybilDetectionResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check if wallet behavior exists
    if (!this.walletBehavior.has(walletAddress)) {
      this.walletBehavior.set(walletAddress, {
        firstSeen: Date.now(),
        totalPredictions: 0,
        patterns: [],
        riskScore: 0
      });
    }

    const behavior = this.walletBehavior.get(walletAddress)!;

    // Pattern 1: New account making high-volume predictions
    const accountAge = Date.now() - behavior.firstSeen;
    const ageInHours = accountAge / (1000 * 60 * 60);
    
    if (ageInHours < 24 && behavior.totalPredictions > 10) {
      riskScore += 30;
      reasons.push('New account with high prediction volume');
    }

    // Pattern 2: Rapid succession predictions
    const recentPredictions = this.getRecentPredictions(walletAddress, 5 * 60 * 1000); // last 5 minutes
    if (recentPredictions.length > 5) {
      riskScore += 25;
      reasons.push('Rapid succession predictions');
    }

    // Pattern 3: Identical prediction patterns
    const identicalPatterns = this.detectIdenticalPatterns(walletAddress);
    if (identicalPatterns > 3) {
      riskScore += 20;
      reasons.push('Repeated identical prediction patterns');
    }

    // Pattern 4: Coordinated timing (simplified check)
    const coordinatedTiming = this.detectCoordinatedTiming(walletAddress);
    if (coordinatedTiming) {
      riskScore += 40;
      reasons.push('Coordinated timing with other accounts');
    }

    // Update risk score
    behavior.riskScore = Math.min(100, riskScore);
    
    return {
      isSuspicious: riskScore > 50,
      riskScore,
      reasons
    };
  }

  // Oracle Manipulation Detection
  async detectOracleManipulation(assetId: string, currentPrice: number): Promise<OracleManipulationAlert> {
    // Store price history
    if (!this.priceHistory.has(assetId)) {
      this.priceHistory.set(assetId, []);
    }

    const history = this.priceHistory.get(assetId)!;
    history.push({ price: currentPrice, timestamp: Date.now() });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    // Calculate price deviation
    const recentPrices = history.filter(p => Date.now() - p.timestamp < 30 * 60 * 1000); // last 30 minutes
    const priceDeviation = this.calculatePriceDeviation(recentPrices);

    // Check for volume anomalies (simplified)
    const volumeAnomaly = this.detectVolumeAnomaly(assetId);

    const suspiciousActivity = priceDeviation > 10 || volumeAnomaly; // 10% deviation threshold

    return {
      assetId,
      suspiciousActivity,
      priceDeviation,
      volumeAnomaly,
      timestamp: Date.now()
    };
  }

  // Anti-Bot Detection
  async detectBotBehavior(walletAddress: string, sessionData: any): Promise<boolean> {
    const behavior = this.walletBehavior.get(walletAddress);
    if (!behavior) return false;

    // Check for bot-like patterns
    const patterns = [
      this.hasUniformTiming(walletAddress),
      this.hasIdenticalUserAgent(sessionData.userAgent),
      this.hasNoMouseMovement(sessionData),
      this.hasPerfectPredictionTiming(walletAddress)
    ];

    return patterns.filter(Boolean).length >= 2;
  }

  // Prediction Validation
  validatePrediction(prediction: any, walletAddress: string): { valid: boolean; reason?: string } {
    // Check for duplicate predictions
    const recentPredictions = this.getRecentPredictions(walletAddress, 60 * 1000); // last minute
    const duplicate = recentPredictions.find(p => 
      JSON.stringify(p.prediction) === JSON.stringify(prediction)
    );

    if (duplicate) {
      return { valid: false, reason: 'Duplicate prediction detected' };
    }

    // Check prediction amount limits
    if (prediction.amount && prediction.amount > 1000) {
      return { valid: false, reason: 'Prediction amount exceeds limit' };
    }

    // Check for valid prediction data
    if (!prediction.assetId || !prediction.direction || !prediction.amount) {
      return { valid: false, reason: 'Invalid prediction data' };
    }

    return { valid: true };
  }

  // Record prediction for analysis
  recordPrediction(prediction: any, walletAddress: string) {
    const key = `${walletAddress}_predictions`;
    if (!this.predictionHistory.has(key)) {
      this.predictionHistory.set(key, []);
    }

    const history = this.predictionHistory.get(key)!;
    history.push({
      timestamp: Date.now(),
      prediction,
      walletAddress
    });

    // Update wallet behavior
    const behavior = this.walletBehavior.get(walletAddress);
    if (behavior) {
      behavior.totalPredictions++;
    }

    // Keep only last 100 predictions
    if (history.length > 100) {
      history.shift();
    }
  }

  // Helper methods
  private getRecentPredictions(walletAddress: string, timeWindow: number) {
    const key = `${walletAddress}_predictions`;
    const history = this.predictionHistory.get(key) || [];
    const cutoff = Date.now() - timeWindow;
    return history.filter(p => p.timestamp > cutoff);
  }

  private detectIdenticalPatterns(walletAddress: string): number {
    const recent = this.getRecentPredictions(walletAddress, 24 * 60 * 60 * 1000); // last 24 hours
    const patterns = new Set();
    let identical = 0;

    for (const prediction of recent) {
      const pattern = JSON.stringify({
        direction: prediction.prediction.direction,
        amount: prediction.prediction.amount
      });
      
      if (patterns.has(pattern)) {
        identical++;
      } else {
        patterns.add(pattern);
      }
    }

    return identical;
  }

  private detectCoordinatedTiming(walletAddress: string): boolean {
    // Simplified coordination detection
    // In production, this would check against other accounts' timing patterns
    const recent = this.getRecentPredictions(walletAddress, 60 * 60 * 1000); // last hour
    
    // Check for predictions at exact minute intervals (bot-like behavior)
    const minuteMarks = recent.filter(p => p.timestamp % (60 * 1000) < 5000);
    return minuteMarks.length > 3;
  }

  private calculatePriceDeviation(prices: Array<{ price: number; timestamp: number }>): number {
    if (prices.length < 2) return 0;

    const values = prices.map(p => p.price);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev / mean) * 100; // Return as percentage
  }

  private detectVolumeAnomaly(assetId: string): boolean {
    // Simplified volume anomaly detection
    // In production, this would analyze actual trading volume data
    const random = Math.random();
    return random < 0.05; // 5% chance of volume anomaly for demo
  }

  private hasUniformTiming(walletAddress: string): boolean {
    const recent = this.getRecentPredictions(walletAddress, 24 * 60 * 60 * 1000);
    if (recent.length < 3) return false;

    const intervals = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i-1].timestamp);
    }

    // Check if intervals are suspiciously uniform
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return variance < (avgInterval * 0.1); // Less than 10% variance indicates bot
  }

  private hasIdenticalUserAgent(userAgent: string): boolean {
    // Check against known bot user agents
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /headless/i,
      /phantom/i,
      /selenium/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private hasNoMouseMovement(sessionData: any): boolean {
    // Check if session data indicates no mouse movement
    return !sessionData.mouseEvents || sessionData.mouseEvents.length === 0;
  }

  private hasPerfectPredictionTiming(walletAddress: string): boolean {
    const recent = this.getRecentPredictions(walletAddress, 24 * 60 * 60 * 1000);
    
    // Check for predictions made at exact technical analysis points
    const perfectTimings = recent.filter(p => {
      const seconds = new Date(p.timestamp).getSeconds();
      return seconds === 0 || seconds === 30; // Predictions made at exact 30-second intervals
    });

    return perfectTimings.length > recent.length * 0.8; // 80% of predictions at perfect timing
  }
}

export const securityService = new SecurityService();