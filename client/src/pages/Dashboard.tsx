import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CryptoPriceGrid } from '@/components/CryptoPriceGrid';
import { TournamentGrid } from '@/components/TournamentGrid';
import { ReputationLeaderboard } from '@/components/ReputationLeaderboard';
import { AchievementGrid } from '@/components/AchievementGrid';
import { TechnicalMetrics } from '@/components/TechnicalMetrics';
import { NotificationToast } from '@/components/NotificationToast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useYellowNetwork } from '@/hooks/useYellowNetwork';
import { NotificationMessage } from '@/types';

export default function Dashboard() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const { onMessage, sendMessage } = useWebSocket();
  const { status: yellowNetworkStatus } = useYellowNetwork();

  useEffect(() => {
    // Listen for WebSocket messages and create notifications
    onMessage('connection_established', (data) => {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: `Connected to PredictX platform. Yellow Network: ${data.yellowNetworkStatus}`,
      });
    });

    onMessage('prediction_submitted', (data) => {
      addNotification({
        type: 'success',
        title: 'Prediction Confirmed',
        message: `Prediction submitted${data.stateChannelTx ? ' via Yellow Network state channel' : ''}`,
      });
    });

    onMessage('prediction_settled', (data) => {
      addNotification({
        type: data.isCorrect ? 'success' : 'error',
        title: 'Prediction Settled',
        message: `Your prediction was ${data.isCorrect ? 'correct' : 'incorrect'}! Price: $${data.actualPrice}`,
      });
    });

    onMessage('tournament_joined', (data) => {
      addNotification({
        type: 'success',
        title: 'Tournament Joined',
        message: 'Successfully joined tournament! Entry fee processed off-chain.',
      });
    });

    // Subscribe to real-time updates
    sendMessage('subscribe_prices', {});
    sendMessage('subscribe_leaderboard', {});

    // Welcome notification
    setTimeout(() => {
      addNotification({
        type: 'info',
        title: 'Welcome to PredictX',
        message: 'Connected to decentralized prediction marketplace powered by Yellow Network.',
      });
    }, 1000);

  }, [onMessage, sendMessage]);

  const addNotification = (notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    const newNotification: NotificationMessage = {
      ...notification,
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date(),
      autoClose: true,
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto-remove after 5 seconds
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/30 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-sm mb-8">
              <span className="text-muted-foreground">Powered by Yellow Network State Channels</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              Predict the Future,<br />
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Earn Rewards</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Decentralized prediction marketplace with instant finality, zero gas fees, and 
              cryptographic security powered by ERC-7824 state channels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="h-12 px-8 text-base"
                data-testid="button-start-predicting"
              >
                Start Predicting
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-12 px-8 text-base"
                data-testid="button-watch-demo"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Markets Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">Live Markets</h2>
              <p className="text-muted-foreground">Make instant predictions on crypto price movements</p>
            </div>
            <div className="flex items-center space-x-3 bg-muted/50 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
              <span className="text-sm font-medium text-muted-foreground" data-testid="text-realtime-indicator">Real-time via CoinGecko API</span>
            </div>
          </div>

          <CryptoPriceGrid />
        </div>
      </section>

      {/* Active Tournaments Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">Active Tournaments</h2>
              <p className="text-muted-foreground">Join competitive prediction tournaments with prize pools</p>
            </div>
            <Button variant="outline" className="bg-background/50 border-border/50" data-testid="button-create-tournament">
              <i className="fas fa-plus mr-2"></i>
              Create Tournament
            </Button>
          </div>

          <TournamentGrid />
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Platform Statistics</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Real-time metrics showing platform performance and Yellow Network integration</p>
          </div>
          <TechnicalMetrics />
        </div>
      </section>

      {/* Global Leaderboard */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ReputationLeaderboard />
        </div>
      </section>

      {/* Achievement System */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Achievement System</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Earn NFT badges and unlock exclusive rewards for your prediction skills</p>
          </div>
          <AchievementGrid />
        </div>
      </section>

      {/* Technical Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powered by Yellow Network</h2>
            <p className="text-lg text-muted-foreground">Built on cutting-edge state channel technology for instant, gasless predictions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bolt text-primary-foreground text-xl"></i>
              </div>
              <h3 className="font-semibold text-foreground mb-3">Instant Finality</h3>
              <p className="text-sm text-muted-foreground">Predictions settle instantly off-chain with cryptographic security guarantees using ERC-7824 state channels.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-coins text-primary-foreground text-xl"></i>
              </div>
              <h3 className="font-semibold text-foreground mb-3">Zero Gas Fees</h3>
              <p className="text-sm text-muted-foreground">Make unlimited predictions without gas costs. Only pay for final tournament settlements on-chain.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-primary-foreground text-xl"></i>
              </div>
              <h3 className="font-semibold text-foreground mb-3">Trustless Security</h3>
              <p className="text-sm text-muted-foreground">All predictions are cryptographically signed and verifiable with blockchain-level security.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-lg">PredictX</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The future of decentralized prediction markets, powered by Yellow Network's state channel technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <i className="fab fa-discord"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <i className="fab fa-github"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Markets</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tournaments</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://erc7824.org" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="https://www.npmjs.com/package/@erc7824/nitrolite" className="hover:text-foreground transition-colors">Nitrolite SDK</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 PredictX. Built for Yellow Network Hackathon 2025.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
