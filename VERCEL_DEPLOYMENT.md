# Vercel Deployment Guide for PredictX

## Overview

This guide explains how to deploy PredictX to Vercel with proper routing for both the React frontend and Express backend API.

## Project Structure

```
predictx/
├── client/              # React frontend (Vite)
├── server/              # Express backend
├── api/                 # Vercel serverless functions
│   └── index.ts        # API handler wrapper
├── dist/
│   └── public/         # Built frontend (outputDirectory)
├── vercel.json         # Vercel configuration
└── package.json
```

## Configuration Files

### vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/health", "destination": "/api" }
  ]
}
```

**Key points:**
- `buildCommand`: Runs `npm run build` → `vercel-build` script → `vite build`
- `outputDirectory`: `dist/public` contains the built React app
- `rewrites`: Routes `/api/*` and `/health` to the serverless function
- All other routes serve the React app (SPA routing)

### package.json

Added `vercel-build` script:
```json
{
  "scripts": {
    "vercel-build": "vite build"
  }
}
```

This builds only the frontend. The backend runs as a serverless function.

### api/index.ts

Serverless function wrapper for the Express app:
- Wraps the Express server to work with Vercel's serverless architecture
- Initializes routes on first request
- Handles all `/api/*` and `/health` requests

## Deployment Steps

### 1. Connect Repository to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

#### Required Variables

```bash
# Yellow Network Configuration
YELLOW_NETWORK=production
CLEARNODE_URL=wss://clearnode.yellow.network/ws
YELLOW_APP_IDENTIFIER=predictx
YELLOW_CHAIN_ID=42161

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://...

# Optional: Session Configuration
YELLOW_SESSION_TIMEOUT=300000

# Optional: Multi-chain Support
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
POLYGON_RPC_URL=https://polygon-rpc.com
ETHEREUM_RPC_URL=https://eth.public-rpc.com
```

#### Optional Variables

```bash
# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info

# Features
ENABLE_YELLOW_NETWORK=true
```

### 3. Deploy

#### Via Vercel Dashboard:
1. Push changes to GitHub/GitLab/Bitbucket
2. Vercel auto-deploys on push to main

#### Via CLI:
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## How It Works

### Request Flow

```
User Request
    ↓
Vercel Edge Network
    ↓
vercel.json rewrites
    ↓
┌─────────────────┬───────────────────┐
│  /api/* routes  │  All other routes │
│  ↓              │  ↓                │
│  api/index.ts   │  dist/public/     │
│  (serverless)   │  (static SPA)     │
└─────────────────┴───────────────────┘
```

### Build Process

```
npm install
    ↓
npm run vercel-build
    ↓
vite build
    ↓
dist/public/ (static files)
    ↓
Deploy to Vercel
```

### Runtime

1. **Static Frontend**: Served from `dist/public/`
   - React SPA
   - All assets (JS, CSS, images)
   - `index.html` for client-side routing

2. **API Routes**: Serverless function at `api/index.ts`
   - Express app wrapped for serverless
   - Handles `/api/*` and `/health`
   - Runs on Node.js 20.x runtime

## Troubleshooting

### Issue: Seeing Server Code Instead of React App

**Problem**: Raw JavaScript code displayed instead of the React interface

**Solution**:
- Check `outputDirectory` in vercel.json is `dist/public`
- Verify `vite build` runs successfully
- Ensure `dist/public/index.html` exists after build

### Issue: API Routes Return 404

**Problem**: `/api/*` endpoints not working

**Solution**:
- Check `api/index.ts` exists
- Verify `rewrites` in vercel.json
- Check serverless function logs in Vercel dashboard

### Issue: WebSocket Not Working

**Problem**: WebSocket connections fail

**Solution**:
Vercel serverless functions don't support WebSockets. Options:
1. Use Vercel's Edge Functions (experimental)
2. Deploy WebSocket server separately (Railway, Render, AWS)
3. Use HTTP polling as fallback

### Issue: Build Fails

**Problem**: Deployment fails during build

**Solutions**:
```bash
# Test build locally
npm run vercel-build

# Check build logs in Vercel dashboard
# Verify all dependencies in package.json
# Check for TypeScript errors
npm run check
```

### Issue: Environment Variables Not Working

**Problem**: App can't connect to Yellow Network or database

**Solution**:
1. Add variables in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match `.env.example`
4. Ensure no typos in variable names

## Performance Optimization

### Cold Starts

Serverless functions have cold start latency. To minimize:

```javascript
// api/index.ts already implements this
let routesInitialized = false;

async function initializeRoutes() {
  if (!routesInitialized) {
    // Initialize once, reuse for subsequent requests
    server = await registerRoutes(app);
    routesInitialized = true;
  }
}
```

### Caching

Add caching headers for static assets:

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Analytics

### Logs

View function logs:
```bash
vercel logs [deployment-url]

# Follow logs in real-time
vercel logs --follow
```

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- Datadog

## Scaling

Vercel automatically scales serverless functions based on:
- Request volume
- Function execution time
- Account plan limits

**Pro Plan**:
- 100GB bandwidth/month
- 1000 hours function execution
- 100 serverless functions

**Enterprise**:
- Custom limits
- Priority support
- Advanced analytics

## Local Development

To test the Vercel configuration locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel dev server
vercel dev

# This simulates Vercel's routing and serverless functions
```

## Alternative: Self-Hosted Deployment

If you need WebSockets or prefer traditional hosting:

```bash
# Build for production
npm run build

# Start server
npm start

# Runs on port 5000 by default
# Serves both API and static frontend
```

Platforms:
- Railway
- Render
- Heroku
- AWS EC2/ECS
- DigitalOcean App Platform

## Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Secrets not exposed in client-side code
- [ ] Database connection string secure
- [ ] API authentication implemented
- [ ] Input validation on all endpoints

## Support

For issues:
1. Check Vercel deployment logs
2. Test build locally: `npm run vercel-build`
3. Verify environment variables
4. Check Vercel status: https://www.vercel-status.com/

Documentation:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)
