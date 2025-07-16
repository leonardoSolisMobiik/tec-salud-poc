/**
 * Jest configuration for TecSalud Medical Assistant Angular Frontend
 *
 * @description Configuration for Jest testing framework optimized for Angular applications
 * with TypeScript support, Angular testing utilities, and coverage reporting.
 *
 * @features
 * - Angular preset configuration
 * - TypeScript support
 * - JSDOM environment for DOM testing
 * - Code coverage reporting
 * - Module mapping for path aliases
 * - Test file patterns for spec files
 *
 * @since 1.0.0
 */
module.exports = {
  // Use Angular Jest preset for optimal Angular support
  preset: 'jest-preset-angular',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],

  // Test environment
  testEnvironment: 'jsdom',

  // Module paths for TypeScript path mapping (corrected property name)
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1'
  },

  // File patterns for test discovery
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|js)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.module.ts',
    '!src/app/**/*.interface.ts',
    '!src/app/**/*.model.ts',
    '!src/app/**/*.config.ts',
    '!src/app/**/*.routes.ts',
    '!src/app/**/index.ts',
    '!src/main.ts',
    '!src/**/*.d.ts'
  ],

  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporter formats
  coverageReporters: [
    'html',
    'lcov',
    'text-summary'
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],

  // Paths to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@ti-tecnologico-de-monterrey-oficial)'
  ],

  // Global test timeout
  testTimeout: 10000,

  // Verbose output for detailed test results
  verbose: true
};
