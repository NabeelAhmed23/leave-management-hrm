import winston from "winston";

export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug";

export interface LoggerConfig {
  level: LogLevel;
  format: winston.Logform.Format;
  transports: winston.transport[];
  exitOnError: boolean;
}

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Define log levels
export const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

// Get log level from environment or default
export const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL as LogLevel;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  return isDevelopment ? "debug" : "info";
};

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// File format for production
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports based on environment
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  if (isDevelopment) {
    // Console transport for development
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  }

  if (isProduction) {
    // File transport for production errors
    transports.push(
      new winston.transports.File({
        filename: process.env.LOG_ERROR_FILE || "logs/error.log",
        level: "error",
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // File transport for all logs
    transports.push(
      new winston.transports.File({
        filename: process.env.LOG_FILE || "logs/combined.log",
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Console transport for production (with minimal info)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.simple()
        ),
      })
    );
  }

  return transports;
};

export const loggerConfig: LoggerConfig = {
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] })
  ),
  transports: createTransports(),
  exitOnError: false,
};
