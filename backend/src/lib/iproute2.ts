import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const exec = promisify(execCallback)

const validWgInterface = (name: string): boolean => /^wg\d+$/.test(name)
const validInterface = (name: string): boolean => /^[a-z0-9]+$/i.test(name)

export async function createInterface (name: string): Promise<void> {
  if (!validWgInterface(name)) {
    log('error', ['iproute2', 'createInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['iproute2', 'createInterface', 'creating interface', name])
  try {
    await exec(`ip link add dev ${name} type wireguard`)
    log('info', ['iproute2', 'createInterface', 'successfully created interface', name])
    return
  } catch (error) {
    if (error.stderr.includes('File exists') as boolean) {
      log('debug', ['iproute2', 'createInterface', 'interface already exists'])
      return
    }
    log('error', ['iproute2', 'createInterface', 'failed to create interface', name, 'error', error])
    throw error
  }
}

export async function deleteInterface (name: string): Promise<void> {
  if (!validWgInterface(name)) {
    log('error', ['iproute2', 'deleteInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['iproute2', 'deleteInterface', 'deleting interface', name])
  try {
    await exec(`ip link delete ${name}`)
    log('info', ['iproute2', 'deleteInterface', 'successfully deleted interface', name])
    return
  } catch (error) {
    if (error.stderr.includes('Cannot find device') as boolean) {
      log('debug', ['iproute2', 'deleteInterface', 'interface is already deleted'])
      return
    }
    log('error', ['iproute2', 'deleteInterface', 'failed to delete interface', name, 'error', error])
    throw error
  }
}

export async function getInterfaces (): Promise<ShowIpAddress[]> {
  log('debug', ['iproute2', 'getInterfaces', 'getting interfaces'])
  try {
    const { stdout } = await exec('ip -json address')
    const output = JSON.parse(stdout) as ShowIpAddress[]
    log('info', ['iproute2', 'getInterfaces', 'successfully got interfaces'])
    return output
  } catch (error) {
    log('error', ['iproute2', 'getInterfaces', 'failed to get interfaces'])
    throw error
  }
}

export async function getInterface (name: string): Promise<ShowIpAddress | null> {
  if (!validInterface(name)) {
    log('error', ['iproute2', 'getInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  const ipInterfaces = await getInterfaces()
  const ipInterface = ipInterfaces.filter(int => int.ifname === name)
  if (ipInterface.length < 1) return null
  if (ipInterface.length > 1) {
    log('warn', ['iproute2', 'getInterface', 'got more than one interface', 'returning first interface'])
  }
  return ipInterface[0]
}

export interface AddrInfo {
  family: string
  local: string
  prefixlen: number
  scope: string
  label: string
  valid_life_time: any
  preferred_life_time: any
  broadcast: string
  dynamic?: boolean
  noprefixroute?: boolean
}

export interface ShowIpAddress {
  ifindex: number
  ifname: string
  flags: string[]
  mtu: number
  qdisc: string
  operstate: string
  group: string
  txqlen: number
  link_type: string
  address: string
  broadcast: string
  addr_info: AddrInfo[]
}
