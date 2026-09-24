import assert from 'node:assert/strict';
import { it } from 'node:test';
import { mkdtemp, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { financialPortfolio } from '../fixtures/financial.js';

it(
	'migrates legacy fixtures, preserves states and data, and restores a backup',
	{ timeout: 120000 },
	async () => {
		const pg = await new PostgreSqlContainer('postgres:15-alpine').start();
		const dir = await mkdtemp(join(tmpdir(), 'release-migrations-'));
		const sql = async (query: string) => {
			const result = await pg.exec([
				'psql',
				'-U',
				pg.getUsername(),
				'-d',
				pg.getDatabase(),
				'-v',
				'ON_ERROR_STOP=1',
				'-At',
				'-c',
				query,
			]);
			assert.equal(result.exitCode, 0, result.output);
			return result.output.trim();
		};
		try {
			await cp('prisma/schema.prisma', join(dir, 'schema.prisma'));
			await mkdir(join(dir, 'migrations'));
			await cp(
				'prisma/migrations/migration_lock.toml',
				join(dir, 'migrations/migration_lock.toml'),
			);
			const migrations = (await readdir('prisma/migrations'))
				.filter((n) => /^\d/.test(n))
				.sort();
			const cutoff = '20260816053310';
			const deploy = () =>
				execFileSync(
					process.execPath,
					[
						resolve('node_modules/prisma/build/index.js'),
						'migrate',
						'deploy',
						'--schema',
						join(dir, 'schema.prisma'),
					],
					{
						env: { ...process.env, DATABASE_URL: pg.getConnectionUri() },
						stdio: 'pipe',
					},
				);
			for (const name of migrations.filter((n) => n < cutoff))
				await cp(
					join('prisma/migrations', name),
					join(dir, 'migrations', name),
					{ recursive: true },
				);
			deploy();
			await sql(`INSERT INTO "Currency" (code,name,symbol,"updatedAt") VALUES ('USD','Dollar','$',now()),('EUR','Euro','€',now());
		INSERT INTO "User" (id,email,password,"primaryCurrencyCode","updatedAt") VALUES ('00000000-0000-4000-8000-000000000010','migration@example.test','fixture','USD',now());
		INSERT INTO "Category" (id,"userId",name,"updatedAt") VALUES (1,'00000000-0000-4000-8000-000000000010','Personal',now());`);
			for (const sub of financialPortfolio()) {
				await sql(`INSERT INTO "Subscription" (id,"userId","categoryId","currencyCode",name,cost,"costType","billingFrequency","billingUnit","firstPaymentDate","trialEndsOn","isActive","updatedAt") VALUES
			('${sub.id}','${sub.userId}',1,'${sub.currencyCode}','${sub.name}',${sub.cost},'${sub.costType}',${sub.billingFrequency},'${sub.billingUnit}','${sub.firstPaymentDate.toISOString()}',${sub.trialEndsOn ? `'${sub.trialEndsOn.toISOString()}'` : 'NULL'},${sub.status === 'ACTIVE'},now());`);
			}
			const snapshot = () =>
				sql(
					`SELECT json_agg(t ORDER BY id) FROM (SELECT id,"userId","categoryId","currencyCode",name,cost,"costType","billingFrequency","billingUnit","firstPaymentDate","trialEndsOn" FROM "Subscription") t`,
				);
			const before = JSON.parse(await snapshot());
			const backup = await pg.exec([
				'pg_dump',
				'-U',
				pg.getUsername(),
				'-d',
				pg.getDatabase(),
				'-f',
				'/tmp/pre-release.sql',
			]);
			assert.equal(backup.exitCode, 0, backup.output);
			for (const name of migrations.filter((n) => n >= cutoff))
				await cp(
					join('prisma/migrations', name),
					join(dir, 'migrations', name),
					{ recursive: true },
				);
			deploy();
			assert.deepEqual(JSON.parse(await snapshot()), before);
			const states = JSON.parse(
				await sql('SELECT json_object_agg(id,status) FROM "Subscription"'),
			);
			for (const sub of financialPortfolio())
				assert.equal(
					states[sub.id],
					sub.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
				);
			assert.equal(
				await sql(
					`SELECT count(*) FROM information_schema.columns WHERE table_name='Subscription' AND column_name='isActive'`,
				),
				'0',
			);
			deploy(); // migrate deploy is repeatable, no changes when already applied.
			// Verify preservation by the enum rename itself, including historical CANCELED.
			await sql(
				`ALTER TYPE "StatusSubscription" RENAME VALUE 'CANCELLED' TO 'CANCELED'; UPDATE "Subscription" SET status='CANCELED' WHERE name='Cancelled';`,
			);
			const { readFile } = await import('node:fs/promises');
			await sql(
				await readFile(
					'prisma/migrations/20260816055631_preserve_cancelled_enum_values/migration.sql',
					'utf8',
				),
			);
			assert.equal(
				await sql(`SELECT status FROM "Subscription" WHERE name='Cancelled'`),
				'CANCELLED',
			);
			const guard = await readFile(
				'prisma/migrations/20260816053310_preserve_legacy_subscription_states/migration.sql',
				'utf8',
			);
			const blocked = await pg.exec([
				'psql',
				'-U',
				pg.getUsername(),
				'-d',
				pg.getDatabase(),
				'-v',
				'ON_ERROR_STOP=1',
				'-c',
				guard,
			]);
			assert.notEqual(blocked.exitCode, 0, `guard: ${blocked.output}`);
			assert.match(blocked.output, /Legacy isActive is absent/);
			assert.equal(
				await sql(
					`SELECT count(*) FROM information_schema.tables WHERE table_name='_SubscriptionLegacyState'`,
				),
				'0',
			);
			await sql('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
			const restored = await pg.exec([
				'psql',
				'-U',
				pg.getUsername(),
				'-d',
				pg.getDatabase(),
				'-v',
				'ON_ERROR_STOP=1',
				'-f',
				'/tmp/pre-release.sql',
			]);
			assert.equal(restored.exitCode, 0, restored.output);
			assert.deepEqual(JSON.parse(await snapshot()), before);
			assert.equal(
				await sql('SELECT count(*) FROM "Subscription" WHERE NOT "isActive"'),
				'2',
			);
		} finally {
			await pg.stop();
			await rm(dir, { recursive: true, force: true });
		}
	},
);
