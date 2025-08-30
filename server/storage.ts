import { 
  type User, 
  type InsertUser,
  type CryptoAsset,
  type InsertCryptoAsset,
  type Prediction,
  type InsertPrediction,
  type Tournament,
  type InsertTournament,
  type TournamentParticipant,
  type InsertTournamentParticipant,
  type Achievement,
  type UserAchievement,
  type InsertUserAchievement
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Crypto asset operations
  getCryptoAsset(id: string): Promise<CryptoAsset | undefined>;
  getAllCryptoAssets(): Promise<CryptoAsset[]>;
  createOrUpdateCryptoAsset(asset: InsertCryptoAsset): Promise<CryptoAsset>;

  // Prediction operations
  getPrediction(id: string): Promise<Prediction | undefined>;
  getUserPredictions(userId: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  updatePrediction(id: string, updates: Partial<Prediction>): Promise<Prediction | undefined>;
  getActivePredictions(): Promise<Prediction[]>;

  // Tournament operations
  getTournament(id: string): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  getActiveTournaments(): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined>;

  // Tournament participant operations
  getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]>;
  addTournamentParticipant(participant: InsertTournamentParticipant): Promise<TournamentParticipant>;
  updateParticipantScore(tournamentId: string, userId: string, score: number): Promise<void>;

  // Achievement operations
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;

  // Leaderboard operations
  getGlobalLeaderboard(limit?: number): Promise<User[]>;
  getTournamentLeaderboard(tournamentId: string, limit?: number): Promise<TournamentParticipant[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cryptoAssets: Map<string, CryptoAsset> = new Map();
  private predictions: Map<string, Prediction> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  private tournamentParticipants: Map<string, TournamentParticipant> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default achievements
    const defaultAchievements: Achievement[] = [
      {
        id: "first-win",
        name: "First Win",
        description: "Make your first correct prediction",
        icon: "fas fa-trophy",
        requirement: "1 correct prediction",
        nftTokenId: null,
      },
      {
        id: "hot-streak",
        name: "Hot Streak",
        description: "10 correct predictions in a row",
        icon: "fas fa-fire",
        requirement: "10 consecutive correct predictions",
        nftTokenId: null,
      },
      {
        id: "market-master",
        name: "Market Master",
        description: "Win 5 tournaments",
        icon: "fas fa-crown",
        requirement: "5 tournament wins",
        nftTokenId: null,
      },
      {
        id: "diamond-predictor",
        name: "Diamond Predictor",
        description: "Maintain 90%+ accuracy with 1000+ predictions",
        icon: "fas fa-diamond",
        requirement: "90% accuracy with 1000+ predictions",
        nftTokenId: null,
      },
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });

    // Initialize sample tournaments
    const sampleTournaments: Tournament[] = [
      {
        id: "crypto-champions-weekly",
        name: "Crypto Champions Weekly",
        description: "Predict top 10 crypto movements",
        prizePool: "5000.00000000",
        entryFee: "10.00000000",
        maxParticipants: 500,
        currentParticipants: 247,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: "active",
        rules: { predictionLimit: 10, targetAssets: ["bitcoin", "ethereum", "solana"] },
        createdAt: new Date(),
      },
      {
        id: "defi-prediction-cup",
        name: "DeFi Prediction Cup",
        description: "Predict DeFi protocol performances",
        prizePool: "12500.00000000",
        entryFee: "25.00000000",
        maxParticipants: 200,
        currentParticipants: 89,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: "active",
        rules: { predictionLimit: 15, targetAssets: ["aave", "uniswap", "compound"] },
        createdAt: new Date(),
      },
    ];

    sampleTournaments.forEach(tournament => {
      this.tournaments.set(tournament.id, tournament);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      level: 1,
      reputation: "0.00",
      totalPredictions: 0,
      correctPredictions: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalRewards: "0.00000000",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Crypto asset operations
  async getCryptoAsset(id: string): Promise<CryptoAsset | undefined> {
    return this.cryptoAssets.get(id);
  }

  async getAllCryptoAssets(): Promise<CryptoAsset[]> {
    return Array.from(this.cryptoAssets.values());
  }

  async createOrUpdateCryptoAsset(asset: InsertCryptoAsset): Promise<CryptoAsset> {
    const cryptoAsset: CryptoAsset = {
      ...asset,
      lastUpdated: new Date()
    };
    this.cryptoAssets.set(asset.id, cryptoAsset);
    return cryptoAsset;
  }

  // Prediction operations
  async getPrediction(id: string): Promise<Prediction | undefined> {
    return this.predictions.get(id);
  }

  async getUserPredictions(userId: string): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(p => p.userId === userId);
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = randomUUID();
    const prediction: Prediction = {
      ...insertPrediction,
      id,
      isCorrect: null,
      actualPrice: null,
      reward: "0.00000000",
      stateChannelTx: null,
      createdAt: new Date(),
      settledAt: null
    };
    this.predictions.set(id, prediction);
    return prediction;
  }

  async updatePrediction(id: string, updates: Partial<Prediction>): Promise<Prediction | undefined> {
    const prediction = this.predictions.get(id);
    if (!prediction) return undefined;
    
    const updatedPrediction = { ...prediction, ...updates };
    this.predictions.set(id, updatedPrediction);
    return updatedPrediction;
  }

  async getActivePredictions(): Promise<Prediction[]> {
    const now = new Date();
    return Array.from(this.predictions.values()).filter(p => 
      p.expiresAt > now && p.isCorrect === null
    );
  }

  // Tournament operations
  async getTournament(id: string): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return Array.from(this.tournaments.values()).filter(t => 
      t.status === "active" && t.endTime > now
    );
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = randomUUID();
    const tournament: Tournament = {
      ...insertTournament,
      id,
      currentParticipants: 0,
      status: "upcoming",
      createdAt: new Date()
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    const updatedTournament = { ...tournament, ...updates };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  // Tournament participant operations
  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    return Array.from(this.tournamentParticipants.values())
      .filter(p => p.tournamentId === tournamentId)
      .sort((a, b) => (parseFloat(b.score) - parseFloat(a.score)));
  }

  async addTournamentParticipant(insertParticipant: InsertTournamentParticipant): Promise<TournamentParticipant> {
    const id = randomUUID();
    const participant: TournamentParticipant = {
      ...insertParticipant,
      id,
      score: "0.00",
      rank: null,
      joinedAt: new Date()
    };
    this.tournamentParticipants.set(id, participant);
    
    // Update tournament participant count
    const tournament = this.tournaments.get(insertParticipant.tournamentId);
    if (tournament) {
      tournament.currentParticipants = (tournament.currentParticipants || 0) + 1;
      this.tournaments.set(tournament.id, tournament);
    }
    
    return participant;
  }

  async updateParticipantScore(tournamentId: string, userId: string, score: number): Promise<void> {
    const participant = Array.from(this.tournamentParticipants.values())
      .find(p => p.tournamentId === tournamentId && p.userId === userId);
    
    if (participant) {
      participant.score = score.toString();
      this.tournamentParticipants.set(participant.id, participant);
    }
  }

  // Achievement operations
  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values()).filter(ua => ua.userId === userId);
  }

  async awardAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const userAchievement: UserAchievement = {
      ...insertUserAchievement,
      id,
      earnedAt: new Date()
    };
    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }

  // Leaderboard operations
  async getGlobalLeaderboard(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => {
        const aAccuracy = a.totalPredictions > 0 ? a.correctPredictions / a.totalPredictions : 0;
        const bAccuracy = b.totalPredictions > 0 ? b.correctPredictions / b.totalPredictions : 0;
        return bAccuracy - aAccuracy;
      })
      .slice(0, limit);
  }

  async getTournamentLeaderboard(tournamentId: string, limit: number = 10): Promise<TournamentParticipant[]> {
    return (await this.getTournamentParticipants(tournamentId)).slice(0, limit);
  }
}

export const storage = new MemStorage();
