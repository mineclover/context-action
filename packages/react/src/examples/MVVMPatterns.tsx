/**
 * @fileoverview MVVM Architecture Examples
 * Demonstrates ARCHITECTURE.md patterns with real-world scenarios
 */

import React, { useEffect } from 'react';
import {
  ActionProvider,
  StoreProvider,
  useActionDispatch,
  useStoreValue,
  useMultiStoreAction,
  useTransactionAction,
  useActionWithStores,
  createStore,
  createComputedStore,
  ActionPayloadMap
} from '@context-action/react';

// === TYPES (Domain Models) ===
interface User {
  id: string;
  name: string;
  email: string;
  membershipLevel: 'basic' | 'premium' | 'gold';
  location: string;
  lastModified: number;
  version: number;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

interface Cart {
  items: CartItem[];
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'processing' | 'confirmed' | 'cancelled';
  createdAt: number;
}

interface Account {
  id: string;
  balance: number;
  type: 'checking' | 'savings';
}

interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  timestamp: number;
}

// === ACTION PAYLOAD MAP ===
interface AppActions extends ActionPayloadMap {
  // User actions
  updateUser: { id: string; name: string };
  
  // Cart actions  
  addToCart: { productId: string; quantity: number };
  processCheckout: { paymentMethod: string };
  
  // Account actions
  transferFunds: { fromAccount: string; toAccount: string; amount: number };
  
  // System actions
  validateCartBeforeCheckout: void;
}

// === STORE CREATION (Model Layer) ===
const userStore = createStore<User>({
  id: '',
  name: '',
  email: '',
  membershipLevel: 'basic',
  location: 'US',
  lastModified: 0,
  version: 0
});

const cartStore = createStore<Cart>({ items: [] });

const inventoryStore = createStore<Record<string, Product>>({
  'product1': { id: 'product1', name: 'Product 1', stock: 10, price: 99.99 },
  'product2': { id: 'product2', name: 'Product 2', stock: 5, price: 149.99 }
});

const orderStore = createStore<Order | null>(null);

const accountsStore = createStore<Record<string, Account>>({
  'acc1': { id: 'acc1', balance: 1000, type: 'checking' },
  'acc2': { id: 'acc2', balance: 500, type: 'savings' }
});

const transactionsStore = createStore<Transaction[]>([]);

// === COMPUTED STORES (Derived State) ===
const cartSummaryStore = createComputedStore(
  [cartStore, inventoryStore, userStore],
  (cart, inventory, user) => {
    const validItems = cart.items.filter(item => 
      inventory[item.productId] && inventory[item.productId].stock >= item.quantity
    );
    
    const subtotal = validItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    const discount = calculateDiscount(user.membershipLevel, subtotal);
    const tax = calculateTax(subtotal - discount, user.location);
    
    return {
      itemCount: validItems.length,
      invalidItemCount: cart.items.length - validItems.length,
      subtotal,
      discount,
      tax,
      total: subtotal - discount + tax,
      hasInvalidItems: validItems.length < cart.items.length
    };
  },
  'cartSummary'
);

// === BUSINESS LOGIC HELPERS ===
function calculateDiscount(membershipLevel: User['membershipLevel'], subtotal: number): number {
  switch (membershipLevel) {
    case 'gold': return subtotal * 0.15;
    case 'premium': return subtotal * 0.10;
    case 'basic': return subtotal * 0.05;
    default: return 0;
  }
}

function calculateTax(amount: number, location: string): number {
  return location === 'US' ? amount * 0.08 : amount * 0.12;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidName(name: string): boolean {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
}

// Mock API
const api = {
  updateUser: async (user: User) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return user;
  },
  processOrder: async (order: Order) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (Math.random() < 0.1) { // 10% failure rate for demo
      throw new Error('Payment processing failed');
    }
    return order;
  },
  recordTransaction: async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...transaction, id: generateId(), timestamp: Date.now() };
  }
};

// === ACTION HANDLERS (ViewModel Layer) ===

/**
 * User Actions Hook - demonstrates single store operations with validation
 */
function useUserActions() {
  useActionWithStores(
    'updateUser',
    {
      user: () => userStore,
      activity: () => createStore<any[]>([])
    },
    async (payload, controller, stores) => {
      // Read current state from Model layer
      const currentUser = stores.user.getValue();
      
      // Business logic validation
      if (!isValidName(payload.name)) {
        controller.abort('Invalid name format');
        return;
      }
      
      // Execute business logic
      const updatedUser = {
        ...currentUser,
        ...payload,
        lastModified: Date.now(),
        version: currentUser.version + 1
      };
      
      try {
        // Update Model layer
        stores.user.setValue(updatedUser);
        
        // Log activity (side effect)
        stores.activity.update(activities => [...activities, {
          type: 'user_updated',
          userId: payload.id,
          timestamp: Date.now()
        }]);
        
        // Async side effect (API call)
        await api.updateUser(updatedUser);
        
      } catch (error) {
        // Rollback on failure (automatically handled by useActionWithStores)
        controller.abort('Failed to save changes');
      }
    },
    []
  );
}

/**
 * Cart Actions Hook - demonstrates multi-store coordination with rollback
 */
function useCartActions() {
  // Add to cart with inventory validation
  useMultiStoreAction(
    'addToCart',
    ['cart', 'inventory', 'user'],
    async (payload, controller, context) => {
      // Read from multiple stores (Model layer)
      const cart = context.stores.cart.getValue();
      const inventory = context.stores.inventory.getValue();
      const user = context.stores.user.getValue();
      
      // Business logic using multiple store values
      const product = inventory[payload.productId];
      if (!product) {
        controller.abort('Product not found');
        return;
      }
      
      if (product.stock < payload.quantity) {
        controller.abort(`Only ${product.stock} items available`);
        return;
      }
      
      // Check user permissions
      if (!user.id) {
        controller.abort('User must be logged in');
        return;
      }
      
      // Update cart with validated data
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
            id: generateId(),
            productId: payload.productId,
            quantity: payload.quantity,
            price: product.price
          }]
        }));
      }
    },
    []
  );

  // Complex checkout process with automatic rollback
  useMultiStoreAction(
    'processCheckout',
    ['cart', 'inventory', 'user', 'order'],
    async (payload, controller, context) => {
      // Read current state from multiple stores
      const cart = context.stores.cart.getValue();
      const user = context.stores.user.getValue();
      const inventory = context.stores.inventory.getValue();
      
      // Validation phase
      if (cart.items.length === 0) {
        controller.abort('Cart is empty');
        return;
      }
      
      // Check inventory availability for all items
      const unavailableItems = cart.items.filter(item => 
        inventory[item.productId]?.stock < item.quantity
      );
      
      if (unavailableItems.length > 0) {
        controller.abort('Some items are no longer available');
        return;
      }
      
      // Calculate totals
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = calculateDiscount(user.membershipLevel, subtotal);
      const tax = calculateTax(subtotal - discount, user.location);
      const total = subtotal - discount + tax;
      
      // Create order object
      const order: Order = {
        id: generateId(),
        userId: user.id,
        items: cart.items,
        subtotal,
        discount,
        tax,
        total,
        status: 'processing',
        createdAt: Date.now()
      };
      
      // Execute coordinated updates (Model layer updates)
      // These will be automatically rolled back if an error occurs
      context.stores.order.setValue(order);
      context.stores.cart.setValue({ items: [] });
      
      // Update inventory
      context.stores.inventory.update(inventory => {
        const updatedInventory = { ...inventory };
        cart.items.forEach(item => {
          if (updatedInventory[item.productId]) {
            updatedInventory[item.productId] = {
              ...updatedInventory[item.productId],
              stock: updatedInventory[item.productId].stock - item.quantity
            };
          }
        });
        return updatedInventory;
      });
      
      // Process payment (async operation that might fail)
      try {
        await api.processOrder(order);
        
        // Update order status on successful payment
        context.stores.order.update(order => order ? { ...order, status: 'confirmed' } : null);
        
      } catch (error) {
        // Rollback is handled automatically by useMultiStoreAction
        controller.abort('Payment processing failed');
      }
    },
    []
  );
}

/**
 * Account Actions Hook - demonstrates explicit transaction management
 */
function useAccountActions() {
  useTransactionAction(
    'transferFunds',
    ['accounts', 'transactions'],
    async (payload, controller, context) => {
      const { fromAccount, toAccount, amount } = payload;
      const accounts = context.stores.accounts.getValue();
      
      // Validation
      const fromAcc = accounts[fromAccount];
      const toAcc = accounts[toAccount];
      
      if (!fromAcc || !toAcc) {
        controller.abort('Account not found');
        return;
      }
      
      if (fromAcc.balance < amount) {
        controller.abort('Insufficient funds');
        return;
      }
      
      // Begin explicit transaction
      context.begin();
      
      try {
        // Update accounts atomically
        context.stores.accounts.update(accs => ({
          ...accs,
          [fromAccount]: {
            ...accs[fromAccount],
            balance: accs[fromAccount].balance - amount
          },
          [toAccount]: {
            ...accs[toAccount],
            balance: accs[toAccount].balance + amount
          }
        }));
        
        // Record transaction
        const transaction: Transaction = {
          id: generateId(),
          fromAccount,
          toAccount,
          amount,
          timestamp: Date.now()
        };
        
        context.stores.transactions.update(txns => [...txns, transaction]);
        
        // Persist to external system
        await api.recordTransaction({ fromAccount, toAccount, amount });
        
        // Commit all changes
        await context.commit();
        
      } catch (error) {
        context.rollback();
        controller.abort('Transfer failed');
      }
    },
    []
  );
}

// === VIEW LAYER (React Components) ===

/**
 * User Profile Component - demonstrates View layer patterns
 */
function UserProfile() {
  // Subscribe to stores (Model layer)
  const user = useStoreValue(userStore);
  
  // Get action dispatcher (ViewModel layer)
  const dispatch = useActionDispatch<AppActions>();
  
  // Handle user interactions
  const updateUserName = (name: string) => {
    if (user?.id) {
      dispatch('updateUser', { id: user.id, name });
    }
  };
  
  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user?.name || 'Not set'}</p>
      <p>Email: {user?.email || 'Not set'}</p>
      <p>Membership: {user?.membershipLevel || 'basic'}</p>
      <p>Version: {user?.version || 0}</p>
      
      <input 
        type="text"
        placeholder="Enter new name"
        onBlur={(e) => updateUserName(e.target.value)}
      />
    </div>
  );
}

/**
 * Shopping Cart Component - demonstrates computed store usage
 */
function ShoppingCart() {
  const cart = useStoreValue(cartStore);
  const summary = useStoreValue(cartSummaryStore);
  const dispatch = useActionDispatch<AppActions>();
  
  const addItem = (productId: string, quantity: number) => {
    dispatch('addToCart', { productId, quantity });
  };
  
  const checkout = () => {
    dispatch('processCheckout', { paymentMethod: 'card' });
  };
  
  return (
    <div>
      <h2>Shopping Cart</h2>
      
      <div>
        <h3>Items ({summary?.itemCount || 0})</h3>
        {cart?.items.map(item => (
          <div key={item.id}>
            Product: {item.productId}, Qty: {item.quantity}, Price: ${item.price}
          </div>
        ))}
      </div>
      
      {summary && (
        <div>
          <h3>Summary</h3>
          <p>Subtotal: ${summary.subtotal.toFixed(2)}</p>
          <p>Discount: -${summary.discount.toFixed(2)}</p>
          <p>Tax: ${summary.tax.toFixed(2)}</p>
          <p><strong>Total: ${summary.total.toFixed(2)}</strong></p>
          
          {summary.hasInvalidItems && (
            <p style={{ color: 'red' }}>
              {summary.invalidItemCount} items are no longer available
            </p>
          )}
        </div>
      )}
      
      <div>
        <button onClick={() => addItem('product1', 1)}>
          Add Product 1
        </button>
        <button onClick={() => addItem('product2', 1)}>
          Add Product 2
        </button>
        <button onClick={checkout} disabled={!cart?.items.length}>
          Checkout
        </button>
      </div>
    </div>
  );
}

/**
 * Account Management Component - demonstrates transaction patterns
 */
function AccountManager() {
  const accounts = useStoreValue(accountsStore);
  const transactions = useStoreValue(transactionsStore);
  const dispatch = useActionDispatch<AppActions>();
  
  const transferFunds = () => {
    dispatch('transferFunds', {
      fromAccount: 'acc1',
      toAccount: 'acc2',
      amount: 100
    });
  };
  
  return (
    <div>
      <h2>Account Manager</h2>
      
      <div>
        <h3>Accounts</h3>
        {Object.values(accounts || {}).map(account => (
          <div key={account.id}>
            {account.id}: ${account.balance} ({account.type})
          </div>
        ))}
      </div>
      
      <div>
        <h3>Recent Transactions</h3>
        {transactions?.slice(-5).map(tx => (
          <div key={tx.id}>
            {tx.fromAccount} → {tx.toAccount}: ${tx.amount}
          </div>
        ))}
      </div>
      
      <button onClick={transferFunds}>
        Transfer $100 (acc1 → acc2)
      </button>
    </div>
  );
}

/**
 * Main App Component - demonstrates provider setup
 */
function MVVMPatternsExample() {
  return (
    <StoreProvider>
      <ActionProvider>
        <ActionHandlerRegistry />
        <div style={{ padding: '20px' }}>
          <h1>MVVM Architecture Example</h1>
          <UserProfile />
          <hr />
          <ShoppingCart />
          <hr />
          <AccountManager />
        </div>
      </ActionProvider>
    </StoreProvider>
  );
}

/**
 * Action Handler Registry - registers all action handlers
 */
function ActionHandlerRegistry() {
  useUserActions();
  useCartActions();
  useAccountActions();
  return null;
}

export default MVVMPatternsExample;