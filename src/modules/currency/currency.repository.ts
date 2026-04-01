import type { Currency } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	CurrencyDomain,
	CreateCurrencyData,
	UpdateCurrencyData,
} from '@/modules/currency/currency.type.js';
// Currency Repository for CRUD operations y Querying currencies
export default class CurrencyRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	private toDomain(currency: Currency): CurrencyDomain {
		return {
			code: currency.code,
			name: currency.name,
			symbol: currency.symbol,
			createdAt: currency.createdAt,
			updatedAt: currency.updatedAt,
		};
	}
	//CRUD Operations
	async create(data: CreateCurrencyData): Promise<CurrencyDomain> {
		const currency = await this.prisma.currency.create({ data });
		return this.toDomain(currency);
	}

	async findAll(): Promise<CurrencyDomain[]> {
		const currencies = await this.prisma.currency.findMany();
		return currencies.map((currency) => this.toDomain(currency));
	}

	async findByCode(code: string): Promise<CurrencyDomain | null> {
		const currency = await this.prisma.currency.findUnique({ where: { code } });
		return currency ? this.toDomain(currency) : null;
	}

	async update(code: string, data: UpdateCurrencyData): Promise<CurrencyDomain> {
		const currency = await this.prisma.currency.update({ where: { code }, data });
		return this.toDomain(currency);
	}

	async delete(code: string): Promise<CurrencyDomain> {
		const currency = await this.prisma.currency.delete({ where: { code } });
		return this.toDomain(currency);
	}
}
