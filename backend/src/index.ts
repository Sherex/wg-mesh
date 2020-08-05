import { config } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import { createInterface, deleteInterface } from './lib/iproute2'
import { isInstalled, install, startServer, stopServer } from './lib/rqlite'

if (config.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('info', ['index', 'checking prerequisites'])
  await checkPrerequisites()

  log('info', ['index', 'creating interface'])
  await createInterface('wg0')

  log('info', ['index', 'checking rqlite server'])
  if (!await isInstalled()) await install(config.rqlite.version)

  log('info', ['index', 'starting rqlite server'])
  await startServer()
  await new Promise(resolve => setTimeout(resolve, 10000))

  log('info', ['index', 'stopping rqlite server'])
  await stopServer()

  log('info', ['index', 'deleting interface'])
  await deleteInterface('wg0')
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
  console.error(error)
})
