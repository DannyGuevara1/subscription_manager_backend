import express from 'express'
import { UserController } from '@/api/components/user/user.controller.ts'
//Router
const router = express.Router()
const user = new UserController()

// User Router
router.get('/', (req, res) => {
    res.send('Get all users')
})

router.get('/:id', user.getUserById.bind(user))

router.post('/', user.createUser.bind(user))

router.put('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Update user ${id}`)
})

router.delete('/:id', (req, res) => {
    const { id } = req.params
    res.send(`Delete user ${id}`)
})

export default router