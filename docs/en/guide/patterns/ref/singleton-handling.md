# Context Singleton Handling

Context singleton management patterns using RefContext for lazy evaluation and proper lifecycle control in the Context-Action framework.

## Prerequisites

Refer to **[RefContext Setup](../setup/ref-context-setup.md)** for:
- Import statements and basic setup
- Type definitions (ServiceRefs, ManagerRefs, etc.)
- Provider composition patterns
- Initialization patterns

## Import
```typescript
import { createRefContext } from '@context-action/react';
```

## Definition

**Context Singleton**: An object that exists as a single instance within a specific React context boundary, managed through RefContext for lazy evaluation and proper lifecycle control.

## Core Concepts

### Context Singleton vs Code Singleton

**Context Singleton**
- **Scope**: React context boundary (Provider → Provider)
- **Lifecycle**: Tied to context mounting/unmounting  
- **Configuration**: Can vary per context instance
- **Purpose**: Context-specific, user-specific, or environment-specific instances

**Code Singleton** 
- **Scope**: Module/global scope across entire application
- **Lifecycle**: Application lifetime (static)
- **Configuration**: Fixed at module load time
- **Purpose**: Truly global, stateless utilities

### Lazy Evaluation

**Definition**: Object creation and initialization deferred until first access, not at context creation time.

**Mechanism**: RefContext provides reference holders that remain empty until explicitly populated through `setRef()` calls.

**Benefits**:
- **Performance**: Expensive objects created only when needed
- **Resource Efficiency**: Unused singletons consume no resources
- **Conditional Logic**: Different singletons can be created based on runtime conditions

### Lightweight Ref Wrapper

**Definition**: RefContext acts as a minimal container that holds references to external objects without coupling them to React's lifecycle.

**Characteristics**:
- **Zero React Coupling**: External objects remain independent
- **Reference Management**: Provides `target` property for object access
- **Type Safety**: Full TypeScript support for referenced objects
- **Lifecycle Independence**: Objects can exist beyond React component lifecycles

## Architectural Principles

### Scope Isolation

**Principle**: Each context boundary maintains its own singleton instances, preventing global state interference.

**Implementation**: Multiple Provider instances create separate singleton scopes:
- Provider A → Singleton Instance A  
- Provider B → Singleton Instance B
- No shared state between contexts

### Context-Driven Lifecycle

**Principle**: Singleton lifecycle is tied to context mounting/unmounting, not component lifecycles.

**Lifecycle Events**:
- **Context Mount**: Singleton creation opportunity
- **Context Active**: Singleton access and usage
- **Context Unmount**: Singleton cleanup and disposal

### Configuration Flexibility

**Principle**: Each context can configure its singletons differently based on context-specific needs.

**Configuration Sources**:
- User-specific settings
- Environment variables  
- Feature flags
- A/B test variants
- Multi-tenant configurations

## Decision Framework

### Use Code Singletons When:
- Object is stateless and immutable
- Configuration never changes at runtime
- No context-specific behavior required
- No cleanup or disposal needed
- Truly global application utilities

### Use Context Singletons When:
- User-specific or tenant-specific instances needed
- Environment-dependent configurations required
- Testing requires isolated instances
- Lifecycle tied to specific contexts
- Resource cleanup necessary on context unmount

## Implementation Patterns

### Service Singleton Pattern

**Setup**: Uses ServiceRefs from RefContext setup for external service management.

```typescript
// Service singleton management
interface ServiceRefs {
  apiClient: any; // REST API client instance
  websocketManager: WebSocket;
  cacheService: Cache;
  analyticsTracker: any; // Analytics service instance
}

const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef
} = createRefContext<ServiceRefs>('Services');

function useServiceSingletons() {
  const apiClient = useServiceRef('apiClient');
  const websocket = useServiceRef('websocketManager');
  const cache = useServiceRef('cacheService');
  const analytics = useServiceRef('analyticsTracker');
  
  // Lazy initialization pattern
  const initializeServices = useCallback(() => {
    if (!apiClient.target) {
      apiClient.setRef(new APIClient({
        baseURL: process.env.REACT_APP_API_URL,
        timeout: 10000,
        retries: 3
      }));
    }
    
    if (!websocket.target && shouldEnableRealtime) {
      const ws = new WebSocket(process.env.REACT_APP_WS_URL!);
      ws.onopen = () => console.log('WebSocket connected');
      ws.onclose = () => console.log('WebSocket disconnected');
      websocket.setRef(ws);
    }
    
    if (!cache.target) {
      caches.open('app-cache-v1').then(cache => {
        cache.setRef(cache);
      });
    }
  }, [apiClient, websocket, cache]);
  
  return { initializeServices };
}
```

### Manager Singleton Pattern

**Setup**: Uses ManagerRefs for heavy computational objects.

```typescript
// Manager singleton for heavy computation
interface ManagerRefs {
  dataProcessor: any; // Heavy data processing engine
  reportGenerator: any; // Report generation service
  fileManager: any; // File operation manager
  notificationManager: any; // Notification service
}

const {
  Provider: ManagerRefProvider,
  useRefHandler: useManagerRef
} = createRefContext<ManagerRefs>('Managers');

function useManagerSingletons() {
  const dataProcessor = useManagerRef('dataProcessor');
  const reportGenerator = useManagerRef('reportGenerator');
  const fileManager = useManagerRef('fileManager');
  const notifications = useManagerRef('notificationManager');
  
  // On-demand initialization with configuration
  const initializeManagers = useCallback((userConfig: any) => {
    if (!dataProcessor.target) {
      // Heavy initialization only when needed
      import('../services/DataProcessor').then(({ DataProcessor }) => {
        const processor = new DataProcessor({
          workerCount: navigator.hardwareConcurrency || 4,
          memoryLimit: userConfig.memoryLimit,
          useWebAssembly: userConfig.enableWASM
        });
        dataProcessor.setRef(processor);
      });
    }
    
    if (!reportGenerator.target) {
      import('../services/ReportGenerator').then(({ ReportGenerator }) => {
        const generator = new ReportGenerator({
          templates: userConfig.reportTemplates,
          outputFormats: ['pdf', 'excel', 'csv'],
          maxConcurrentJobs: 3
        });
        reportGenerator.setRef(generator);
      });
    }
  }, [dataProcessor, reportGenerator, userConfig]);
  
  return { initializeManagers };
}
```

### Context-Specific Singleton Pattern

**Setup**: Different singleton configurations per context boundary.

```typescript
// User-specific singleton configuration
interface UserSingletons {
  userDataService: any;
  userPreferences: any;
  userNotifications: any;
}

function UserContextProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const {
    Provider: UserRefProvider,
    useRefHandler: useUserRef
  } = createRefContext<UserSingletons>('UserContext');
  
  return (
    <UserRefProvider>
      <UserSingletonInitializer userId={userId} />
      {children}
    </UserRefProvider>
  );
}

function UserSingletonInitializer({ userId }: { userId: string }) {
  const userDataService = useUserRef('userDataService');
  const userPreferences = useUserRef('userPreferences');
  const userNotifications = useUserRef('userNotifications');
  
  useEffect(() => {
    // Context-specific initialization
    if (!userDataService.target) {
      userDataService.setRef(new UserDataService({
        userId,
        cachePolicy: 'user-specific',
        syncInterval: 30000
      }));
    }
    
    if (!userPreferences.target) {
      userPreferences.setRef(new UserPreferencesManager({
        userId,
        autoSave: true,
        localBackup: true
      }));
    }
    
    if (!userNotifications.target) {
      userNotifications.setRef(new NotificationManager({
        userId,
        channels: ['push', 'email', 'sms'],
        preferences: userPreferences.target?.getNotificationSettings()
      }));
    }
    
    // Cleanup on user context change
    return () => {
      userDataService.target?.cleanup();
      userPreferences.target?.save();
      userNotifications.target?.disconnect();
    };
  }, [userId, userDataService, userPreferences, userNotifications]);
  
  return null;
}
```

### Lifecycle Management Patterns  

**Cleanup on Unmount**: Essential pattern for resource management with proper singleton disposal.

```typescript
// Comprehensive cleanup pattern
function useSingletonCleanup() {
  const services = useServiceRef();
  const managers = useManagerRef();
  
  useEffect(() => {
    return () => {
      // Service cleanup
      services.apiClient?.target?.disconnect();
      services.websocketManager?.target?.close();
      services.cacheService?.target?.clear();
      services.analyticsTracker?.target?.flush();
      
      // Manager cleanup
      managers.dataProcessor?.target?.terminate();
      managers.reportGenerator?.target?.cancelAllJobs();
      managers.fileManager?.target?.cleanup();
      managers.notificationManager?.target?.unsubscribeAll();
    };
  }, [services, managers]);
}
```

**Lazy Disposal**: Defer cleanup until necessary with smart resource management.

```typescript
// Smart cleanup with resource monitoring
function useSmartSingletonDisposal() {
  const [resourceUsage, setResourceUsage] = useState(0);
  const services = useServiceRef();
  
  useEffect(() => {
    const monitor = setInterval(() => {
      // Monitor resource usage
      const usage = performance.memory?.usedJSHeapSize || 0;
      setResourceUsage(usage);
      
      // Lazy disposal when resources are high
      if (usage > MEMORY_THRESHOLD) {
        // Dispose non-critical singletons
        services.cacheService?.target?.cleanup();
        services.analyticsTracker?.target?.pause();
      }
    }, 5000);
    
    return () => clearInterval(monitor);
  }, [services]);
}
```

## Conceptual Boundaries

### What Context Singletons ARE:
- **Scoped Objects**: Exist within specific context boundaries
- **External Resources**: Database connections, API clients, third-party SDKs
- **Stateful Services**: Objects that maintain internal state
- **Context-Configurable**: Can be configured differently per context

### What Context Singletons are NOT:
- **React State**: Not for managing reactive UI state
- **Global Objects**: Not for application-wide singletons
- **Component Data**: Not for component-local data
- **State Replacement**: Not a substitute for store patterns

## Relationship to Other Patterns

### vs Store Patterns
- **Stores**: Reactive state management with subscriptions
- **Context Singletons**: External object management without reactivity

### vs React Context
- **React Context**: Direct value sharing across components  
- **RefContext**: Reference management for external objects

### vs Dependency Injection
- **DI**: Provides dependencies through constructor injection
- **Context Singletons**: Provides context-scoped dependencies through hooks

## Key Takeaways

### Core Understanding
1. **Context Singletons** exist once per context boundary, not globally
2. **Lazy Evaluation** defers object creation until first access  
3. **Lightweight Wrapper** provides reference management without React coupling
4. **Scope Isolation** prevents interference between different contexts

### Design Decisions
- Choose **Code Singletons** for stateless, global utilities
- Choose **Context Singletons** for configurable, context-specific objects
- Use **RefContext** for external object management, not reactive state
- Implement proper **cleanup patterns** to prevent resource leaks

### Architectural Benefits  
- **Testability**: Isolated instances per context enable better testing
- **Flexibility**: Different configurations per context support multi-tenancy  
- **Performance**: Lazy evaluation reduces unnecessary resource consumption
- **Maintainability**: Clear separation between singleton types and responsibilities

## Multi-Context Singleton Management

### Singleton Sharing Across Contexts

```typescript
// Shared singleton pool pattern
interface SharedSingletons {
  globalCache: Cache;
  systemLogger: any;
  configManager: any;
}

interface DomainSingletons {
  domainService: any;
  domainProcessor: any;
}

// Global shared singletons
const {
  Provider: SharedRefProvider,
  useRefHandler: useSharedRef
} = createRefContext<SharedSingletons>('Shared');

// Domain-specific singletons
const {
  Provider: DomainRefProvider,
  useRefHandler: useDomainRef
} = createRefContext<DomainSingletons>('Domain');

function MultiContextApp() {
  return (
    <SharedRefProvider>
      <DomainRefProvider>
        <DomainAComponents />
      </DomainRefProvider>
      <DomainRefProvider>
        <DomainBComponents />
      </DomainRefProvider>
    </SharedRefProvider>
  );
}
```

### Environment-Specific Singletons

```typescript
// Environment-based singleton configuration
function createEnvironmentSingletons(environment: 'development' | 'staging' | 'production') {
  const config = {
    development: {
      apiUrl: 'http://localhost:3001',
      enableMocking: true,
      logLevel: 'debug'
    },
    staging: {
      apiUrl: 'https://staging-api.example.com',
      enableMocking: false,
      logLevel: 'info'
    },
    production: {
      apiUrl: 'https://api.example.com',
      enableMocking: false,
      logLevel: 'error'
    }
  }[environment];
  
  return createRefContext<ServiceRefs>(`Services-${environment}`);
}

const EnvironmentServices = createEnvironmentSingletons(process.env.NODE_ENV);
```

## Related Patterns

- **[RefContext Setup](../setup/ref-context-setup.md)** - Complete setup patterns and type definitions
- **[Context Splitting](../architecture/context-splitting.md)** - Managing singleton objects across split contexts
- **[RefContext Basic Usage](./basic-usage.md)** - Foundation RefContext patterns
- **[Memory Optimization](./memory-optimization.md)** - Singleton lifecycle and memory management