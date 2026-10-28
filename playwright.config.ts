import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5179',
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'off', // Auth artifacts must not record cookies or magic-link tokens.
    screenshot: 'off',
  },
  webServer: [{
    command: 'pnpm contracts:build && pnpm db:build && pnpm --filter api dev',
    url: 'http://127.0.0.1:3009/api/v1/health',
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NODE_ENV: 'test', HOST: '127.0.0.1', PORT: '3009', WEB_ORIGIN: 'http://localhost:5179',
      DATABASE_URL: 'postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control_test?schema=app',
      AUTH_SECRET: 'synthetic-browser-test-secret-1234567890',
      SMTP_HOST: '127.0.0.1', SMTP_PORT: '1025', SMTP_SECURE: 'false', MAIL_FROM: 'login@example.test',
    },
  }, {
    command: 'pnpm contracts:build && pnpm --filter web dev --host localhost --port 5179 --strictPort',
    url: 'http://localhost:5179',
    reuseExistingServer: false,
    env: { API_PROXY_TARGET: 'http://127.0.0.1:3009' },
  }],
})
