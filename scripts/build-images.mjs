import { spawnSync } from 'node:child_process';
for (const [target, tag] of [['migration', 'migration-test'], ['production', 'release-test']]) {
  const result = spawnSync('docker', ['build', '--target', target, '-t', `subscription-manager:${tag}`, '.'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
