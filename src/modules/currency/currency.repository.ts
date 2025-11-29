import type { Currency } from '@prisma/client';
import type { CreateCurrencyData } from '@/modules/currency/currency.type.js';
import prismaClient from '@/config/prisma.js';
// Currency Repository for CRUD operations y Querying currencies
export default class CurrencyRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}
	//CRUD Operations
	async create(data: CreateCurrencyData): Promise<Currency> {
		return this.prisma.currency.create({ data });
	}

	async findAll(): Promise<Currency[]> {
		return this.prisma.currency.findMany();
	}

	async findByCode(code: string): Promise<Currency | null> {
		return this.prisma.currency.findUnique({ where: { code } });
	}

	async update(
		code: string,
		data: Partial<Currency>,
	): Promise<Currency | null> {
		return this.prisma.currency.update({ where: { code }, data });
	}

	async delete(code: string): Promise<Currency | null> {
		return this.prisma.currency.delete({ where: { code } });
	}
}
