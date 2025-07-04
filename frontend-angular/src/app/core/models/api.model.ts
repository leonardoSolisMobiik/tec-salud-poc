export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  timestamp: string;
  services?: {
    database: boolean;
    azure_openai: boolean;
    chroma: boolean;
  };
}

export interface AzureOpenAIHealthResponse {
  status: string;
  gpt4o_available: boolean;
  gpt4o_mini_available: boolean;
  embeddings_available: boolean;
  models_info?: {
    [key: string]: {
      deployment_name: string;
      status: string;
    };
  };
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  status_code: number;
  timestamp?: string;
}