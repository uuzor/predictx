# PredictX - Crypto Prediction Tournament Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Yellow Network](https://img.shields.io/badge/Yellow%20Network-Nitrolite-brightgreen.svg)](https://yellow.org/)

PredictX is a high-performance prediction tournament platform built on blockchain state channels, allowing users to make rapid predictions on cryptocurrency price movements with instant feedback and micro-rewards.

## Features

- **Instant Finality**: Predictions settled in real-time via Yellow Network state channels
- **Zero Gas Fees**: Off-chain transaction processing with on-chain settlement
- **Multi-Tournament Support**: Standard, bracket elimination, season-long, and multi-stage tournaments
- **Real-time Updates**: WebSocket-based live price feeds and leaderboard updates
- **Security First**: Sybil attack detection, oracle manipulation monitoring, and fraud prevention
- **Gamification**: Achievement system with NFT rewards and reputation tracking
- **Cross-chain Ready**: Built on Yellow Network's Layer-3 clearing infrastructure

## Architecture

### Tech Stack

**Frontend:**
- React 18.3 + TypeScript
- Vite (build system)
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Wagmi/Ethers (wallet integration)
- WebSocket client

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL + Drizzle ORM
- Yellow Network Nitrolite SDK (@erc7824/nitrolite)
- WebSocket server (ws)
- Winston (logging)

**Blockchain:**
- Yellow Network (state channels)
- ERC-7824 Nitrolite Protocol
- MetaMask/Web3 wallets

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+
- Yellow Network account (register at [apps.yellow.com](https://apps.yellow.com))
- MetaMask or compatible Web3 wallet

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/predictx.git
cd predictx
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure the following **required** variables:

#### Database Configuration
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/predictx
```

#### Yellow Network Setup (see detailed setup below)
```bash
CLEARNODE_URL=wss://clearnode.yellow.network/ws
YELLOW_WALLET_ADDRESS=0x...
YELLOW_PARTICIPANT_ADDRESS=0x...
YELLOW_APPLICATION_ADDRESS=0x...
YELLOW_SIGNER_PRIVATE_KEY=0x...
```

### 4. Set Up Database

```bash
# Push database schema
npm run db:push
```

### 5. Start Development Server

```bash
# Start backend and frontend concurrently
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`

## Yellow Network Setup

### Step 1: Register Your Application

1. Visit [apps.yellow.com](https://apps.yellow.com)
2. Connect your MetaMask wallet
3. Click "Create New Application"
4. Fill in application details:
   - **Name**: PredictX
   - **Description**: Crypto prediction tournament platform
   - **Category**: Gaming/DeFi

### Step 2: Create State Channel

1. After registration, navigate to your application dashboard
2. Click "Create Channel"
3. Select network (Mainnet or Testnet)
4. Fund the channel with initial collateral
5. Note down the following addresses:
   - **Participant Address**: Your identity in Yellow Network
   - **Application Address**: Your state channel contract address

### Step 3: Configure Environment Variables

Generate a private key for signing (keep this secure!):

```bash
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
```

Derive the wallet address from your private key:

```bash
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY'); console.log(wallet.address);"
```

Update your `.env` file:

```bash
YELLOW_WALLET_ADDRESS=0x...                # Address derived from private key
YELLOW_PARTICIPANT_ADDRESS=0x...            # From Yellow Network dashboard
YELLOW_APPLICATION_ADDRESS=0x...            # From Yellow Network dashboard
YELLOW_SIGNER_PRIVATE_KEY=0x...            # Generated private key
```

### Step 4: Verify Connection

Start your server and check the status endpoint:

```bash
curl http://localhost:3000/api/status
```

Expected response:
```json
{
  "yellowNetwork": {
    "connection": "connected",
    "sessionOpen": true,
    "lastRpcTimestamp": 1699999999999
  }
}
```

## API Documentation

### Authentication

#### POST `/api/auth/wallet`
Authenticate user with wallet address.

**Request:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "walletAddress": "0x...",
    "username": "user_abc123",
    "reputation": "0.00",
    "level": 1
  }
}
```

### Predictions

#### POST `/api/predictions`
Submit a new prediction.

**Request:**
```json
{
  "userId": "uuid",
  "assetId": "bitcoin",
  "predictionType": "direction",
  "direction": "up",
  "timeFrame": 60,
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "stateChannelTx": "0x...",
  "priceAtSubmission": "50000.00000000",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### GET `/api/predictions/user/:userId`
Get user's prediction history.

### Crypto Data

#### GET `/api/crypto/prices?coins=bitcoin,ethereum`
Get current cryptocurrency prices.

#### GET `/api/crypto/top?limit=10`
Get top cryptocurrencies by market cap.

### Tournaments

#### GET `/api/tournaments`
Get active tournaments.

#### POST `/api/tournaments/:id/join`
Join a tournament.

**Request:**
```json
{
  "userId": "uuid"
}
```

#### GET `/api/tournaments/:id/leaderboard?limit=10`
Get tournament leaderboard.

### Leaderboard

#### GET `/api/leaderboard?limit=10`
Get global leaderboard.

### Statistics

#### GET `/api/stats`
Get platform statistics.

**Response:**
```json
{
  "activePredictors": 1234,
  "totalVolume": "$127K",
  "oracleAccuracy": "92.5%",
  "avgSettlement": "0.003s",
  "yellowNetworkStatus": "connected"
}
```

### Security

#### GET `/api/security/oracle-status/:assetId`
Check oracle status for price manipulation.

#### GET `/api/security/user-risk/:userId`
Get user risk score (Sybil detection).

#### POST `/api/security/report-fraud`
Report fraudulent activity.

## Project Structure

```
predictx/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API clients
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript definitions
│   │   └── App.tsx          # Root component
│   └── index.html
├── server/                  # Express backend
│   ├── services/
│   │   ├── yellowNetworkService.ts    # Yellow Network integration
│   │   ├── coinGeckoService.ts        # Price data fetching
│   │   ├── tournamentService.ts       # Tournament logic
│   │   └── securityService.ts         # Security monitoring
│   ├── middleware/          # Express middleware
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database layer
│   └── index.ts             # Server entry point
├── shared/                  # Shared code
│   ├── schema.ts            # Database schema (Drizzle)
│   └── appProtocol.ts       # Yellow Network app protocol
├── .env.example             # Environment template
├── package.json
└── README.md
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm run check        # Type check

# Database
npm run db:push      # Push schema changes to database

# Production
npm start            # Start production server
```

### Database Migrations

PredictX uses Drizzle ORM for database management.

**Create migration:**
```bash
npm run db:push
```

**Schema location:** `shared/schema.ts`

### WebSocket Events

**Client → Server:**
- `subscribe_prices`: Subscribe to price updates
- `subscribe_leaderboard`: Subscribe to leaderboard updates

**Server → Client:**
- `connection_established`: Initial connection
- `price_update`: Real-time price data
- `leaderboard_update`: Leaderboard changes
- `prediction_submitted`: New prediction broadcast
- `prediction_settled`: Prediction result
- `tournament_joined`: User joined tournament
- `security_alert`: Oracle manipulation detected

## Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── yellowNetworkService.test.ts
│   └── utils/
├── integration/
│   └── api/
│       └── predictions.test.ts
└── e2e/
    └── prediction-flow.test.ts
```

## Deployment

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Variables (Production)

Ensure the following are set:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
YELLOW_SIGNER_PRIVATE_KEY=0x...
SESSION_SECRET=your-random-secret
CORS_ORIGINS=https://yourdomain.com
```

### Docker Deployment (Optional)

```bash
# Build image
docker build -t predictx .

# Run container
docker run -p 3000:3000 --env-file .env predictx
```

## Security Considerations

### Best Practices

1. **Never commit `.env` files** - Always use `.env.example` as a template
2. **Rotate private keys** - Change `YELLOW_SIGNER_PRIVATE_KEY` periodically
3. **Use strong session secrets** - Generate random 32-byte hex strings
4. **Enable rate limiting** - Configure appropriate limits in production
5. **Monitor fraud detection** - Review security alerts regularly
6. **Validate user input** - All inputs are validated with Zod schemas
7. **Secure WebSocket** - Use WSS (WebSocket Secure) in production

### Fraud Detection

PredictX includes built-in security features:

- **Sybil Attack Detection**: Identifies multiple accounts from same source
- **Oracle Manipulation Monitoring**: Detects unusual price movements
- **Rate Limiting**: Prevents abuse of API endpoints
- **Prediction Validation**: Ensures logical consistency of predictions

## Troubleshooting

### Yellow Network Connection Issues

**Problem:** `WebSocket not connected` error

**Solution:**
1. Verify `CLEARNODE_URL` is correct
2. Check Yellow Network status at [status.yellow.com](https://status.yellow.com)
3. Ensure private key is valid 32-byte hex with `0x` prefix
4. Verify channel is funded and active

**Problem:** `Auth verify failed` error

**Solution:**
1. Ensure `YELLOW_WALLET_ADDRESS` matches the address derived from `YELLOW_SIGNER_PRIVATE_KEY`
2. Check participant and application addresses are correct
3. Verify your application is whitelisted on Yellow Network

### Database Issues

**Problem:** `relation "users" does not exist`

**Solution:**
```bash
npm run db:push
```

**Problem:** Database connection timeout

**Solution:**
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format and credentials
3. Ensure database user has necessary permissions

### API Errors

**Problem:** `Failed to fetch crypto prices`

**Solution:**
1. Check CoinGecko API status
2. Verify `COINGECKO_API_URL` is correct
3. Consider adding `COINGECKO_API_KEY` for higher rate limits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write tests for new features
- Document public APIs

## Resources

### Documentation

- [Yellow Network Docs](https://docs.yellow.org/)
- [Nitrolite Protocol (ERC-7824)](https://erc7824.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

### Support

- [GitHub Issues](https://github.com/yourusername/predictx/issues)
- [Yellow Network Discord](https://discord.gg/yellow)
- [Documentation](./replit.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Yellow Network](https://yellow.org/) - State channel infrastructure
- [CoinGecko](https://www.coingecko.com/) - Cryptocurrency price data
- [Replit](https://replit.com/) - Development platform

---

**Built with ❤️ using Yellow Network state channels**
