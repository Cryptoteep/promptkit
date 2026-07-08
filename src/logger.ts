/**
 * promptkit — tiny logger
 *
 * A minimal, dependency-free logger with levels and a quiet mode. Used by
 * the CLI; library code never logs directly.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
}

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  silent: '',
}

const RESET = '\x1b[0m'

export interface Logger {
  level: LogLevel
  debug(msg: string, ...args: unknown[]): void
  info(msg: string, ...args: unknown[]): void
  warn(msg: string, ...args: unknown[]): void
  error(msg: string, ...args: unknown[]): void
}

export function createLogger(level: LogLevel = 'info', useColor = true): Logger {
  const write = (lvl: LogLevel, msg: string, args: unknown[]) => {
    if (LEVEL_ORDER[lvl] < LEVEL_ORDER[level]) return
    const prefix = useColor ? `${COLORS[lvl]}[${lvl}]${RESET}` : `[${lvl}]`
    // eslint-disable-next-line no-console
    if (lvl === 'error') console.error(prefix, msg, ...args)
    else if (lvl === 'warn') console.warn(prefix, msg, ...args)
    else console.log(prefix, msg, ...args)
  }

  return {
    level,
    debug: (msg, ...args) => write('debug', msg, args),
    info: (msg, ...args) => write('info', msg, args),
    warn: (msg, ...args) => write('warn', msg, args),
    error: (msg, ...args) => write('error', msg, args),
  }
}
