import parseArgs from 'minimist'
import { LogLevel } from './logger.js'

interface CliArgs extends parseArgs.ParsedArgs {
  interactive: boolean
  'log-level': LogLevel
}

const parseArgsOptions = {
  default: {
    interactive: false,
    'log-level': 'info'
  },
  string: [
    'log-level'
  ],
  boolean: [
    'interactive'
  ]
}

const args = parseArgs(process.argv.slice(2), parseArgsOptions) as CliArgs

export const config = {
  interactive: args.interactive,
  logLevel: args['log-level'],
  rqlite: {
    version: 'v5.4.0',
    dataPath: './.rqlite'
  },
  tempDir: './.tmp'
}
