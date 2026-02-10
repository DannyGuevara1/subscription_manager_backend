import { stopContainers } from './testContainers.js';

export default async function globalTeardown() {
	console.log('\n🧹 Limpieza global de tests\n');
	await stopContainers();
}
