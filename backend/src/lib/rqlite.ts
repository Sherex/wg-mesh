import axios from 'axios'
import tar from 'tar'
import fs from 'fs/promises'
import { log } from './logger'

const installLocation = './.rqlite'
const rqliteServer = `${installLocation}/rqlited`

export async function isInstalled (): Promise<boolean> {
  log('debug', ['rqlite', 'isInstalled', 'checking if exists', rqliteServer])
  try {
    await fs.access(rqliteServer)
    log('debug', ['rqlite', 'isInstalled', 'rqlited exists!'])
    return true
  } catch (error) {
    log('debug', ['rqlite', 'isInstalled', 'rqlited does not exist!'])
    return false
  }
}

export async function install (version: string): Promise<void> {
  log('debug', ['rqlite', 'Starting installation'])
  await fs.mkdir(installLocation, { recursive: true })

  const downloadUrl = await getArchiveUrl(version)
  log('debug', ['rqlite', 'downloading rqlite server', 'version', version])
  const { data: rqliteFile } = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  })

  log('debug', ['rqlite', 'download complete!', 'extracting to', installLocation])
  rqliteFile
    .pipe(tar.extract({
      cwd: installLocation,
      strip: 1,
      filter: path => path.includes('rqlited')
    }))

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
