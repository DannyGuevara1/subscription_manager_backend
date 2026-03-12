// src/types/errors.type.ts
export const ProblemTypes = {
	NOT_CONTENT: {
		type: '/problems/no-content',
		title: 'No Content',
		status: 204,
	},
	BAD_REQUEST: {
		type: '/problems/bad-request',
		title: 'Bad Request',
		status: 400,
	},
	UNPROCESSABLE_ENTITY: {
		type: '/problems/unprocessable-entity',
		title: 'Unprocessable Entity',
		status: 422,
	},
	VALIDATION_ERROR: {
		type: '/problems/validation-error',
		title: 'Validation Error',
		status: 422,
	},
	AUTHENTICATION_ERROR: {
		type: '/problems/authentication-error',
		title: 'Authentication Error',
		status: 401,
	},
	AUTHENTICATION_REQUIRED: {
		type: '/problems/authentication-required',
		title: 'Authentication Required',
		status: 401,
	},
	AUTHORIZATION_ERROR: {
		type: '/problems/authorization-error',
		title: 'Authorization Error',
		status: 403,
	},
	UNAUTHORIZED: {
		type: '/problems/unauthorized',
		title: 'Unauthorized',
		status: 401,
	},
	INSUFFICIENT_PERMISSIONS: {
		type: '/problems/insufficient-permissions',
		title: 'Insufficient Permissions',
		status: 403,
	},
	ACCESS_FORBIDDEN: {
		type: '/problems/access-forbidden',
		title: 'Access Forbidden',
		status: 403,
	},
	RESOURCE_NOT_FOUND: {
		type: '/problems/resource-not-found',
		title: 'Resource Not Found',
		status: 404,
	},
	BUSINESS_LOGIC_ERROR: {
		type: '/problems/business-logic-error',
		title: 'Business Logic Error',
		status: 409,
	},
	CONFLICT: {
		type: '/problems/conflict',
		title: 'Conflict',
		status: 409,
	},
	DATABASE_ERROR: {
		type: '/problems/database-error',
		title: 'Database Error',
		status: 500,
	},
	EXTERNAL_SERVICE_ERROR: {
		type: '/problems/external-service-error',
		title: 'External Service Error',
		status: 502,
	},
	INTERNAL_SERVER_ERROR: {
		type: '/problems/internal-server-error',
		title: 'Internal Server Error',
		status: 500,
	},
	SERVICE_UNAVAILABLE: {
		type: '/problems/service-unavailable',
		title: 'Service Unavailable',
		status: 503,
	},
	RATE_LIMIT_EXCEEDED: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
	},
} as const;
