export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
}

export type UpdateCurrencyData = Omit<Partial<CreateCurrencyData>, 'code'>;

export type CreateCurrencyInput = CreateCurrencyData;

export interface CurrencyDomain {
	code: string;
	name: string;
	symbol: string;
	createdAt: Date;
	updatedAt: Date;
}
const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;
type UpperLetter =
	| 'A'
	| 'B'
	| 'C'
	| 'D'
	| 'E'
	| 'F'
	| 'G'
	| 'H'
	| 'I'
	| 'J'
	| 'K'
	| 'L'
	| 'M'
	| 'N'
	| 'O'
	| 'P'
	| 'Q'
	| 'R'
	| 'S'
	| 'T'
	| 'U'
	| 'V'
	| 'W'
	| 'X'
	| 'Y'
	| 'Z';
export type CurrencyCode = `${UpperLetter}${UpperLetter}${UpperLetter}` & {
	readonly _brand: 'CurrencyCode';
};

export function isCurrencyCode(value: string): value is CurrencyCode {
	return CURRENCY_CODE_REGEX.test(value);
}

export function parseCurrencyCode(value: string): CurrencyCode {
	if (!isCurrencyCode(value)) {
		throw new Error(`Código inválido: "${value}"`);
	}
	return value;
}
