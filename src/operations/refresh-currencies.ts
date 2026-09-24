import 'dotenv/config';
import prisma from '@/config/prisma.js';
import OpenExchangeRateProvider from '@/modules/currency/adapters/open-exchange-rate.provider.js';

// Explicit deployment job; never runs from application replicas or seeds users.
try {
	const provider = new OpenExchangeRateProvider(
		process.env.APP_ID_OPENEXCHANGERATES ?? '',
	);
	const quotes = await provider.getAllRates();
	const existing = await prisma.currency.findMany();
	const catalog = new Map([
		['USD', { code: 'USD', name: 'United States Dollar', symbol: '$' }],
		['EUR', { code: 'EUR', name: 'Euro', symbol: '€' }],
		...existing.map(
			(c) =>
				[c.code, { code: c.code, name: c.name, symbol: c.symbol }] as const,
		),
	]);
	const now = new Date();
	const changes = [...catalog.values()].map((currency) => {
		const quote = quotes[currency.code];
		if (!quote || !Number.isFinite(quote) || quote <= 0)
			throw new Error(`Missing valid quote for ${currency.code}`);
		const data = { exchangeRateToUSD: 1 / quote, rateUpdatedAt: now };
		return prisma.currency.upsert({
			where: { code: currency.code },
			create: { ...currency, ...data },
			update: data,
		});
	});
	await prisma.$transaction(changes);
	console.log(
		`Initialized/refreshed ${changes.length} currencies in USD-per-unit direction.`,
	);
} catch {
	console.error(
		'Currency initialization failed. No rates were committed; verify provider configuration and supported codes.',
	);
	process.exitCode = 1;
} finally {
	await prisma.$disconnect();
}
