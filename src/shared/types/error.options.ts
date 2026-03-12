// src/types/error.options.ts

export interface BaseErrorOptions {
	detail?: string;
	instance?: string;
	isOperational?: boolean;
	extensions?: Record<string, any>;
	stack?: string;
}

export interface ValidationOptions extends BaseErrorOptions {
	detail: string; // Obligatorio para un error de validación útil.
	field?: string;
	value?: any;
	constraint?: string;
}

export interface NotFoundOptions extends BaseErrorOptions {
	resource?: string;
	identifier?: string | number;
	metadata?: {
		service?: string;
		version?: string;
		environment?: string;
		[key: string]: any;
	};
}

export interface InternalErrorOptions extends BaseErrorOptions {
	originalError?: Error;
	errorCode?: string;
	context?: {
		userId?: string;
		requestId?: string;
		operation?: string;
		timestamp?: string;
		severity?: 'low' | 'medium' | 'high' | 'critical';
	};
	metadata?: {
		service?: string;
		version?: string;
		errorType?: string;
		environment?: string;
		restartRequired?: boolean;
	};
}

export interface ConflictOptions extends BaseErrorOptions {
	resource?: string;
	identifier?: string | number;
	metadata?: Record<string, any>;
}

export type UnauthorizedOptions = BaseErrorOptions;

export type ForbiddenOptions = BaseErrorOptions;

export type UnprocessableEntityOptions = BaseErrorOptions;
