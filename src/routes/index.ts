// src/routes/index.ts
import express, { type Router } from 'express';
import { authMiddleware } from '@/modules/auth/index.js';
import { containerPromise } from '@/shared/container/container.js';

const container = await containerPromise;

const userRouter = container.cradle.userRoutes;
const currencyRouter = container.cradle.currencyRoutes;
const subscriptionRouter = container.cradle.subscriptionRoutes;
const categoryRouter = container.cradle.categoryRoutes;
const authRouter = container.cradle.authRoutes;

const v1: Router = express.Router();

v1.get('/health', (_req, res) => {
	res.status(200).json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

v1.use('/users', authMiddleware, userRouter);
v1.use('/currencies', authMiddleware, currencyRouter);
v1.use('/subscriptions', authMiddleware, subscriptionRouter);
v1.use('/categories', authMiddleware, categoryRouter);
v1.use('/auth', authRouter);
export default v1;
