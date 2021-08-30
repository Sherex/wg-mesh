import { config } from './lib/config.js'
import { log } from './lib/logger.js'
import { checkPrerequisites } from './lib/check-prerequisites.js'
import * as ip from './lib/iproute2.js'
import * as rqlite from './lib/rqlite.js'
import * as wireguard from './lib/wireguard.js'
import * as api from './routes/index.js'

if (config.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('info', ['index', 'starting API server..'])
  await api.start(8080)
  log('info', ['index', 'API server is now running'])
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
  console.error(error)
})
