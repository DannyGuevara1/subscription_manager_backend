import { rmSync } from 'node:fs';
// Delete only this repository's generated build output; no downloaded CLI needed.
rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
