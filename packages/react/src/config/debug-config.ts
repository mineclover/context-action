/**
 * @fileoverview Global debug configuration for Context-Action framework
 * 
 * Centralized configuration for controlling debug output across the entire framework.
 * Allows fine-grained control over different types of debug messages.
 */

/**
 * Debug configuration interface
 */
export interface DebugConfig {
  /** Enable all debug output */
  enabled: boolean;
  
  /** Debug specific features */
  features: {
    /** Action handler registration and dispatching */
    actions: boolean;
    /** Store value changes and subscriptions */
    stores: boolean;
    /** Computed store cache hits and computations */
    computed: boolean;
    /** Performance metrics and timings */
    performance: boolean;
    /** Error details and stack traces */
    errors: boolean;
    /** Ref operations and lifecycle */
    refs: boolean;
    /** Immutability checks and operations */
    immutability: boolean;
  };
  
  /** Log level threshold */
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Custom logger function */
  logger?: {
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
    trace: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Default debug configuration
 * In production, all debug output is disabled by default
 */
const defaultConfig: DebugConfig = {
  enabled: process.env.NODE_ENV === 'development',
  features: {
    actions: process.env.NODE_ENV === 'development',
    stores: false,
    computed: false,
    performance: false,
    errors: process.env.NODE_ENV === 'development',
    refs: false,
    immutability: false
  },
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  logger: undefined
};

/**
 * Current debug configuration
 */
let currentConfig: DebugConfig = { ...defaultConfig };

/**
 * Set global debug configuration
 * 
 * @param config - Partial configuration to merge with current
 * 
 * @example
 * ```typescript
 * // Disable all debug output in production
 * setDebugConfig({ enabled: false });
 * 
 * // Enable only action debugging
 * setDebugConfig({
 *   enabled: true,
 *   features: {
 *     actions: true,
 *     stores: false,
 *     computed: false
 *   }
 * });
 * 
 * // Use custom logger (e.g., for Sentry or other logging services)
 * setDebugConfig({
 *   logger: {
 *     error: (msg, ...args) => Sentry.captureMessage(msg, 'error'),
 *     warn: (msg, ...args) => console.warn(msg, ...args),
 *     info: () => {}, // Disable info logs
 *     debug: () => {}, // Disable debug logs
 *     trace: () => {} // Disable trace logs
 *   }
 * });
 * ```
 */
export function setDebugConfig(config: Partial<DebugConfig>): void {
  if (config.features) {
    currentConfig.features = {
      ...currentConfig.features,
      ...config.features
    };
  }
  
  if (config.logger) {
    currentConfig.logger = config.logger;
  }
  
  if (config.enabled !== undefined) {
    currentConfig.enabled = config.enabled;
  }
  
  if (config.logLevel) {
    currentConfig.logLevel = config.logLevel;
  }
}

/**
 * Get current debug configuration
 */
export function getDebugConfig(): Readonly<DebugConfig> {
  return { ...currentConfig };
}

/**
 * Reset debug configuration to defaults
 */
export function resetDebugConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Log level priorities for comparison
 */
const logLevelPriority: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

/**
 * Check if a specific feature's debug output is enabled
 */
export function isDebugEnabled(feature: keyof DebugConfig['features']): boolean {
  return currentConfig.enabled && currentConfig.features[feature];
}

/**
 * Check if a log level is enabled
 */
export function isLogLevelEnabled(level: keyof typeof logLevelPriority): boolean {
  const currentLevel = logLevelPriority[currentConfig.logLevel];
  const targetLevel = logLevelPriority[level];
  return currentLevel !== undefined && targetLevel !== undefined && targetLevel <= currentLevel;
}

/**
 * Debug logger with conditional output
 */
export const debugLog = {
  error: (feature: keyof DebugConfig['features'], message: string, ...args: unknown[]) => {
    if (isDebugEnabled(feature) && isLogLevelEnabled('error')) {
      const logger = currentConfig.logger?.error || console.error;
      logger(`[Context-Action:${feature}] ${message}`, ...args);
    }
  },

  warn: (feature: keyof DebugConfig['features'], message: string, ...args: unknown[]) => {
    if (isDebugEnabled(feature) && isLogLevelEnabled('warn')) {
      const logger = currentConfig.logger?.warn || console.warn;
      logger(`[Context-Action:${feature}] ${message}`, ...args);
    }
  },

  info: (feature: keyof DebugConfig['features'], message: string, ...args: unknown[]) => {
    if (isDebugEnabled(feature) && isLogLevelEnabled('info')) {
      const logger = currentConfig.logger?.info || console.info;
      logger(`[Context-Action:${feature}] ${message}`, ...args);
    }
  },

  debug: (feature: keyof DebugConfig['features'], message: string, ...args: unknown[]) => {
    if (isDebugEnabled(feature) && isLogLevelEnabled('debug')) {
      const logger = currentConfig.logger?.debug || console.debug;
      logger(`[Context-Action:${feature}] ${message}`, ...args);
    }
  },

  trace: (feature: keyof DebugConfig['features'], message: string, ...args: unknown[]) => {
    if (isDebugEnabled(feature) && isLogLevelEnabled('trace')) {
      const logger = currentConfig.logger?.trace || console.trace;
      logger(`[Context-Action:${feature}] ${message}`, ...args);
    }
  }
};

/**
 * Environment-based configuration helper
 * Automatically configures debug settings based on environment variables
 */
export function configureDebugForEnvironment(): void {
  // Check for environment variables
  const debugEnabled = process.env.REACT_APP_DEBUG === 'true' || 
                       process.env.NEXT_PUBLIC_DEBUG === 'true' ||
                       process.env.VITE_DEBUG === 'true';
  
  const debugFeatures = process.env.REACT_APP_DEBUG_FEATURES || 
                        process.env.NEXT_PUBLIC_DEBUG_FEATURES ||
                        process.env.VITE_DEBUG_FEATURES;
  
  if (debugEnabled !== undefined) {
    setDebugConfig({ enabled: debugEnabled });
  }
  
  if (debugFeatures) {
    const features = debugFeatures.split(',').reduce((acc, feature) => {
      const trimmed = feature.trim() as keyof DebugConfig['features'];
      if (trimmed in defaultConfig.features) {
        acc[trimmed] = true;
      }
      return acc;
    }, {} as Record<keyof DebugConfig['features'], boolean>);
    
    setDebugConfig({ features });
  }
}

// Auto-configure on module load
if (typeof window !== 'undefined') {
  configureDebugForEnvironment();
}