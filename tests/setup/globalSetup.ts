import { execSync } from 'node:child_process';
import { startContainers } from './testContainers.js';

export default async function globalSetup() {
	console.log('\n🧪 Configuración global de tests\n');

	const containers = await startContainers();

	// Guardar referencias para teardown
	(global as any).__CONTAINERS__ = containers;

	// Ejecutar migraciones de Prisma
	console.log('🔄 Ejecutando migraciones de Prisma...');
	try {
		execSync('npx prisma migrate deploy', {
			stdio: 'inherit',
			env: { ...process.env },
		});
		console.log('✅ Migraciones completadas');
	} catch (error) {
		console.error('❌ Error en migraciones:', error);
		throw error;
	}

	// Esperar un poco para asegurar que todo esté listo
	await new Promise((resolve) => setTimeout(resolve, 2000));
}
