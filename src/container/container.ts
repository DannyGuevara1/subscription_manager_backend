// src/container/container.ts
import {
	type AwilixContainer,
	asClass,
	asFunction,
	asValue,
	createContainer,
	InjectionMode,
	Lifetime,
} from 'awilix';
import prismaClient from '@/config/prisma.js';

const isProduction = process.env.NODE_ENV === 'production';
const baseGlob = isProduction ? 'dist' : 'src';
const extensionGlob = isProduction ? '.js' : '.ts';

export async function setupContainer(): Promise<AwilixContainer> {
	const container = createContainer({
		strict: true,
		injectionMode: InjectionMode.CLASSIC,
	});

	container.register({
		prisma: asValue(prismaClient),
	});

	// Carga automática con loadModules
	// Globs relativos desde src/container/

	await container.loadModules(
		[
			[
				`${baseGlob}/repositories/**/*${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/services/**/*${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/api/components/**/*${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/api/components/**/*.routes${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON, register: asFunction },
			],
			[
				`${baseGlob}/api/features/**/services/*.service${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/api/features/**/controllers/*.controller${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/api/features/**/routes/*.routes${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON, register: asFunction },
			],
		],
		{
			esModules: true, // Para ES modules
			formatName: 'camelCase', // user.controller.js → userController
			resolverOptions: {
				lifetime: Lifetime.SINGLETON,
				register: asClass, // Tus controladores son clases
				injectionMode: InjectionMode.CLASSIC,
			},
		},
	);

	return container;
}
export const containerPromise = setupContainer();
