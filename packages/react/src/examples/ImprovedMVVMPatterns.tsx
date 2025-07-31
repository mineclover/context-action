/**
 * @fileoverview Improved MVVM Architecture Examples
 * Demonstrates enhanced hooks with performance optimizations and patterns
 */

import React from 'react';
import {
  ActionProvider,
  StoreProvider,
  useActionDispatch,
  useStoreValue,
  useStoreValues,
  useComputedValue,
  useLocalState,
  useMVVMStore,
  useMultiMVVMStore,
  useStoreQuery,
  useMultiStoreAction,
  createStore,
  ActionPayloadMap
} from '@context-action/react';

// === TYPES ===
interface User {
  id: string;
  name: string;
  email: string;
  membershipLevel: 'basic' | 'premium' | 'gold';
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface Cart {
  items: CartItem[];
}

// === ACTION PAYLOAD MAP ===
interface AppActions extends ActionPayloadMap {
  updateUserProfile: { name: string; email: string };
  addToCart: { productId: string; quantity: number };
  updateTheme: 'light' | 'dark';
  toggleNotifications: void;
}

// === INITIAL DATA ===
const initialUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  membershipLevel: 'premium',
  preferences: {
    theme: 'light',
    notifications: true
  }
};

const initialProducts: Product[] = [
  { id: '1', name: 'Laptop', price: 999, category: 'Electronics' },
  { id: '2', name: 'Book', price: 29, category: 'Education' },
  { id: '3', name: 'Coffee', price: 5, category: 'Food' }
];

// === BUSINESS LOGIC ===
function calculateDiscount(membershipLevel: User['membershipLevel'], subtotal: number): number {
  switch (membershipLevel) {
    case 'gold': return subtotal * 0.15;
    case 'premium': return subtotal * 0.10;
    case 'basic': return subtotal * 0.05;
    default: return 0;
  }
}

// === COMPONENTS WITH IMPROVED HOOKS ===

/**
 * User Profile with Selective Subscriptions
 * Demonstrates performance optimization with selectors
 */
function UserProfile() {
  // Using useMVVMStore for automatic store creation and management
  const { value: user, setValue, update } = useMVVMStore('user', initialUser);
  
  // Using useStoreValues for multiple selective subscriptions
  const userDisplay = useStoreValues(
    useMVVMStore('user', initialUser).store,
    {
      displayName: user => user.name,
      email: user => user.email,
      theme: user => user.preferences.theme,
      canEdit: user => user.membershipLevel !== 'basic'
    }
  );
  
  const dispatch = useActionDispatch<AppActions>();
  
  // Local component state for form
  const [formName, setFormName, updateFormName] = useLocalState(user?.name || '');
  const [formEmail, setFormEmail] = useLocalState(user?.email || '');
  
  const handleSave = () => {
    if (formName && formEmail) {
      dispatch('updateUserProfile', { name: formName, email: formEmail });
    }
  };
  
  const handleToggleTheme = () => {
    dispatch('updateTheme', user?.preferences.theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div style={{ 
      backgroundColor: userDisplay?.theme === 'dark' ? '#333' : '#fff',
      color: userDisplay?.theme === 'dark' ? '#fff' : '#333',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <h2>Enhanced User Profile</h2>
      
      <div>
        <p><strong>Display Name:</strong> {userDisplay?.displayName}</p>
        <p><strong>Email:</strong> {userDisplay?.email}</p>
        <p><strong>Theme:</strong> {userDisplay?.theme}</p>
        <p><strong>Can Edit:</strong> {userDisplay?.canEdit ? 'Yes' : 'No'}</p>
      </div>
      
      {userDisplay?.canEdit && (
        <div>
          <h3>Edit Profile</h3>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Name"
          />
          <input
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="Email"
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleToggleTheme}>
            Switch to {userDisplay?.theme === 'light' ? 'Dark' : 'Light'} Theme
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Shopping Cart with Multi-Store Management
 */
function ShoppingCart() {
  // Using useMultiMVVMStore for coordinated multi-store access
  const stores = useMultiMVVMStore({
    cart: { 
      initialValue: { items: [] } as Cart
    },
    products: { 
      initialValue: initialProducts
    },
    user: { 
      initialValue: initialUser,
      selector: user => ({ 
        membershipLevel: user.membershipLevel,
        id: user.id 
      })
    }
  });
  
  // Computed cart summary using useComputedValue
  const cartSummary = useComputedValue(
    [stores.cart.store, stores.products.store, stores.user.store],
    (cart, products, user) => {
      const cartItems = cart.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return product ? {
          ...item,
          product,
          total: product.price * item.quantity
        } : null;
      }).filter(Boolean);
      
      const subtotal = cartItems.reduce((sum, item) => sum + (item?.total || 0), 0);
      const discount = calculateDiscount(user.membershipLevel, subtotal);
      const total = subtotal - discount;
      
      return {
        items: cartItems,
        subtotal,
        discount,
        total,
        itemCount: cartItems.length
      };
    }
  );
  
  const dispatch = useActionDispatch<AppActions>();
  
  const addToCart = (productId: string) => {
    dispatch('addToCart', { productId, quantity: 1 });
  };
  
  return (
    <div>
      <h2>Smart Shopping Cart</h2>
      
      <div>
        <h3>Available Products</h3>
        {stores.products.value?.map(product => (
          <div key={product.id} style={{ padding: '10px', border: '1px solid #ccc', margin: '5px' }}>
            <p><strong>{product.name}</strong> - ${product.price}</p>
            <p>Category: {product.category}</p>
            <button onClick={() => addToCart(product.id)}>Add to Cart</button>
          </div>
        ))}
      </div>
      
      <div>
        <h3>Cart Summary ({cartSummary?.itemCount || 0} items)</h3>
        {cartSummary?.items.map((item, index) => (
          <div key={index} style={{ padding: '5px' }}>
            {item?.product.name} x{item?.quantity} = ${item?.total}
          </div>
        ))}
        
        {cartSummary && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
            <p>Subtotal: ${cartSummary.subtotal.toFixed(2)}</p>
            <p>Discount ({stores.user.value?.membershipLevel}): -${cartSummary.discount.toFixed(2)}</p>
            <p><strong>Total: ${cartSummary.total.toFixed(2)}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * User Statistics with Store Query
 */
function UserStats() {
  const userStats = useStoreQuery(
    'userStats',
    (user, cart, products) => {
      const cartItems = cart.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return product ? { ...item, product } : null;
      }).filter(Boolean);
      
      const totalItems = cartItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      const totalValue = cartItems.reduce((sum, item) => 
        sum + ((item?.product.price || 0) * (item?.quantity || 0)), 0
      );
      
      const favoriteCategory = cartItems.reduce((acc, item) => {
        const category = item?.product.category || 'Unknown';
        acc[category] = (acc[category] || 0) + (item?.quantity || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const topCategory = Object.entries(favoriteCategory)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
      
      return {
        userName: user.name,
        membershipLevel: user.membershipLevel,
        totalItems,
        totalValue,
        favoriteCategory: topCategory,
        themePreference: user.preferences.theme
      };
    },
    ['user', 'cart', 'products']
  );
  
  if (userStats.loading) {
    return <div>Loading user statistics...</div>;
  }
  
  if (userStats.error) {
    return <div>Error loading stats: {userStats.error}</div>;
  }
  
  return (
    <div>
      <h2>User Statistics</h2>
      {userStats.data && (
        <div style={{ padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <p><strong>User:</strong> {userStats.data.userName}</p>
          <p><strong>Membership:</strong> {userStats.data.membershipLevel}</p>
          <p><strong>Items in Cart:</strong> {userStats.data.totalItems}</p>
          <p><strong>Cart Value:</strong> ${userStats.data.totalValue.toFixed(2)}</p>
          <p><strong>Favorite Category:</strong> {userStats.data.favoriteCategory}</p>
          <p><strong>Theme:</strong> {userStats.data.themePreference}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Action Handlers using Multi-Store Coordination
 */
function useAppActions() {
  useMultiStoreAction(
    'updateUserProfile',
    ['user'],
    async (payload, controller, context) => {
      const currentUser = context.stores.user.getValue();
      
      if (!payload.name.trim()) {
        controller.abort('Name cannot be empty');
        return;
      }
      
      if (!payload.email.includes('@')) {
        controller.abort('Invalid email format');
        return;
      }
      
      context.stores.user.setValue({
        ...currentUser,
        name: payload.name,
        email: payload.email
      });
    },
    []
  );
  
  useMultiStoreAction(
    'updateTheme',
    ['user'],
    async (theme, controller, context) => {
      const currentUser = context.stores.user.getValue();
      
      context.stores.user.setValue({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          theme
        }
      });
    },
    []
  );
  
  useMultiStoreAction(
    'addToCart',
    ['cart', 'products'],
    async (payload, controller, context) => {
      const cart = context.stores.cart.getValue();
      const products = context.stores.products.getValue();
      
      const product = products.find(p => p.id === payload.productId);
      if (!product) {
        controller.abort('Product not found');
        return;
      }
      
      const existingItem = cart.items.find(item => item.productId === payload.productId);
      
      if (existingItem) {
        context.stores.cart.update(cart => ({
          items: cart.items.map(item =>
            item.productId === payload.productId
              ? { ...item, quantity: item.quantity + payload.quantity }
              : item
          )
        }));
      } else {
        context.stores.cart.update(cart => ({
          items: [...cart.items, {
            productId: payload.productId,
            quantity: payload.quantity
          }]
        }));
      }
    },
    []
  );
}

/**
 * Main App Component
 */
function ImprovedMVVMPatternsExample() {
  return (
    <StoreProvider>
      <ActionProvider>
        <ActionHandlerRegistry />
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <h1>Improved MVVM Architecture Example</h1>
          <p>Demonstrates enhanced hooks with performance optimizations</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <UserProfile />
            <UserStats />
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <ShoppingCart />
          </div>
        </div>
      </ActionProvider>
    </StoreProvider>
  );
}

function ActionHandlerRegistry() {
  useAppActions();
  return null;
}

export default ImprovedMVVMPatternsExample;