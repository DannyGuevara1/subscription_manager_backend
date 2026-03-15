// src/errors/app.error.ts
import type { ProblemDetails } from '@/shared/types/problem.details.js';

/*
 * Formato de error sigue la especificación de https://www.rfc-editor.org/rfc/rfc9457.html
 * aplicado a errores de nuestra API REST.
 */
export class AppError extends Error {
	// Campos estándar de RFC 9457
	public readonly type: string;
	public readonly title: string;
	public readonly status: number;
	public readonly detail?: string;
	public readonly instance?: string;

	// Campos internos para control de la aplicación
	public readonly extensions?: Record<string, any>;

	// Campos internos para control de la aplicación
	public readonly isOperational: boolean;
	public readonly timestamp: Date;

	constructor(
		options: ProblemDetails & { stack?: string },
		isOperational: boolean = true,
	) {
		super(options.detail ?? options.title);

		Object.setPrototypeOf(this, new.target.prototype);
		this.name = new.target.name;

		this.type = options.type ?? 'about:blank';
		this.status = options.status ?? 500;
		this.title = options.title ?? 'Internal Server Error';

		this.detail = options.detail;
		this.instance = options.instance;
		this.extensions = options.extensions;

		this.isOperational = isOperational;
		this.timestamp = new Date();

		// Prioriza el stack del error original si se proporciona; si no, genera uno nuevo.
		const originalStack = options.stack || new Error().stack;

		// Captura y limpia el stack trace
		this.stack = this.getCleanStackTrace(originalStack);
	}

	/*
	 * Parsea el stack trace y lo limpia, omitiendo llamdas internas de Node.js
	 * @returns Un string con el stack trace limpio o undefined si no está disponible
	 */

	private getCleanStackTrace(stackToParse?: string): string | undefined {
		if (!stackToParse) return undefined;

		const lines = stackToParse.split('\n');
		const relevantLines = lines.filter((line) => {
			// Mantenemos las líneas que apuntan a nuestro código fuente y excluimos node_modules
			return line.includes('src/') && !line.includes('node_modules');
		});

		// Si el filtro es muy agresivo y no deja nada, devolvemos el stack original sin la primera línea (el mensaje de error).
		if (relevantLines.length === 0) {
			return lines.slice(1).join('\n');
		}

		return relevantLines.join('\n').trim();
	}

	/**
	 * Convierte el error a formato RFC 9457 para respuestas HTTP
	 */
	toProblemDetails(): ProblemDetails {
		const problemDetails: ProblemDetails = {
			type: this.type,
			title: this.title,
			status: this.status,
			detail: this.detail,
			instance: this.instance,
		};

		// Agregar extensiones si existen
		if (this.extensions) {
			Object.assign(problemDetails, this.extensions);
			//problemDetails.extensions = this.extensions;
		}

		return problemDetails;
	}

	/**
	 * Convierte el error a formato completo para logging interno
	 */
	toLogFormat(): Record<string, any> {
		return {
			// Campos RFC 9457
			...this.toProblemDetails(),

			// Campos internos para logging
			name: this.name,
			isOperational: this.isOperational,
			timestamp: this.timestamp.toISOString(),
			stack: this.stack,

			// Extensiones
			...this.extensions,
		};
	}
}
