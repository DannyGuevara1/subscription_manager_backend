import { unprocessableEntityError } from '@/shared/errors/error.factory.js';

export function currencyConversionError(from: string, to: string) {
	return unprocessableEntityError({
		detail: `Cannot convert currency from ${from} to ${to}. Exchange rate provider is not available yet.`,
		extensions: {
			fromCurrency: from,
			toCurrency: to,
		},
	});
}
