import {
	BillingUnit,
	type Category,
	CostType,
	type Currency,
	PrismaClient,
	Role,
	type Subscription,
	type User,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

const prisma = new PrismaClient();

const currencies: Currency[] = [
	{
		code: 'USD',
		name: 'United States Dollar',
		symbol: '$',
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		code: 'EUR',
		name: 'Euro',
		symbol: '€',
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];
const initialUsers: User[] = [
	{
		id: uuidv7(),
		email: 'guevarad170@gmail.com',
		role: Role.ADMIN,
		password: await bcrypt.hash('admin123', 10),
		name: 'Danys Guevara',
		primaryCurrencyCode: 'USD',
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv7(),
		email: 'katherineamaya2200@gmail.com',
		role: Role.USER,
		password: await bcrypt.hash('user123', 10),
		name: 'Katherine Amaya',
		primaryCurrencyCode: 'USD',
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv7(),
		email: 'mdannyguevarac12@gmail.com',
		role: Role.USER,
		password: await bcrypt.hash('user123', 10),
		name: 'Lyssander Guevara',
		primaryCurrencyCode: 'USD',
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

async function main() {
	console.log('Seeding database...');
	//Be sure to delete the existing dataset.
	await prisma.subscription.deleteMany();
	await prisma.user.deleteMany();
	await prisma.currency.deleteMany();
	await prisma.category.deleteMany();
	console.log('Existing data cleared.');

	//Create initial currencies
	for (const currencyData of currencies) {
		await createCurrency(currencyData);
	}

	//Create initial users
	const user: User[] = [];
	for (const userData of initialUsers) {
		user.push(await createUser(userData));
	}

	//Create initial categories
	const categories: Category[] = [
		{
			id: 1,
			userId: user[1].id,
			name: 'Streaming',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 2,
			userId: user[1].id,
			name: 'Software',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 3,
			userId: user[2].id,
			name: 'Utilities',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	for (const categoryData of categories) {
		await createCategory(categoryData);
	}

	//Create initial subscriptions

	const subscriptions: Subscription[] = [
		{
			id: uuidv7(),
			userId: user[1].id,
			categoryId: 1,
			name: 'Netflix',
			billingFrequency: 1,
			costType: CostType.FIXED,
			billingUnit: BillingUnit.MONTHS,
			currencyCode: 'USD',
			firstPaymentDate: new Date('2024-01-15'),
			cost: 15.99,
			trialEndsOn: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: uuidv7(),
			userId: user[1].id,
			categoryId: 2,
			name: 'Adobe Creative Cloud',
			billingFrequency: 1,
			costType: CostType.FIXED,
			billingUnit: BillingUnit.MONTHS,
			currencyCode: 'USD',
			firstPaymentDate: new Date('2024-02-01'),
			cost: 52.99,
			trialEndsOn: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: uuidv7(),
			userId: user[2].id,
			categoryId: 3,
			name: 'Electricity Bill',
			billingFrequency: 1,
			costType: CostType.FIXED,
			billingUnit: BillingUnit.MONTHS,
			currencyCode: 'USD',
			firstPaymentDate: new Date('2024-01-20'),
			cost: 75.5,
			trialEndsOn: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: uuidv7(),
			userId: user[2].id,
			categoryId: 3,
			name: 'Water Bill',
			billingFrequency: 1,
			costType: CostType.FIXED,
			billingUnit: BillingUnit.MONTHS,
			currencyCode: 'USD',
			firstPaymentDate: new Date('2024-01-25'),
			cost: 40.25,
			trialEndsOn: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];
	for (const subscriptionData of subscriptions) {
		await createSubscription(subscriptionData);
	}
}

async function createUser(data: User): Promise<User> {
	const user = await prisma.user.create({ data });
	console.log(`Created user: ${user.email} with ID: ${user.id}`);
	return user;
}

async function createCurrency(data: Currency): Promise<Currency> {
	const currency = await prisma.currency.create({ data });
	console.log(`Created currency: ${currency.code}`);
	return currency;
}

async function createCategory(params: Category): Promise<Category> {
	const category = await prisma.category.create({ data: params });
	console.log(`Created category: ${category.name}`);
	return category;
}

async function createSubscription(data: Subscription): Promise<Subscription> {
	const subscription = await prisma.subscription.create({ data });
	console.log(`Created subscription with ID: ${subscription.id}`);
	return subscription;
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
