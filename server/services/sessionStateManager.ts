import fs from 'fs';
import path from 'path';

interface SessionState {
  sessionId: string | null;
  isOpen: boolean;
  lastActivity: number;
  metadata: {
    openedAt?: number;
    closedAt?: number;
    totalRequests?: number;
    errors?: number;
  };
}

const SESSION_STATE_FILE = 'data/session-state.json';

export class SessionStateManager {
  private stateFilePath: string;

  constructor(stateFile: string = SESSION_STATE_FILE) {
    this.stateFilePath = path.resolve(process.cwd(), stateFile);
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dir = path.dirname(this.stateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Save session state to disk for recovery after restart
   */
  async saveState(state: SessionState): Promise<void> {
    try {
      const data = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.stateFilePath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  /**
   * Load session state from disk
   */
  async loadState(): Promise<SessionState | null> {
    try {
      if (!fs.existsSync(this.stateFilePath)) {
        return null;
      }

      const data = fs.readFileSync(this.stateFilePath, 'utf8');
      return JSON.parse(data) as SessionState;
    } catch (error) {
      console.error('Failed to load session state:', error);
      return null;
    }
  }

  /**
   * Clear session state file
   */
  async clearState(): Promise<void> {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }

  /**
   * Check if session has timed out (inactive for more than specified duration)
   */
  isSessionTimedOut(state: SessionState, timeoutMs: number = 300000): boolean {
    if (!state.isOpen) return true;
    const inactiveTime = Date.now() - state.lastActivity;
    return inactiveTime > timeoutMs;
  }

  /**
   * Create initial session state
   */
  createInitialState(sessionId: string): SessionState {
    return {
      sessionId,
      isOpen: true,
      lastActivity: Date.now(),
      metadata: {
        openedAt: Date.now(),
        totalRequests: 0,
        errors: 0,
      },
    };
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(state: SessionState): SessionState {
    return {
      ...state,
      lastActivity: Date.now(),
    };
  }

  /**
   * Increment request counter
   */
  incrementRequests(state: SessionState): SessionState {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        totalRequests: (state.metadata.totalRequests || 0) + 1,
      },
    };
  }

  /**
   * Increment error counter
   */
  incrementErrors(state: SessionState): SessionState {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        errors: (state.metadata.errors || 0) + 1,
      },
    };
  }

  /**
   * Mark session as closed
   */
  closeSession(state: SessionState): SessionState {
    return {
      ...state,
      isOpen: false,
      metadata: {
        ...state.metadata,
        closedAt: Date.now(),
      },
    };
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(state: SessionState): number {
    const startTime = state.metadata.openedAt || Date.now();
    const endTime = state.metadata.closedAt || Date.now();
    return endTime - startTime;
  }

  /**
   * Get session statistics
   */
  getSessionStats(state: SessionState): {
    duration: number;
    totalRequests: number;
    errors: number;
    errorRate: number;
    isActive: boolean;
  } {
    const duration = this.getSessionDuration(state);
    const totalRequests = state.metadata.totalRequests || 0;
    const errors = state.metadata.errors || 0;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    return {
      duration,
      totalRequests,
      errors,
      errorRate: parseFloat(errorRate.toFixed(2)),
      isActive: state.isOpen && !this.isSessionTimedOut(state),
    };
  }
}

export const sessionStateManager = new SessionStateManager();
