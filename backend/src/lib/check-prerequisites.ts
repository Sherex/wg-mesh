import { exec as execCallback } from 'child_process'
import { promisify } from 'util'
import { log } from './logger'

const exec = promisify(execCallback)

export async function checkPrerequisites (): Promise<void> {
  try {
    await exec('ip -Version')
    log('debug', ['check-prerequisites', 'iproute2 is installed'])
  } catch (error) {
    console.log(`
      ############### IPROUTE2 IS NOT INSTALLED ################
      I can't find the command 'ip', currently this
      software supports only 'iproute2'.
      
      Check if your OS/Distro has the package 'iproute2'.
      ##########################################################
    `.replace(/^ */gm, ''))
    process.exit(1)
  }

  try {
    await exec('wg version')
    log('debug', ['check-prerequisites', 'wireguard is installed'])
  } catch (error) {
    console.log(`
      ############### WIREGUARD IS NOT INSTALLED ###############
      It looks like you haven't installed Wireguard yet.
      I could at least not find the command 'wg'.
      To install Wireguard head on over to:
      
      https://www.wireguard.com/install/

      Then follow the instructions for your OS/Distro.
      ##########################################################
    `.replace(/^ */gm, ''))
    process.exit(1)
  }
}

checkPrerequisites().catch(console.error)
