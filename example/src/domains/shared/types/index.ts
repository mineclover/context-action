/**
 * Shared type definitions across all domains
 * Following Context-Action framework conventions
 */

// Common patterns for all domains
export interface DomainContext {
  stores: Record<string, any>;
  actions: Record<string, any>;
  components: Record<string, any>;
}

// Store-related shared types
export interface StoreConfig<T = any> {
  initialValue: T;
  strategy?: 'reference' | 'shallow' | 'deep';
  debug?: boolean;
  description?: string;
}

export interface StorePattern<T extends Record<string, StoreConfig>> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useStore: <K extends keyof T>(key: K) => any;
  useStoreManager: () => any;
  withProvider?: <P extends Record<string, any>>(
    Component: React.ComponentType<P>
  ) => React.ComponentType<P>;
}

// Action-related shared types
export interface ActionPayloadMap {
  [key: string]: any;
}

export interface ActionContext<TActions extends ActionPayloadMap> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useActionDispatch: () => <K extends keyof TActions>(
    actionType: K,
    payload: TActions[K]
  ) => Promise<any>;
  useActionHandler: (
    actionType: keyof TActions,
    handler: (payload: any, controller: any) => Promise<void> | void
  ) => void;
}

// Async-related shared types
export interface AsyncPatternConfig {
  timeout?: number;
  retries?: number;
  fallback?: () => void;
  onError?: (error: Error) => void;
}

export interface WaitForRefsConfig extends AsyncPatternConfig {
  maxWaitTime?: number;
  checkInterval?: number;
}

// Demo and component shared types
export interface DemoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface CodeExampleProps {
  children: string;
  language?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
  source?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operations: number;
  errors: number;
  avgResponseTime: number;
}

// Navigation and routing types
export interface NavItem {
  path: string;
  title: string;
  description: string;
  category: 'store' | 'action' | 'async' | 'core' | 'demos' | 'examples';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  concepts?: string[];
}