# Handler Registry Pattern

A comprehensive guide to centralized handler ID and priority management in Context-Layered Architecture.

## 🎯 Overview

The Handler Registry Pattern provides centralized management of handler identifiers, priorities, and dispatch names. This ensures consistent naming conventions, prevents ID conflicts, and enables dynamic handler configuration.

## 🏗️ Core Registry Structure

### Basic Handler Registry

```typescript
// handlers/handler-registry.ts

export interface HandlerConfig {
  readonly id: string;
  readonly priority: number;
  readonly dispatchName: string;
  readonly description?: string;
}

export interface HandlerFactoryOptions {
  basePriority?: number;
  priorityIncrement?: number;
  modulePrefix?: string;
}

/**
 * Factory function to create consistent handler configurations
 */
export function createHandlerConfig(
  domain: string,
  action: string,
  priority: number,
  options?: { description?: string }
): HandlerConfig {
  return {
    id: `${domain}.${action}`,
    priority,
    dispatchName: action,
    description: options?.description
  } as const;
}

/**
 * Factory function for module-specific handler configurations
 */
export function createModuleHandlerConfig(
  moduleId: string,
  domain: string,
  action: string,
  priority: number
): HandlerConfig {
  return {
    id: `${moduleId}.${domain}.${action}`,
    priority,
    dispatchName: action,
    description: `${action} handler for ${moduleId} module`
  } as const;
}
```

### Domain-Specific Handler Registries

```typescript
// handlers/checkout-registry.ts
export const CHECKOUT_HANDLERS = {
  // Validation handlers (100-199)
  VALIDATE: createHandlerConfig('checkout', 'validate', 100, {
    description: 'Validate checkout form data'
  }),
  VALIDATE_ADDRESS: createHandlerConfig('checkout', 'validateAddress', 110, {
    description: 'Validate shipping address'
  }),
  VALIDATE_PAYMENT: createHandlerConfig('checkout', 'validatePayment', 120, {
    description: 'Validate payment information'
  }),
  
  // Processing handlers (200-299)
  SUBMIT: createHandlerConfig('checkout', 'submit', 200, {
    description: 'Submit checkout order'
  }),
  CALCULATE_TOTALS: createHandlerConfig('checkout', 'calculateTotals', 210, {
    description: 'Calculate order totals'
  }),
  APPLY_DISCOUNT: createHandlerConfig('checkout', 'applyDiscount', 220, {
    description: 'Apply discount codes'
  }),
  
  // Cleanup handlers (300-399)
  RESET: createHandlerConfig('checkout', 'reset', 300, {
    description: 'Reset checkout form'
  }),
  CLEAR_ERRORS: createHandlerConfig('checkout', 'clearErrors', 310, {
    description: 'Clear validation errors'
  })
} as const;

export const PAYMENT_HANDLERS = {
  // Payment validation (400-499)
  VALIDATE_CARD: createHandlerConfig('payment', 'validateCard', 400),
  VALIDATE_BILLING: createHandlerConfig('payment', 'validateBilling', 410),
  
  // Payment processing (500-599)
  PROCESS: createHandlerConfig('payment', 'process', 500),
  AUTHORIZE: createHandlerConfig('payment', 'authorize', 510),
  CAPTURE: createHandlerConfig('payment', 'capture', 520),
  
  // Payment cleanup (600-699)
  CANCEL: createHandlerConfig('payment', 'cancel', 600),
  REFUND: createHandlerConfig('payment', 'refund', 610)
} as const;
```

## 🏭 Dynamic Handler Generation

### Incremental ID Generation

```typescript
// handlers/dynamic-registry.ts
export class DynamicHandlerRegistry {
  private static handlerCounters = new Map<string, number>();
  private static registeredHandlers = new Map<string, HandlerConfig>();
  
  /**
   * Generate incremental handler ID for dynamic handlers
   */
  static generateIncrementalId(baseActionId: string, moduleId?: string): string {
    const key = moduleId ? `${moduleId}.${baseActionId}` : baseActionId;
    const currentCount = this.handlerCounters.get(key) || 0;
    const newCount = currentCount + 1;
    
    this.handlerCounters.set(key, newCount);
    
    return newCount === 1 ? key : `${key}.${newCount}`;
  }
  
  /**
   * Calculate dynamic priority based on existing handlers
   */
  static calculateDynamicPriority(
    baseActionId: string, 
    basePriority: number,
    increment: number = 10
  ): number {
    const existingHandlers = Array.from(this.registeredHandlers.values())
      .filter(handler => handler.id.includes(baseActionId));
    
    return basePriority + (existingHandlers.length * increment);
  }
  
  /**
   * Register a dynamic handler
   */
  static registerDynamicHandler(
    baseActionId: string,
    basePriority: number,
    moduleId?: string,
    options?: { description?: string; priorityIncrement?: number }
  ): HandlerConfig {
    const id = this.generateIncrementalId(baseActionId, moduleId);
    const priority = this.calculateDynamicPriority(
      baseActionId, 
      basePriority, 
      options?.priorityIncrement
    );
    
    const config: HandlerConfig = {
      id,
      priority,
      dispatchName: baseActionId.split('.').pop() || baseActionId,
      description: options?.description || `Dynamic ${baseActionId} handler`
    };
    
    this.registeredHandlers.set(id, config);
    return config;
  }
  
  /**
   * Get all registered handlers for debugging
   */
  static getRegisteredHandlers(): HandlerConfig[] {
    return Array.from(this.registeredHandlers.values())
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Clear registry (useful for testing)
   */
  static clearRegistry(): void {
    this.handlerCounters.clear();
    this.registeredHandlers.clear();
  }
}
```

### Module-Specific Registry Factory

```typescript
// handlers/module-registry-factory.ts
export interface ModuleRegistryConfig {
  moduleId: string;
  basePriority: number;
  priorityIncrement: number;
}

export function createModuleRegistry(config: ModuleRegistryConfig) {
  const { moduleId, basePriority, priorityIncrement } = config;
  
  return {
    /**
     * Create handler config for this module
     */
    createHandler(domain: string, action: string, priorityOffset: number = 0): HandlerConfig {
      return createModuleHandlerConfig(
        moduleId,
        domain,
        action,
        basePriority + priorityOffset
      );
    },
    
    /**
     * Create incremental handler for dynamic scenarios
     */
    createIncrementalHandler(domain: string, action: string): HandlerConfig {
      return DynamicHandlerRegistry.registerDynamicHandler(
        `${domain}.${action}`,
        basePriority,
        moduleId,
        { priorityIncrement }
      );
    },
    
    /**
     * Create handler group with consistent priority spacing
     */
    createHandlerGroup(domain: string, actions: string[]): Record<string, HandlerConfig> {
      const handlers: Record<string, HandlerConfig> = {};
      
      actions.forEach((action, index) => {
        const key = action.toUpperCase();
        handlers[key] = this.createHandler(domain, action, index * priorityIncrement);
      });
      
      return handlers;
    }
  };
}

// Usage example
const checkoutModuleRegistry = createModuleRegistry({
  moduleId: 'checkout-v2',
  basePriority: 1000,
  priorityIncrement: 10
});

export const CHECKOUT_V2_HANDLERS = {
  ...checkoutModuleRegistry.createHandlerGroup('validation', [
    'validateForm',
    'validateAddress',
    'validatePayment'
  ]),
  ...checkoutModuleRegistry.createHandlerGroup('processing', [
    'submit',
    'calculateTotals',
    'applyDiscount'
  ])
};
```

## 🔍 Registry Utilities

### Handler Discovery and Validation

```typescript
// handlers/registry-utils.ts
export class HandlerRegistryUtils {
  /**
   * Find handlers by pattern
   */
  static findHandlersByPattern(pattern: RegExp): HandlerConfig[] {
    return Object.values({
      ...CHECKOUT_HANDLERS,
      ...PAYMENT_HANDLERS,
      // Add other handler registries...
    }).filter(handler => pattern.test(handler.id));
  }
  
  /**
   * Get handlers by priority range
   */
  static getHandlersByPriorityRange(min: number, max: number): HandlerConfig[] {
    return Object.values({
      ...CHECKOUT_HANDLERS,
      ...PAYMENT_HANDLERS,
      // Add other handler registries...
    }).filter(handler => handler.priority >= min && handler.priority <= max)
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Validate handler ID uniqueness
   */
  static validateHandlerIds(): { isValid: boolean; conflicts: string[] } {
    const allHandlers = [
      ...Object.values(CHECKOUT_HANDLERS),
      ...Object.values(PAYMENT_HANDLERS),
      ...DynamicHandlerRegistry.getRegisteredHandlers()
    ];
    
    const idCounts = new Map<string, number>();
    allHandlers.forEach(handler => {
      idCounts.set(handler.id, (idCounts.get(handler.id) || 0) + 1);
    });
    
    const conflicts = Array.from(idCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
    
    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }
  
  /**
   * Generate priority suggestions for new handlers
   */
  static suggestPriority(domain: string): number {
    const domainHandlers = this.findHandlersByPattern(new RegExp(`^[^.]*\\.${domain}\\.`));
    
    if (domainHandlers.length === 0) {
      // Suggest base priority for new domain
      return 100;
    }
    
    const maxPriority = Math.max(...domainHandlers.map(h => h.priority));
    return maxPriority + 10;
  }
}
```

### Registry Documentation Generator

```typescript
// handlers/registry-docs.ts
export class RegistryDocumentationGenerator {
  /**
   * Generate markdown documentation for all handlers
   */
  static generateMarkdownDocs(): string {
    const allHandlers = [
      ...Object.values(CHECKOUT_HANDLERS),
      ...Object.values(PAYMENT_HANDLERS),
      ...DynamicHandlerRegistry.getRegisteredHandlers()
    ].sort((a, b) => a.priority - b.priority);
    
    let docs = '# Handler Registry Documentation\n\n';
    docs += '## Registered Handlers\n\n';
    docs += '| ID | Priority | Dispatch Name | Description |\n';
    docs += '|----|----------|---------------|-------------|\n';
    
    allHandlers.forEach(handler => {
      docs += `| \`${handler.id}\` | ${handler.priority} | \`${handler.dispatchName}\` | ${handler.description || 'N/A'} |\n`;
    });
    
    return docs;
  }
  
  /**
   * Generate TypeScript type definitions
   */
  static generateTypeDefinitions(): string {
    const allHandlers = [
      ...Object.values(CHECKOUT_HANDLERS),
      ...Object.values(PAYMENT_HANDLERS)
    ];
    
    const dispatchNames = [...new Set(allHandlers.map(h => h.dispatchName))];
    
    let typeDefs = 'export type HandlerDispatchNames = \n';
    typeDefs += dispatchNames.map(name => `  | '${name}'`).join('\n');
    typeDefs += ';\n\n';
    
    typeDefs += 'export type HandlerIds = \n';
    typeDefs += allHandlers.map(h => `  | '${h.id}'`).join('\n');
    typeDefs += ';\n';
    
    return typeDefs;
  }
}
```

## 🧪 Testing Registry Patterns

### Registry Testing Utilities

```typescript
// __tests__/registry.test.ts
describe('Handler Registry', () => {
  beforeEach(() => {
    DynamicHandlerRegistry.clearRegistry();
  });
  
  it('should generate unique incremental IDs', () => {
    const id1 = DynamicHandlerRegistry.generateIncrementalId('test.action');
    const id2 = DynamicHandlerRegistry.generateIncrementalId('test.action');
    
    expect(id1).toBe('test.action');
    expect(id2).toBe('test.action.2');
  });
  
  it('should calculate dynamic priorities correctly', () => {
    DynamicHandlerRegistry.registerDynamicHandler('test.action', 100);
    DynamicHandlerRegistry.registerDynamicHandler('test.action', 100);
    
    const priority = DynamicHandlerRegistry.calculateDynamicPriority('test.action', 100);
    expect(priority).toBe(120); // 100 + (2 * 10)
  });
  
  it('should validate handler ID uniqueness', () => {
    const validation = HandlerRegistryUtils.validateHandlerIds();
    expect(validation.isValid).toBe(true);
    expect(validation.conflicts).toHaveLength(0);
  });
});
```

## 📋 Best Practices

### Do's ✅
- **Use descriptive, consistent naming conventions**
- **Group handlers by priority ranges (100s for validation, 200s for processing, etc.)**
- **Always provide descriptions for complex handlers**
- **Use factory functions for consistent configuration**
- **Validate handler ID uniqueness in tests**
- **Document priority conventions in your team**

### Don'ts ❌
- **Don't hardcode handler IDs in multiple places**
- **Don't skip priority planning for new handler groups**
- **Don't create overlapping priority ranges**
- **Don't forget to update registries when adding new handlers**
- **Don't use magic numbers for priorities**

### Registry Conventions 📏
- **Validation handlers**: 100-199
- **Business logic handlers**: 200-299  
- **Cleanup handlers**: 300-399
- **External API handlers**: 400-499
- **Module-specific ranges**: Start from 1000+ with moduleId prefix

This registry pattern ensures consistent, maintainable, and conflict-free handler management across your Context-Layered Architecture application.