// src/types/error.options.ts
export interface ValidationOptions {
	detail: string; // `detail` es obligatorio para un error de validación útil.
	instance?: string;
	isOperational?: boolean;
	extensions?: Record<string, any>;
	field?: string;
	value?: any;
	constraint?: string;
	stack?: string; // Traza de pila personalizada
}

export interface NotFoundOptions {
	resource?: string; // El recurso es obligatorio para saber qué no se encontró.
	identifier?: string | number;
	instance?: string;
	isOperational?: boolean;
	metadata?: {
		service?: string;
		version?: string;
		environment?: string;
		[key: string]: any;
	};
	extensions?: Record<string, any>;
	stack?: string; // Traza de pila personalizada
}

export interface InternalErrorOptions {
	detail?: string;
	instance?: string;
	isOperational?: boolean;
	originalError?: Error;
	errorCode?: string;
	context?: {
		userId?: string;
		requestId?: string;
		operation?: string;
		timestamp?: string;
		severity?: 'low' | 'medium' | 'high' | 'critical';
	};

	stack?: string; // Traza de pila personalizada
	metadata?: {
		service?: string;
		version?: string;
		errorType?: string;
		environment?: string;
		restartRequired?: boolean;
	};
	extensions?: Record<string, any>;
}

export interface ConflictOptions {
	detail?: string;
	resource?: string; // Qué recurso está en conflicto
	identifier?: string | number;
	instance?: string;
	isOperational?: boolean;
	metadata?: Record<string, any>; // Información adicional relevante sobre el conflicto
	extensions?: Record<string, any>;
	stack?: string; // Traza de pila personalizada
}

export interface UnauthorizedOptions {
	detail?: string; // Detalles adicionales sobre el error de autorización
	instance?: string; // URI del recurso que causó el error
	isOperational?: boolean; // Indica si el error es operativo (por defecto es true)
	extensions?: Record<string, any>; // Información adicional relevante
	stack?: string; // Traza de pila personalizada
}

export interface forbiddenError {
	detail?: string; // Detalles adicionales sobre el error de autorización
	instance?: string; // URI del recurso que causó el error
	isOperational?: boolean; // Indica si el error es operativo (por defecto es true)
	extensions?: Record<string, any>; // Información adicional relevante
	stack?: string; // Traza de pila personalizada
}
