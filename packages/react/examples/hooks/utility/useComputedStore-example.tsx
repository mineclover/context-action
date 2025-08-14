/**
 * useComputedStore Hook Examples
 * 
 * Demonstrates derived state computation from store values
 */

import React, { useState, useRef } from 'react';
import { createStore } from '../../../src/stores/core/Store';
import { 
  useComputedStore,
  useMultiComputedStore,
  useComputedStoreInstance,
  useAsyncComputedStore
} from '../../../src/stores/hooks/useComputedStore';
import { shallowEqual } from '../../../src/stores/hooks/useStoreSelector';

// Create example stores
const userStore = createStore('user', {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com',
  avatar: '👨‍💻'
});

const cartStore = createStore('cart', {
  items: [
    { id: 1, name: 'Laptop', price: 999, quantity: 1 },
    { id: 2, name: 'Mouse', price: 25, quantity: 2 },
    { id: 3, name: 'Keyboard', price: 75, quantity: 1 }
  ],
  discount: 0.1, // 10% discount
  tax: 0.08 // 8% tax
});

const settingsStore = createStore('settings', {
  currency: 'USD',
  locale: 'en-US',
  theme: 'dark',
  numberFormat: { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }
});

// Performance tracking component
function ComputeCounter({ label }: { label: string }) {
  const computeCount = useRef(0);
  computeCount.current += 1;
  
  return (
    <span style={{ 
      fontSize: '12px', 
      backgroundColor: '#e3f2fd', 
      color: '#1565c0',
      padding: '2px 6px', 
      borderRadius: '3px',
      marginLeft: '10px'
    }}>
      {label}: {computeCount.current} computes
    </span>
  );
}

// Example 1: Basic computed store
function BasicComputedStore() {
  let computeCount = 0;
  
  const fullName = useComputedStore(userStore, user => {
    computeCount++;
    return `${user.firstName} ${user.lastName}`;
  });
  
  const userEmail = useComputedStore(userStore, user => user.email);
  
  return (
    <div className="example-section">
      <h3>Basic Computed Store</h3>
      <p>Full Name: {fullName}</p>
      <p>Email: {userEmail}</p>
      <p>Compute count: {computeCount}</p>
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => userStore.update(user => ({
            ...user,
            firstName: user.firstName === 'John' ? 'Jane' : 'John',
            avatar: user.avatar === '👨‍💻' ? '👩‍💻' : '👨‍💻'
          }))}
        >
          Toggle Name (Will Recompute)
        </button>
        
        <button 
          onClick={() => userStore.update(user => ({
            ...user,
            age: user.age + 1
          }))}
          style={{ marginLeft: '10px' }}
        >
          Increment Age (Won't Recompute Full Name)
        </button>
      </div>
    </div>
  );
}

// Example 2: Shopping cart totals
function ShoppingCartTotals() {
  const subtotal = useComputedStore(cartStore, cart => 
    cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );
  
  const discountAmount = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal * cart.discount;
  });
  
  const taxableAmount = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal - (subtotal * cart.discount);
  });
  
  const taxAmount = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const afterDiscount = subtotal - (subtotal * cart.discount);
    return afterDiscount * cart.tax;
  });
  
  const total = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const afterDiscount = subtotal - (subtotal * cart.discount);
    const tax = afterDiscount * cart.tax;
    return afterDiscount + tax;
  });
  
  return (
    <div className="example-section">
      <h3>Shopping Cart Computed Totals</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Cart Items</h4>
          {cartStore.getValue().items.map(item => (
            <div key={item.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px',
              border: '1px solid #ddd',
              marginBottom: '5px'
            }}>
              <span>{item.name}</span>
              <span>${item.price} x {item.quantity}</span>
            </div>
          ))}
          
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => cartStore.update(cart => ({
                ...cart,
                items: cart.items.map(item => 
                  item.id === 1 ? { ...item, quantity: item.quantity + 1 } : item
                )
              }))}
            >
              Add Laptop
            </button>
            
            <button 
              onClick={() => cartStore.update(cart => ({
                ...cart,
                discount: cart.discount === 0.1 ? 0.2 : 0.1
              }))}
              style={{ marginLeft: '10px' }}
            >
              Toggle Discount (10% / 20%)
            </button>
          </div>
        </div>
        
        <div>
          <h4>Computed Totals</h4>
          <div style={{ fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Discount ({(cartStore.getValue().discount * 100)}%):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Taxable Amount:</span>
              <span>${taxableAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Tax ({(cartStore.getValue().tax * 100)}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontWeight: 'bold',
              fontSize: '16px',
              borderTop: '1px solid #ddd',
              paddingTop: '5px',
              marginTop: '10px'
            }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example 3: Multi-store computed values
function MultiStoreComputed() {
  const userSummary = useMultiComputedStore(
    [userStore, settingsStore],
    ([user, settings]) => ({
      displayName: `${user.firstName} ${user.lastName}`,
      greeting: settings.locale === 'en-US' ? 
        `Hello, ${user.firstName}!` : 
        `Bonjour, ${user.firstName}!`,
      formattedAge: new Intl.NumberFormat(settings.locale).format(user.age),
      profileComplete: !!(user.firstName && user.lastName && user.email)
    }),
    { equalityFn: shallowEqual }
  );
  
  const cartSummary = useMultiComputedStore(
    [cartStore, settingsStore],
    ([cart, settings]) => {
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal * (1 - cart.discount) * (1 + cart.tax);
      
      return {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        formattedTotal: new Intl.NumberFormat(settings.locale, {
          style: 'currency',
          currency: settings.currency,
          ...settings.numberFormat
        }).format(total),
        averageItemPrice: cart.items.length > 0 ? total / cart.items.length : 0
      };
    }
  );
  
  return (
    <div className="example-section">
      <h3>Multi-Store Computed Values</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>User Summary <ComputeCounter label="User" /></h4>
          <ul>
            <li>Display Name: {userSummary.displayName}</li>
            <li>Greeting: {userSummary.greeting}</li>
            <li>Age: {userSummary.formattedAge}</li>
            <li>Profile Complete: {userSummary.profileComplete ? 'Yes' : 'No'}</li>
          </ul>
          
          <button 
            onClick={() => settingsStore.update(settings => ({
              ...settings,
              locale: settings.locale === 'en-US' ? 'fr-FR' : 'en-US'
            }))}
          >
            Toggle Locale
          </button>
        </div>
        
        <div>
          <h4>Cart Summary <ComputeCounter label="Cart" /></h4>
          <ul>
            <li>Item Count: {cartSummary.itemCount}</li>
            <li>Total: {cartSummary.formattedTotal}</li>
            <li>Avg Item Price: ${cartSummary.averageItemPrice.toFixed(2)}</li>
          </ul>
          
          <button 
            onClick={() => settingsStore.update(settings => ({
              ...settings,
              currency: settings.currency === 'USD' ? 'EUR' : 'USD'
            }))}
          >
            Toggle Currency
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 4: Computed store instance
function ComputedStoreInstance() {
  // Create a computed store instance
  const fullNameStore = useComputedStoreInstance(
    [userStore],
    ([user]) => `${user.firstName} ${user.lastName}`,
    { 
      name: 'fullNameStore',
      debug: true 
    }
  );
  
  const cartTotalStore = useComputedStoreInstance(
    [cartStore],
    ([cart]) => {
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return subtotal * (1 - cart.discount) * (1 + cart.tax);
    },
    { name: 'cartTotalStore' }
  );
  
  return (
    <div className="example-section">
      <h3>Computed Store Instances</h3>
      <p>These computed values are actual Store instances that can be passed around</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Full Name Store</h4>
          <p>Store Name: {fullNameStore.name}</p>
          <p>Current Value: {fullNameStore.getValue()}</p>
          <p>Listener Count: {fullNameStore.getListenerCount()}</p>
          
          <button onClick={() => userStore.update(user => ({
            ...user,
            firstName: user.firstName === 'John' ? 'Jane' : 'John'
          }))}>
            Toggle First Name
          </button>
        </div>
        
        <div>
          <h4>Cart Total Store</h4>
          <p>Store Name: {cartTotalStore.name}</p>
          <p>Current Value: ${cartTotalStore.getValue().toFixed(2)}</p>
          <p>Listener Count: {cartTotalStore.getListenerCount()}</p>
          
          <button onClick={() => cartStore.update(cart => ({
            ...cart,
            items: cart.items.map(item => 
              item.id === 2 ? { ...item, quantity: item.quantity + 1 } : item
            )
          }))}>
            Add Mouse
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 5: Async computed store
function AsyncComputedStore() {
  const [userId, setUserId] = useState(1);
  const userIdStore = createStore('userId', userId);
  
  // Update store when state changes
  React.useEffect(() => {
    userIdStore.setValue(userId);
  }, [userId]);
  
  const userProfile = useAsyncComputedStore(
    [userIdStore],
    async ([id]) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const profiles = {
        1: { name: 'John Doe', role: 'Developer', avatar: '👨‍💻' },
        2: { name: 'Jane Smith', role: 'Designer', avatar: '👩‍🎨' },
        3: { name: 'Bob Johnson', role: 'Manager', avatar: '👨‍💼' }
      };
      
      const profile = profiles[id as keyof typeof profiles];
      if (!profile) {
        throw new Error(`User ${id} not found`);
      }
      
      return profile;
    },
    {
      initialValue: null,
      onError: (error) => console.error('Failed to load user:', error)
    }
  );
  
  return (
    <div className="example-section">
      <h3>Async Computed Store</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>User ID: </label>
        {[1, 2, 3, 999].map(id => (
          <button
            key={id}
            onClick={() => setUserId(id)}
            style={{
              margin: '0 5px',
              backgroundColor: userId === id ? '#007bff' : '#f8f9fa',
              color: userId === id ? 'white' : 'black'
            }}
          >
            {id}
          </button>
        ))}
      </div>
      
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '6px',
        minHeight: '100px'
      }}>
        {userProfile.loading && (
          <div style={{ textAlign: 'center' }}>
            <p>Loading user profile...</p>
            <div style={{ 
              width: '30px', 
              height: '30px', 
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        )}
        
        {userProfile.error && (
          <div style={{ color: 'red', textAlign: 'center' }}>
            <p>❌ Error: {userProfile.error.message}</p>
          </div>
        )}
        
        {userProfile.value && !userProfile.loading && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
              {userProfile.value.avatar}
            </div>
            <h4 style={{ margin: '0 0 5px 0' }}>{userProfile.value.name}</h4>
            <p style={{ margin: 0, color: '#666' }}>{userProfile.value.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Example 6: Performance comparison
function PerformanceComparison() {
  const [method, setMethod] = useState<'multiple' | 'computed'>('computed');
  
  // Method 1: Multiple individual computations (inefficient)
  const subtotalMultiple = useComputedStore(cartStore, cart => 
    cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );
  const discountMultiple = useComputedStore(cartStore, cart => 
    cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * cart.discount
  );
  const totalMultiple = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal * (1 - cart.discount) * (1 + cart.tax);
  });
  
  // Method 2: Single computed object (efficient)
  const allTotalsComputed = useComputedStore(cartStore, cart => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * cart.discount;
    const total = subtotal * (1 - cart.discount) * (1 + cart.tax);
    
    return { subtotal, discount, total };
  }, { equalityFn: shallowEqual });
  
  const displayData = method === 'multiple' ? 
    { subtotal: subtotalMultiple, discount: discountMultiple, total: totalMultiple } :
    allTotalsComputed;
  
  return (
    <div className="example-section">
      <h3>Performance Comparison</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Computation Method: </label>
        <label style={{ marginLeft: '10px' }}>
          <input
            type="radio"
            value="multiple"
            checked={method === 'multiple'}
            onChange={(e) => setMethod(e.target.value as any)}
          />
          Multiple Computations
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input
            type="radio"
            value="computed"
            checked={method === 'computed'}
            onChange={(e) => setMethod(e.target.value as any)}
          />
          Single Computed Object
        </label>
      </div>
      
      <div>
        <h4>{method === 'multiple' ? 'Multiple' : 'Single'} Computation Results</h4>
        <ul>
          <li>Subtotal: ${displayData.subtotal.toFixed(2)}</li>
          <li>Discount: ${displayData.discount.toFixed(2)}</li>
          <li>Total: ${displayData.total.toFixed(2)}</li>
        </ul>
        
        <button 
          onClick={() => cartStore.update(cart => ({
            ...cart,
            tax: cart.tax === 0.08 ? 0.1 : 0.08
          }))}
        >
          Toggle Tax Rate
        </button>
        
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          <strong>Multiple:</strong> Recalculates subtotal 3 times (inefficient)<br />
          <strong>Single:</strong> Calculates subtotal once and reuses (efficient)
        </p>
      </div>
    </div>
  );
}

// Main component showcasing all examples
export function UseComputedStoreExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>useComputedStore Hook Examples</h1>
      <p>
        The <code>useComputedStore</code> family provides derived state computation from store values.
        Values are automatically recomputed when dependencies change, with built-in memoization.
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <BasicComputedStore />
      <ShoppingCartTotals />
      <MultiStoreComputed />
      <ComputedStoreInstance />
      <AsyncComputedStore />
      <PerformanceComparison />
      
      <div className="example-section">
        <h3>Key Features</h3>
        <ul>
          <li>✅ Automatic recomputation when dependencies change</li>
          <li>✅ Built-in memoization prevents unnecessary recalculations</li>
          <li>✅ Multi-store computation with useMultiComputedStore</li>
          <li>✅ Store instances with useComputedStoreInstance</li>
          <li>✅ Async computation with useAsyncComputedStore</li>
          <li>✅ Custom equality functions for optimization</li>
          <li>✅ TypeScript support with type inference</li>
        </ul>
      </div>
      
      <div className="example-section">
        <h3>When to Use</h3>
        <ul>
          <li>🎯 Derived calculations (totals, summaries, formatting)</li>
          <li>🎯 Cross-store data combinations</li>
          <li>🎯 Expensive computations that should be memoized</li>
          <li>🎯 Async operations based on store values</li>
          <li>🎯 Complex business logic that depends on multiple stores</li>
        </ul>
      </div>
    </div>
  );
}

export default UseComputedStoreExamples;