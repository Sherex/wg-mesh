import { config } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import * as ip from './lib/iproute2'
import * as rqlite from './lib/rqlite'
import * as wireguard from './lib/wireguard'

if (config.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('debug', ['index', 'checking prerequisites'])
  await checkPrerequisites()

  log('info', ['index', 'creating interface'])
  await ip.createInterface('wg1')

  log('debug', ['index', 'starting rqlite server'])
  await rqlite.startServer()

  await ip.addIp('wg1', '10.50.0.20/24')
  await ip.setInterfaceState('wg1', 'up')

  // console.log(await ip.getInterface('wg1'))

  // console.log((await wireguard.getInfo()))

  await new Promise(resolve => setTimeout(resolve, 3000))

  log('debug', ['index', 'stopping rqlite server'])
  await rqlite.stopServer()

  await ip.deleteIp('wg1', '10.50.0.20/24')

  log('info', ['index', 'deleting interface'])
  await ip.deleteInterface('wg1')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
  console.error(error)
})
