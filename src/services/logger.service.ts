import winston from "winston";
import { loggerConfig, LogLevel } from "../config/logger.config";

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: unknown;
}

export interface Logger {
  error(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  http(message: string, meta?: LogMetadata): void;
  verbose(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  child(defaultMeta: LogMetadata): Logger;
}

class LoggerService implements Logger {
  private winston: winston.Logger;
  private defaultMeta: LogMetadata;

  constructor(defaultMeta: LogMetadata = {}) {
    this.defaultMeta = defaultMeta;
    this.winston = winston.createLogger(loggerConfig);
  }

  private log(level: LogLevel, message: string, meta: LogMetadata = {}): void {
    const combinedMeta = { ...this.defaultMeta, ...meta };
    this.winston.log(level, message, combinedMeta);
  }

  error(message: string, meta: LogMetadata = {}): void {
    this.log("error", message, meta);
  }

  warn(message: string, meta: LogMetadata = {}): void {
    this.log("warn", message, meta);
  }

  info(message: string, meta: LogMetadata = {}): void {
    this.log("info", message, meta);
  }

  http(message: string, meta: LogMetadata = {}): void {
    this.log("http", message, meta);
  }

  verbose(message: string, meta: LogMetadata = {}): void {
    this.log("verbose", message, meta);
  }

  debug(message: string, meta: LogMetadata = {}): void {
    this.log("debug", message, meta);
  }

  child(defaultMeta: LogMetadata): Logger {
    return new LoggerService({ ...this.defaultMeta, ...defaultMeta });
  }
}

// Create and export the singleton instance
export const logger = new LoggerService();

// Export factory function for creating child loggers
export const createLogger = (defaultMeta: LogMetadata = {}): Logger => {
  return new LoggerService(defaultMeta);
};

// Export type
export { LoggerService };
