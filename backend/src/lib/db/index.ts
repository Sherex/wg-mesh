import { readFile } from 'fs/promises'
import rqlite from 'rqlite-js'
import * as uuid from 'uuid'

const dataApiClient = new rqlite.DataApiClient('http://localhost:4001')

export async function setup (): Promise<void> {
  const schema = await readFile('./src/lib/db/schema.sql', 'utf-8')

  const result = await dataApiClient.execute(schema)

  if (result.hasError() === true) {
    const error = result.getFirstError()
    console.error(error, 'rqlite create tables results contained an error.')
    return
  }
  // We are successful and have results to use from our SQL query.
  console.log(result.toString())
}

export type Platform = 'linux' | 'macos' | 'windows'

export interface CreateNodeOptions {
  name?: string
  platform: Platform
}

export interface CreateNodeReturn {
  id: number
  name?: string
  platform: Platform
  joinToken: string
}

// TODO: IP filtering on join
// TODO: Use SQL escaper or knex.js
// TODO: DRY it up
export async function createNode (options: CreateNodeOptions): Promise<CreateNodeReturn> {
  const result = await dataApiClient.execute(`INSERT INTO node(name, platform) VALUES("${options.name ?? ''}", "${options.platform}")`)

  if (result.hasError() === true) {
    const error = result.getFirstError()
    console.error(error, 'rqlite createNode results contained an error.')
    throw error
  }

  const nodeId = result.get(0).getLastInsertId() as number

  const queryResult = await dataApiClient.query(`SELECT id,name,platform FROM node WHERE id="${nodeId}"`)

  if (queryResult.hasError() === true) {
    const error = queryResult.getFirstError()
    console.error(error, 'rqlite createNode results contained an error.')
    throw error
  }

  const token = uuid.v4() // TODO: Hash before insert

  const tokenResult = await dataApiClient.execute(`INSERT INTO access_token(node_id, token_hash, is_join_token) VALUES("${nodeId}", "${token}", "1")`)

  if (tokenResult.hasError() === true) {
    const error = tokenResult.getFirstError()
    console.error(error, 'rqlite createNode results contained an error.')
    throw error
  }

  return {
    id: nodeId,
    name: queryResult.get(0).get('name'),
    platform: queryResult.get(0).get('platform'),
    joinToken: token
  }
}

export async function getNodes (): Promise<any> {
  const result = await dataApiClient.query('SELECT * FROM node JOIN access_token WHERE node.id = node_id')

  if (result.hasError() === true) {
    const error = result.getFirstError()
    console.error(error, 'rqlite getNodes results contained an error.')
    throw error
  }

  const results = result.toArray()

  return results
}
