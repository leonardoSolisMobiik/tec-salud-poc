export const environment = {
  production: true,
  apiUrl: 'https://api.tecsalud.com', // Production API URL - update as needed
  apiTimeout: 10000, // 10 seconds for production
  retryAttempts: 2,
  debug: {
    showApiLogs: false
  }
};