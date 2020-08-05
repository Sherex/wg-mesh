import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const exec = promisify(execCallback)

const validWgInterface = (name: string): boolean => /^wg\d+$/.test(name)
const validInterface = (name: string): boolean => /^[a-z0-9]+$/i.test(name)
const validIPv4 = (ip: string): boolean => /^(?:\d{1,3}\.){3}\d{1,3}\/\d{2}$/m.test(ip)

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
      log('warn', ['iproute2', 'createInterface', 'interface already exists'])
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
      log('warn', ['iproute2', 'deleteInterface', 'interface is already deleted'])
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
    log('error', ['iproute2', 'getInterface', 'wrong format on interface name', 'got', name])
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

export async function addIp (name: string, ip: string): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['iproute2', 'addIp', 'wrong format on interface name', 'got', name])
    throw Error('Wrong format on interface name')
  }
  if (!validIPv4(ip)) {
    log('error', ['iproute2', 'addIp', 'wrong format on IP address', 'got', ip, 'expected', 'xxx.xxx.xxx.xxx/xx'])
    throw Error('Wrong format on interface IP')
  }
  try {
    await exec(`ip address add dev ${name} ${ip}`)
    log('info', ['iproute2', 'addIp', 'successfully added an IP to', name, 'IP', ip])
    return
  } catch (error) {
    if (error.stderr.includes('File exists') as boolean) {
      log('warn', ['iproute2', 'addIp', 'ip exists already on interface', name, 'IP', ip])
      return
    }
    log('error', ['iproute2', 'addIp', 'failed to add the IP to the interface', name, 'IP', ip, 'error', error])
    throw error
  }
}

export async function deleteIp (name: string, ip: string): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['iproute2', 'deleteIp', 'wrong format on interface name', 'got', name])
    throw Error('Wrong format on interface name')
  }
  if (!validIPv4(ip)) {
    log('error', ['iproute2', 'deleteIp', 'wrong format on IP address', 'got', ip, 'expected', 'xxx.xxx.xxx.xxx/xx'])
    throw Error('Wrong format on interface IP')
  }
  try {
    await exec(`ip address delete dev ${name} ${ip}`)
    log('info', ['iproute2', 'deleteIp', 'successfully deleted an IP from', name, 'IP', ip])
    return
  } catch (error) {
    if (error.stderr.includes('Cannot assign requested address') as boolean) {
      log('warn', ['iproute2', 'deleteIp', 'ip does not exist on interface', name, 'IP', ip])
      return
    }
    log('error', ['iproute2', 'deleteIp', 'failed to delete the IP from the interface', name, 'IP', ip, 'error', error])
    throw error
  }
}

export async function setInterfaceState (name: string, state: 'up' | 'down'): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['iproute2', 'setInterfaceState', 'wrong format on interface name', 'got', name])
    throw Error('Wrong format on interface name')
  }
  if (state !== 'up' && state !== 'down') {
    log('error', ['iproute2', 'setInterfaceState', 'wrong state', 'state has to be either up or down', 'got', state])
    throw Error('Wrong format on state')
  }
  try {
    await exec(`ip link set ${name} ${state}`)
    log('info', ['iproute2', 'setInterfaceState', 'successfully set the state of', name, 'to', state])
    return
  } catch (error) {
    log('error', ['iproute2', 'setInterfaceState', 'failed to set the state of', name, 'to', state])
    throw error
  }
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
