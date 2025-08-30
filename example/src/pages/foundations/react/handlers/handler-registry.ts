// ==============================================
// HANDLER REGISTRY - Context-Layered Architecture
// ==============================================

export interface HandlerConfig {
  readonly id: string;
  readonly priority: number;
  readonly dispatchName: string;
  readonly description?: string;
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

// ==============================================
// PARENT DOMAIN HANDLERS
// ==============================================

export const PARENT_HANDLERS = {
  // Counter handlers (100-199)
  INCREMENT_COUNTER: createHandlerConfig('parent', 'incrementParentCounter', 100, {
    description: 'Increment parent counter by 1'
  }),
  RESET_COUNTER: createHandlerConfig('parent', 'resetParentCounter', 110, {
    description: 'Reset parent counter to 0'
  }),
  
  // Control handlers (200-299)
  REQUEST_CHILD_CONTROL: createHandlerConfig('parent', 'requestChildControl', 200, {
    description: 'Request control action on child components'
  }),
  
  // Data handlers (300-399)
  ON_CHILD_REGISTERED: createHandlerConfig('parent', 'onChildRegistered', 300, {
    description: 'Handle child component registration'
  })
} as const;

// ==============================================
// CHILD A DOMAIN HANDLERS  
// ==============================================

export const CHILD_A_HANDLERS = {
  // Counter handlers (400-499)
  INCREMENT_COUNTER: createHandlerConfig('child-a', 'incrementCounter', 400, {
    description: 'Increment child A counter'
  }),
  RESET_COUNTER: createHandlerConfig('child-a', 'resetCounter', 410, {
    description: 'Reset child A counter'
  }),
  
  // Control handlers (500-599)
  REQUEST_CHILD_CONTROL: createHandlerConfig('child-a', 'requestChildControl', 500, {
    description: 'Handle control requests for child A'
  })
} as const;

// ==============================================
// CHILD B DOMAIN HANDLERS
// ==============================================

export const CHILD_B_HANDLERS = {
  // Text handlers (600-699)
  UPDATE_TEXT: createHandlerConfig('child-b', 'updateText', 600, {
    description: 'Update child B text content'
  }),
  CLEAR_TEXT: createHandlerConfig('child-b', 'clearText', 610, {
    description: 'Clear child B text content'
  })
} as const;

// ==============================================
// REGISTRY UTILITIES
// ==============================================

/**
 * Get all registered handlers sorted by priority
 */
export function getAllHandlers(): HandlerConfig[] {
  return [
    ...Object.values(PARENT_HANDLERS),
    ...Object.values(CHILD_A_HANDLERS),
    ...Object.values(CHILD_B_HANDLERS)
  ].sort((a, b) => a.priority - b.priority);
}

/**
 * Find handler by ID
 */
export function findHandlerById(handlerId: string): HandlerConfig | undefined {
  return getAllHandlers().find(handler => handler.id === handlerId);
}

/**
 * Get handlers by domain
 */
export function getHandlersByDomain(domain: string): HandlerConfig[] {
  return getAllHandlers().filter(handler => handler.id.startsWith(domain));
}