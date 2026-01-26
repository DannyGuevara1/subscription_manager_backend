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
import redisClient from '@/config/redis.js';

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
		redis: asValue(redisClient),
	});

	// Carga automática con loadModules
	// Globs relativos desde src/container/

	await container.loadModules(
		[
			[
				`${baseGlob}/modules/**/*.repository${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/modules/**/*.routes${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON, register: asFunction },
			],
			[
				`${baseGlob}/modules/**/*.service${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
			],
			[
				`${baseGlob}/modules/**/*.controller${extensionGlob}`,
				{ lifetime: Lifetime.SINGLETON },
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
