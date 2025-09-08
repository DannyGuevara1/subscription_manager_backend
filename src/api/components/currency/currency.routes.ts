import { Router } from "express";

//Router
const router = Router();

// Currency Router
router.get('/', (req, res) => {
    res.send('Get all currencies');
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    res.send(`Get currency ${id}`);
});

router.post('/', (req, res) => {
    res.send('Create currency');
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    res.send(`Update currency ${id}`);
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    res.send(`Delete currency ${id}`);
});

export default router;
