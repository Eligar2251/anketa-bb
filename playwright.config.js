const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    } : {},
  },
  webServer: {
    command: 'npm run build && npm run start -- --hostname 0.0.0.0 --port 3100',
    timeout: 120000,
    url: 'http://127.0.0.1:3100',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://sheet-test.supabase.co',
      NEXT_PUBLIC_SUPABASE_KEY: 'test-key',
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'sheet-test',
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: 'sheet-test',
    },
  },
});
