# Pattern Composition Strategies

Advanced pattern composition techniques for building complex, scalable applications with the Context-Action framework.

## Prerequisites

Before implementing composition strategies, ensure you have completed the foundational setup:

- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complete MVVM and Domain Context architecture setup patterns
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced provider composition utilities and patterns
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Single action context patterns  
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Single store context patterns

These setup guides provide the context definitions, provider configurations, and composition utilities used throughout this document.

## Composition Overview

Pattern composition allows you to combine different architectural approaches based on your application's specific needs:

- **Single Domain Composition**: Action + Store + Ref patterns within one domain
- **Multi-Domain Composition**: Domain contexts with layered patterns
- **Enterprise Composition**: Combined MVVM and Domain architectures
- **Hybrid Composition**: Mixed approaches for different application areas

## Composition Strategies

### Strategy 1: Single Domain Composition

Perfect for complex single-domain applications requiring all three core patterns.

```typescript
// Complete single domain setup using Multi-Context Setup patterns
// Reference: multi-context-setup.md - UserModelProvider, UserViewModelProvider, UserPerformanceProvider

import { 
  UserModelProvider,
  UserViewModelProvider as UserActionProvider,
  UserPerformanceProvider
} from '../setup/contexts/UserDomain';

function SingleDomainApp() {
  return (
    {/* State Management Layer - from Multi-Context Setup */}
    <UserModelProvider>
      
      {/* Business Logic Layer - from Multi-Context Setup */}
      <UserActionProvider>
        
        {/* Performance Layer - from Multi-Context Setup */}
        <UserPerformanceProvider>
          
          {/* Application Components */}
          <UserDashboard />
          <UserProfile />
          <UserSettings />
          
        </UserPerformanceProvider>
      </UserActionProvider>
    </UserModelProvider>
  );
}
```

**Use Cases:**
- E-commerce product management
- Financial dashboard applications
- Content management systems
- Gaming applications

### Strategy 2: Multi-Domain Composition

Ideal for applications with distinct business domains, each requiring different pattern combinations.

```typescript
// Multi-domain with selective pattern usage
// Reference: multi-context-setup.md - Domain-specific provider patterns

import {
  UserModelProvider,
  UserViewModelProvider as UserActionProvider,
  UserPerformanceProvider,
  ProductModelProvider,
  ProductViewModelProvider as ProductActionProvider,
  // Order domain uses Store Only Pattern - reference: basic-store-setup.md
  OrderModelProvider,
  // Analytics uses Action Only Pattern - reference: basic-action-setup.md
  AnalyticsActionProvider
} from '../setup/contexts';

function MultiDomainApp() {
  return (
    {/* User Domain - Full MVVM from Multi-Context Setup */}
    <UserModelProvider>
      <UserActionProvider>
        <UserPerformanceProvider>
          
          {/* Product Domain - Store + Action from Multi-Context Setup */}
          <ProductModelProvider>
            <ProductActionProvider>
              
              {/* Order Domain - Store Only Pattern */}
              <OrderModelProvider>
                
                {/* Analytics Domain - Action Only Pattern */}
                <AnalyticsActionProvider>
                  
                  <ECommerceApp />
                  
                </AnalyticsActionProvider>
              </OrderModelProvider>
            </ProductActionProvider>
          </ProductModelProvider>
        </UserPerformanceProvider>
      </UserActionProvider>
    </UserModelProvider>
  );
}
```

**Domain-Specific Pattern Selection:**

| Domain | Patterns Used | Rationale |
|--------|---------------|-----------|
| User | Store + Action + Ref | Complex interactions, animations needed |
| Product | Store + Action | Business logic with data management |
| Order | Store Only | Simple data management, no complex logic |
| Analytics | Action Only | Event tracking, no persistent state |

### Strategy 3: Enterprise Composition

Large-scale applications combining MVVM layers with Domain contexts.

```typescript
// Enterprise-scale composition using Domain Context Architecture Setup
// Reference: multi-context-setup.md - Domain Context Architecture Setup

import {
  // Business Domain from Domain Context Architecture Setup
  BusinessModelProvider,
  BusinessViewModelProvider as BusinessActionProvider,
  // UI Domain from MVVM Architecture Setup
  UIModelProvider,
  UIViewModelProvider as UIActionProvider,
  UserPerformanceProvider as UIPerformanceProvider,
  // Validation Domain from Domain Context Architecture Setup
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider,
  // Design System Context from Domain Context Architecture Setup
  DesignModelProvider
} from '../setup/contexts';

function EnterpriseApp() {
  return (
    {/* Business Domain MVVM - from Domain Context Architecture Setup */}
    <BusinessModelProvider>
      <BusinessActionProvider>
        <BusinessPerformanceProvider>
          
          {/* UI Domain MVVM - from MVVM Architecture Setup */}
          <UIModelProvider>
            <UIActionProvider>
              <UIPerformanceProvider>
                
                {/* Validation Domain - from Domain Context Architecture Setup */}
                <ValidationModelProvider>
                  <ValidationActionProvider>
                    
                    {/* Design Domain - from Design System Context Setup */}
                    <DesignModelProvider>
                      
                      <EnterpriseApplication />
                      
                    </DesignModelProvider>
                  </ValidationActionProvider>
                </ValidationModelProvider>
              </UIPerformanceProvider>
            </UIActionProvider>
          </UIModelProvider>
        </BusinessPerformanceProvider>
      </BusinessActionProvider>
    </BusinessModelProvider>
  );
}
```

### Strategy 4: Hybrid Composition

Different areas of the application use different architectural approaches.

```typescript
// Hybrid approach with area-specific patterns
function HybridApp() {
  return (
    <AppRouter>
      {/* Admin Area - Full MVVM */}
      <Route path="/admin/*">
        <AdminModelProvider>
          <AdminActionProvider>
            <AdminPerformanceProvider>
              <AdminDashboard />
            </AdminPerformanceProvider>
          </AdminActionProvider>
        </AdminModelProvider>
      </Route>
      
      {/* Customer Area - Domain Context */}
      <Route path="/customer/*">
        <CustomerBusinessProvider>
          <CustomerUIProvider>
            <CustomerValidationProvider>
              <CustomerPortal />
            </CustomerValidationProvider>
          </CustomerUIProvider>
        </CustomerBusinessProvider>
      </Route>
      
      {/* Public Area - Simple Store Only */}
      <Route path="/public/*">
        <PublicModelProvider>
          <PublicWebsite />
        </PublicModelProvider>
      </Route>
    </AppRouter>
  );
}
```

## Advanced Composition Patterns

### Cross-Domain Integration

```typescript
// Integration layer for cross-domain communication
// Reference: multi-context-setup.md - Cross-Context Communication Setup

import {
  useBusinessStoreManager,
  useUIStoreManager,
  useValidationStoreManager,
  useBusinessActionHandler,
  useContextBridge  // Cross-context communication utility
} from '../setup/contexts';

export function useIntegrationLayer() {
  // Using Context Bridge pattern from Multi-Context Setup
  const contextBridge = useContextBridge();
  
  // Alternative: Direct manager access
  const businessManager = useBusinessStoreManager();
  const uiManager = useUIStoreManager();
  const validationManager = useValidationStoreManager();
  
  const integratedWorkflow = useCallback(async (payload, controller) => {
    // Coordinate across multiple domains using Context Bridge
    const validationResult = await contextBridge.validation.actions('validateAcrossDomains', payload);
    const businessResult = await contextBridge.business.actions('processBusinessLogic', payload);
    const uiUpdate = await contextBridge.ui.actions('updateUserInterface', businessResult);
    
    return { validationResult, businessResult, uiUpdate };
  }, [contextBridge, businessManager, uiManager, validationManager]);
  
  // Register in appropriate action context
  useBusinessActionHandler('integratedWorkflow', integratedWorkflow);
}
```

### Selective Provider Usage

```typescript
// Conditional provider composition based on features
// Reference: multi-context-setup.md - Conditional Multi-Context Setup

import {
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider,
  UserPerformanceProvider as PerformanceProvider,
  EventBusProvider as IntegrationActionProvider  // from Cross-Context Communication Setup
} from '../setup/contexts';

interface AppConfig {
  enablePerformanceOptimizations: boolean;
  enableAdvancedValidation: boolean;
  enableCrossDomainFeatures: boolean;
}

// Following Enterprise Configuration pattern from Multi-Context Setup
function ConfigurableApp({ config }: { config: AppConfig }) {
  let app = <CoreApp />;
  
  // Wrap with performance layer if enabled - from Multi-Context Setup RefContext patterns
  if (config.enablePerformanceOptimizations) {
    app = (
      <PerformanceProvider>
        {app}
      </PerformanceProvider>
    );
  }
  
  // Add validation layer if enabled - from Domain Context Architecture Setup
  if (config.enableAdvancedValidation) {
    app = (
      <ValidationModelProvider>
        <ValidationActionProvider>
          {app}
        </ValidationActionProvider>
      </ValidationModelProvider>
    );
  }
  
  // Add cross-domain features if enabled - from Cross-Context Communication Setup
  if (config.enableCrossDomainFeatures) {
    app = (
      <IntegrationActionProvider>
        {app}
      </IntegrationActionProvider>
    );
  }
  
  return app;
}
```

### Dynamic Composition

```typescript
// Runtime composition based on user roles or features
// Reference: provider-composition-setup.md - Dynamic Provider Composition

import { composeProviders } from '@context-action/react';  // from Provider Composition Setup
import {
  UIModelProvider as CoreModelProvider,
  UIViewModelProvider as CoreActionProvider,
  // Admin providers would be defined in Multi-Context Setup
  AdminModelProvider,
  AdminActionProvider,
  UserPerformanceProvider as PerformanceProvider,
  ValidationModelProvider,
  ValidationViewModelProvider as ValidationActionProvider
} from '../setup/contexts';

function DynamicApp({ userRole, features }: { 
  userRole: 'admin' | 'user' | 'guest';
  features: string[];
}) {
  const providers: React.ComponentType<any>[] = [];
  
  // Base providers for all users - from Multi-Context Setup
  providers.push(CoreModelProvider, CoreActionProvider);
  
  // Add admin-specific providers - from Multi-Context Setup Enterprise Config
  if (userRole === 'admin') {
    providers.push(AdminModelProvider, AdminActionProvider);
  }
  
  // Add performance providers for specific features - from Multi-Context Setup Performance Layer
  if (features.includes('animations')) {
    providers.push(PerformanceProvider);
  }
  
  // Add validation providers for forms - from Domain Context Architecture Setup
  if (features.includes('forms')) {
    providers.push(ValidationModelProvider, ValidationActionProvider);
  }
  
  // Use composeProviders utility from Provider Composition Setup
  const DynamicProviders = composeProviders(providers);
  
  return (
    <DynamicProviders>
      <AppContent />
    </DynamicProviders>
  );
}
```

## Composition Guidelines

### ✅ Best Practices

1. **Layer Ordering**
   - Model providers at the outermost level
   - Action providers wrap Model providers
   - Performance providers wrap Action providers
   - Ref providers at the innermost level

2. **Domain Isolation**
   - Keep domain contexts separate
   - Use explicit cross-domain communication
   - Avoid deep provider nesting
   - Document domain boundaries

3. **Performance Considerations**
   - Only include necessary providers
   - Use selective composition for features
   - Monitor provider tree depth
   - Implement lazy loading for complex domains

4. **Type Safety**
   - Maintain type safety across compositions
   - Use typed integration patterns
   - Document cross-domain interfaces
   - Validate composition at build time

### ❌ Common Pitfalls

1. **Over-Composition**
   - Don't include every pattern by default
   - Avoid unnecessary provider nesting
   - Don't create circular dependencies
   - Don't mix incompatible patterns

2. **Performance Issues**
   - Deep provider nesting affects performance
   - Too many contexts create overhead
   - Unnecessary re-renders from poor composition
   - Memory leaks from improper cleanup

3. **Maintenance Problems**
   - Complex compositions are hard to debug
   - Unclear data flow between domains
   - Difficult to test in isolation
   - Hard to refactor when requirements change

## Composition Decision Matrix

| Application Type | Recommended Composition | Rationale |
|------------------|-------------------------|-----------|
| **Simple Apps** | Store Only | Minimal overhead, easy to understand |
| **Interactive Apps** | Store + Action | Business logic separation needed |
| **Performance Apps** | Store + Action + Ref | Animations and real-time interactions |
| **Complex Single Domain** | MVVM Architecture | Clear layer separation for complex logic |
| **Multi-Domain Apps** | Domain Context Architecture | Business domain separation |
| **Enterprise Apps** | Combined MVVM + Domain | Both technical and business separation |

## Migration Strategies

### From Simple to Complex

```typescript
// Stage 1: Start with Store Only
<StoreProvider>
  <SimpleApp />
</StoreProvider>

// Stage 2: Add Actions when business logic grows
<StoreProvider>
  <ActionProvider>
    <SimpleApp />
  </ActionProvider>
</StoreProvider>

// Stage 3: Add Performance for animations
<StoreProvider>
  <ActionProvider>
    <PerformanceProvider>
      <SimpleApp />
    </PerformanceProvider>
  </ActionProvider>
</StoreProvider>

// Stage 4: Split into domains when complexity increases
<BusinessProvider>
  <UIProvider>
    <ValidationProvider>
      <ComplexApp />
    </ValidationProvider>
  </UIProvider>
</BusinessProvider>
```

### Refactoring Guidelines

1. **Incremental Migration**
   - Add patterns gradually
   - Test each composition stage
   - Maintain backward compatibility
   - Document migration steps

2. **Pattern Extraction**
   - Extract common patterns into reusable compositions
   - Create composition utilities
   - Build composition templates
   - Establish composition standards

3. **Performance Monitoring**
   - Monitor render performance
   - Track provider tree depth
   - Measure memory usage
   - Profile complex compositions

## Integration with Setup Guides

This composition guide builds upon several setup documents:

### Foundation Setup Guides
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complete MVVM and Domain Context setup patterns used in all examples
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - `composeProviders` utility and composition patterns
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Single action context setup for Action Only domains
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Single store context setup for Store Only domains

### Architecture Integration
- **[MVVM Architecture](./mvvm.md)** - Uses complete MVVM setup from Multi-Context Setup
- **[Domain Context Architecture](./domain-context.md)** - Uses domain separation from Multi-Context Setup
- **[Context Splitting Patterns](./context-splitting.md)** - Uses provider composition from Provider Composition Setup

## Related Patterns

- **[MVVM Architecture](./mvvm.md)** - Structured layer-based composition
- **[Domain Context Architecture](./domain-context.md)** - Business domain-based composition
- **[Store Only Pattern](../store/basic-usage.md)** - Foundation for data-centric compositions
- **[Action Only Pattern](../action/basic-usage.md)** - Foundation for logic-centric compositions
- **[RefContext Pattern](../ref/basic-usage.md)** - Foundation for performance-centric compositions