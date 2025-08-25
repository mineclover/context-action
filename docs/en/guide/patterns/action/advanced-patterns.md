# Advanced Action Patterns

Overview of advanced action patterns in the Context-Action framework built on multi-context setup foundations.

## Prerequisites

This guide builds on the complete multi-context setup patterns. For foundational architecture and type definitions:

**[📚 Multi-Context Setup →](../setup/multi-context-setup.md)** - Complete MVVM architecture, domain separation, and provider composition patterns

### Required Setup Components

All advanced patterns in this guide require the multi-context setup including:

- **MVVM Architecture Setup**: Model, ViewModel, and Performance layer contexts
- **Domain Context Architecture**: User, Product, UI, Business, Validation, and Design domains
- **Provider Composition**: Layer-based and domain-based composition patterns
- **Cross-Context Communication**: Event bus and context bridge utilities
- **Type System**: Complete interface definitions for stores, actions, and refs

## Pattern Categories

The Context-Action framework provides three main categories of action patterns leveraging multi-context setup:

### 🚀 Dispatch Patterns
Cross-domain action dispatching using multi-context setup with MVVM architecture separation.

- **Cross-Domain Execution**: Dispatch actions across User, Product, UI, and Business domains
- **Layer-Aware Filtering**: Model, ViewModel, Performance layer-specific execution
- **Multi-Context Performance**: Domain-isolated execution with shared event bus

**[View Dispatch Patterns →](./dispatch-patterns.md)**

### 📊 Result Collection Patterns
Advanced result aggregation for complex business workflows across domain boundaries.

- **Domain Result Aggregation**: Collect results from User, Product, and Business contexts
- **Cross-Context Validation**: Validation domain integration with result processing
- **Enterprise Result Processing**: Large-scale data processing with domain separation

**[View Dispatch with Result Patterns →](./dispatch-with-result.md)**

### ⚙️ Registration Patterns
Domain-aware handler registration with MVVM layer configuration and cross-context coordination.

- **Domain-Specific Configuration**: Priority and tags based on business domains
- **Layer-Aware Registration**: Model, ViewModel, Performance layer targeting
- **Cross-Context Coordination**: Event bus integration and context bridge patterns

**[View Register Patterns →](./register-patterns.md)**

### 🔌 Dispatch Access Patterns
Multi-context dispatch access using domain-specific hooks and context bridge utilities.

- **Domain Hook Access**: `useUserActionDispatch()`, `useProductActionDispatch()` patterns
- **Context Bridge Access**: Cross-domain dispatch using `useContextBridge()` utility
- **MVVM Layer Access**: Layer-specific dispatch patterns for complex architectures

**[View Dispatch Access Patterns →](./dispatch-access.md)**

### 🔧 Handler State Access Patterns
Advanced state access patterns across domain contexts with MVVM architecture integration.

- **Cross-Domain State Access**: Access User, Product, UI state from any domain
- **Store Manager Integration**: Advanced state management with `useStoreManager()` patterns
- **Context Bridge State Access**: Unified state access across domain boundaries

**[View Handler State Access Patterns →](./handler-state-access.md)**

## Setup-Based Advanced Pattern Examples

### Cross-Domain Action Coordination
```typescript
// Using multi-context setup for complex workflows
function useCheckoutWorkflow() {
  const userActions = useUserActionDispatch();
  const productActions = useProductActionDispatch();
  const businessActions = useBusinessActionDispatch();
  const validationActions = useValidationActionDispatch();
  const eventBus = useEventBus();

  const executeCheckout = useCallback(async () => {
    // Step 1: Validate user session and cart
    await validationActions('validateForm', {
      formId: 'checkout',
      data: { userId, cartItems },
      schema: checkoutSchema
    });

    // Step 2: Process order through business domain
    const orderResult = await businessActions('processOrder', {
      customerId: userId,
      items: cartItems
    });

    // Step 3: Update product inventory
    await productActions('updateInventory', {
      items: orderResult.items
    });

    // Step 4: Clear user cart and update session
    await userActions('clearCart');
    await userActions('updateSession', {
      lastActivity: Date.now(),
      orderCount: userSession.orderCount + 1
    });

    // Step 5: Notify across domains
    eventBus('orderCompleted', {
      orderId: orderResult.id,
      userId,
      total: orderResult.total
    });
  }, [userActions, productActions, businessActions, validationActions, eventBus]);

  return { executeCheckout };
}
```

### Domain-Specific Handler Registration
```typescript
// Multi-domain handler registration using MVVM setup
function BusinessLogicSetup() {
  // Business domain handlers
  useBusinessActionHandler('processOrder', async (payload, controller) => {
    const businessStore = useBusinessStoreManager();
    const validationStore = useValidationStoreManager();
    
    // Cross-domain state validation
    const validationResults = validationStore.getStore('validationResults').getValue();
    if (!validationResults.every(r => r.isValid)) {
      controller.abort('Validation failed');
      return;
    }

    // Process order with inventory check
    const inventory = businessStore.getStore('inventory').getValue();
    const updatedOrder = processOrderLogic(payload, inventory);
    
    businessStore.getStore('orders').update(orders => [...orders, updatedOrder]);
  });

  // Cross-domain event handlers
  useEventHandler('userLoggedIn', async (payload) => {
    const userStore = useUserStoreManager();
    const businessStore = useBusinessStoreManager();
    
    // Load user-specific business data
    const userOrders = await loadUserOrders(payload.userId);
    businessStore.getStore('orders').setValue(userOrders);
  });

  return null;
}
```

### Advanced State Access Patterns
```typescript
// Context bridge for complex cross-domain operations
function useAdvancedUserOperations() {
  const bridge = useContextBridge();

  const updateUserWithValidation = useCallback(async (userData: Partial<User>) => {
    // Step 1: Validate data using validation domain
    const validationResult = await bridge.validation.actions('validateField', {
      fieldName: 'userProfile',
      value: userData,
      rules: userValidationRules
    });

    if (!validationResult.isValid) {
      // Update UI with errors
      bridge.ui.actions('showNotification', {
        message: 'Validation failed',
        type: 'error'
      });
      return;
    }

    // Step 2: Update user data
    const currentUser = bridge.user.store.getStore('profile').getValue();
    const updatedUser = { ...currentUser, ...userData };
    bridge.user.store.getStore('profile').setValue(updatedUser);

    // Step 3: Update design preferences if theme changed
    if (userData.preferences?.theme) {
      bridge.design?.actions('changeColorScheme', {
        scheme: userData.preferences.theme
      });
    }

    // Step 4: Notify success
    bridge.ui.actions('showNotification', {
      message: 'Profile updated successfully',
      type: 'success'
    });
  }, [bridge]);

  return { updateUserWithValidation };
}
```

## Real-World Examples

Multi-context setup enables sophisticated real-world patterns:

- [Priority Performance Demo](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - Cross-domain priority execution
- [Search Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - Multi-domain search with validation
- [Scroll Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - Performance-optimized UI state management

## Related Patterns

### Setup Foundations
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complete architecture foundation
- **[MVVM Architecture](../architecture/mvvm.md)** - Layer separation patterns
- **[Domain Context](../architecture/domain-context.md)** - Business domain isolation

### Basic Patterns
- [Action Basic Usage](./basic-usage.md) - Single-context fundamental patterns
- [Type System](./type-system.md) - Multi-context TypeScript integration
- [Register Delegation](./register-delegation.md) - Cross-domain handler organization