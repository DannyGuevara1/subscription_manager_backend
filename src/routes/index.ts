// src/routes/index.ts
import express, { type Router } from 'express';
import { containerPromise } from '@/container/container.js';

const container = await containerPromise;

const userRouter = container.resolve<express.Router>('userRoutes');
const currencyRouter = container.resolve<express.Router>('currencyRoutes');
const subscriptionRouter =
	container.resolve<express.Router>('subscriptionRoutes');
const categoryRouter = container.resolve<express.Router>('categoryRoutes');
const authRouter = container.resolve<express.Router>('authRoutes');

const v1: Router = express.Router();

v1.use('/users', userRouter);
v1.use('/currencies', currencyRouter);
v1.use('/subscriptions', subscriptionRouter);
v1.use('/categories', categoryRouter);
v1.use('/auth', authRouter);

export default v1;
