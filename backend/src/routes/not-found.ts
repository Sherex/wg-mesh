import { Router } from 'express'

const notFoundRouter = Router()

notFoundRouter.get('/', (req, res) => {
  res.status(404).send(`
    <h1>WG-Mesh</h1>
    <h3>404 - No kittens here!</h3>
  `)
})

export {
  notFoundRouter
}
