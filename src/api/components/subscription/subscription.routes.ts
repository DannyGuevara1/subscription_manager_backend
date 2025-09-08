import { Router } from 'express'

//Router
const router = Router()

// Subscription Router
router.get('/', (req, res) => {
    res.send('Get all subscriptions')
})

router.get('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Get subscription ${id}`)
})

router.post('/', (req, res) => {
    res.send('Create subscription')
})

router.put('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Update subscription ${id}`)
})

router.delete('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Delete subscription ${id}`)
})

export default router