# Backend API Implementation Plan

## Current Status ✅

### Already Implemented
The following endpoints and services are already operational:

**User & Auth:**
- `POST /api/auth/wallet` - Wallet authentication with signature verification
- `GET /api/users/:id` - Get user profile
- `GET /api/achievements/user/:userId` - Get user achievements

**Predictions:**
- `POST /api/predictions` - Submit prediction (with Yellow Network integration)
- `GET /api/predictions/user/:userId` - Get user predictions
- Background task: Automatic settlement every 60 seconds

**Tournaments:**
- `GET /api/tournaments` - Get active tournaments
- `POST /api/tournaments/:id/join` - Join tournament
- `GET /api/tournaments/:id/leaderboard` - Tournament leaderboard
- Background task: Score updates and completion checks

**Markets/Assets:**
- `GET /api/crypto/prices` - Get current crypto prices
- `GET /api/crypto/top` - Get top cryptocurrencies

**Leaderboard:**
- `GET /api/leaderboard` - Global leaderboard

**System Status:**
- `GET /health` - Basic health check
- `GET /api/status` - Yellow Network status
- `GET /api/watchdog/status` - Watchdog monitoring
- `GET /api/watchdog/audit-log` - Audit log

**Security:**
- `GET /api/security/oracle-status/:assetId` - Oracle manipulation detection
- `GET /api/security/user-risk/:userId` - Sybil attack detection
- `POST /api/security/report-fraud` - Fraud reporting

**Platform Stats:**
- `GET /api/stats` - Global platform statistics

---

## APIs to Implement 🚧

### 1. User Profile Page (`/profile/:userId`)

#### Required Endpoints:

**✅ Already Working:**
- `GET /api/users/:userId` - Returns user data
- `GET /api/predictions/user/:userId` - Returns prediction history
- `GET /api/achievements/user/:userId` - Returns achievements

**🆕 Need to Add:**

```typescript
// Get user stats summary
GET /api/users/:userId/stats
Response: {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  totalRewards: string;
  reputation: string;
  level: number;
  tournamentsWon: number;
  challengesWon: number;
}

// Get user tournament history
GET /api/users/:userId/tournaments
Query: ?limit=10&offset=0
Response: {
  tournaments: [{
    id, name, rank, score, prizewon, completedAt
  }]
}

// Update user profile (username, avatar, etc.)
PATCH /api/users/:userId
Body: { username?, bio?, avatar? }
```

**Implementation Steps:**
1. Add `getUserStats()` method to storage.ts
2. Add `getUserTournaments()` method to storage.ts
3. Add endpoints to routes.ts
4. Update User schema to include bio and avatar fields

---

### 2. Markets Page (`/markets`)

#### Required Endpoints:

**✅ Already Working:**
- `GET /api/crypto/prices` - Get coin prices
- `GET /api/crypto/top` - Get top coins

**🆕 Need to Add:**

```typescript
// Get all assets with filtering
GET /api/assets
Query: ?search=btc&category=layer1&sort=volume&limit=50
Response: {
  assets: [{
    id, symbol, name, currentPrice, priceChange24h,
    volume24h, marketCap, category, predictionCount,
    bullishSentiment, accuracyRate
  }]
}

// Get featured assets
GET /api/assets/featured
Response: {
  trending: Asset[];
  mostPredicted: Asset[];
  highVolatility: Asset[];
}

// Get asset detail
GET /api/assets/:assetId
Response: {
  id, symbol, name, currentPrice, priceChange24h,
  volume24h, marketCap, category,
  priceHistory: { timestamp, price }[],
  predictionStats: {
    total: number,
    bullish: number,
    bearish: number,
    accuracy: number
  }
}
```

**Implementation Steps:**
1. Enhance CryptoAsset schema with category, prediction counts
2. Add `getAssets()` with filtering to storage.ts
3. Add `getFeaturedAssets()` to storage.ts
4. Add `getAssetPredictionStats()` to storage.ts
5. Create assetService.ts for business logic
6. Add endpoints to routes.ts

---

### 3. Challenges Page (`/challenges`)

**⚠️ NEW FEATURE - Requires full implementation**

#### Database Schema Needed:

```typescript
// shared/schema.ts additions
export const challenges = pgTable('challenges', {
  id: text('id').primaryKey().default('challenge_' + nanoid()),
  challengerId: text('challenger_id').notNull().references(() => users.id),
  opponentId: text('opponent_id').references(() => users.id),
  assetId: text('asset_id').notNull(),
  predictionType: text('prediction_type').notNull(),
  amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
  timeFrame: integer('time_frame').notNull(), // minutes
  status: text('status').notNull().default('pending'), // pending, accepted, completed, cancelled
  challengerPrediction: text('challenger_prediction'),
  opponentPrediction: text('opponent_prediction'),
  winnerId: text('winner_id').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  settledAt: timestamp('settled_at'),
});
```

#### Required Endpoints:

```typescript
// Create challenge
POST /api/challenges
Body: {
  assetId, predictionType, amount, timeFrame,
  opponentId?, isPublic
}

// Get user challenges
GET /api/challenges/user/:userId
Response: { challenges: Challenge[] }

// Get open challenges (public)
GET /api/challenges/open
Response: { challenges: Challenge[] }

// Accept challenge
POST /api/challenges/:id/accept
Body: { userId, prediction }

// Get challenge stats
GET /api/challenges/stats/:userId
Response: {
  totalChallenges, won, lost, draws, winRate
}

// Get challenge leaderboard
GET /api/challenges/leaderboard
Query: ?limit=10
Response: { leaderboard: LeaderboardEntry[] }

// Get recent activity
GET /api/challenges/recent
Query: ?limit=10
Response: { activities: Activity[] }

// Cancel challenge
POST /api/challenges/:id/cancel
Body: { userId }
```

**Implementation Steps:**
1. Add Challenge table to database schema
2. Create multiPartyService enhancements for challenge logic
3. Add storage methods: createChallenge, acceptChallenge, getChallenges, etc.
4. Add settlement logic to background task
5. Add WebSocket events for real-time challenge updates
6. Add all endpoints to routes.ts

---

### 4. Tournament Detail Page (`/tournaments/:id`)

#### Required Endpoints:

**✅ Already Working:**
- `GET /api/tournaments/:id/leaderboard` - Tournament rankings

**🆕 Need to Add:**

```typescript
// Get tournament details
GET /api/tournaments/:id
Response: {
  id, name, description, status, prizePool, entryFee,
  startTime, endTime, maxParticipants, currentParticipants,
  minPredictions, eligibleAssets, rules, scoringSystem
}

// Get tournament activity feed
GET /api/tournaments/:id/activity
Query: ?limit=20
Response: {
  activities: [{
    id, type, userId, username, description, timestamp
  }]
}

// Get tournament participants
GET /api/tournaments/:id/participants
Response: {
  participants: [{
    userId, username, joinedAt, totalPredictions,
    accuracy, rank
  }]
}

// Leave tournament
POST /api/tournaments/:id/leave
Body: { userId }
```

**Implementation Steps:**
1. Enhance Tournament schema with detailed fields
2. Add activity logging to storage
3. Add getTournamentActivity() to storage.ts
4. Add getTournamentParticipants() (already exists, enhance)
5. Add leaveTournament() to storage.ts
6. Update tournamentService.ts
7. Add endpoints to routes.ts

---

### 5. System Status Page (`/status`)

#### Required Endpoints:

**✅ Already Working:**
- `GET /health` - Basic health
- `GET /api/status` - Yellow Network status
- `GET /api/watchdog/status` - Watchdog status

**🆕 Need to Add:**

```typescript
// Get service health status
GET /api/status/services
Response: {
  services: [{
    name: 'Yellow Network' | 'Database' | 'API' | 'WebSocket',
    status: 'operational' | 'degraded' | 'down',
    uptime: number,
    responseTime?: number,
    lastCheck: string
  }]
}

// Get Yellow Network detailed health
GET /api/status/yellow-network
Response: {
  connected: boolean,
  sessionOpen: boolean,
  healthScore: number,
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F',
  lastRpcTimestamp: number,
  circuitOpen: boolean,
  failureCount: number,
  reconnectAttempts: number,
  queuedRequests: number,
  pendingRequests: number
}

// Get performance metrics
GET /api/status/performance
Response: {
  apiResponseTime: { avg, p50, p95, p99 },
  settlementTime: { avg, min, max },
  websocketLatency: number,
  databaseQueryTime: number
}

// Get incident history
GET /api/status/incidents
Query: ?days=30
Response: {
  incidents: [{
    id, title, description, status, severity,
    startTime, endTime, duration, affectedServices
  }]
}
```

**Implementation Steps:**
1. Create statusService.ts for service monitoring
2. Add performance metrics tracking
3. Create Incident schema and storage
4. Enhance Yellow Network service methods
5. Add all endpoints to routes.ts

---

### 6. Leaderboard Page (`/leaderboard`)

#### Required Endpoints:

**✅ Already Working:**
- `GET /api/leaderboard` - Basic global leaderboard

**🆕 Need to Enhance:**

```typescript
// Enhanced global leaderboard with filters
GET /api/leaderboard/global
Query: ?period=all_time&category=all&minPredictions=10&limit=100
Response: {
  leaderboard: [{
    rank, userId, username, walletAddress, level,
    totalPredictions, correctPredictions, accuracy,
    reputation, currentStreak, maxStreak,
    totalRewards, lastActive
  }]
}

// Monthly leaderboard
GET /api/leaderboard/monthly
Query: ?category=all&minPredictions=10
Response: { leaderboard: [...] }

// Tournament champions
GET /api/leaderboard/tournament-champions
Response: {
  champions: [{
    rank, userId, username, tournamentsWon,
    totalPlacements, averageRank, totalPrizes
  }]
}

// Challenge champions
GET /api/leaderboard/challenge-champions
Response: {
  champions: [{
    rank, userId, username, challengesWon,
    winRate, totalEarnings
  }]
}
```

**Implementation Steps:**
1. Enhance storage.ts leaderboard methods with filtering
2. Add monthly leaderboard calculation
3. Add tournament champion aggregation
4. Add challenge champion aggregation
5. Update endpoints in routes.ts

---

## Implementation Priority

### Phase 1 (Critical - Do First) 🔴
1. **Challenges System** - New feature, high complexity
   - Database schema
   - Storage layer
   - Service layer
   - API endpoints
   - Settlement logic

### Phase 2 (High Priority) 🟠
2. **Markets API Enhancement** - Core feature
3. **Tournament Detail Enhancements** - Improves UX
4. **User Profile Stats** - Core feature

### Phase 3 (Medium Priority) 🟡
5. **Leaderboard Enhancements** - Nice to have filters
6. **System Status APIs** - Monitoring improvements

---

## Database Schema Changes Required

### New Tables:
1. **challenges** - Full table (see Challenges section)
2. **incidents** - System incidents tracking
3. **activity_log** - Tournament/challenge activity feed
4. **asset_categories** - Asset categorization

### Table Enhancements:
1. **users** - Add: bio, avatar, tournamentsWon, challengesWon
2. **crypto_assets** - Add: category, volume24h, marketCap
3. **tournaments** - Add: description, rules, scoringSystem, eligibleAssets
4. **predictions** - Add: challengeId reference

---

## Service Layer Additions

### New Services:
1. **challengeService.ts** - Challenge business logic
2. **assetService.ts** - Asset aggregation and stats
3. **statusService.ts** - System monitoring
4. **activityService.ts** - Activity feed management

### Service Enhancements:
1. **multiPartyService.ts** - Already exists, expand for challenges
2. **tournamentService.ts** - Add activity logging
3. **yellowNetworkService.ts** - Add detailed metrics

---

## WebSocket Events to Add

```typescript
// Real-time challenge events
ws.on('challenge_created', { challenge })
ws.on('challenge_accepted', { challengeId, opponentId })
ws.on('challenge_settled', { challengeId, winnerId })

// Tournament activity
ws.on('tournament_activity', { tournamentId, activity })

// Market updates
ws.on('asset_trending', { assetId, metrics })
```

---

## Background Tasks to Add

```typescript
// Challenge settlement (add to existing interval)
- Check expired challenges
- Determine winners
- Distribute rewards
- Update user stats

// Asset metrics calculation (every 5 minutes)
- Calculate prediction counts per asset
- Calculate bullish/bearish sentiment
- Update trending assets

// Performance metrics (every 1 minute)
- Track API response times
- Track settlement times
- Track WebSocket latency
```

---

## Testing Strategy

### Unit Tests:
- Storage layer methods
- Service layer business logic
- Settlement calculations

### Integration Tests:
- Full challenge flow: create → accept → settle
- Tournament lifecycle
- Asset filtering and searching

### API Tests:
- Endpoint response formats
- Error handling
- Rate limiting

---

## Deployment Checklist

1. ✅ Run database migrations for new tables
2. ✅ Update .env.example with new config
3. ✅ Test Yellow Network integration
4. ✅ Verify background tasks running
5. ✅ Test WebSocket connections
6. ✅ Monitor performance metrics
7. ✅ Set up alerting for incidents

---

## Estimated Timeline

**Phase 1 (Challenges):** 3-4 days
- Day 1: Schema, storage, service layer
- Day 2: API endpoints, settlement
- Day 3: Testing, WebSocket integration
- Day 4: Bug fixes, polish

**Phase 2 (Markets, Tournaments, Profile):** 2-3 days
- Day 1: Markets + Asset service
- Day 2: Tournament enhancements + Profile stats
- Day 3: Testing

**Phase 3 (Leaderboard, Status):** 1-2 days
- Day 1: Enhanced leaderboards
- Day 2: System status improvements

**Total: 6-9 days for complete implementation**

---

## Notes

- All endpoints should use existing rate limiting middleware
- Use existing logger service for structured logging
- Leverage existing Yellow Network integration
- Follow existing code patterns and conventions
- Add comprehensive error handling
- Include input validation with Zod schemas
- Broadcast WebSocket events for real-time updates
