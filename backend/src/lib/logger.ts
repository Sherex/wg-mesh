type LogLevel = 'silly' | 'debug' | 'info' | 'verbose' | 'warn' | 'error'

let minimumLogLevel: LogLevel = 'silly'

function isLogLevel (level: string | undefined): level is LogLevel {
  if (typeof level !== 'string') return false
  return typeof getLevel(level as LogLevel) !== 'undefined'
}

const logLevelEnv = process.env.LOG_LEVEL
if (isLogLevel(logLevelEnv)) {
  minimumLogLevel = logLevelEnv.toLocaleLowerCase() as LogLevel
}

function log (level: LogLevel, message: string | string[]): void {
  if (getLevel(level) > getLevel(minimumLogLevel)) return
  message = Array.isArray(message) ? message : [message]
  console.log(
    `[ ${getDateTime()} ] < ${level.toUpperCase()} > ${
      message.join(' - ')
    }`
  )
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
