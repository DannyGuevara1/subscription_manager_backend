// src/middleware/error.normalizer.ts

import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '@/shared/errors/app.error.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';
import {
	handlePrismaClientInitializationError,
	handlePrismaClientRustPanicError,
	handlePrismaClientUnknownRequestError,
	handlePrismaKnownRequestError,
	handlePrismaValidationError,
} from '@/shared/errors/prisma.error.js';

/**
 * Error Normalizer Middleware
 *
 * Su trabajo es convertir CUALQUIER error en un AppError estándar
 * para que el siguiente middleware {@file @/middleware/error.handler.ts} en la cadena siempre reciba
 * un formato consistente.
 */
export const errorNormalizer = (
	err: unknown,
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	// Si ya es un AppError, simplemente pásalo al siguiente middleware.
	if (err instanceof AppError) return next(err);

	// Manejo de errores de validación de Zod
	if (err instanceof z.ZodError) {
		const normalizedError = ErrorFactory.validationError({
			detail: 'La validación de los datos de entrada ha fallado.',
			instance: req.originalUrl,
			extensions: {
				validationErrors: z.flattenError(err),
			},
		});
		return next(normalizedError);
	}

	if (err instanceof Prisma.PrismaClientValidationError) {
		const prismaValidationError = handlePrismaValidationError(
			err,
			req.originalUrl,
		);
		return next(prismaValidationError);
	}

	if (err instanceof Prisma.PrismaClientInitializationError) {
		const prismaInitError = handlePrismaClientInitializationError(
			err,
			req.originalUrl,
		);
		return next(prismaInitError);
	}

	if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		const prismaUnknownError = handlePrismaClientUnknownRequestError(
			err,
			req.originalUrl,
		);
		return next(prismaUnknownError);
	}

	if (err instanceof Prisma.PrismaClientRustPanicError) {
		const prismaRustPanicError = handlePrismaClientRustPanicError(
			err,
			req.originalUrl,
		);
		return next(prismaRustPanicError);
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		const prismaKnownError = handlePrismaKnownRequestError(
			err,
			req.originalUrl,
		);
		//console.log(prismaKnownError.extensions);
		return next(prismaKnownError);
	}

	// Si es un error genérico de JavaScript, conviértelo en un AppError de tipo INTERNAL_SERVER_ERROR
	if (err instanceof Error) {
		const internalError = ErrorFactory.internalError({
			detail: err.message || 'Se ha producido un error interno en el servidor.',
			instance: req.originalUrl,
			isOperational: false,
			originalError: err,
			context: {
				operation: `${req.method} ${req.originalUrl}`,
				timestamp: new Date().toISOString(),
			},
			stack: err.stack,
		});
		return next(internalError);
	}
};
