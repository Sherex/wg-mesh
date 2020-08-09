import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import { config } from './config'

const dataPath = config.tempDir

interface TempFileHandler {
  path: string
  get: Function
  delete: Function
}

export async function save (data: string): Promise<TempFileHandler> {
  const fileName = new Date().toISOString()
  const filePath = `${dataPath}/${fileName}`
  await mkdir(dataPath, { recursive: true })
  await writeFile(filePath, data)

  return {
    path: filePath,
    get: async () => await get(filePath),
    delete: async () => await del(filePath)
  }
}

async function get (filePath: string): Promise<string> {
  return await readFile(filePath, 'utf-8')
}

async function del (filePath: string): Promise<void> {
  await unlink(filePath)
}
