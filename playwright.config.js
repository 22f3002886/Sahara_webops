import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
process.env.DATA_DIR = resolve('artifacts/browser-data');
export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  workers: 1,
  webServer: {
    command: 'node scripts/browser-server.js',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
  },
});
