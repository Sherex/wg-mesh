import { Router } from 'express'

const peersRouter = Router()

peersRouter.get('/', (req, res) => {
  res.send({
    message: 'Hello and welcome!'
  })
})

peersRouter.get('/:id', (req, res) => {
  console.log(`Peer: ${req.params.id}`)
  res.send({
    message: 'Hello and welcome!'
  })
})

export {
  peersRouter
}
