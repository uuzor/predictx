import { useState } from 'react';
import { Link } from 'wouter';
import { useYellowNetwork } from '@/hooks/useYellowNetwork';
import { WalletConnection } from './WalletConnection';

export function Navigation() {
  const { status } = useYellowNetwork();

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-10">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-background font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-xl tracking-tight">PredictX</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/">
                <span className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                  Markets
                </span>
              </Link>
              <Link href="/tournaments">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Tournaments
                </span>
              </Link>
              <Link href="/leaderboard">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Leaderboard
                </span>
              </Link>
              <Link href="/security">
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Security
                </span>
              </Link>
              <a 
                href="https://erc7824.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {/* Network Status */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
              <div className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-500 pulse-dot' : 
                status === 'connecting' ? 'bg-yellow-500 pulse-dot' : 
                'bg-red-500'
              }`}></div>
              <span className="text-xs font-medium">Yellow Network</span>
            </div>
            
            <WalletConnection />
          </div>
        </div>
      </div>
    </nav>
  );
}
