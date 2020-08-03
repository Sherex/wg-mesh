import { args } from './lib/config'
import { log } from './lib/logger'
import { isInstalled, install } from './lib/rqlite'

if (args.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('info', ['index', 'starting client...'])
  if (!await isInstalled()) await install('v5.4.0')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
})
