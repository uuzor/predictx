# Recommended Pages for PredictX

## Current Pages
✅ Dashboard (/) - Overview with markets, tournaments, leaderboard
✅ Security (/security) - Security monitoring dashboard
✅ Not Found (404) - Error page

---

## 🎯 PRIORITY 1: Core User Experience Pages

### 1. User Profile Page (`/profile` or `/profile/:userId`)
**Purpose:** User's personal hub for all their activity

**Key Sections:**
- **User Stats Card**
  - Total predictions: 127
  - Accuracy: 78.5%
  - Current streak: 12
  - Best streak: 23
  - Total rewards earned
  - Reputation score
  - Level and progress bar

- **Prediction History Table**
  - Date, Asset, Type, Prediction, Actual, Result
  - Filters: All / Won / Lost / Pending
  - Sorting: Date, Asset, Accuracy
  - Pagination

- **Tournament History**
  - Tournaments participated in
  - Rankings achieved
  - Prizes won

- **Achievement Showcase**
  - Earned achievements with NFT display
  - Progress towards locked achievements
  - Achievement collection completion %

- **Challenge Statistics** (NEW)
  - P2P challenges won/lost/draw
  - Challenge win rate
  - Total challenge earnings

**Why Important:** Users need to track their progress and see their stats

---

### 2. Prediction Detail Page (`/predictions/:id`)
**Purpose:** Detailed view of a single prediction

**Key Sections:**
- **Prediction Info Card**
  - Asset name and icon
  - Prediction type (direction, price target, above/below)
  - Your prediction vs actual price
  - Time frame
  - Status (pending, won, lost)

- **Price Chart**
  - Historical price data
  - Mark prediction submission point
  - Mark expiration point
  - Show target price line

- **State Channel Info**
  - Transaction hash on Yellow Network
  - Settlement status
  - Block explorer link

- **Timeline**
  - Created at
  - Submitted to Yellow Network
  - Settled at
  - Rewards distributed

**Why Important:** Transparency and detailed tracking of each prediction

---

### 3. Markets Page (`/markets`)
**Purpose:** Comprehensive view of all tradeable assets

**Currently:** Routed to Dashboard, needs dedicated page

**Key Sections:**
- **Asset Grid/List Toggle**
  - Search and filter by name, category
  - Sort by: Price, 24h change, volume, popularity

- **Featured Markets**
  - Top trending assets
  - Most predicted
  - Highest volatility

- **Market Categories**
  - Crypto (BTC, ETH, SOL, etc.)
  - DeFi tokens
  - Layer 1s, Layer 2s
  - Memecoins

- **Quick Predict Cards**
  - Click asset → Quick predict modal
  - Real-time price updates
  - 1-click prediction submission

- **Market Analytics**
  - Total prediction volume per asset
  - Community sentiment (% predicting up/down)
  - Accuracy rates per asset

**Why Important:** Better asset discovery and prediction creation

---

### 4. Asset Detail Page (`/markets/:assetId`)
**Purpose:** Deep dive into a specific cryptocurrency

**Key Sections:**
- **Price Chart**
  - TradingView-style chart
  - Multiple timeframes (1h, 4h, 1d, 1w)
  - Technical indicators

- **Asset Info**
  - Current price
  - 24h change, volume
  - Market cap, rank
  - Links to CoinGecko, website, socials

- **Community Predictions**
  - Active predictions on this asset
  - Community sentiment gauge
  - Top predictors for this asset

- **Historical Performance**
  - Prediction accuracy for this asset
  - Average settlement time
  - Most common prediction types

- **Quick Predict Panel**
  - Sticky sidebar for easy prediction submission
  - Pre-filled asset
  - Quick timeframe selection

**Why Important:** Users want context before making predictions

---

## 🏆 PRIORITY 2: Tournament & Competition Pages

### 5. Tournaments Page (`/tournaments`)
**Purpose:** Tournament discovery and participation

**Currently:** Routed to Dashboard, needs dedicated page

**Key Sections:**
- **Tournament Status Tabs**
  - Live Now
  - Upcoming (registration open)
  - Completed (view results)
  - My Tournaments

- **Tournament Cards**
  - Name and description
  - Prize pool
  - Entry fee
  - Participants: 45/100
  - Time remaining
  - CTA: "Join Tournament"

- **Tournament Types**
  - Standard (most accurate wins)
  - Bracket Elimination
  - Season Long
  - Multi-Stage

- **Featured Tournaments**
  - Highlighted major competitions
  - Sponsored tournaments
  - Community tournaments

**Why Important:** Drive engagement and competition

---

### 6. Tournament Detail Page (`/tournaments/:id`)
**Purpose:** Full information about a specific tournament

**Key Sections:**
- **Tournament Header**
  - Name, status, time remaining
  - Prize pool breakdown
  - Entry fee
  - Join/Leave button

- **Tournament Info**
  - Rules and scoring system
  - Eligible assets
  - Time frame for predictions
  - Minimum predictions required

- **Live Leaderboard**
  - Real-time rankings
  - User stats (predictions, accuracy, score)
  - Highlight current user position
  - Prize distribution preview

- **Tournament Activity Feed**
  - Recent predictions
  - Settlements
  - New participants
  - Leaderboard changes

- **Participants**
  - List all participants
  - Search by username
  - View their profiles

**Why Important:** Transparency and engagement during tournaments

---

### 7. Bracket Tournament Page (`/tournaments/:id/bracket`)
**Purpose:** Visual bracket view for elimination tournaments

**Key Sections:**
- **Interactive Bracket Tree**
  - Visual tournament bracket
  - Match results
  - Click to see match details

- **Round Navigation**
  - Round of 32, 16, 8, Semi-finals, Finals
  - Current round highlighted

- **My Match Card**
  - Your current opponent
  - Match deadline
  - Your predictions vs opponent
  - Live scoring

- **Match History**
  - Previous rounds
  - Results and scores

**Why Important:** Essential for bracket-style competitions

---

## 🎮 PRIORITY 3: Social & Multi-Party Features

### 8. Challenges Page (`/challenges`)
**Purpose:** Browse and create P2P prediction challenges (NEW feature!)

**Key Sections:**
- **My Challenges Tabs**
  - Active (pending, accepted)
  - Completed
  - Challenge History

- **Open Challenges**
  - Public challenges anyone can accept
  - Filter by asset, timeframe, stake
  - Sort by prize amount, time remaining

- **Create Challenge**
  - Select asset
  - Set prediction type
  - Set stake amount
  - Invite specific user OR make public
  - Challenge expires in...

- **Challenge Feed**
  - Recent challenges created
  - Recent settlements
  - Top challengers

- **Challenge Leaderboard**
  - Users ranked by challenge wins
  - Win rate
  - Total earnings from challenges

**Why Important:** Leverages new multi-party service we built!

---

### 9. Challenge Detail Page (`/challenges/:id`)
**Purpose:** View and interact with a specific challenge

**Key Sections:**
- **Challenge Card**
  - Challenger vs Opponent
  - Asset and prediction type
  - Stake amount
  - Status (pending, accepted, completed)

- **Challenge Timeline**
  - Created by [User]
  - Accepted by [User]
  - Predictions submitted
  - Settlement result

- **Predictions Comparison**
  - Challenger's prediction
  - Opponent's prediction
  - Actual result
  - Winner highlighted

- **State Channel Info**
  - Transaction hashes
  - Settlement on Yellow Network
  - Escrow status

- **Challenge Again Button**
  - Rematch with same user
  - Invite to new challenge

**Why Important:** Full transparency for P2P competitions

---

### 10. Leaderboard Page (`/leaderboard`)
**Purpose:** Global and category-specific rankings

**Currently:** Routed to Dashboard, needs dedicated page

**Key Sections:**
- **Leaderboard Types Tabs**
  - Global (overall reputation)
  - Monthly (reset monthly)
  - Asset-specific (BTC leaders, ETH leaders)
  - Tournament champions
  - Challenge champions

- **Ranking Table**
  - Rank, Username, Stats
  - Total predictions
  - Accuracy rate
  - Reputation score
  - Current streak
  - Rewards earned

- **Filters**
  - Time period: All time, Month, Week
  - Asset category
  - Minimum predictions

- **My Position Card**
  - Your rank highlighted
  - Stats vs #1
  - Next rank requirements

**Why Important:** Gamification and competition

---

## 📊 PRIORITY 4: Analytics & Monitoring

### 11. Analytics Page (`/analytics`)
**Purpose:** Platform-wide statistics and insights

**Key Sections:**
- **Platform Overview**
  - Total predictions
  - Active users
  - Total volume
  - Average accuracy

- **Market Insights**
  - Most predicted assets
  - Trending predictions
  - Community sentiment by asset

- **User Insights**
  - Top predictors
  - Most active users
  - Prediction distribution (direction, price target, etc.)

- **Performance Charts**
  - Predictions over time
  - Accuracy trends
  - Volume trends
  - Tournament participation

- **Yellow Network Stats**
  - Total transactions
  - Average settlement time
  - State channel utilization

**Why Important:** Transparency and platform health visibility

---

### 12. System Status Page (`/status`)
**Purpose:** Real-time system health monitoring

**Key Sections:**
- **Service Status Grid**
  - Yellow Network: 🟢 Operational
  - Database: 🟢 Operational
  - API: 🟢 Operational
  - WebSocket: 🟢 Operational
  - CoinGecko: 🟢 Operational

- **Yellow Network Health** (NEW!)
  - Connection status
  - Session state
  - Health score: 95/100 (Grade A)
  - Last RPC timestamp
  - Circuit breaker status

- **Watchdog Monitoring** (NEW!)
  - Active anomalies: 0
  - Health grade: A
  - Recent alerts
  - Audit log link

- **Performance Metrics**
  - API response times
  - Average settlement time
  - WebSocket latency
  - Database query time

- **Incident History**
  - Past 30 days incidents
  - Status: Resolved / Investigating
  - Duration and impact

**Why Important:** Transparency and user trust

---

## 🎓 PRIORITY 5: Educational & Support

### 13. How It Works Page (`/how-it-works`)
**Purpose:** Educate new users about the platform

**Key Sections:**
- **Getting Started**
  - Connect wallet
  - Get some testnet tokens
  - Make your first prediction

- **Yellow Network Explained**
  - What are state channels?
  - Why gasless transactions?
  - How instant settlement works
  - Benefits of Layer-3

- **Prediction Types**
  - Direction (up/down)
  - Price Target
  - Above/Below
  - When to use each

- **Tournaments Guide**
  - How scoring works
  - Tournament types explained
  - Prize distribution
  - Tips for winning

- **Challenges Guide**
  - Creating challenges
  - Accepting challenges
  - Settlement rules
  - Strategy tips

- **FAQ**
  - Common questions
  - Troubleshooting
  - Support links

**Why Important:** User onboarding and education

---

### 14. Achievements Page (`/achievements`)
**Purpose:** Dedicated view for all achievements and NFTs

**Key Sections:**
- **Achievement Gallery**
  - Grid of all achievements
  - Unlocked vs locked
  - Progress bars for in-progress

- **Achievement Categories**
  - Beginner (first prediction, first win)
  - Streaks (3-win, 5-win, 10-win streak)
  - Mastery (100 predictions, 80% accuracy)
  - Tournament (first tournament, tournament win)
  - Challenge (challenge master, 10 wins)
  - Special (seasonal, event-based)

- **NFT Showcase**
  - Earned NFT achievements
  - Rarity indicators
  - OpenSea links
  - Share on social

- **Achievement Tracker**
  - Next achievements to unlock
  - Progress percentage
  - Requirements

- **Achievement Leaderboard**
  - Most achievements earned
  - Rarest achievements
  - Achievement hunters

**Why Important:** Gamification and retention

---

## ⚙️ PRIORITY 6: Settings & Admin

### 15. Settings Page (`/settings`)
**Purpose:** User preferences and account management

**Key Sections:**
- **Account Settings**
  - Username
  - Email notifications
  - Connected wallet
  - Disconnect wallet

- **Notification Preferences**
  - Prediction settled
  - Tournament updates
  - Challenge invitations
  - Achievement unlocked
  - Security alerts

- **Display Settings**
  - Theme (light/dark)
  - Currency display
  - Timezone
  - Language

- **Privacy Settings**
  - Profile visibility
  - Show in leaderboards
  - Share prediction history

- **Advanced Settings**
  - Yellow Network preferences
  - Chain selection (Arbitrum/Polygon/Ethereum)
  - RPC endpoint override
  - Enable debug mode

**Why Important:** User control and customization

---

### 16. Admin Dashboard (`/admin`) [Admin Only]
**Purpose:** Platform management and monitoring

**Key Sections:**
- **User Management**
  - Total users
  - Active users
  - Banned users
  - User search

- **Tournament Management**
  - Create tournament
  - Edit tournaments
  - Cancel tournaments
  - Prize pool management

- **System Health**
  - Yellow Network status
  - Database status
  - Watchdog alerts
  - Error logs

- **Analytics**
  - Platform metrics
  - Revenue
  - User growth
  - Engagement rates

- **Content Management**
  - Achievements
  - Announcements
  - Featured tournaments

**Why Important:** Platform administration

---

## 🎨 PRIORITY 7: Additional Nice-to-Have Pages

### 17. Wallet Page (`/wallet`)
**Purpose:** Manage funds and rewards

**Key Sections:**
- Balance overview
- Transaction history
- Withdraw rewards
- Deposit funds
- State channel balance

---

### 18. Notifications Page (`/notifications`)
**Purpose:** Centralized notification center

**Key Sections:**
- All notifications
- Unread only
- Filter by type
- Mark as read

---

### 19. Activity Feed Page (`/activity`)
**Purpose:** Real-time platform activity

**Key Sections:**
- Recent predictions
- Recent settlements
- Tournament updates
- Challenge activity

---

### 20. Documentation Page (`/docs`)
**Purpose:** Developer and API documentation

**Key Sections:**
- API reference
- WebSocket events
- Yellow Network integration
- Code examples

---

## 📱 Implementation Priority

### PHASE 1 (Build First - Core UX)
1. **User Profile** - Essential for user engagement
2. **Markets Page** - Better asset discovery
3. **Tournaments Page** - Tournament engagement
4. **Challenges Page** - NEW multi-party feature showcase

### PHASE 2 (Build Next - Engagement)
5. **Leaderboard Page** - Competition
6. **Tournament Detail** - Tournament transparency
7. **Challenge Detail** - P2P transparency
8. **Prediction Detail** - Tracking

### PHASE 3 (Build Later - Analytics)
9. **Analytics Page** - Insights
10. **System Status** - Watchdog showcase
11. **Asset Detail** - Deep dives
12. **Achievements Page** - Gamification

### PHASE 4 (Build Last - Support)
13. **How It Works** - Education
14. **Settings** - User control
15. **Admin Dashboard** - Management

---

## 🛠️ Technical Recommendations

### Reusable Components Needed
- `<PredictionCard>` - For displaying predictions
- `<TournamentCard>` - For tournament listings
- `<ChallengeCard>` - For challenge listings
- `<UserCard>` - For user profiles
- `<StatCard>` - For statistics display
- `<Chart>` - For price/performance charts
- `<LoadingState>` - For loading states
- `<EmptyState>` - For empty data states

### Data Fetching Pattern
Use TanStack Query (React Query) consistently:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/predictions/user/:userId'],
  queryFn: () => fetch(...).then(r => r.json())
})
```

### Routing Updates Needed
Update `App.tsx` with all new routes
```typescript
<Route path="/profile/:userId" component={Profile} />
<Route path="/tournaments/:id" component={TournamentDetail} />
<Route path="/challenges" component={Challenges} />
// etc...
```

### Mobile Responsiveness
All pages should be fully responsive with:
- Mobile-first design
- Tailwind breakpoints (sm, md, lg, xl)
- Touch-friendly interactions
- Condensed layouts for small screens

---

## 📊 Expected Impact

### User Engagement
- Profile pages: +40% return visits
- Challenge pages: +60% daily active users
- Tournament details: +35% tournament participation
- Analytics: +25% session duration

### Platform Growth
- Better onboarding: +50% new user retention
- Social features: +70% viral coefficient
- Transparency: +40% trust score

---

## Next Steps

1. **Review this list** with your team
2. **Prioritize** based on user feedback
3. **Design mockups** for Phase 1 pages
4. **Build components** library first
5. **Implement pages** incrementally
6. **Test thoroughly** on mobile and desktop
7. **Gather feedback** and iterate

Would you like me to start implementing any of these pages? I recommend starting with:
1. User Profile
2. Challenges Page (to showcase new multi-party feature!)
3. Markets Page
4. Tournament Detail
