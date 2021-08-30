import express from 'express'
import { rootRouter } from './root.js'
import { notFoundRouter } from './not-found.js'
import { peersRouter } from './peers.js'
const app = express()

app.use('/', rootRouter)
app.use('/api/v1/peers', peersRouter)
app.use('/*', notFoundRouter)

export async function start (port = 80): Promise<void> {
  return await new Promise((resolve, reject) => {
    app.listen(port, '0.0.0.0', () => {
      resolve()
    })
  })
}
