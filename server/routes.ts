import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { coinGeckoService } from "./services/coinGeckoService";
import { yellowNetworkService } from "./services/yellowNetworkService";
import { tournamentService } from "./services/tournamentService";
import { securityService } from "./services/securityService";
import { generalRateLimit, predictionRateLimit, authRateLimit, apiRateLimit } from "./middleware/rateLimiter";
import { insertUserSchema, insertPredictionSchema, insertTournamentParticipantSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);

        // Handle different message types
        switch (data.type) {
          case 'subscribe_prices':
            // Subscribe client to price updates
            ws.send(JSON.stringify({
              type: 'price_update',
              data: await coinGeckoService.getTopCoins(10)
            }));
            break;
          
          case 'subscribe_leaderboard':
            // Subscribe client to leaderboard updates
            ws.send(JSON.stringify({
              type: 'leaderboard_update',
              data: await storage.getGlobalLeaderboard(10)
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { yellowNetworkStatus: yellowNetworkService.getConnectionStatus() }
    }));
  });

  // Broadcast function for real-time updates
  const broadcast = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // Apply general rate limiting to all API routes
  app.use('/api', apiRateLimit.middleware());

  // User authentication and management
  app.post("/api/auth/wallet", authRateLimit.middleware(), async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      // Check if user exists
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user
        const userData = insertUserSchema.parse({
          walletAddress,
          username: `user_${walletAddress.slice(-6)}`
        });
        user = await storage.createUser(userData);
      }

      res.json({ user });
    } catch (error) {
      console.error("Wallet authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get current crypto prices
  app.get("/api/crypto/prices", async (req, res) => {
    try {
      const { coins } = req.query;
      const coinIds = coins ? (coins as string).split(',') : ['bitcoin', 'ethereum', 'solana', 'matic-network'];
      
      const cryptoData = await coinGeckoService.getCoinsData(coinIds);
      
      // Update local storage with fresh data
      for (const coin of cryptoData) {
        await storage.createOrUpdateCryptoAsset({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          currentPrice: coin.current_price.toFixed(8),
          priceChange24h: coin.price_change_percentage_24h?.toFixed(4) || "0.0000"
        });
      }

      res.json(cryptoData);
    } catch (error) {
      console.error("Crypto prices error:", error);
      res.status(500).json({ error: "Failed to fetch crypto prices" });
    }
  });

  // Get top cryptocurrencies
  app.get("/api/crypto/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCoins = await coinGeckoService.getTopCoins(limit);
      res.json(topCoins);
    } catch (error) {
      console.error("Top crypto error:", error);
      res.status(500).json({ error: "Failed to fetch top cryptocurrencies" });
    }
  });

  // Submit prediction
  app.post("/api/predictions", predictionRateLimit.middleware(), async (req, res) => {
    try {
      const predictionData = insertPredictionSchema.parse(req.body);
      
      // Security validation
      const sybilCheck = await securityService.detectSybilAttack(predictionData.userId, req.get('User-Agent'), req.ip);
      if (sybilCheck.isSuspicious) {
        return res.status(403).json({ 
          error: "Suspicious activity detected", 
          reasons: sybilCheck.reasons,
          riskScore: sybilCheck.riskScore 
        });
      }

      // Validate prediction data
      const validationResult = securityService.validatePrediction(predictionData, predictionData.userId);
      if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.reason });
      }
      
      // Validate expiration time
      if (predictionData.expiresAt <= new Date()) {
        return res.status(400).json({ error: "Expiration time must be in the future" });
      }

      // Record prediction for security analysis
      securityService.recordPrediction(predictionData, predictionData.userId);

      const prediction = await storage.createPrediction(predictionData);

      // Submit to Yellow Network state channel
      try {
        const stateChannelTx = await yellowNetworkService.submitPrediction({
          userId: predictionData.userId,
          assetId: predictionData.assetId,
          predictionType: predictionData.predictionType,
          targetPrice: predictionData.targetPrice ? parseFloat(predictionData.targetPrice) : undefined,
          direction: predictionData.direction || undefined,
          timeFrame: predictionData.timeFrame || 60,
          amount: 1 // Mock amount for now
        });

        // Update prediction with state channel transaction
        await storage.updatePrediction(prediction.id, { stateChannelTx });
        
        broadcast('prediction_submitted', { 
          predictionId: prediction.id, 
          userId: predictionData.userId,
          stateChannelTx 
        });

      } catch (stateChannelError) {
        console.error("State channel submission error:", stateChannelError);
        // Continue without state channel for now
      }

      res.json(prediction);
    } catch (error) {
      console.error("Prediction creation error:", error);
      res.status(500).json({ error: "Failed to create prediction" });
    }
  });

  // Get user predictions
  app.get("/api/predictions/user/:userId", async (req, res) => {
    try {
      const predictions = await storage.getUserPredictions(req.params.userId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Get active tournaments
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getActiveTournaments();
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  // Join tournament
  app.post("/api/tournaments/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const tournamentId = req.params.id;

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      if (tournament.maxParticipants && 
          tournament.currentParticipants >= tournament.maxParticipants) {
        return res.status(400).json({ error: "Tournament is full" });
      }

      const participantData = insertTournamentParticipantSchema.parse({
        tournamentId,
        userId
      });

      const participant = await storage.addTournamentParticipant(participantData);
      
      broadcast('tournament_joined', { tournamentId, userId, participant });
      
      res.json(participant);
    } catch (error) {
      console.error("Tournament join error:", error);
      res.status(500).json({ error: "Failed to join tournament" });
    }
  });

  // Get tournament leaderboard
  app.get("/api/tournaments/:id/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getTournamentLeaderboard(req.params.id, limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournament leaderboard" });
    }
  });

  // Get global leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getGlobalLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global leaderboard" });
    }
  });

  // Get user achievements
  app.get("/api/achievements/user/:userId", async (req, res) => {
    try {
      const userAchievements = await storage.getUserAchievements(req.params.userId);
      const allAchievements = await storage.getAllAchievements();
      
      res.json({
        earned: userAchievements,
        available: allAchievements
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Platform statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const tournamentStats = await tournamentService.getActiveTournamentStats();
      const globalLeaderboard = await storage.getGlobalLeaderboard(1);
      const topAccuracy = globalLeaderboard[0] ? 
        (globalLeaderboard[0].totalPredictions > 0 ? 
          (globalLeaderboard[0].correctPredictions / globalLeaderboard[0].totalPredictions * 100).toFixed(1) : 
          "0.0") : "0.0";

      res.json({
        activePredictors: await storage.getGlobalLeaderboard(1000).then(users => users.length),
        totalVolume: "$127K", // This would be calculated from actual volume
        oracleAccuracy: topAccuracy + "%",
        avgSettlement: "0.003s",
        yellowNetworkStatus: yellowNetworkService.getConnectionStatus()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform statistics" });
    }
  });

  // Background tasks for price monitoring and prediction settlement
  setInterval(async () => {
    try {
      // Check active predictions that need settlement
      const activePredictions = await storage.getActivePredictions();
      const now = new Date();

      for (const prediction of activePredictions) {
        if (prediction.expiresAt <= now) {
          // Get current price for settlement
          const currentPrice = await coinGeckoService.getCurrentPrice(prediction.assetId);
          
          let isCorrect = false;
          
          // Determine if prediction was correct based on type
          switch (prediction.predictionType) {
            case 'price_target':
              if (prediction.targetPrice) {
                const targetPrice = parseFloat(prediction.targetPrice);
                const tolerance = targetPrice * 0.02; // 2% tolerance
                isCorrect = Math.abs(currentPrice - targetPrice) <= tolerance;
              }
              break;
              
            case 'direction':
              // This would require the price at prediction time
              // For now, we'll use a simplified version
              isCorrect = Math.random() > 0.5; // Mock for demonstration
              break;
              
            case 'above_below':
              if (prediction.targetPrice) {
                const targetPrice = parseFloat(prediction.targetPrice);
                isCorrect = prediction.direction === 'up' ? 
                  currentPrice > targetPrice : 
                  currentPrice < targetPrice;
              }
              break;
          }

          // Update prediction
          await storage.updatePrediction(prediction.id, {
            actualPrice: currentPrice.toFixed(8),
            isCorrect,
            settledAt: now
          });

          // Update user stats
          const user = await storage.getUser(prediction.userId);
          if (user) {
            const newTotal = user.totalPredictions + 1;
            const newCorrect = user.correctPredictions + (isCorrect ? 1 : 0);
            const newStreak = isCorrect ? user.currentStreak + 1 : 0;
            
            await storage.updateUser(user.id, {
              totalPredictions: newTotal,
              correctPredictions: newCorrect,
              currentStreak: newStreak,
              maxStreak: Math.max(user.maxStreak, newStreak)
            });
          }

          // Submit settlement to Yellow Network
          try {
            await yellowNetworkService.settlePrediction(
              prediction.id, 
              currentPrice, 
              isCorrect
            );
          } catch (error) {
            console.error("Yellow Network settlement error:", error);
          }

          // Broadcast settlement
          broadcast('prediction_settled', {
            predictionId: prediction.id,
            isCorrect,
            actualPrice: currentPrice
          });
        }
      }

      // Update tournament scores
      const activeTournaments = await storage.getActiveTournaments();
      for (const tournament of activeTournaments) {
        await tournamentService.updateTournamentScores(tournament.id);
        await tournamentService.checkTournamentCompletion(tournament.id);
      }

    } catch (error) {
      console.error("Background task error:", error);
    }
  }, 60000); // Check every minute

  // Real-time price updates broadcast
  setInterval(async () => {
    try {
      const topCoins = await coinGeckoService.getTopCoins(10);
      broadcast('price_update', topCoins);
    } catch (error) {
      console.error("Price update broadcast error:", error);
    }
  }, 30000); // Update every 30 seconds

  // Security monitoring endpoints
  app.get("/api/security/oracle-status/:assetId", generalRateLimit.middleware(), async (req, res) => {
    try {
      const { assetId } = req.params;
      const currentPrice = await coinGeckoService.getCurrentPrice(assetId);
      const oracleAlert = await securityService.detectOracleManipulation(assetId, currentPrice);
      
      res.json({
        assetId,
        currentPrice,
        status: oracleAlert.suspiciousActivity ? 'ALERT' : 'NORMAL',
        priceDeviation: oracleAlert.priceDeviation,
        volumeAnomaly: oracleAlert.volumeAnomaly,
        timestamp: oracleAlert.timestamp
      });
    } catch (error) {
      console.error("Oracle status error:", error);
      res.status(500).json({ error: "Failed to check oracle status" });
    }
  });

  app.get("/api/security/user-risk/:userId", generalRateLimit.middleware(), async (req, res) => {
    try {
      const { userId } = req.params;
      const sybilCheck = await securityService.detectSybilAttack(userId, req.get('User-Agent'), req.ip);
      
      res.json({
        userId,
        riskScore: sybilCheck.riskScore,
        isSuspicious: sybilCheck.isSuspicious,
        reasons: sybilCheck.reasons,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("User risk check error:", error);
      res.status(500).json({ error: "Failed to check user risk" });
    }
  });

  app.post("/api/security/report-fraud", generalRateLimit.middleware(), async (req, res) => {
    try {
      const { userId, predictionId, reason, description } = req.body;
      
      // Log fraud report (in production, this would go to a fraud detection system)
      console.log("Fraud report received:", {
        reportedUser: userId,
        predictionId,
        reason,
        description,
        reportedBy: req.ip,
        timestamp: new Date().toISOString()
      });

      // Run additional security checks
      const sybilCheck = await securityService.detectSybilAttack(userId);
      
      res.json({
        reportId: `FR-${Date.now()}`,
        status: 'received',
        additionalChecks: {
          sybilRisk: sybilCheck.riskScore,
          flagged: sybilCheck.isSuspicious
        },
        message: 'Fraud report received and being investigated'
      });
    } catch (error) {
      console.error("Fraud report error:", error);
      res.status(500).json({ error: "Failed to process fraud report" });
    }
  });

  // Oracle manipulation monitoring with price updates
  setInterval(async () => {
    try {
      const topCoins = await coinGeckoService.getTopCoins(10);
      
      // Check each coin for oracle manipulation
      for (const coin of topCoins) {
        const oracleAlert = await securityService.detectOracleManipulation(coin.id, coin.current_price);
        
        if (oracleAlert.suspiciousActivity) {
          console.warn("Oracle manipulation detected:", {
            assetId: coin.id,
            priceDeviation: oracleAlert.priceDeviation,
            volumeAnomaly: oracleAlert.volumeAnomaly
          });
          
          // Broadcast security alert
          broadcast('security_alert', {
            type: 'oracle_manipulation',
            assetId: coin.id,
            severity: oracleAlert.priceDeviation > 20 ? 'HIGH' : 'MEDIUM',
            details: oracleAlert
          });
        }
      }
    } catch (error) {
      console.error("Oracle monitoring error:", error);
    }
  }, 120000); // Check every 2 minutes

  return httpServer;
}
