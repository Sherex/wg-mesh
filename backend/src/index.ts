import { config } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import * as ip from './lib/iproute2'
import * as rqlite from './lib/rqlite'
import * as wireguard from './lib/wireguard'
import * as api from './routes'

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
