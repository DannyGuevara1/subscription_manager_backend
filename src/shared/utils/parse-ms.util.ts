// src/shared/utils/parse-ms.util.ts

/**
 * Supported time unit multipliers in milliseconds.
 * Covers the same units as the `ms` npm package.
 */
const UNIT_MAP: Record<string, number> = {
	ms: 1,
	s: 1_000,
	sec: 1_000,
	m: 60_000,
	min: 60_000,
	h: 3_600_000,
	hr: 3_600_000,
	d: 86_400_000,
	w: 604_800_000,
	y: 31_557_600_000, // 365.25 days
};

/**
 * Matches a numeric value followed by an optional unit.
 *
 * @example
 * '5m'   → ['5m', '5', 'm']
 * '7d'   → ['7d', '7', 'd']
 * '1.5h' → ['1.5h', '1.5', 'h']
 * '500'  → ['500', '500', undefined] → defaults to 'ms'
 */
const DURATION_REGEX = /^(\d+(?:\.\d+)?)\s*(ms|s|sec|m|min|h|hr|d|w|y)?$/i;

/**
 * Parses a human-readable duration string into milliseconds.
 *
 * @param value - Duration string (e.g., '5m', '7d', '1.5h', '500ms')
 * @returns The duration in milliseconds
 * @throws {Error} If the value is not a valid duration string
 *
 * @example
 * parseMs('5m')   // 300_000
 * parseMs('7d')   // 604_800_000
 * parseMs('1.5h') // 5_400_000
 * parseMs('500')  // 500 (defaults to ms)
 */
export function parseMs(value: string): number {
	const match = DURATION_REGEX.exec(value.trim());

	if (!match?.[1]) {
		throw new Error(
			`Invalid duration format: "${value}". Expected format: <number><unit> (e.g., "5m", "7d", "1.5h")`,
		);
	}

	const amount = Number.parseFloat(match[1]);
	const unit = (match[2] ?? 'ms').toLowerCase();
	const multiplier = UNIT_MAP[unit];

	if (multiplier === undefined) {
		throw new Error(`Unknown time unit: "${match[2]}"`);
	}

	return Math.floor(amount * multiplier);
}

/**
 * Parses a human-readable duration string into seconds.
 * Convenience wrapper for Redis TTL and similar use cases.
 *
 * @param value - Duration string (e.g., '5m', '7d')
 * @returns The duration in seconds (floored)
 *
 * @example
 * parseMsToSeconds('7d') // 604_800
 * parseMsToSeconds('5m') // 300
 */
export function parseMsToSeconds(value: string): number {
	return Math.floor(parseMs(value) / 1_000);
}
