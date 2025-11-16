import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  responseTime?: number;
  lastCheck: string;
}

interface YellowNetworkHealth {
  connected: boolean;
  sessionOpen: boolean;
  healthScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  lastRpcTimestamp: number;
  circuitOpen: boolean;
  failureCount: number;
  reconnectAttempts: number;
  queuedRequests: number;
  pendingRequests: number;
}

interface WatchdogStatus {
  running: boolean;
  healthScore: number;
  healthGrade: 'A' | 'B' | 'C' | 'D';
  activeAnomalies: number;
  criticalAnomalies: number;
  recentAlerts: {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

interface PerformanceMetrics {
  apiResponseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  settlementTime: {
    avg: number;
    min: number;
    max: number;
  };
  websocketLatency: number;
  databaseQueryTime: number;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  endTime?: string;
  duration?: number;
  affectedServices: string[];
}

export default function SystemStatus() {
  const { data: services = [], refetch: refetchServices } = useQuery<ServiceStatus[]>({
    queryKey: ['/api/status/services'],
    queryFn: async () => {
      const res = await fetch('/api/status/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: yellowHealth } = useQuery<YellowNetworkHealth>({
    queryKey: ['/api/status/yellow-network'],
    queryFn: async () => {
      const res = await fetch('/api/status/yellow-network');
      if (!res.ok) throw new Error('Failed to fetch Yellow Network health');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: watchdog } = useQuery<WatchdogStatus>({
    queryKey: ['/api/watchdog/status'],
    queryFn: async () => {
      const res = await fetch('/api/watchdog/status');
      if (!res.ok) throw new Error('Failed to fetch watchdog status');
      return res.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: performance } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/status/performance'],
    queryFn: async () => {
      const res = await fetch('/api/status/performance');
      if (!res.ok) throw new Error('Failed to fetch performance metrics');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['/api/status/incidents'],
    queryFn: async () => {
      const res = await fetch('/api/status/incidents?days=30');
      if (!res.ok) throw new Error('Failed to fetch incidents');
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-500';
      case 'B':
        return 'text-blue-500';
      case 'C':
        return 'text-yellow-500';
      case 'D':
      case 'F':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'major':
        return 'bg-orange-500';
      case 'minor':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground mb-4">
              System Status
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Real-time monitoring of PredictX platform health and performance
            </p>

            <div className="inline-flex items-center gap-3">
              {allOperational ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold text-green-500">All Systems Operational</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold text-yellow-500">Some Services Degraded</span>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => refetchServices()}>
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh Status
            </Button>
            <Button variant="outline">
              <i className="fas fa-bell mr-2"></i>
              Subscribe to Updates
            </Button>
          </div>
        </div>
      </section>

      {/* Service Status Grid */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-8">Service Health</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.name} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground text-lg">{service.name}</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                  </div>

                  <Badge
                    className={`${getStatusColor(service.status)} mb-4`}
                  >
                    {service.status.toUpperCase()}
                  </Badge>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-medium text-foreground">
                        {service.uptime.toFixed(2)}%
                      </span>
                    </div>
                    {service.responseTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response Time</span>
                        <span className="font-medium text-foreground">
                          {service.responseTime}ms
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Check</span>
                      <span className="font-medium text-foreground">
                        {new Date(service.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={service.uptime} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Yellow Network Health */}
      {yellowHealth && (
        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-foreground mb-8">Yellow Network Health</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Connection & Session Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Connection</p>
                      <Badge className={yellowHealth.connected ? 'bg-green-500' : 'bg-red-500'}>
                        {yellowHealth.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Session</p>
                      <Badge className={yellowHealth.sessionOpen ? 'bg-green-500' : 'bg-yellow-500'}>
                        {yellowHealth.sessionOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Circuit Breaker</p>
                      <Badge className={yellowHealth.circuitOpen ? 'bg-red-500' : 'bg-green-500'}>
                        {yellowHealth.circuitOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Failure Count</p>
                      <p className="text-xl font-bold text-foreground">{yellowHealth.failureCount}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Queued Requests</p>
                      <p className="text-xl font-bold text-foreground">{yellowHealth.queuedRequests}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Pending Requests</p>
                      <p className="text-xl font-bold text-foreground">{yellowHealth.pendingRequests}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Last RPC Call</span>
                      <span className="font-medium text-foreground">
                        {new Date(yellowHealth.lastRpcTimestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <div className={`text-7xl font-black mb-3 ${getHealthGradeColor(yellowHealth.healthGrade)}`}>
                    {yellowHealth.healthGrade}
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    {yellowHealth.healthScore}/100
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {yellowHealth.healthScore >= 90
                      ? 'Excellent Health'
                      : yellowHealth.healthScore >= 75
                      ? 'Good Health'
                      : yellowHealth.healthScore >= 60
                      ? 'Fair Health'
                      : 'Poor Health'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Watchdog Monitoring */}
      {watchdog && (
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bold text-foreground">Watchdog Monitoring</h2>
              <Badge className={watchdog.running ? 'bg-green-500' : 'bg-gray-500'}>
                {watchdog.running ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className={`text-5xl font-black mb-2 ${getHealthGradeColor(watchdog.healthGrade)}`}>
                    {watchdog.healthGrade}
                  </div>
                  <p className="text-sm text-muted-foreground">Health Grade</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-5xl font-bold text-yellow-500 mb-2">
                    {watchdog.activeAnomalies}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Anomalies</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-5xl font-bold text-red-500 mb-2">
                    {watchdog.criticalAnomalies}
                  </div>
                  <p className="text-sm text-muted-foreground">Critical Anomalies</p>
                </CardContent>
              </Card>
            </div>

            {watchdog.recentAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Alerts</CardTitle>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-file-alt mr-2"></i>
                      View Audit Log
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {watchdog.recentAlerts.slice(0, 10).map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 pb-3 border-b border-border last:border-0"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-500/10' :
                          alert.severity === 'error' ? 'bg-orange-500/10' :
                          alert.severity === 'warning' ? 'bg-yellow-500/10' :
                          'bg-blue-500/10'
                        }`}>
                          <i className={`fas ${
                            alert.severity === 'critical' || alert.severity === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'
                          } ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'error' ? 'text-orange-500' :
                            alert.severity === 'warning' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            <Badge className={
                              alert.severity === 'critical' ? 'bg-red-500' :
                              alert.severity === 'error' ? 'bg-orange-500' :
                              alert.severity === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground mb-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Performance Metrics */}
      {performance && (
        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-foreground mb-8">Performance Metrics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Response Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-semibold">{performance.apiResponseTime.avg}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P50</span>
                    <span className="font-semibold">{performance.apiResponseTime.p50}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P95</span>
                    <span className="font-semibold">{performance.apiResponseTime.p95}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P99</span>
                    <span className="font-semibold">{performance.apiResponseTime.p99}ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settlement Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-semibold">{performance.settlementTime.avg}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Minimum</span>
                    <span className="font-semibold">{performance.settlementTime.min}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maximum</span>
                    <span className="font-semibold">{performance.settlementTime.max}ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>WebSocket Latency</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-foreground mb-1">
                      {performance.websocketLatency}
                    </p>
                    <p className="text-sm text-muted-foreground">milliseconds</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Query Time</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-foreground mb-1">
                      {performance.databaseQueryTime}
                    </p>
                    <p className="text-sm text-muted-foreground">milliseconds</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Incident History */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-8">Incident History (Last 30 Days)</h2>

          {incidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-3xl text-green-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Incidents</h3>
                <p className="text-muted-foreground">
                  No incidents reported in the last 30 days
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Affected Services</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Start Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{incident.title}</p>
                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{incident.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {incident.affectedServices.map((service) => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {incident.duration
                            ? `${Math.floor(incident.duration / 60)}h ${incident.duration % 60}m`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(incident.startTime).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
