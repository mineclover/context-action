# Props-based Handler Patterns

A comprehensive guide to implementing handlers using props-based dependency injection in Context-Layered Architecture.

## 🎯 Overview

Props-based handlers are the core pattern for implementing business logic in Context-Layered Architecture. They provide flexible dependency injection, testability, and clear separation from UI components.

## 🏗️ Core Pattern

### Basic Handler Structure

```typescript
// handlers/useCheckoutHandlers.ts
export interface CheckoutHandlerProps {
  moduleId: string;
  customPriority?: number;
  apiClient: ApiClient;
  validator: FormValidator;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useCheckoutValidateHandler(props: CheckoutHandlerProps) {
  const { moduleId, customPriority, apiClient, validator, onSuccess, onError } = props;
  
  // Context-based dependencies
  const checkoutStore = useCheckoutStore('checkout-data');
  const validationStore = useCheckoutStore('validation-state');
  
  useActionHandler(
    `${moduleId}.checkout.validate`,
    async (payload: CheckoutData) => {
      try {
        // Step 1: Read current state
        const currentData = checkoutStore.getValue();
        
        // Step 2: Execute business logic with injected dependencies
        const isValid = await validator.validate(payload);
        
        if (isValid) {
          const result = await apiClient.saveCheckout(payload);
          
          // Step 3: Update stores
          checkoutStore.setValue({ ...currentData, ...payload });
          validationStore.setValue({ isValid: true, errors: [] });
          
          onSuccess?.(result);
        } else {
          validationStore.setValue({ 
            isValid: false, 
            errors: validator.getErrors() 
          });
          onError?.(new Error('Validation failed'));
        }
      } catch (error) {
        onError?.(error as Error);
        validationStore.setValue({ 
          isValid: false, 
          errors: [{ message: 'System error occurred' }] 
        });
      }
    },
    customPriority || CHECKOUT_HANDLERS.VALIDATE.priority
  );
}
```

## 🎯 Dependency Injection Patterns

### 1. Service Dependencies
Inject external services through props:

```typescript
export interface HandlerServiceDeps {
  apiClient: ApiClient;
  validator: FormValidator;
  logger: Logger;
  analyticsTracker: AnalyticsTracker;
}

export function useOrderProcessHandler(deps: HandlerServiceDeps & { orderId: string }) {
  const { apiClient, validator, logger, analyticsTracker, orderId } = deps;
  
  useActionHandler('process.order', async (payload) => {
    logger.info('Processing order', { orderId, payload });
    
    const isValid = await validator.validate(payload);
    if (!isValid) {
      analyticsTracker.track('order.validation.failed', { orderId });
      throw new Error('Invalid order data');
    }
    
    const result = await apiClient.processOrder(orderId, payload);
    analyticsTracker.track('order.processed', { orderId, result });
    
    return result;
  });
}
```

### 2. Configuration Dependencies
Pass configuration through props:

```typescript
export interface HandlerConfigDeps {
  retryAttempts: number;
  timeout: number;
  enableDebug: boolean;
  environment: 'dev' | 'staging' | 'prod';
}

export function useApiRequestHandler(config: HandlerConfigDeps) {
  const { retryAttempts, timeout, enableDebug, environment } = config;
  
  useActionHandler('api.request', async (payload) => {
    const requestConfig = {
      timeout,
      retries: retryAttempts,
      debug: enableDebug && environment !== 'prod'
    };
    
    // Implementation with config...
  });
}
```

### 3. Callback Dependencies
Provide success/error callbacks:

```typescript
export interface HandlerCallbackDeps {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useFileUploadHandler(deps: HandlerCallbackDeps) {
  const { onSuccess, onError, onProgress } = deps;
  
  useActionHandler('file.upload', async (file: File) => {
    try {
      const result = await uploadWithProgress(file, (progress) => {
        onProgress?.(progress);
      });
      
      onSuccess?.(result);
    } catch (error) {
      onError?.(error as Error);
    }
  });
}
```

## 🔄 Handler Composition Patterns

### 1. Handler Groups
Group related handlers together:

```typescript
// handlers/useCheckoutHandlerGroup.ts
export interface CheckoutHandlerGroupProps {
  moduleId: string;
  apiClient: ApiClient;
  validator: FormValidator;
  paymentProcessor: PaymentProcessor;
}

export function useCheckoutHandlerGroup(props: CheckoutHandlerGroupProps) {
  // Individual handler props
  const baseProps = {
    moduleId: props.moduleId,
    apiClient: props.apiClient,
    validator: props.validator
  };
  
  // Register all checkout-related handlers
  useCheckoutValidateHandler(baseProps);
  useCheckoutSubmitHandler({ 
    ...baseProps, 
    paymentProcessor: props.paymentProcessor 
  });
  useCheckoutResetHandler(baseProps);
}
```

### 2. Conditional Handler Registration
Register handlers based on conditions:

```typescript
export interface ConditionalHandlerProps {
  moduleId: string;
  features: {
    enableValidation: boolean;
    enableAutoSave: boolean;
    enableAnalytics: boolean;
  };
  dependencies: HandlerServiceDeps;
}

export function useConditionalHandlers(props: ConditionalHandlerProps) {
  const { moduleId, features, dependencies } = props;
  
  // Always register core handlers
  useCoreHandlers({ moduleId, ...dependencies });
  
  // Conditionally register feature handlers
  if (features.enableValidation) {
    useValidationHandlers({ moduleId, validator: dependencies.validator });
  }
  
  if (features.enableAutoSave) {
    useAutoSaveHandlers({ moduleId, apiClient: dependencies.apiClient });
  }
  
  if (features.enableAnalytics) {
    useAnalyticsHandlers({ moduleId, tracker: dependencies.analyticsTracker });
  }
}
```

## 🧪 Testing Patterns

### 1. Handler Unit Testing
Test handlers in isolation with mock dependencies:

```typescript
// __tests__/useCheckoutHandlers.test.ts
describe('useCheckoutValidateHandler', () => {
  it('should validate and save checkout data', async () => {
    const mockApiClient = {
      saveCheckout: jest.fn().mockResolvedValue({ id: 'checkout-123' })
    };
    
    const mockValidator = {
      validate: jest.fn().mockResolvedValue(true),
      getErrors: jest.fn().mockReturnValue([])
    };
    
    const onSuccess = jest.fn();
    const onError = jest.fn();
    
    const { result } = renderHook(() => 
      useCheckoutValidateHandler({
        moduleId: 'test',
        apiClient: mockApiClient,
        validator: mockValidator,
        onSuccess,
        onError
      })
    );
    
    // Test implementation...
  });
});
```

### 2. Integration Testing
Test handler integration with actual stores:

```typescript
describe('Checkout Handler Integration', () => {
  it('should update stores correctly', async () => {
    const TestComponent = () => {
      useCheckoutValidateHandler({
        moduleId: 'test',
        apiClient: mockApiClient,
        validator: mockValidator
      });
      
      const { validate } = useCheckoutActions();
      const { checkout } = useCheckoutData();
      
      return (
        <button onClick={() => validate(testData)}>
          Validate
        </button>
      );
    };
    
    // Test store updates...
  });
});
```

## 🚀 Advanced Patterns

### 1. Handler Middleware
Add middleware functionality to handlers:

```typescript
export interface HandlerMiddleware<T = any> {
  before?: (payload: T) => Promise<T | void>;
  after?: (result: any, payload: T) => Promise<void>;
  error?: (error: Error, payload: T) => Promise<void>;
}

export function useMiddlewareHandler<T>(
  handlerId: string,
  handler: (payload: T) => Promise<any>,
  middleware: HandlerMiddleware<T>,
  priority?: number
) {
  useActionHandler(
    handlerId,
    async (payload: T) => {
      try {
        const processedPayload = await middleware.before?.(payload) || payload;
        const result = await handler(processedPayload);
        await middleware.after?.(result, processedPayload);
        return result;
      } catch (error) {
        await middleware.error?.(error as Error, payload);
        throw error;
      }
    },
    priority
  );
}
```

### 2. Handler Factory Pattern
Create handlers dynamically:

```typescript
export interface HandlerFactoryConfig {
  moduleId: string;
  handlerType: 'validation' | 'submission' | 'reset';
  dependencies: HandlerServiceDeps;
  customLogic?: (payload: any) => Promise<any>;
}

export function createHandler(config: HandlerFactoryConfig) {
  const { moduleId, handlerType, dependencies, customLogic } = config;
  
  return function useCreatedHandler() {
    const handlerId = `${moduleId}.${handlerType}`;
    
    useActionHandler(handlerId, async (payload) => {
      if (customLogic) {
        return await customLogic(payload);
      }
      
      // Default logic based on handler type
      switch (handlerType) {
        case 'validation':
          return await dependencies.validator.validate(payload);
        case 'submission':
          return await dependencies.apiClient.submit(payload);
        case 'reset':
          // Reset logic...
          return;
      }
    });
  };
}
```

## 📋 Best Practices

### Do's ✅
- **Always use props for external dependencies**
- **Define clear TypeScript interfaces for props**
- **Handle errors gracefully with try-catch**
- **Use optional callbacks for flexibility**
- **Keep handlers focused on single responsibility**
- **Test handlers with mock dependencies**

### Don'ts ❌
- **Don't hardcode dependencies inside handlers**
- **Don't access stores directly without going through Context**
- **Don't register handlers conditionally without clear logic**
- **Don't mix UI logic with business logic**
- **Don't forget error handling and edge cases**
- **Don't create handlers without proper TypeScript typing**

### Performance Tips ⚡
- **Use useCallback for handler functions when possible**
- **Memoize expensive computations**
- **Avoid creating new objects in render cycles**
- **Consider debouncing for frequent operations**
- **Clean up resources in handler cleanup functions**

This props-based handler pattern provides a flexible, testable, and maintainable approach to implementing business logic in Context-Layered Architecture applications.