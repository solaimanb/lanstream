/**
 * Centralized, structured logger for LANStream portal.
 *
 * Provides tagged, level-filtered logging across API routes,
 * server actions, proxy middleware, and DAL operations.
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogContext {
  userId?: string | null;
  path?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private format(
    level: LogLevel,
    tag: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const tagFormatted = tag.startsWith("[") ? tag : `[${tag.toUpperCase()}]`;
    const metaStr =
      context && Object.keys(context).length > 0
        ? ` | ${JSON.stringify(context)}`
        : "";
    return `${timestamp} ${level.padEnd(5)} ${tagFormatted} ${message}${metaStr}`;
  }

  info(tag: string, message: string, context?: LogContext): void {
    console.log(this.format("INFO", tag, message, context));
  }

  warn(tag: string, message: string, context?: LogContext): void {
    console.warn(this.format("WARN", tag, message, context));
  }

  error(tag: string, message: string, errorOrContext?: unknown): void {
    if (errorOrContext instanceof Error) {
      console.error(
        this.format("ERROR", tag, message, {
          errorName: errorOrContext.name,
          errorMessage: errorOrContext.message,
          stack: errorOrContext.stack,
        }),
      );
    } else {
      console.error(
        this.format("ERROR", tag, message, errorOrContext as LogContext),
      );
    }
  }

  debug(tag: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.format("DEBUG", tag, message, context));
    }
  }
}

export const logger = new Logger();
