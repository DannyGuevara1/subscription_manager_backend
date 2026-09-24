import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const groups = { unit: 'tests/unit', integration: 'tests/integration', migrations: 'tests/migrations', smoke: 'tests/smoke' };
const group = process.argv[2];
if (!Object.hasOwn(groups, group)) throw new Error(`Unknown test group: ${group}`);
function discover(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? discover(path) : path.endsWith('.test.ts') ? [path] : [];
  }).sort();
}
const files = discover(groups[group]);
if (!files.length) throw new Error(`No tests discovered in ${group}`);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
