import { log } from './lib/logger'
import { isInstalled, install } from './lib/rqlite'

;(async () => {
  log('info', ['index', 'starting client...'])
  if (!await isInstalled()) await install('v5.4.0')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
})
