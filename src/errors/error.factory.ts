// src/errors/error.factory.ts
import { AppError } from '@/errors/app.error.js';
import type * as ErrorOptions from '@/types/error.options.js';
import { ProblemTypes } from '@/types/problem.types.js';

type ProblemTypeKey = keyof typeof ProblemTypes;

export class ErrorFactory {
	static createError(
		typeKey: ProblemTypeKey,
		options: {
			detail?: string;
			instance?: string;
			extensions?: Record<string, any>;
			isOperational?: boolean;
			stack?: string;
		} = {},
	): AppError {
		const baseProblem = ProblemTypes[typeKey];

		if (!baseProblem) {
			throw new TypeError(
				`El tipo de problema "${typeKey}" no existe en ProblemTypes.`,
			);
		}

		const problemDetails = {
			...baseProblem, // type, title, status
			detail: options.detail,
			instance: options.instance,
			extensions: {
				...options.extensions,
			},
			stack: options.stack,
		};

		return new AppError(problemDetails, options.isOperational);
	}

	/**
	 * Helper para errores de validación con una API consistente.
	 */
	static validationError(options: ErrorOptions.ValidationOptions): AppError {
		const {
			detail,
			instance,
			isOperational,
			field,
			value,
			constraint,
			stack,
			...rest
		} = options;

		const extensions = { field, value, constraint, ...(rest.extensions || {}) };

		return ErrorFactory.createError('VALIDATION_ERROR', {
			detail,
			instance,
			isOperational,
			extensions: Object.values(extensions).some((v) => v !== undefined)
				? extensions
				: undefined,
			stack,
		});
	}

	/**
	 * Helper para recursos no encontrados con API consistente.
	 */
	static notFoundError(options: ErrorOptions.NotFoundOptions): AppError {
		const { resource, identifier, instance, isOperational, stack, ...rest } =
			options;

		return ErrorFactory.createError('RESOURCE_NOT_FOUND', {
			instance,
			isOperational,
			extensions: {
				resource,
				identifier,
				...(rest.extensions || {}),
			},
			stack,
		});
	}

	/**
	 * Helper para errores internos con API consistente.
	 */
	static internalError(options: ErrorOptions.InternalErrorOptions): AppError {
		const {
			detail,
			instance,
			isOperational = false,
			originalError,
			errorCode,
			context,
			stack,
			metadata,
			...rest
		} = options;
		// Generar un código de error único si no se proporciona uno
		const finalErrorCode =
			errorCode ||
			`INT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		return ErrorFactory.createError('INTERNAL_SERVER_ERROR', {
			detail,
			instance,
			isOperational,
			extensions: {
				errorCode: finalErrorCode,
				originalErrorName: originalError?.name,
				originalErrorMessage: originalError?.message,
				context,
				metadata,
				...(rest.extensions || {}),
			},
			stack,
		});
	}

	/**
	 * Helper para errores de conflicto con API consistente.
	 */
	static conflictError(options: ErrorOptions.ConflictOptions): AppError {
		const {
			detail,
			resource,
			identifier,
			instance,
			isOperational,
			stack,
			...rest
		} = options;

		const finalDetail =
			detail || 'Se ha detectado un conflicto en la operación solicitada.';

		return ErrorFactory.createError('CONFLICT', {
			detail: finalDetail,
			instance,
			isOperational,
			extensions: {
				resource,
				identifier,
				...(rest.metadata || {}),
				...(rest.extensions || {}),
			},
			stack,
		});
	}

	/**
	 * Helper para errores de no autorizado con API consistente.
	 */
	static unauthorizedError(
		options: ErrorOptions.UnauthorizedOptions = {},
	): AppError {
		const { detail, instance, isOperational = true, stack, ...rest } = options;

		const finalDetail =
			detail || 'No está autorizado para acceder a este recurso.';

		return ErrorFactory.createError('UNAUTHORIZED', {
			detail: finalDetail,
			instance,
			isOperational,
			extensions: {
				...(rest.extensions || {}),
			},
			stack,
		});
	}
}
