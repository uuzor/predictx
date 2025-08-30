export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  last_updated?: string;
}

export interface PredictionMarket {
  assetId: string;
  question: string;
  yesPercentage: number;
  noPercentage: number;
  timeFrame: string;
  type: 'price_target' | 'direction' | 'above_below';
  targetPrice?: number;
  direction?: 'up' | 'down';
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  prizePool: string;
  entryFee: string;
  maxParticipants?: number;
  currentParticipants: number;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  rules?: any;
}

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  level: number;
  reputation: string;
  totalPredictions: number;
  correctPredictions: number;
  currentStreak: number;
  maxStreak: number;
  totalRewards: string;
}

export interface Prediction {
  id: string;
  userId: string;
  assetId: string;
  tournamentId?: string;
  predictionType: string;
  targetPrice?: string;
  direction?: string;
  timeFrame?: number;
  expiresAt: Date;
  actualPrice?: string;
  isCorrect?: boolean;
  reward: string;
  stateChannelTx?: string;
  createdAt: Date;
  settledAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  nftTokenId?: string;
  earned?: boolean;
  progress?: number;
}

export interface LeaderboardEntry {
  user: User;
  rank: number;
  accuracy: number;
  score?: string;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface YellowNetworkStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  blockNumber?: number;
  chainId?: number;
}
