import { config } from './config.js'

// TODO: Use enum?
export type LogLevel = 'silly' | 'debug' | 'info' | 'verbose' | 'warn' | 'error'
export type LogMessage = string | number | undefined | Error

let minimumLogLevel: LogLevel = 'silly'

function isLogLevel (level: string | undefined): level is LogLevel {
  if (typeof level !== 'string') return false
  return typeof getLevel(level as LogLevel) !== 'undefined'
}

const logLevelEnv = config.logLevel
if (isLogLevel(logLevelEnv)) {
  minimumLogLevel = logLevelEnv.toLocaleLowerCase() as LogLevel
} else {
  log('warn', ['logger', 'invalid minimun loglevel in config!', logLevelEnv, 'expected one of: silly | debug | info | verbose | warn | error'])
}

function log (level: LogLevel, message: LogMessage | LogMessage[]): void {
  if (getLevel(level) > getLevel(minimumLogLevel)) return
  message = Array.isArray(message) ? message : [message]
  console.log(
    `[ ${getDateTime()} ] < ${level.toUpperCase()} > ${
      message.join(' - ')
    }`
  )
  if (getLevel(minimumLogLevel) >= getLevel('debug')) {
    const error = message.find(part => part instanceof Error)
    if (typeof error !== 'undefined') console.error(error)
  }
}

function getDateTime (): string {
  const dateObject = new Date()
  const [date, time, milli] = dateObject.toISOString().split(/T|Z|\./)
  return `${date} ${time}.${milli}`
}

function getLevel (level: LogLevel): number {
  level = level.toLocaleLowerCase() as LogLevel
  const levelMapper = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  }
  return levelMapper[level]
}

export {
  log
}
