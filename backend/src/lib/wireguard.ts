import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'
import { validWgInterface } from './iproute2'
import * as tempFile from './temp-file'

const exec = promisify(execCallback)

export interface WGInfo {
  isRunning: boolean
  host: HostInfo | null
  peers: PeerInfo[]
}

export interface HostInfo {
  interface: string
  privateKey: string
  publicKey: string
  listenPort: string
  fwmark: string
}

export interface PeerInfo {
  publicKey: string
  presharedKey: string
  endpoint: string
  allowedIps: string
  latestHandshake: number
  transferRx: number
  transferTx: number
  persistentKeepalive: number
}

export async function getInfo (): Promise<WGInfo> {
  const returnInfo: WGInfo = {
    isRunning: false,
    host: null,
    peers: []
  }
  try {
    const output = await exec('wg show all dump')
    log('debug', ['wireguard', 'getHostInfo', 'successfully got information for host'])

    if (output.stdout === '') return returnInfo
    returnInfo.isRunning = true

    // BUG: Handle multiple interfaces, for every interface the first entry is always the host
    const infoLines = output.stdout.split('\n').filter(line => line !== '')
    returnInfo.host = parseString(infoLines[0], 'host') as HostInfo | null
    returnInfo.peers = infoLines.splice(1).map(infoLine => parseString(infoLine, 'peer') as PeerInfo)

    return returnInfo
  } catch (error) {
    log('error', ['wireguard', 'getHostInfo', 'failed to get information for host', 'error', error.message])
    throw error
  }
}

function parseString (valueString: string, type: 'host' | 'peer' = 'host'): HostInfo | PeerInfo {
  let keyString: string
  if (type === 'host') {
    keyString = 'interface\tprivateKey\tpublicKey\tlistenPort\tfwmark'
  } else {
    keyString = 'interface\tpublicKey\tpresharedKey\tendpoint\tallowedIps\tlatestHandshake\ttransferRx\ttransferTx\tpersistentKeepalive'
  }

  const parsedInfo: {[key: string]: string | number | null} = {}
  const values = valueString.split('\t')
  // TODO: parse allowedIps as an array of ips
  keyString.split('\t').forEach((key, i) => {
    let value: string | number | null = values[i] === '(none)' || values[i] === '' ? null : values[i]
    if (['latestHandshake', 'transferRx', 'transferTx', 'persistentKeepalive'].includes(key)) value = Number(value)
    parsedInfo[key] = value
  })

  if (isHostInfo(parsedInfo)) {
    return parsedInfo as HostInfo
  } else if (isPeerInfo(parsedInfo)) {
    return parsedInfo as PeerInfo
  }
  log('error', ['wireguard', 'parseString', 'invalid object returned from parsing', 'check parsing logic!', 'type', type])
  throw Error(`Failed to parse line of type "${type}"`)
}

export function isHostInfo (data: any): data is HostInfo {
  const validKeys = ['interface', 'privateKey', 'publicKey', 'listenPort', 'fwmark']
  for (const validKey of validKeys) {
    if (!Object.prototype.hasOwnProperty.call(data, validKey)) return false
  }
  return true
}

export function isPeerInfo (data: any): data is PeerInfo {
  const validKeys = ['interface', 'publicKey', 'presharedKey', 'endpoint', 'allowedIps', 'latestHandshake', 'transferRx', 'transferTx', 'persistentKeepalive']
  for (const validKey of validKeys) {
    if (!Object.prototype.hasOwnProperty.call(data, validKey)) return false
  }
  return true
}

export interface ConfigOptions {
  listenPort?: number
  fwmark?: string
  privateKey?: string
}

export async function setConfig (wgInterface: string, options: ConfigOptions): Promise<void> {
  if (!validWgInterface(wgInterface)) {
    log('error', ['wireguard', 'setConfig', 'wrong format on interface name', 'got', wgInterface, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  let configString: string = wgInterface
  let file

  for (let [key, value] of Object.entries(options)) {
    let stringVal = String(value)
    key = key === 'listenPort' ? 'listen-port' : key
    key = key === 'privateKey' ? 'private-key' : key

    if (key === 'private-key') {
      file = await tempFile.save(stringVal)
      stringVal = file.path
    }

    configString += ` ${key} ${stringVal}`
  }

  try {
    await exec(`wg set ${configString}`)
    log('debug', ['wireguard', 'setConfig', 'successfully set config for', wgInterface])
  } catch (error) {
    log('error', ['wireguard', 'setConfig', 'failed to set config for', wgInterface, 'error', error.message])
    throw error
  } finally {
    if (typeof file !== 'undefined') await file.delete()
  }
}

setConfig('wg0', {
  fwmark: 'off',
  listenPort: 20227,
  privateKey: 'YA/ON7SSmVsYk+PKXHX8ayryerilzCUJDiOEMATmh2k='
}).then(console.log).catch(console.error)
export interface AddPeersOptions {
  base64PublicKey: string
  presharedKey?: string
}

export interface PeerConfigOptions {
  listenPort?: string
  fwmark?: string
  privateKey?: string
}

export async function addPeer (options: AddPeersOptions): Promise<void> {
  // TODO: Create addPeer()
}

export async function deletePeer (base64PublicKey: string): Promise<void> {
  // TODO: Create deletePeer()
}

// Options:
// set <interface> [listen-port <port>] [fwmark <fwmark>] [private-key <file-path>] [peer <base64-public-key> [remove] [preshared-key <file-path>] [endpoint <ip>:<port>]
// [persistent-keepalive  <interval seconds>] [allowed-ips <ip1>/<cidr1>[,<ip2>/<cidr2>]...] ]...
