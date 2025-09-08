import { Router } from 'express'

//Router
const router = Router()

// Category Router
router.get('/', (req, res) => {
    res.send('Get all categories')
})

router.get('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Get category ${id}`)
})

router.post('/', (req, res) => {
    res.send('Create category')
})

router.put('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Update category ${id}`)
})

router.delete('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Delete category ${id}`)
})

export default router