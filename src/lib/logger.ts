import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: ["password", "passwordHash", "token", "accessToken", "refreshToken"],
});

export function createChildLogger(context: string): pino.Logger {
  return logger.child({ context });
}

export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number
): void {
  logger.info({ method, url, statusCode, duration }, "Request completed");
}

export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error({ err: error, ...context }, "Error occurred");
}

export function logWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  logger.warn(context, message);
}

export function logInfo(
  message: string,
  context?: Record<string, unknown>
): void {
  logger.info(context, message);
}

export function logDebug(
  message: string,
  context?: Record<string, unknown>
): void {
  logger.debug(context, message);
}

export default logger;
