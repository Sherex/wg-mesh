import parseArgs from 'minimist'
import { LogLevel } from './logger'

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

export const args = parseArgs(process.argv.slice(2), parseArgsOptions) as CliArgs
