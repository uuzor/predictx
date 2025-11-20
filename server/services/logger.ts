import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const logConsole = process.env.LOG_CONSOLE !== 'false';
const logFile = process.env.LOG_FILE || 'logs/predictx.log';

// Custom format for console output with colors and emojis
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceTag = service ? `[${service}]` : '';
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level} ${serviceTag} ${message}${metaString}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Add console transport if enabled
if (logConsole) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel,
    })
  );
}

// Add file transport with daily rotation if enabled
if (logFile) {
  const logDir = path.dirname(logFile);
  const logFileName = path.basename(logFile, path.extname(logFile));

  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, `${logFileName}-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: logLevel,
    })
  );

  // Separate file for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, `${logFileName}-error-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: { service: 'predictx' },
  transports,
  exceptionHandlers: logFile
    ? [
        new DailyRotateFile({
          filename: path.join(path.dirname(logFile), 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ]
    : undefined,
  rejectionHandlers: logFile
    ? [
        new DailyRotateFile({
          filename: path.join(path.dirname(logFile), 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ]
    : undefined,
});

// Helper functions for common logging patterns
export const log = {
  // General logging
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: Error | object) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, error);
    }
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
  verbose: (message: string, meta?: object) => logger.verbose(message, meta),

  // Service-specific logging
  yellowNetwork: {
    info: (message: string, meta?: object) =>
      logger.info(message, { ...meta, service: 'yellow-network' }),
    warn: (message: string, meta?: object) =>
      logger.warn(message, { ...meta, service: 'yellow-network' }),
    error: (message: string, error?: Error | object) =>
      log.error(message, { ...error, service: 'yellow-network' }),
    debug: (message: string, meta?: object) =>
      logger.debug(message, { ...meta, service: 'yellow-network' }),
  },

  api: {
    request: (method: string, path: string, meta?: object) =>
      logger.http(`${method} ${path}`, { ...meta, service: 'api' }),
    response: (method: string, path: string, status: number, duration: number) =>
      logger.http(`${method} ${path} ${status}`, { duration, service: 'api' }),
    error: (method: string, path: string, error: Error | object) =>
      log.error(`API Error: ${method} ${path}`, { ...error, service: 'api' }),
  },

  prediction: {
    submitted: (userId: string, assetId: string, meta?: object) =>
      logger.info(`Prediction submitted: ${assetId}`, { userId, assetId, ...meta, service: 'prediction' }),
    settled: (predictionId: string, isCorrect: boolean, meta?: object) =>
      logger.info(`Prediction settled: ${isCorrect ? '✓' : '✗'}`, {
        predictionId,
        isCorrect,
        ...meta,
        service: 'prediction',
      }),
    error: (message: string, error?: Error | object) =>
      log.error(message, { ...error, service: 'prediction' }),
  },

  tournament: {
    created: (tournamentId: string, name: string) =>
      logger.info(`Tournament created: ${name}`, { tournamentId, name, service: 'tournament' }),
    joined: (userId: string, tournamentId: string) =>
      logger.info(`User joined tournament`, { userId, tournamentId, service: 'tournament' }),
    completed: (tournamentId: string, winner?: string) =>
      logger.info(`Tournament completed`, { tournamentId, winner, service: 'tournament' }),
  },

  security: {
    alert: (type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details: object) =>
      logger.warn(`Security Alert: ${type} [${severity}]`, { type, severity, ...details, service: 'security' }),
    fraud: (userId: string, reason: string, meta?: object) =>
      logger.warn(`Fraud detected: ${reason}`, { userId, reason, ...meta, service: 'security' }),
    rateLimit: (ip: string, endpoint: string) =>
      logger.warn(`Rate limit exceeded`, { ip, endpoint, service: 'security' }),
  },
};

// Stream for Morgan HTTP logger
export const stream = {
  write: (message: string) => logger.http(message.trim()),
};

export default logger;
