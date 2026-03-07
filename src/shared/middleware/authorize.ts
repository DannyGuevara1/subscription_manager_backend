import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { forbiddenError } from '@/shared/errors/error.factory.js';

export const authorize = (...allowedRoles: Role[]) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const userRole = req.user?.role as Role | undefined;

		if (!userRole || !allowedRoles.includes(userRole)) {
			return next(
				forbiddenError({
					detail:
						'No tiene los permisos necesarios para acceder a este recurso.',
					instance: req.originalUrl,
				}),
			);
		}
		next();
	};
};
