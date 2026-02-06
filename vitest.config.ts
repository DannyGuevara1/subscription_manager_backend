import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true, // Nos permite usar describe, it, expect sin importarlos
		environment: 'node',
		include: ['tests/**/*.test.ts'], // Definimos dónde vivirán los tests
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
	},
});
