/**
 * Centralized logging system for error tracking and debugging
 * Ready for future integration with Sentry, LogRocket, or similar services
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Format log entry as string
 */
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, context, message, metadata } = entry;
  const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : "";
  return `[${timestamp}] ${level.toUpperCase()} [${context}] ${message}${metaStr}`;
}

/**
 * Log error with context
 * @param context - Where the error occurred (e.g., "ReceiptAPI", "DashboardPage")
 * @param error - Error object or message
 * @param metadata - Additional data to log
 */
export function logError(
  context: string,
  error: Error | string | unknown,
  metadata?: Record<string, any>
): void {
  const message =
    error instanceof Error ? error.message : String(error);
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "error",
    context,
    message,
    metadata: {
      ...metadata,
      ...(error instanceof Error && { stack: error.stack }),
    },
  };

  // Console output for development
  console.error(formatLogEntry(entry));

  // TODO: Send to error tracking service (Sentry, LogRocket)
  // if (process.env.NODE_ENV === 'production') {
  //   captureException(error, { tags: { context }, extra: metadata });
  // }
}

/**
 * Log info message with context
 * @param context - Where the message originated
 * @param message - Message to log
 * @param metadata - Additional data to log
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    context,
    message,
    metadata,
  };

  // Console output for development
  console.log(formatLogEntry(entry));

  // TODO: Send to logging service if needed
}

/**
 * Log warning message with context
 * @param context - Where the warning occurred
 * @param message - Warning message
 * @param metadata - Additional data to log
 */
export function logWarn(
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "warn",
    context,
    message,
    metadata,
  };

  // Console output for development
  console.warn(formatLogEntry(entry));

  // TODO: Send to logging service if needed
}

/**
 * Create a scoped logger for a specific context
 * Useful for components or modules that log frequently
 */
export function createLogger(context: string) {
  return {
    error: (message: string | Error, metadata?: Record<string, any>) => {
      logError(context, message, metadata);
    },
    info: (message: string, metadata?: Record<string, any>) => {
      logInfo(context, message, metadata);
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      logWarn(context, message, metadata);
    },
  };
}
