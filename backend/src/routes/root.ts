import { Router } from 'express'

const rootRouter = Router()

rootRouter.get('/', (req, res) => {
  res.send(`
    <h1>WG-Mesh</h1>
    <a href="api/v1/peers">api/v1/peers</a>
  `)
})

export {
  rootRouter
}
