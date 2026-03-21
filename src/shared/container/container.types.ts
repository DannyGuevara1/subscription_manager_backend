import type { Router } from 'express';
import type prismaClient from '@/config/prisma.js';
import type redisClient from '@/config/redis.js';
import type AuthController from '@/modules/auth/auth.controller.js';
import type AuthService from '@/modules/auth/auth.service.js';
import type LoginService from '@/modules/auth/login.service.js';
import type RegisterService from '@/modules/auth/register.service.js';
import type CategoryController from '@/modules/category/category.controller.js';
import type CategoryRepository from '@/modules/category/category.repository.js';
import type CategoryService from '@/modules/category/category.service.js';
import type CurrencyController from '@/modules/currency/currency.controller.js';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import type CurrencyService from '@/modules/currency/currency.service.js';
import type SubscriptionController from '@/modules/subscription/subscription.controller.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';
import type UserController from '@/modules/user/user.controller.js';
import type UserRepository from '@/modules/user/user.repository.js';
import type UserService from '@/modules/user/user.service.js';

export interface Cradle {
	prisma: typeof prismaClient;
	redis: typeof redisClient;

	userRepository: UserRepository;
	categoryRepository: CategoryRepository;
	currencyRepository: CurrencyRepository;
	subscriptionRepository: SubscriptionRepository;

	userService: UserService;
	categoryService: CategoryService;
	currencyService: CurrencyService;
	subscriptionService: SubscriptionService;
	authService: AuthService;
	loginService: LoginService;
	registerService: RegisterService;

	userController: UserController;
	categoryController: CategoryController;
	currencyController: CurrencyController;
	subscriptionController: SubscriptionController;
	authController: AuthController;

	userRoutes: Router;
	categoryRoutes: Router;
	currencyRoutes: Router;
	subscriptionRoutes: Router;
	authRoutes: Router;
}
