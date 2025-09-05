import express from 'express'
import { PrismaClient } from '../generated/prisma/client.js'
import 'dotenv/config'

const app = express()
app.use(express.json())

const prisma = new PrismaClient()

const PORT = process.env.PORT || 3000

app.get('/ping', (req, res) => {
    res.send('ping')
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})