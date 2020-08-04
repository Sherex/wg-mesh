import { exec } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const execP = promisify(exec)

type ShowNotInstalledTypes = Array<'wg' | 'ip'>

export async function checkPrerequisites (): Promise<void> {
  const errorIn: ShowNotInstalledTypes = []
  try {
    await execP('wg version')
    log('debug', ['check-prerequisites', 'wireguard is installed'])
  } catch (error) {
    log('error', ['check-prerequisites', 'wireguard is NOT installed'])
    errorIn.push('wg')
  }

  try {
    await execP('ip -Version')
    log('debug', ['check-prerequisites', 'iproute2 is installed'])
  } catch (error) {
    log('error', ['check-prerequisites', 'iproute2 is NOT installed'])
    errorIn.push('ip')
  }

  showNotInstalled(errorIn)
  if (errorIn.length > 0) process.exit(1)
}

function showNotInstalled (types: ShowNotInstalledTypes): void {
  if (types.includes('wg')) {
    console.log(`
    ############### WIREGUARD IS NOT INSTALLED ###############
    It looks like you haven't installed Wireguard yet.
    I could at least not find the command 'wg'.
    To install Wireguard head on over to:
    
    https://www.wireguard.com/install/

    Then follow the instructions for your OS/Distro.
    ##########################################################
    `.replace(/^ */gm, ''))
  }

  if (types.includes('ip')) {
    console.log(`
    ############### IPROUTE2 IS NOT INSTALLED ################
    I can't find the command 'ip', currently this
    software supports only 'iproute2'.
    
    Check if your OS/Distro has the package 'iproute2'.
    ##########################################################
    `.replace(/^ */gm, ''))
  }
}
