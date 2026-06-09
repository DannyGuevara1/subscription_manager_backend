import type { Router } from 'express';
import type prismaClient from '@/config/prisma.js';
import type redisClient from '@/config/redis.js';
import type AnalyticsService from '@/modules/analytics/analytics.service.js';
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
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type DashboardController from '@/modules/dashboard/dashboard.controller.js';
import type DashboardService from '@/modules/dashboard/dashboard.service.js';
import type SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import type SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type SubscriptionController from '@/modules/subscription/subscription.controller.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';
import type UserController from '@/modules/user/user.controller.js';
import type UserRepository from '@/modules/user/user.repository.js';
import type UserService from '@/modules/user/user.service.js';

export interface Cradle {
	prisma: typeof prismaClient;
	redis: typeof redisClient;
	exchangeRateProvider: ExchangeRateProvider;

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
	dashboardService: DashboardService;
	exchangeRateService: ExchangeRateService;
	analyticsService: AnalyticsService;
	subscriptionCalculatorService: SubscriptionCalculatorService;
	subscriptionCostNormalizerService: SubscriptionCostNormalizerService;

	userController: UserController;
	categoryController: CategoryController;
	currencyController: CurrencyController;
	subscriptionController: SubscriptionController;
	authController: AuthController;
	dashboardController: DashboardController;

	userRoutes: Router;
	categoryRoutes: Router;
	currencyRoutes: Router;
	subscriptionRoutes: Router;
	authRoutes: Router;
	dashboardRoutes: Router;
}
