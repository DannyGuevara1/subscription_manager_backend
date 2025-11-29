// src/types/problem.details.ts
/* Definición del formato Problem Details según RFC 9457 */
export interface ProblemDetails {
	type: string; // URI que identifica el tipo de problema
	title: string; // Resumen legible del tipo de problema
	status: number; // Código de estado HTTP
	detail?: string; // Explicación específica de esta ocurrencia del problema
	instance?: string; // URI que identifica esta ocurrencia específica
	[key: string]: any; // Campos de extensión (permitidos por RFC 9457)
}
