import { args } from './lib/config'
import { log } from './lib/logger'
import { checkPrerequisites } from './lib/check-prerequisites'
import { isInstalled, install, startServer, stopServer } from './lib/rqlite'

if (args.interactive) {
  console.log('The --interactive switch is a planned feature! Exiting..')
  process.exit(1)
}

;(async () => {
  log('info', ['index', 'checking prerequisites'])
  await checkPrerequisites()
  log('info', ['index', 'checking rqlite server'])
  if (!await isInstalled()) await install('v5.4.0')

  log('info', ['index', 'starting rqlite server'])
  await startServer()
  log('info', ['index', 'started rqlite server'])
  await new Promise(resolve => setTimeout(resolve, 10000))

  log('info', ['index', 'stopping rqlite server'])
  await stopServer()
  log('info', ['index', 'stopped rqlite server'])
})().catch(error => {
  log('error', ['index', 'Failed in execution!', 'Error', error])
})
