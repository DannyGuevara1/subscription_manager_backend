// src/shared/api-docs/swagger.routes.ts
import { contentSecurityPolicy } from 'helmet';
import express, { type Router } from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { serve, setup } from 'swagger-ui-express';

// ponytail: sin DI ni cache — lee el YAML del disco por request.
// Archivo chico (~50KB), solo se accede desde la UI, y en dev refleja
// ediciones del spec sin reiniciar. Si el archivo falta, Express 5
// captura el throw síncrono y lo pasa al errorNormalizer global.

export default function apiDocsRouter(): Router {
	const router = express.Router();

	// CSP relajada solo para esta ruta: el initializer de Swagger UI
	// se inyecta como <script> inline. Sobreescribe la CSP estricta
	// del helmet() global de app.ts para /api/v1/api-docs únicamente.
	router.use(
		contentSecurityPolicy({
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", 'data:'],
			},
		}),
	);

	// Spec antes del static de swaggerUi para que no lo atrape.
	router.get('/openapi.yaml', (_req, res) => {
		const spec = readFileSync(
			resolve(process.cwd(), 'docs/openapi.yaml'),
			'utf8',
		);
		res.type('text/yaml').send(spec);
	});

	// UI same-origin; withCredentials envía la cookie httpOnly en cada fetch.
	router.use(
		serve,
		setup(null, {
			swaggerOptions: {
				url: '/api/v1/api-docs/openapi.yaml',
				withCredentials: true,
			},
			customCss: '.swagger-ui .topbar { display: none }',
		}),
	);

	return router;
}
