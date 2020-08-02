import express from 'express'
import v1Peers from './v1-peers'
import v1Clients from './v1-clients'

const app = express()

app.use('/api/v1/peers', v1Peers)
app.use('/api/v1/clients', v1Clients)
