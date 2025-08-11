# Logic Fit Hooks Pattern

Logic Fit Hooks combine business logic and UI state management in reusable custom hooks, providing a clean abstraction layer that bridges the MVVM architecture layers for specific use cases.

## Pattern Overview

The Logic Fit Hooks pattern allows you to:

- **Combine Layers**: Merge business logic (ViewModel) and UI state (View) in a single hook
- **Encapsulate Complexity**: Hide complex state coordination behind simple interfaces
- **Promote Reusability**: Share common logic patterns across components
- **Maintain Separation**: Keep business and UI concerns identifiable within the hook

## Basic Logic Fit Hook Pattern

### Simple User Editor Hook

```typescript
// hooks/useUserEditor.ts
export function useUserEditor() {
  // Business layer (ViewModel)
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  // UI state layer (View)
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sync form data with store changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);
  
  // Combined business + UI logic
  const startEdit = useCallback(() => {
    setEditMode(true);
    setFormData(profile);
    setError(null);
  }, [profile]);
  
  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setFormData(profile); // Reset to original
    setError(null);
  }, [profile]);
  
  const saveChanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Delegate to business layer
      await dispatch('updateProfile', { data: formData });
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }, [dispatch, formData]);
  
  const updateField = useCallback(<K extends keyof typeof formData>(
    field: K, 
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Computed values
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(profile);
  }, [formData, profile]);
  
  const canSave = useMemo(() => {
    return hasChanges && !loading && formData.name.trim() !== '';
  }, [hasChanges, loading, formData.name]);
  
  return {
    // State
    profile,
    formData,
    editMode,
    loading,
    error,
    hasChanges,
    canSave,
    
    // Actions
    startEdit,
    cancelEdit,
    saveChanges,
    updateField
  };
}
```

### Using the Logic Fit Hook

```typescript
// components/UserProfile.tsx
export function UserProfile() {
  const {
    profile,
    formData,
    editMode,
    loading,
    error,
    hasChanges,
    canSave,
    startEdit,
    cancelEdit,
    saveChanges,
    updateField
  } = useUserEditor(); // All complexity hidden in the hook
  
  if (editMode) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
        <div>
          <label>Name:</label>
          <input 
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div>
          <label>Email:</label>
          <input 
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            disabled={loading}
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <div>
          <button type="submit" disabled={!canSave}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={cancelEdit} disabled={loading}>
            Cancel
          </button>
        </div>
        
        {hasChanges && <div className="warning">You have unsaved changes</div>}
      </form>
    );
  }
  
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <p>Role: {profile.role}</p>
      <button onClick={startEdit}>Edit Profile</button>
    </div>
  );
}
```

## Advanced Logic Fit Patterns

### 1. Multi-Store Coordination Hook

```typescript
// hooks/useCheckoutProcess.ts
export function useCheckoutProcess() {
  // Multiple business layers
  const cartStore = useCartStore('items');
  const userStore = useUserStore('profile');
  const orderStore = useOrderStore('current');
  
  const cartItems = useStoreValue(cartStore);
  const userProfile = useStoreValue(userStore);
  const currentOrder = useStoreValue(orderStore);
  
  const cartAction = useCartAction();
  const userAction = useUserAction();
  const orderAction = useOrderAction();
  
  // UI state coordination
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'review'>('cart');
  const [shippingData, setShippingData] = useState(userProfile.address || {});
  const [paymentData, setPaymentData] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Computed values across domains
  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);
  
  const canProceedToShipping = useMemo(() => {
    return cartItems.length > 0 && userProfile.id;
  }, [cartItems, userProfile]);
  
  const canProceedToPayment = useMemo(() => {
    return shippingData.address && shippingData.city && shippingData.zipCode;
  }, [shippingData]);
  
  // Complex cross-domain workflow
  const processCheckout = useCallback(async () => {
    setProcessing(true);
    setError(null);
    
    try {
      // Step 1: Validate cart
      await cartAction('validateItems');
      
      // Step 2: Update user shipping address
      if (shippingData.address !== userProfile.address?.address) {
        await userAction('updateAddress', { address: shippingData });
      }
      
      // Step 3: Create order
      const orderResult = await orderAction('createOrder', {
        items: cartItems,
        shipping: shippingData,
        payment: paymentData,
        total
      });
      
      // Step 4: Clear cart on success
      await cartAction('clearCart');
      
      return orderResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [cartAction, userAction, orderAction, cartItems, shippingData, paymentData, total, userProfile]);
  
  // Step navigation
  const nextStep = useCallback(() => {
    const steps: typeof step[] = ['cart', 'shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }, [step]);
  
  const prevStep = useCallback(() => {
    const steps: typeof step[] = ['cart', 'shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }, [step]);
  
  return {
    // Cross-domain state
    cartItems,
    userProfile,
    currentOrder,
    total,
    
    // UI state
    step,
    shippingData,
    paymentData,
    processing,
    error,
    
    // Computed values
    canProceedToShipping,
    canProceedToPayment,
    
    // Actions
    setShippingData,
    setPaymentData,
    processCheckout,
    nextStep,
    prevStep,
    setStep
  };
}
```

### 2. Real-time Data Synchronization Hook

```typescript
// hooks/useUserActivitySync.ts
export function useUserActivitySync() {
  // Business layer
  const userStore = useUserStore('profile');
  const activityStore = useUserStore('activity');
  const user = useStoreValue(userStore);
  const activity = useStoreValue(activityStore);
  const dispatch = useUserAction();
  
  // UI state for real-time features
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingUpdates.length > 0) {
      syncPendingUpdates();
    }
  }, [isOnline]);
  
  // Sync pending updates
  const syncPendingUpdates = useCallback(async () => {
    if (!isOnline || pendingUpdates.length === 0) return;
    
    setSyncStatus('syncing');
    
    try {
      for (const update of pendingUpdates) {
        await dispatch('syncActivity', update);
      }
      
      setPendingUpdates([]);
      setLastSync(Date.now());
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      // Keep pending updates for retry
    }
  }, [isOnline, pendingUpdates, dispatch]);
  
  // Track user activity
  const trackActivity = useCallback((activityType: string, data: any) => {
    const activityRecord = {
      type: activityType,
      data,
      timestamp: Date.now(),
      userId: user.id
    };
    
    if (isOnline) {
      // Sync immediately when online
      dispatch('trackActivity', activityRecord);
    } else {
      // Queue for later sync when offline
      setPendingUpdates(prev => [...prev, activityRecord]);
    }
  }, [isOnline, user.id, dispatch]);
  
  // Manual sync trigger
  const forcSync = useCallback(() => {
    if (isOnline) {
      dispatch('forceSync');
      setLastSync(Date.now());
    }
  }, [isOnline, dispatch]);
  
  return {
    // State
    user,
    activity,
    isOnline,
    lastSync,
    syncStatus,
    pendingUpdates: pendingUpdates.length,
    
    // Actions
    trackActivity,
    forcSync,
    syncPendingUpdates
  };
}
```

### 3. Form Validation Logic Fit Hook

```typescript
// hooks/useValidatedForm.ts
export function useValidatedForm<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, (value: any) => string | null>,
  onSubmit: (data: T) => Promise<void>
) {
  // UI state
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Validation logic
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = validationRules[field];
    return rule ? rule(value) : null;
  }, [validationRules]);
  
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    
    for (const field in formData) {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);
  
  // Field update with validation
  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [touched, validateField]);
  
  // Mark field as touched
  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on touch
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);
  
  // Submit handling
  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );
    setTouched(allTouched);
    
    // Validate all fields
    if (!validateAll()) {
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateAll, onSubmit]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialData]);
  
  // Computed values
  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error);
  }, [errors]);
  
  const isValid = useMemo(() => {
    return !hasErrors && Object.keys(touched).length > 0;
  }, [hasErrors, touched]);
  
  return {
    // Data
    formData,
    errors,
    touched,
    submitting,
    submitError,
    
    // Computed
    hasErrors,
    isValid,
    
    // Actions
    updateField,
    touchField,
    handleSubmit,
    resetForm,
    validateAll
  };
}

// Usage with business logic integration
export function useUserProfileForm() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  const validationRules = {
    name: (value: string) => !value.trim() ? 'Name is required' : null,
    email: (value: string) => {
      if (!value.trim()) return 'Email is required';
      if (!value.includes('@')) return 'Invalid email format';
      return null;
    }
  };
  
  const handleProfileUpdate = useCallback(async (data: typeof profile) => {
    await dispatch('updateProfile', { data });
  }, [dispatch]);
  
  const form = useValidatedForm(profile, validationRules, handleProfileUpdate);
  
  // Reset form when profile changes from external updates
  useEffect(() => {
    if (JSON.stringify(form.formData) !== JSON.stringify(profile)) {
      form.resetForm();
    }
  }, [profile]);
  
  return form;
}
```

## Logic Fit Hook Patterns

### 1. State + Actions Pattern

```typescript
// Combine store state with action dispatchers
export function useUserManagement() {
  // State layer
  const users = useStoreValue(useUserStore('list'));
  const selectedUser = useStoreValue(useUserStore('selected'));
  
  // Action layer
  const dispatch = useUserAction();
  
  // UI state
  const [loading, setLoading] = useState(false);
  
  // Combined operations
  const selectUser = useCallback(async (userId: string) => {
    setLoading(true);
    await dispatch('selectUser', { userId });
    setLoading(false);
  }, [dispatch]);
  
  return { users, selectedUser, loading, selectUser };
}
```

### 2. Cross-Domain Integration Pattern

```typescript
// Integrate multiple domains in a single hook
export function useShoppingExperience() {
  // Multiple domain connections
  const userProfile = useStoreValue(useUserStore('profile'));
  const cartItems = useStoreValue(useCartStore('items'));
  const recommendations = useStoreValue(useProductStore('recommended'));
  
  const userAction = useUserAction();
  const cartAction = useCartAction();
  const productAction = useProductAction();
  
  // Cross-domain operations
  const addToCartWithRecommendations = useCallback(async (productId: string) => {
    await cartAction('addItem', { productId });
    await productAction('updateRecommendations', { userId: userProfile.id });
  }, [cartAction, productAction, userProfile.id]);
  
  return {
    userProfile,
    cartItems,
    recommendations,
    addToCartWithRecommendations
  };
}
```

### 3. Async State Management Pattern

```typescript
// Handle async operations with UI state
export function useAsyncOperation<TParams, TResult>(
  operation: (params: TParams) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);
  
  const execute = useCallback(async (params: TParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(params);
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation]);
  
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);
  
  return { loading, error, result, execute, reset };
}
```

## Best Practices

### ✅ Do

- **Keep business logic identifiable**: Clearly separate business and UI concerns within the hook
- **Use meaningful names**: Hook names should describe what they accomplish
- **Return consistent interfaces**: Provide predictable return shapes
- **Handle loading and error states**: Include UI state for async operations
- **Use useMemo for expensive computations**: Optimize derived values

### ❌ Don't

- **Mix too many concerns**: Keep hooks focused on specific functionality
- **Create overly complex hooks**: Split large hooks into smaller, focused ones
- **Ignore error handling**: Always handle potential errors in async operations
- **Forget cleanup**: Clean up subscriptions and timers in useEffect
- **Bypass the action layer**: Don't directly manipulate stores in logic fit hooks

---

## Summary

Logic Fit Hooks provide:

- **Clean Abstraction**: Hide complex state coordination behind simple interfaces
- **Reusable Logic**: Share common patterns across multiple components
- **Type Safety**: Full TypeScript support with proper inference
- **Testability**: Isolated testing of complex business + UI logic
- **Maintainability**: Centralized logic for specific features

Use Logic Fit Hooks when you need to combine business logic with UI state management in a reusable, testable way.

---

::: tip Next Steps
- Learn [Handler ID Strategies](./handler-id-strategies) for debugging and organization
- Explore [Performance Optimization](./performance) for efficient hook implementations  
- See [Testing Strategies](./testing) for testing custom hooks
:::