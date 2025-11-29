// src/errors/prisma.error.ts
import type {
	PrismaClientInitializationError,
	PrismaClientKnownRequestError,
	PrismaClientRustPanicError,
	PrismaClientUnknownRequestError,
	PrismaClientValidationError,
} from '@prisma/client/runtime/library.js';
import type { AppError } from '@/shared/errors/app.error.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';

/**
 * The function `handlePrismaValidationError` handles Prisma client validation errors by creating an
 * AppError with the error message and optional instance.
 * @param {PrismaClientValidationError} err - The `err` parameter is of type
 * `PrismaClientValidationError`, which is an error object thrown by Prisma Client when a validation
 * error occurs during database operations.
 * @param {string} [instance] - The `instance` parameter in the `handlePrismaValidationError` function
 * is an optional parameter that represents the specific instance or context where the validation error
 * occurred. It can be used to provide additional information about the error, such as the name of the
 * entity or resource that the validation error is related to.
 * @returns An `AppError` object is being returned.
 */
export const handlePrismaValidationError = (
	err: PrismaClientValidationError,
	instance?: string,
): AppError => {
	return ErrorFactory.validationError({
		detail: err.message,
		instance,
		isOperational: false,
		stack: err.stack,
	});
};

export const handlePrismaClientInitializationError = (
	err: PrismaClientInitializationError,
	instance?: string,
): AppError => {
	return ErrorFactory.internalError({
		detail: err.message,
		instance,
		isOperational: false,
		errorCode: err.errorCode,
		metadata: {
			service: 'PRISMA',
			errorType: 'PrismaClientInitializationError',
			version: err.clientVersion,
		},
		stack: err.stack,
	});
};

export const handlePrismaClientUnknownRequestError = (
	err: PrismaClientUnknownRequestError,
	instance?: string,
): AppError => {
	return ErrorFactory.internalError({
		detail: err.message,
		instance,
		isOperational: false,
		stack: err.stack,
		context: {
			operation: 'database query',
			timestamp: new Date().toISOString(),
		},
		metadata: {
			service: 'PRISMA',
			errorType: 'PrismaClientUnknownRequestError',
			version: err.clientVersion,
		},
	});
};

export const handlePrismaClientRustPanicError = (
	err: PrismaClientRustPanicError,
	instance?: string,
): AppError => {
	return ErrorFactory.internalError({
		detail: err.message,
		instance,
		isOperational: false,
		stack: err.stack,
		errorCode: 'PRISMA_RUST_PANIC',
		context: {
			operation: 'database_engine_operation',
			timestamp: new Date().toISOString(),
			severity: 'critical',
		},
		metadata: {
			service: 'PRISMA',
			errorType: 'PrismaClientRustPanicError',
			version: err.clientVersion,
			restartRequired: true,
		},
	});
};

export const handlePrismaKnownRequestError = (
	err: PrismaClientKnownRequestError,
	instance?: string,
): AppError => {
	switch (err.code) {
		case 'P2002': {
			// Unique constraint failed
			const conflictField =
				(err.meta?.target as string[])?.join(', ') || 'campo';

			// Creamos un mensaje de detalle mucho más claro y amigable
			const detail = `El valor proporcionado para el campo '${conflictField}' ya está en uso. Por favor, utilice un valor diferente.`;
			return ErrorFactory.conflictError({
				detail,
				instance,
				isOperational: true,
				extensions: {
					...err.meta,
					service: 'PRISMA',
					errorType: 'PrismaClientKnownRequestError',
					version: err.clientVersion,
				},
				stack: err.stack,
			});
		}
		case 'P2003': {
			// Foreign key constraint failed
			const fieldName =
				(err.meta?.constraint as string) ||
				'(constraint no expuesta por Prisma en PostgreSQL)';
			const detail = `Violación de clave foránea. ${fieldName}. Verifique que el ID relacionado exista o elimine primero las dependencias.`;

			return ErrorFactory.conflictError({
				detail,
				instance,
				isOperational: true,
				extensions: {
					...err.meta,
					service: 'PRISMA',
					errorType: 'PrismaClientKnownRequestError',
					version: err.clientVersion,
				},
				stack: err.stack,
			});
		}

		case 'P2025': // Record not found
			return ErrorFactory.notFoundError({
				instance,
				isOperational: true,
				metadata: {
					service: 'PRISMA',
					errorType: 'PrismaClientKnownRequestError',
					version: err.clientVersion,
				},
				stack: err.stack,
			});
		default:
			return ErrorFactory.internalError({
				detail: err.message,
				instance,
				isOperational: false,
				originalError: err,
				errorCode: err.code,
				metadata: {
					...err.meta,
					service: 'PRISMA',
					errorType: 'PrismaClientKnownRequestError',
					version: err.clientVersion,
				},
				stack: err.stack,
			});
	}
};
