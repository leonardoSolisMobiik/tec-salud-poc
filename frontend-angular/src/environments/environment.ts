export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  appName: 'TecSalud Medical Assistant',
  version: '1.0.0',
  // Development specific settings
  enableLogging: true,
  enableMockData: false,
  apiTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  // Feature flags for development
  features: {
    enableStreaming: true,
    enableVoiceAssistant: true,
    enableFileUpload: true,
    enableBatchProcessing: true
  },
  // Debug settings
  debug: {
    showApiLogs: true,
    showPerformanceMetrics: true,
    enableDevTools: true
  }
};