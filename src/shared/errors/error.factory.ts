// src/errors/error.factory.ts
import { AppError } from '@/shared/errors/app.error.js';
import type * as ErrorOptions from '@/shared/types/error.options.js';
import { ProblemTypes } from '@/shared/types/problem.types.js';

type ProblemTypeKey = keyof typeof ProblemTypes;

export function createError(
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
			`Problem type "${typeKey}" does not exist in ProblemTypes.`,
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
export function validationError(
	options: ErrorOptions.ValidationOptions,
): AppError {
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

	return createError('VALIDATION_ERROR', {
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
export function notFoundError(options: ErrorOptions.NotFoundOptions): AppError {
	const { resource, identifier, instance, isOperational, stack, ...rest } =
		options;

	return createError('RESOURCE_NOT_FOUND', {
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
export function internalError(
	options: ErrorOptions.InternalErrorOptions,
): AppError {
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
		errorCode || `INT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	return createError('INTERNAL_SERVER_ERROR', {
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
export function conflictError(options: ErrorOptions.ConflictOptions): AppError {
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
		detail || 'A conflict was detected in the requested operation.';

	return createError('CONFLICT', {
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
export function unauthorizedError(
	options: ErrorOptions.UnauthorizedOptions = {},
): AppError {
	const { detail, instance, isOperational = true, stack, ...rest } = options;

	const finalDetail =
		detail || 'You are not authorized to access this resource.';

	return createError('UNAUTHORIZED', {
		detail: finalDetail,
		instance,
		isOperational,
		extensions: {
			...(rest.extensions || {}),
		},
		stack,
	});
}

export function forbiddenError(
	options: ErrorOptions.ForbiddenOptions = {},
): AppError {
	const { detail, instance, isOperational = true, stack, ...rest } = options;

	return createError('ACCESS_FORBIDDEN', {
		detail,
		instance,
		isOperational,
		extensions: {
			...(rest.extensions || {}),
		},
		stack,
	});
}

export function unprocessableEntityError(
	options: ErrorOptions.UnprocessableEntityOptions,
): AppError {
	const { detail, instance, isOperational = true, stack, ...rest } = options;

	return createError('UNPROCESSABLE_ENTITY', {
		detail,
		instance,
		isOperational,
		extensions: {
			...(rest.extensions || {}),
		},
		stack,
	});
}
