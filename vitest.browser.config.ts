import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    include: ["./src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    globals: true,
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/config/browser/playwright
      instances: [
        { browser: 'chromium' },
        { browser: 'firefox' },
        { browser: 'webkit' },
      ],
    },
  },
});
