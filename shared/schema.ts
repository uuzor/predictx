import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  level: integer("level").default(1),
  reputation: decimal("reputation", { precision: 10, scale: 2 }).default("0.00"),
  totalPredictions: integer("total_predictions").default(0),
  correctPredictions: integer("correct_predictions").default(0),
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  totalRewards: decimal("total_rewards", { precision: 18, scale: 8 }).default("0.00000000"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cryptoAssets = pgTable("crypto_assets", {
  id: varchar("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 4 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assetId: varchar("asset_id").references(() => cryptoAssets.id).notNull(),
  tournamentId: varchar("tournament_id").references(() => tournaments.id),
  predictionType: text("prediction_type").notNull(), // "price_target", "direction", "above_below"
  targetPrice: decimal("target_price", { precision: 18, scale: 8 }),
  direction: text("direction"), // "up", "down"
  timeFrame: integer("time_frame"), // in minutes
  expiresAt: timestamp("expires_at").notNull(),
  actualPrice: decimal("actual_price", { precision: 18, scale: 8 }),
  isCorrect: boolean("is_correct"),
  reward: decimal("reward", { precision: 18, scale: 8 }).default("0.00000000"),
  stateChannelTx: text("state_channel_tx"), // Yellow Network transaction hash
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "crypto", "sports", "weather", "elections", "custom"
  type: text("type").notNull(), // "standard", "bracket_elimination", "season_long", "multi_stage"
  prizePool: decimal("prize_pool", { precision: 18, scale: 8 }).notNull(),
  entryFee: decimal("entry_fee", { precision: 18, scale: 8 }).default("0.00000000"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  minParticipants: integer("min_participants").default(2),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  registrationEnd: timestamp("registration_end"),
  status: text("status").default("upcoming"), // "upcoming", "active", "completed", "cancelled"
  difficulty: text("difficulty").default("beginner"), // "beginner", "intermediate", "expert", "pro"
  rules: jsonb("rules"), // Tournament-specific rules
  metadata: jsonb("metadata"), // Additional tournament data (bracket info, season details, etc.)
  seasonId: varchar("season_id"), // For season-long tournaments
  parentTournamentId: varchar("parent_tournament_id"), // For multi-stage tournaments
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournamentParticipants = pgTable("tournament_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).default("0.00"),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: text("requirement").notNull(),
  nftTokenId: text("nft_token_id"),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("upcoming"), // "upcoming", "active", "completed"
  totalPrizePool: decimal("total_prize_pool", { precision: 18, scale: 8 }).default("0.00000000"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournamentBrackets = pgTable("tournament_brackets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  round: integer("round").notNull(), // 1, 2, 4, 8, etc.
  matchNumber: integer("match_number").notNull(),
  participant1Id: varchar("participant1_id").references(() => users.id),
  participant2Id: varchar("participant2_id").references(() => users.id),
  winnerId: varchar("winner_id").references(() => users.id),
  participant1Score: decimal("participant1_score", { precision: 10, scale: 2 }).default("0.00"),
  participant2Score: decimal("participant2_score", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("pending"), // "pending", "active", "completed"
  scheduledTime: timestamp("scheduled_time"),
  completedAt: timestamp("completed_at"),
});

export const tournamentStages = pgTable("tournament_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id).notNull(),
  stageName: text("stage_name").notNull(), // "Qualification", "Group Stage", "Knockout", "Finals"
  stageNumber: integer("stage_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").default("upcoming"), // "upcoming", "active", "completed"
  requirements: jsonb("requirements"), // Stage-specific requirements
  rewards: jsonb("rewards"), // Stage-specific rewards
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCryptoAssetSchema = createInsertSchema(cryptoAssets).omit({
  lastUpdated: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
  settledAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements);

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentBracketSchema = createInsertSchema(tournamentBrackets).omit({
  id: true,
});

export const insertTournamentStageSchema = createInsertSchema(tournamentStages).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CryptoAsset = typeof cryptoAssets.$inferSelect;
export type InsertCryptoAsset = z.infer<typeof insertCryptoAssetSchema>;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;

export type TournamentBracket = typeof tournamentBrackets.$inferSelect;
export type InsertTournamentBracket = z.infer<typeof insertTournamentBracketSchema>;

export type TournamentStage = typeof tournamentStages.$inferSelect;
export type InsertTournamentStage = z.infer<typeof insertTournamentStageSchema>;
