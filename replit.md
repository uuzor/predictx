# PredictX - Crypto Prediction Tournament Platform

## Overview

PredictX is a high-performance prediction tournament platform built on blockchain state channels, allowing users to make rapid predictions on cryptocurrency price movements with instant feedback and micro-rewards. The platform leverages Yellow Network's state channel technology for gasless transactions and real-time processing, while settling final payouts on-chain.

The application implements a prediction market system where users can participate in tournaments, make predictions about crypto asset price movements, earn reputation points, unlock achievements, and compete on global leaderboards. The platform emphasizes instant finality, reduced gas costs, and high throughput through off-chain state channel operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Vite Build System**: Fast development server and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a comprehensive component library
- **React Query (TanStack Query)**: State management for server state with caching and synchronization
- **Wouter**: Lightweight client-side routing solution
- **WebSocket Integration**: Real-time communication for live updates and notifications

### Backend Architecture
- **Express.js**: RESTful API server with middleware support
- **WebSocket Server**: Real-time bidirectional communication using ws library
- **Modular Service Layer**: Separated concerns with dedicated services for:
  - CoinGecko API integration for crypto price data
  - Yellow Network state channel management
  - Tournament scoring and management
  - User authentication and wallet connection

### Database Layer
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **PostgreSQL**: Primary database for persistent storage
- **Schema Design**: Comprehensive data models for users, predictions, tournaments, crypto assets, and achievements
- **Migration System**: Database schema versioning and deployment

### State Channel Integration
- **Yellow Network SDK**: Off-chain transaction processing and state management
- **ClearNode Connection**: WebSocket-based communication with Yellow Network infrastructure
- **Instant Settlement**: Immediate transaction finality for predictions and micro-rewards
- **Gasless Operations**: Zero-cost predictions and tournament participation

### Real-time Features
- **Live Price Updates**: Streaming cryptocurrency price data
- **Tournament Scoring**: Real-time calculation and broadcasting of tournament results
- **Leaderboard Updates**: Dynamic ranking system with live updates
- **Notification System**: Toast-based user notifications for events and achievements

### Authentication & User Management
- **Wallet-based Authentication**: MetaMask and Web3 wallet integration
- **User Profiles**: Reputation system, streak tracking, and achievement unlocking
- **Session Management**: Persistent user sessions with wallet address linking

## External Dependencies

### Blockchain & Web3
- **Yellow Network**: State channel infrastructure for off-chain transactions and instant finality
- **MetaMask/Web3 Wallets**: User authentication and transaction signing
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)

### Market Data
- **CoinGecko API**: Real-time cryptocurrency price data and market information
- **WebSocket Streams**: Live price feeds for tournament and prediction updates

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Icon library for consistent visual elements
- **Google Fonts**: Typography (Inter, JetBrains Mono, DM Sans, Geist Mono)

### Development & Deployment
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Backend bundling for production deployment
- **Replit Integration**: Development environment and deployment platform

### Additional Services
- **WebSocket Infrastructure**: Real-time communication layer
- **Session Storage**: User session persistence
- **Error Monitoring**: Runtime error tracking and reporting