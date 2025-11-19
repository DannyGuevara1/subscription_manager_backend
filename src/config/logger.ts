// src/config/logger.ts
import pino from 'pino';

// El logger SIEMPRE producirá JSON.
const logger = pino({
	level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

export default logger;
