import { logger } from "../services/logger.service";

// Re-export the singleton logger instance for easy access throughout the app
export { logger };

// Re-export types for convenience
export type { Logger, LogMetadata } from "../services/logger.service";
