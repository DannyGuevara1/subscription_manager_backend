// src/config/logger.ts
import pino from 'pino';

// El logger SIEMPRE producirá JSON.
const logger = pino({
	redact: [
		'password',
		'token',
		'accessToken',
		'refreshToken',
		'req.headers.authorization',
		'req.headers.cookie',
		'res.headers["set-cookie"]',
	],
	level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

export default logger;
