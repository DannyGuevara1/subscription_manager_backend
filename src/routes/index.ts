// src/routes/index.ts
import express, { type Router } from 'express';
import { authMiddleware } from '@/modules/auth/index.js';
import { containerPromise } from '@/shared/container/container.js';

const container = await containerPromise;

const userRouter = container.resolve<express.Router>('userRoutes');
const currencyRouter = container.resolve<express.Router>('currencyRoutes');
const subscriptionRouter =
	container.resolve<express.Router>('subscriptionRoutes');
const categoryRouter = container.resolve<express.Router>('categoryRoutes');
const authRouter = container.resolve<express.Router>('authRoutes');

const v1: Router = express.Router();

v1.use('/users', authMiddleware, userRouter);
v1.use('/currencies', authMiddleware, currencyRouter);
v1.use('/subscriptions', authMiddleware, subscriptionRouter);
v1.use('/categories', authMiddleware, categoryRouter);
v1.use('/auth', authRouter);
export default v1;
