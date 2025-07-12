export const environment = {
  production: true,
  apiUrl: 'https://api.tecsalud.com', // Production API URL - update as needed
  appName: 'TecSalud Medical Assistant',
  version: '1.0.0',
  // Production specific settings
  enableLogging: false,
  enableMockData: false,
  apiTimeout: 10000, // 10 seconds for production
  retryAttempts: 2,
  // Feature flags for production
  features: {
    enableStreaming: true,
    enableVoiceAssistant: true,
    enableFileUpload: true,
    enableBatchProcessing: true
  },
  // Debug settings (disabled for production)
  debug: {
    showApiLogs: false,
    showPerformanceMetrics: false,
    enableDevTools: false
  }
};