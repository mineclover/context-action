# Pattern Composition Strategies

Advanced pattern composition techniques for building complex, scalable applications with the Context-Action framework.

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
// Complete single domain setup
function SingleDomainApp() {
  return (
    {/* State Management Layer */}
    <UserModelProvider>
      
      {/* Business Logic Layer */}
      <UserActionProvider>
        
        {/* Performance Layer */}
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
function MultiDomainApp() {
  return (
    {/* User Domain - Full MVVM */}
    <UserModelProvider>
      <UserActionProvider>
        <UserPerformanceProvider>
          
          {/* Product Domain - Store + Action Only */}
          <ProductModelProvider>
            <ProductActionProvider>
              
              {/* Order Domain - Store Only */}
              <OrderModelProvider>
                
                {/* Analytics Domain - Action Only */}
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
// Enterprise-scale composition
function EnterpriseApp() {
  return (
    {/* Business Domain MVVM */}
    <BusinessModelProvider>
      <BusinessActionProvider>
        <BusinessPerformanceProvider>
          
          {/* UI Domain MVVM */}
          <UIModelProvider>
            <UIActionProvider>
              <UIPerformanceProvider>
                
                {/* Validation Domain - Store + Action */}
                <ValidationModelProvider>
                  <ValidationActionProvider>
                    
                    {/* Design Domain - Store Only */}
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
export function useIntegrationLayer() {
  const businessManager = useBusinessStoreManager();
  const uiManager = useUIStoreManager();
  const validationManager = useValidationStoreManager();
  
  const integratedWorkflow = useCallback(async (payload, controller) => {
    // Coordinate across multiple domains
    const validationResult = await validateAcrossDomains(payload);
    const businessResult = await processBusinessLogic(payload);
    const uiUpdate = await updateUserInterface(businessResult);
    
    return { validationResult, businessResult, uiUpdate };
  }, [businessManager, uiManager, validationManager]);
  
  // Register in appropriate action context
  useBusinessActionHandler('integratedWorkflow', integratedWorkflow);
}
```

### Selective Provider Usage

```typescript
// Conditional provider composition based on features
interface AppConfig {
  enablePerformanceOptimizations: boolean;
  enableAdvancedValidation: boolean;
  enableCrossDomainFeatures: boolean;
}

function ConfigurableApp({ config }: { config: AppConfig }) {
  let app = <CoreApp />;
  
  // Wrap with performance layer if enabled
  if (config.enablePerformanceOptimizations) {
    app = (
      <PerformanceProvider>
        {app}
      </PerformanceProvider>
    );
  }
  
  // Add validation layer if enabled
  if (config.enableAdvancedValidation) {
    app = (
      <ValidationModelProvider>
        <ValidationActionProvider>
          {app}
        </ValidationActionProvider>
      </ValidationModelProvider>
    );
  }
  
  // Add cross-domain features if enabled
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
function DynamicApp({ userRole, features }: { 
  userRole: 'admin' | 'user' | 'guest';
  features: string[];
}) {
  const providers: React.ComponentType<any>[] = [];
  
  // Base providers for all users
  providers.push(CoreModelProvider, CoreActionProvider);
  
  // Add admin-specific providers
  if (userRole === 'admin') {
    providers.push(AdminModelProvider, AdminActionProvider);
  }
  
  // Add performance providers for specific features
  if (features.includes('animations')) {
    providers.push(PerformanceProvider);
  }
  
  // Add validation providers for forms
  if (features.includes('forms')) {
    providers.push(ValidationModelProvider, ValidationActionProvider);
  }
  
  // Compose providers dynamically
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <AppContent />
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

## Related Patterns

- **[MVVM Architecture](./mvvm.md)** - Structured layer-based composition
- **[Domain Context Architecture](./domain-context.md)** - Business domain-based composition
- **[Store Only Pattern](../store/basic-usage.md)** - Foundation for data-centric compositions
- **[Action Only Pattern](../action/basic-usage.md)** - Foundation for logic-centric compositions
- **[RefContext Pattern](../ref/basic-usage.md)** - Foundation for performance-centric compositions