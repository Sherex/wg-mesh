import axios from 'axios'
import tar from 'tar'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { log } from './logger.js'
import { config } from './config.js'

const installLocation = config.rqlite.dataPath
const rqliteServer = `${installLocation}/rqlited`

export async function isInstalled (): Promise<boolean> {
  log('debug', ['rqlite', 'isInstalled', 'checking if exists', rqliteServer])
  try {
    await fs.accessSync(rqliteServer)
    log('debug', ['rqlite', 'isInstalled', 'rqlited exists!'])
    return true
  } catch (error) {
    log('debug', ['rqlite', 'isInstalled', 'rqlited does not exist!'])
    return false
  }
}

export async function install (version: string): Promise<void> {
  log('debug', ['rqlite', 'Starting installation'])
  await fs.mkdirSync(installLocation, { recursive: true })

  const downloadUrl = await getArchiveUrl(version)
  log('debug', ['rqlite', 'downloading rqlite server', 'version', version])
  const { data: rqliteFile } = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  })

  log('debug', ['rqlite', 'download complete!', 'extracting to', installLocation])

  await new Promise<void>((resolve, reject) => {
    rqliteFile
      .pipe(tar.extract({
        cwd: installLocation,
        strip: 1,
        filter: path => path.includes('rqlited')
      }))
      .on('close', () => {
        resolve()
      })
      .on('error', () => {
        reject(Error('Failed to extract archive!'))
      })
  })

  log('debug', ['rqlite', 'extraction complete!'])
}

async function getArchiveUrl (version: string): Promise<string> {
  log('info', ['rqlite', 'getArchiveUrl', 'Getting archive URL for version', version])
  const response = await axios.get(`https://api.github.com/repos/rqlite/rqlite/releases/tags/${version}`)
  const assets = response?.data?.assets
  if (typeof assets === 'undefined' || !Array.isArray(assets)) {
    log('error', ['rqlite', 'getArchiveUrl', 'Couldn\'t find "assets" in API response', version, 'Exiting!'])
    // TODO: Provide instructions for manual download
    process.exit(1)
  }
  const linuxAsset = assets.find(asset => typeof asset.name === 'string' && asset.name.includes('linux'))
  if (typeof linuxAsset.browser_download_url === 'string') {
    log('debug', ['rqlite', 'getArchiveUrl', 'found archive URL', linuxAsset.browser_download_url])
    return linuxAsset.browser_download_url as string
  }
  log('error', ['rqlite', 'getArchiveUrl', 'Couldn\'t find archive URL!', 'Exiting!'])
  // TODO: Provide instructions for manual download
  process.exit(1)
}

let node: ChildProcess | null = null
// Child_process docs: https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
interface StartServerOptions {
  noInstall?: boolean
}
export async function startServer (options: StartServerOptions = {}): Promise<void> {
  if (!await isInstalled() && options.noInstall !== true) {
    log('debug', ['rqlite', 'startServer', 'executable not installed', 'installing..'])
    await install(config.rqlite.version)
  }
  if (!await isInstalled()) throw Error('RQLite is not installed! Run .install() first.')

  if (node === null || node.killed) {
    const logFile = fs.openSync(`${installLocation}/server.log`, 'a')
    // TODO: Check that the server is actually spawned
    node = spawn(`${rqliteServer}`, [`${installLocation}/db`], {
      stdio: [
        'ignore', logFile, logFile
      ]
    })
    log('info', ['rqlite', 'startServer', 'successfully started server', 'pid', node.pid])
  } else {
    log('info', ['rqlite', 'startServer', 'server is already running', 'pid', node.pid])
  }
}

export async function stopServer (): Promise<void> {
  if (node === null || node.killed) {
    log('info', ['rqlite', 'stopServer', 'server is already stopped'])
  } else if (!await isInstalled()) {
    log('warn', ['rqlite', 'stopServer', 'server executable does not exist', 'continuing anyway..'])
    node = null
  } else {
    if (node.kill('SIGINT')) {
      log('info', ['rqlite', 'stopServer', 'successfully stopped the server', 'pid', node.pid])
    } else {
      // TODO: Force shutdown the server
      log('error', ['rqlite', 'stopServer', 'failed to stop the server', 'pid', node.pid])
    }
  }
}
