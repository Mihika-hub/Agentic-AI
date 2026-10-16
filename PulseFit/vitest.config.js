import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.js', 'tests/unit/**/*.test.js'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 30000,
    hookTimeout: 60000,
    // Every test file gets its own throwaway in-memory database. The real
    // .data/pulsefit database and any Neon DATABASE_URL in .env are never used.
    env: {
      PULSEFIT_DB_PATH: 'memory://pulsefit-test',
      DATABASE_URL: '',
      JWT_SECRET: 'test-only-secret-that-is-long-enough-for-hs256-signing',
      NODE_ENV: 'test',
    },
  },
})
