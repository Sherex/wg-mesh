import { exec } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const execP = promisify(exec)

const validInterface = (name: string): boolean => /^wg\d+$/.test(name)

export async function createInterface (name: string): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['wireguard', 'createInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['wireguard', 'createInterface', 'creating interface', name])
  try {
    await execP(`ip link add dev ${name} type wireguard`)
    log('info', ['wireguard', 'createInterface', 'successfully created interface', name])
    return
  } catch (error) {
    if (error.stderr.includes('File exists') as boolean) {
      log('debug', ['wireguard', 'createInterface', 'interface already exists'])
      return
    }
    log('error', ['wireguard', 'createInterface', 'failed to create interface', name, 'error', error])
    throw error
  }
}

export async function deleteInterface (name: string): Promise<void> {
  if (!validInterface(name)) {
    log('error', ['wireguard', 'deleteInterface', 'wrong format on interface name', 'got', name, 'expected', 'wg0..wgn'])
    throw Error('Wrong format on interface name')
  }
  log('debug', ['wireguard', 'deleteInterface', 'deleting interface', name])
  try {
    await execP(`ip link delete ${name}`)
    log('info', ['wireguard', 'deleteInterface', 'successfully deleted interface', name])
    return
  } catch (error) {
    if (error.stderr.includes('Cannot find device') as boolean) {
      log('debug', ['wireguard', 'createInterface', 'interface is already deleted'])
      return
    }
    log('error', ['wireguard', 'deleteInterface', 'failed to delete interface', name, 'error', error])
    throw error
  }
}
