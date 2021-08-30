import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'
import { validWgInterface } from './iproute2'
import * as tempFile from './temp-file'

const exec = promisify(execCallback)

const hostKeyString = 'interface\tprivateKey\tpublicKey\tlistenPort\tfwmark'
const peerKeyString = 'interface\tpublicKey\tpresharedKey\tendpoint\tallowedIps\tlatestHandshake\ttransferRx\ttransferTx\tpersistentKeepalive'

export interface WGInfo {
  interface: string
  privateKey: string
  publicKey: string
  listenPort: string
  fwmark: string
  peers?: PeerInfo[]
}

export interface PeerInfo {
  interface: string
  publicKey: string
  presharedKey: string
  endpoint: string
  allowedIps: string[]
  latestHandshake: number
  transferRx: number
  transferTx: number
  persistentKeepalive: number
}

export async function getInfo (): Promise<WGInfo[]> {
  const returnInfo: WGInfo[] = []
  try {
    const output = await exec('wg show all dump')
    log('debug', ['wireguard', 'getWGInfo', 'successfully got information for host'])

    if (output.stdout === '') return returnInfo

    const infoLines = output.stdout.split('\n').filter(line => line !== '')
    infoLines.forEach(line => {
      const wgInterface = parseString(line, 'host') as WGInfo | null
      if (wgInterface !== null) {
        returnInfo.push(wgInterface)
      } else {
        const peer = parseString(line, 'peer') as PeerInfo | null
        if (peer === null) {
          log('debug', ['wireguard', 'getWGInfo', 'failed to parse peer'])
          return
        }

        const intIndex = returnInfo.findIndex(info => info.interface === peer.interface)
        log('debug', ['wireguard', 'getWGInfo', 'intIndex', intIndex])
        if (intIndex === -1) {
          throw new Error('Couldn\'t find peer interface info')
        }

        const returnInt = returnInfo[intIndex]
        if (typeof returnInt.peers === 'undefined') {
          returnInt.peers = [peer]
        } else {
          returnInt.peers.push(peer)
        }
      }
    })

    return returnInfo
  } catch (error) {
    log('error', ['wireguard', 'getWGInfo', 'failed to get information for host', 'error', error.message])
    throw error
  }
}

function parseString (valueString: string, type: 'host' | 'peer' = 'host'): WGInfo | PeerInfo | null {
  const keyString = type === 'host' ? hostKeyString : peerKeyString

  const parsedInfo: {[key: string]: string | number | string[] | null} = {}
  const values = valueString.split('\t')
  const keys = keyString.split('\t')

  if (keys.length !== values.length) {
    log('silly', ['wireguard', 'parseString', 'early return', 'unequal length'])
    return null
  }

  keys.forEach((key, i) => {
    let value: string | number | string[] | null = values[i] === '(none)' || values[i] === '' ? null : values[i]
    if (['latestHandshake', 'transferRx', 'transferTx', 'persistentKeepalive'].includes(key)) value = Number(value)
    else if (key === 'allowedIps' && typeof value === 'string') value = value.split(',')
    parsedInfo[key] = value
  })

  if (isWGInfo(parsedInfo)) {
    return parsedInfo as WGInfo
  } else if (isPeerInfo(parsedInfo)) {
    return parsedInfo as PeerInfo
  }
  return null
}

export function isWGInfo (data: any): data is WGInfo {
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

export async function setConfig (wgInterface: string, options?: ConfigOptions): Promise<void> {
  if (!validWgInterface(wgInterface)) {
    log('error', ['wireguard', 'setConfig', 'wrong format on interface name', 'got', wgInterface, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  let configString: string = wgInterface
  let file

  if (typeof options === 'object') {
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

export interface AddPeersOptions {
  peerPublicKey: string
  presharedKey?: string
  endpoint?: string
  persistentKeepalive?: number
  allowedIps?: string[]
}

export interface PeerConfigOptions {
  listenPort?: string
  fwmark?: string
  privateKey?: string
}

export async function addPeer (wgInterface: string, options: AddPeersOptions): Promise<void> {
  if (!validWgInterface(wgInterface)) {
    log('error', ['wireguard', 'addPeer', 'wrong format on interface name', 'got', wgInterface, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }

  const { configString, files } = await optionsToCli(options)

  try {
    await exec(`wg set ${wgInterface} ${configString}`)
    log('debug', ['wireguard', 'addPeer', 'successfully added peer for', wgInterface])
  } catch (error) {
    log('error', ['wireguard', 'addPeer', 'failed to add peer for', wgInterface, 'error', error.message])
    throw error
  } finally {
    if (files.length > 0) await Promise.all(files.map(async file => await file.delete()))
  }
}

export async function deletePeer (wgInterface: string, peerPublicKey: string): Promise<void> {
  if (!validWgInterface(wgInterface)) {
    log('error', ['wireguard', 'deletePeer', 'wrong format on interface name', 'got', wgInterface, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  try {
    await exec(`wg set ${wgInterface} peer ${peerPublicKey} remove`)
  } catch (error) {
    log('error', ['wireguard', 'deletePeer', 'failed to delete peer for', wgInterface, 'error', error.message])
  }
}

interface OptionsToCliReturn {
  files: tempFile.TempFileHandler[]
  configString: string
}

async function optionsToCli (options: Object): Promise<OptionsToCliReturn> {
  const files: tempFile.TempFileHandler[] = []
  let configString: string = ''
  for (let [key, value] of Object.entries(options)) {
    let stringVal = String(value)
    key = key.replace(/([A-Z])/g, '-$1').toLowerCase()

    if (['private-key', 'preshared-key'].includes(key)) {
      const file = await tempFile.save(stringVal)
      stringVal = file.path
      files.push(file)
    }

    if (key === 'peer-public-key') {
      key = 'peer'
    }

    configString += ` ${key} ${stringVal}`
  }
  return {
    files,
    configString: configString.trim()
  }
}
