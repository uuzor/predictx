import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { WalletProvider } from "@/components/WalletProvider";
import Dashboard from "@/pages/Dashboard";
import Security from "@/pages/Security";
import Profile from "@/pages/Profile";
import Markets from "@/pages/Markets";
import Challenges from "@/pages/Challenges";
import TournamentDetail from "@/pages/TournamentDetail";
import SystemStatus from "@/pages/SystemStatus";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/markets" component={Markets} />
      <Route path="/tournaments/:id" component={TournamentDetail} />
      <Route path="/tournaments" component={Dashboard} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/status" component={SystemStatus} />
      <Route path="/security" component={Security} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
