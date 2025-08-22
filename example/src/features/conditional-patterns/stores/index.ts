// Re-export from legacy demo for now
export * from '../../../pages/ConditionalExecutionDemo/mockServices';
export interface ConditionalActions {
  deployApplication: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    features?: string[];
  };
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}