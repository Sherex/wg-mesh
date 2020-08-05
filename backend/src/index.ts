import { config } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import * as ip from './lib/iproute2'
import * as rqlite from './lib/rqlite'

if (config.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('debug', ['index', 'checking prerequisites'])
  await checkPrerequisites()

  log('info', ['index', 'creating interface'])
  await ip.createInterface('wg0')

  log('debug', ['index', 'checking rqlite server'])
  if (!await rqlite.isInstalled()) await rqlite.install(config.rqlite.version)

  log('debug', ['index', 'starting rqlite server'])
  await rqlite.startServer()

  await ip.addIp('wg0', '10.50.0.20/24')

  console.log(await ip.getInterface('wg0'))

  await new Promise(resolve => setTimeout(resolve, 10000))

  log('debug', ['index', 'stopping rqlite server'])
  await rqlite.stopServer()

  await ip.deleteIp('wg0', '10.50.0.20/24')

  log('info', ['index', 'deleting interface'])
  await ip.deleteInterface('wg0')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
  console.error(error)
})
