import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
// This fixed directory is exclusively synthetic browser-test data.
const directory = resolve('artifacts/browser-data');
rmSync(directory, { recursive: true, force: true });
process.env.DATA_DIR = directory;
process.env.PORT = '3100';
await import('../server.js');
