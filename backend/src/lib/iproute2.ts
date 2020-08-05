import { exec } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const execP = promisify(exec)

const validInterface = (name: string): boolean => /^wg\d+$/.test(name)

export async function createInterface (name: string): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['iproute2', 'createInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['iproute2', 'createInterface', 'creating interface', name])
  try {
    await execP(`ip link add dev ${name} type wireguard`)
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
  if (!validInterface(name)) {
    log('error', ['iproute2', 'deleteInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['iproute2', 'deleteInterface', 'deleting interface', name])
  try {
    await execP(`ip link delete ${name}`)
    log('info', ['iproute2', 'deleteInterface', 'successfully deleted interface', name])
    return
  } catch (error) {
    if (error.stderr.includes('Cannot find device') as boolean) {
      log('debug', ['iproute2', 'createInterface', 'interface is already deleted'])
      return
    }
    log('error', ['iproute2', 'deleteInterface', 'failed to delete interface', name, 'error', error])
    throw error
  }
}
