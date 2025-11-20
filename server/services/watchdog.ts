/**
 * Watchdog Service for Yellow Network State Channel Monitoring
 *
 * Based on Yellow Network best practices:
 * - Auditing entities that replicate state from channels
 * - Monitor for anomalies and disputes
 * - Can call challenges to unlock escrowed funds in case of disasters
 * - Share audit logs for transparency
 */

import { log } from './logger.js';
import { yellowNetworkService } from './yellowNetworkService.js';

interface StateSnapshot {
  timestamp: number;
  sessionId: string | null;
  connectionStatus: string;
  sessionOpen: boolean;
  pendingRequests: number;
  queuedRequests: number;
  failureCount: number;
  circuitOpen: boolean;
}

interface AnomalyReport {
  type: 'connection_loss' | 'session_timeout' | 'high_failure_rate' | 'circuit_open' | 'suspicious_activity';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  details: Record<string, any>;
  resolved: boolean;
}

export class WatchdogService {
  private stateHistory: StateSnapshot[] = [];
  private maxHistorySize = 1000; // Keep last 1000 snapshots
  private anomalies: AnomalyReport[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private monitoringIntervalMs = 30000; // Check every 30 seconds

  // Thresholds for anomaly detection
  private thresholds = {
    maxFailureRate: 0.2, // 20% failure rate
    maxQueueSize: 50,
    maxPendingRequests: 20,
    connectionLossWindow: 60000, // 1 minute
  };

  /**
   * Start watchdog monitoring
   */
  start() {
    if (this.monitoringInterval) {
      log.info('Watchdog already running');
      return;
    }

    log.info('🐕 Starting Watchdog service for Yellow Network monitoring');

    this.monitoringInterval = setInterval(() => {
      this.captureState();
      this.detectAnomalies();
      this.cleanupOldData();
    }, this.monitoringIntervalMs);
  }

  /**
   * Stop watchdog monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      log.info('Watchdog service stopped');
    }
  }

  /**
   * Capture current state snapshot
   */
  private captureState() {
    try {
      const health = yellowNetworkService.getHealthStatus();

      const snapshot: StateSnapshot = {
        timestamp: Date.now(),
        sessionId: null, // Would need to expose this from yellowNetworkService
        connectionStatus: yellowNetworkService.getConnectionStatus(),
        sessionOpen: yellowNetworkService.getSessionOpen(),
        pendingRequests: health.pendingRequests,
        queuedRequests: health.queuedRequests,
        failureCount: health.failureCount,
        circuitOpen: health.circuitOpen,
      };

      this.stateHistory.push(snapshot);

      // Log state to audit trail
      log.debug('Watchdog state captured', snapshot);
    } catch (error) {
      log.error('Failed to capture state', error as Error);
    }
  }

  /**
   * Detect anomalies in the system
   */
  private detectAnomalies() {
    const current = this.getCurrentState();
    if (!current) return;

    // Check for circuit breaker open
    if (current.circuitOpen) {
      this.reportAnomaly({
        type: 'circuit_open',
        severity: 'HIGH',
        timestamp: Date.now(),
        details: {
          failureCount: current.failureCount,
          message: 'Circuit breaker is open, service degraded',
        },
        resolved: false,
      });
    }

    // Check for high queue size
    if (current.queuedRequests > this.thresholds.maxQueueSize) {
      this.reportAnomaly({
        type: 'suspicious_activity',
        severity: 'MEDIUM',
        timestamp: Date.now(),
        details: {
          queueSize: current.queuedRequests,
          threshold: this.thresholds.maxQueueSize,
          message: 'Abnormally high number of queued requests',
        },
        resolved: false,
      });
    }

    // Check for connection loss pattern
    const recentStates = this.getRecentStates(this.thresholds.connectionLossWindow);
    const disconnectedCount = recentStates.filter((s) => s.connectionStatus === 'disconnected').length;

    if (disconnectedCount > recentStates.length * 0.5) {
      this.reportAnomaly({
        type: 'connection_loss',
        severity: 'CRITICAL',
        timestamp: Date.now(),
        details: {
          disconnectedRatio: disconnectedCount / recentStates.length,
          window: this.thresholds.connectionLossWindow,
          message: 'Frequent connection losses detected',
        },
        resolved: false,
      });
    }

    // Check for high failure rate
    if (current.failureCount > 10) {
      this.reportAnomaly({
        type: 'high_failure_rate',
        severity: 'HIGH',
        timestamp: Date.now(),
        details: {
          failureCount: current.failureCount,
          message: 'High failure count detected',
        },
        resolved: false,
      });
    }

    // Check for session timeout
    if (!current.sessionOpen && current.connectionStatus === 'connected') {
      this.reportAnomaly({
        type: 'session_timeout',
        severity: 'MEDIUM',
        timestamp: Date.now(),
        details: {
          message: 'Connected but session not open',
        },
        resolved: false,
      });
    }
  }

  /**
   * Report an anomaly
   */
  private reportAnomaly(anomaly: AnomalyReport) {
    // Check if similar anomaly already reported recently
    const recentSimilar = this.anomalies.find(
      (a) => a.type === anomaly.type && Date.now() - a.timestamp < 300000 && !a.resolved
    );

    if (recentSimilar) {
      // Update existing anomaly
      recentSimilar.timestamp = anomaly.timestamp;
      recentSimilar.details = anomaly.details;
      return;
    }

    this.anomalies.push(anomaly);

    // Log anomaly with appropriate severity
    log.security.alert(anomaly.type, anomaly.severity, anomaly.details);

    // For critical anomalies, could trigger notifications, webhooks, etc.
    if (anomaly.severity === 'CRITICAL') {
      this.handleCriticalAnomaly(anomaly);
    }
  }

  /**
   * Handle critical anomalies
   */
  private handleCriticalAnomaly(anomaly: AnomalyReport) {
    log.warn(`🚨 CRITICAL ANOMALY DETECTED: ${anomaly.type}`, anomaly.details);

    // In production, you might:
    // 1. Send alerts to monitoring system (PagerDuty, Sentry, etc.)
    // 2. Trigger automatic recovery procedures
    // 3. Call challenge functions on adjudicator contract
    // 4. Notify administrators

    // For now, we log extensively
    console.error('═══════════════════════════════════════');
    console.error('🚨 CRITICAL WATCHDOG ALERT');
    console.error('═══════════════════════════════════════');
    console.error(`Type: ${anomaly.type}`);
    console.error(`Severity: ${anomaly.severity}`);
    console.error(`Time: ${new Date(anomaly.timestamp).toISOString()}`);
    console.error(`Details:`, JSON.stringify(anomaly.details, null, 2));
    console.error('═══════════════════════════════════════');
  }

  /**
   * Get current state
   */
  private getCurrentState(): StateSnapshot | null {
    if (this.stateHistory.length === 0) return null;
    return this.stateHistory[this.stateHistory.length - 1];
  }

  /**
   * Get recent states within time window
   */
  private getRecentStates(windowMs: number): StateSnapshot[] {
    const cutoff = Date.now() - windowMs;
    return this.stateHistory.filter((s) => s.timestamp >= cutoff);
  }

  /**
   * Cleanup old data to prevent memory leaks
   */
  private cleanupOldData() {
    // Keep only last maxHistorySize snapshots
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }

    // Mark old anomalies as resolved
    const ageThreshold = Date.now() - 86400000; // 24 hours
    this.anomalies.forEach((anomaly) => {
      if (anomaly.timestamp < ageThreshold && !anomaly.resolved) {
        anomaly.resolved = true;
      }
    });

    // Remove very old resolved anomalies
    const purgeThreshold = Date.now() - 604800000; // 7 days
    this.anomalies = this.anomalies.filter((a) => a.timestamp >= purgeThreshold);
  }

  /**
   * Get watchdog status and statistics
   */
  getStatus() {
    const activeAnomalies = this.anomalies.filter((a) => !a.resolved);
    const criticalAnomalies = activeAnomalies.filter((a) => a.severity === 'CRITICAL');

    return {
      running: this.monitoringInterval !== null,
      stateHistorySize: this.stateHistory.length,
      totalAnomalies: this.anomalies.length,
      activeAnomalies: activeAnomalies.length,
      criticalAnomalies: criticalAnomalies.length,
      recentAnomalies: activeAnomalies.slice(-5),
      thresholds: this.thresholds,
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100) {
    return {
      stateSnapshots: this.stateHistory.slice(-limit),
      anomalies: this.anomalies.slice(-limit),
      timestamp: Date.now(),
    };
  }

  /**
   * Resolve an anomaly manually
   */
  resolveAnomaly(index: number) {
    if (index >= 0 && index < this.anomalies.length) {
      this.anomalies[index].resolved = true;
      log.info(`Anomaly resolved manually`, { index, type: this.anomalies[index].type });
    }
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    const current = this.getCurrentState();
    if (!current) return 0;

    let score = 100;

    // Deduct points for issues
    if (current.circuitOpen) score -= 30;
    if (current.connectionStatus === 'disconnected') score -= 25;
    if (!current.sessionOpen) score -= 20;
    if (current.failureCount > 5) score -= 15;
    if (current.queuedRequests > 20) score -= 10;

    // Active anomalies reduce score
    const activeAnomalies = this.anomalies.filter((a) => !a.resolved);
    activeAnomalies.forEach((a) => {
      switch (a.severity) {
        case 'CRITICAL':
          score -= 20;
          break;
        case 'HIGH':
          score -= 10;
          break;
        case 'MEDIUM':
          score -= 5;
          break;
        case 'LOW':
          score -= 2;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }
}

export const watchdogService = new WatchdogService();
