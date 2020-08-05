import { config } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import { createInterface, deleteInterface, getInterface } from './lib/iproute2'
import { isInstalled, install, startServer, stopServer } from './lib/rqlite'

if (config.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('debug', ['index', 'checking prerequisites'])
  await checkPrerequisites()

  log('info', ['index', 'creating interface'])
  await createInterface('wg0')

  log('debug', ['index', 'checking rqlite server'])
  if (!await isInstalled()) await install(config.rqlite.version)

  log('debug', ['index', 'starting rqlite server'])
  await startServer()

  console.log(await getInterface('wg0'))

  await new Promise(resolve => setTimeout(resolve, 10000))

  log('debug', ['index', 'stopping rqlite server'])
  await stopServer()

  log('info', ['index', 'deleting interface'])
  await deleteInterface('wg0')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
  console.error(error)
})
