import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { authorize } from '@/shared/middleware/authorize.js';

export const DASHBOARD_PATH = '/dashboard';

export default function dashboardRoutes(): ExpressRouter {
	const router = Router();

	// GET
	router.get('/summary', authorize('ADMIN', 'USER'));

	return router;
}
