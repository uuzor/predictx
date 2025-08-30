import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Eye, Users, TrendingUp } from 'lucide-react';

interface SecurityMetrics {
  oracleStatus: {
    assetId: string;
    status: 'NORMAL' | 'ALERT';
    priceDeviation: number;
    volumeAnomaly: boolean;
    currentPrice: number;
  }[];
  riskScore: number;
  activeUsers: number;
  flaggedAccounts: number;
  totalReports: number;
}

export function SecurityDashboard() {
  const { data: bitcoinOracle } = useQuery({
    queryKey: ['/api/security/oracle-status/bitcoin'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: ethereumOracle } = useQuery({
    queryKey: ['/api/security/oracle-status/ethereum'],
    refetchInterval: 30000,
  });

  // Mock security metrics for demonstration
  const securityMetrics: SecurityMetrics = {
    oracleStatus: [
      ...(bitcoinOracle ? [{
        assetId: 'Bitcoin',
        status: bitcoinOracle.status as 'NORMAL' | 'ALERT',
        priceDeviation: bitcoinOracle.priceDeviation as number,
        volumeAnomaly: bitcoinOracle.volumeAnomaly as boolean,
        currentPrice: bitcoinOracle.currentPrice as number,
      }] : []),
      ...(ethereumOracle ? [{
        assetId: 'Ethereum',
        status: ethereumOracle.status as 'NORMAL' | 'ALERT',
        priceDeviation: ethereumOracle.priceDeviation as number,
        volumeAnomaly: ethereumOracle.volumeAnomaly as boolean,
        currentPrice: ethereumOracle.currentPrice as number,
      }] : [])
    ],
    riskScore: 15,
    activeUsers: 1247,
    flaggedAccounts: 3,
    totalReports: 12
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'text-green-600 bg-green-50 border-green-200';
      case 'ALERT': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDeviationColor = (deviation: number) => {
    if (deviation < 5) return 'text-green-600';
    if (deviation < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security & Risk Management</h2>
          <p className="text-muted-foreground">Real-time monitoring and fraud prevention systems</p>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Platform Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{securityMetrics.riskScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Low risk level</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{securityMetrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">24h active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              Flagged Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{securityMetrics.flaggedAccounts}</div>
            <p className="text-xs text-muted-foreground mt-1">Under review</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-2 text-purple-500" />
              Fraud Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{securityMetrics.totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Oracle Status Monitoring */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Oracle Status Monitoring
          </CardTitle>
          <CardDescription>
            Real-time monitoring of price oracle data for manipulation detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityMetrics.oracleStatus.map((oracle, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center space-x-3">
                  <div className="font-medium text-foreground">{oracle.assetId}</div>
                  <Badge className={`${getStatusColor(oracle.status)} text-xs`}>
                    {oracle.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="font-medium">${oracle.currentPrice.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Deviation</div>
                    <div className={`font-medium ${getDeviationColor(oracle.priceDeviation)}`}>
                      {oracle.priceDeviation.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div className={`font-medium ${oracle.volumeAnomaly ? 'text-red-600' : 'text-green-600'}`}>
                      {oracle.volumeAnomaly ? 'Anomaly' : 'Normal'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Anti-Manipulation Features</CardTitle>
            <CardDescription>
              Advanced security measures to protect the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sybil Attack Detection</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rate Limiting</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bot Detection</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Oracle Validation</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Fraud Reporting</CardTitle>
            <CardDescription>
              Report suspicious activity to help maintain platform integrity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                If you notice suspicious prediction patterns or potential manipulation, 
                please report it to our security team for investigation.
              </AlertDescription>
            </Alert>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                data-testid="button-report-fraud"
              >
                Report Fraud
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                data-testid="button-view-reports"
              >
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Security Alerts */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Live monitoring of security events and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Oracle integrity check passed</span>
              </div>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Rate limiting prevented 15 excessive requests</span>
              </div>
              <span className="text-xs text-muted-foreground">12 minutes ago</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Suspicious prediction pattern detected and flagged</span>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}