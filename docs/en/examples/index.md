# Examples

Learn Context Action through practical examples that demonstrate common patterns and use cases.

## Basic Counter

A simple counter demonstrating basic action dispatching and handling.

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';

interface CounterActions {
  increment: void;
  decrement: void;
  reset: void;
  setCount: number;
}

const { Provider, useAction, useActionHandler } = createActionContext<CounterActions>();

function Counter() {
  const [count, setCount] = useState(0);
  const action = useAction();

  // Register action handlers
  useActionHandler('increment', () => setCount(prev => prev + 1));
  useActionHandler('decrement', () => setCount(prev => prev - 1));
  useActionHandler('reset', () => setCount(0));
  useActionHandler('setCount', (value) => setCount(value));

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => action.dispatch('increment')}>+1</button>
      <button onClick={() => action.dispatch('decrement')}>-1</button>
      <button onClick={() => action.dispatch('setCount', 10)}>Set to 10</button>
      <button onClick={() => action.dispatch('reset')}>Reset</button>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
}
```

## Todo List

A complete todo list application with CRUD operations.

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoActions {
  addTodo: { text: string };
  toggleTodo: { id: string };
  deleteTodo: { id: string };
  editTodo: { id: string; text: string };
  clearCompleted: void;
  toggleAll: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<TodoActions>();

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const action = useAction();

  // Action handlers
  useActionHandler('addTodo', ({ text }) => {
    const newTodo: Todo = {
      id: Math.random().toString(36).slice(2),
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };
    setTodos(prev => [...prev, newTodo]);
  });

  useActionHandler('toggleTodo', ({ id }) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  });

  useActionHandler('deleteTodo', ({ id }) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  });

  useActionHandler('editTodo', ({ id, text }) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, text: text.trim() } : todo
    ));
  });

  useActionHandler('clearCompleted', () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  });

  useActionHandler('toggleAll', () => {
    const allCompleted = todos.every(todo => todo.completed);
    setTodos(prev => prev.map(todo => ({ ...todo, completed: !allCompleted })));
  });

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.length - activeCount;

  return (
    <div>
      <h1>Todo List</h1>
      
      <TodoInput />
      
      {todos.length > 0 && (
        <div>
          <button onClick={() => action.dispatch('toggleAll')}>
            {activeCount === 0 ? 'Mark all incomplete' : 'Mark all complete'}
          </button>
        </div>
      )}

      <TodoList todos={filteredTodos} />

      {todos.length > 0 && (
        <div>
          <p>
            {activeCount} item{activeCount !== 1 ? 's' : ''} left
          </p>
          
          <div>
            <button 
              onClick={() => setFilter('all')}
              disabled={filter === 'all'}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')}
              disabled={filter === 'active'}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('completed')}
              disabled={filter === 'completed'}
            >
              Completed
            </button>
          </div>

          {completedCount > 0 && (
            <button onClick={() => action.dispatch('clearCompleted')}>
              Clear completed ({completedCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TodoInput() {
  const [text, setText] = useState('');
  const action = useAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      action.dispatch('addTodo', { text });
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
      />
      <button type="submit">Add</button>
    </form>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const action = useAction();

  const handleEdit = () => {
    if (editText.trim() && editText !== todo.text) {
      action.dispatch('editTodo', { id: todo.id, text: editText });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => action.dispatch('toggleTodo', { id: todo.id })}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          style={{
            textDecoration: todo.completed ? 'line-through' : 'none',
            opacity: todo.completed ? 0.6 : 1
          }}
        >
          {todo.text}
        </span>
      )}
      
      <button onClick={() => action.dispatch('deleteTodo', { id: todo.id })}>
        Delete
      </button>
    </li>
  );
}

// Root component
function App() {
  return (
    <Provider>
      <TodoApp />
    </Provider>
  );
}
```

## User Authentication

A user authentication system with login, logout, and profile management.

```typescript
import React, { useState, useEffect } from 'react';
import { createActionContext } from '@context-action/react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: { email: string; password: string };
  logout: void;
  register: { email: string; password: string; name: string };
  updateProfile: { name: string; avatar?: string };
  clearError: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<AuthActions>();

// Mock API
const authApi = {
  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    if (email === 'test@example.com' && password === 'password') {
      return { id: '1', email: 'test@example.com', name: 'Test User' };
    }
    throw new Error('Invalid credentials');
  },

  async register(email: string, password: string, name: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: Math.random().toString(), email, name };
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: userId, email: 'test@example.com', name: 'Test User', ...updates };
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null
  });

  // Login handler
  useActionHandler('login', async ({ email, password }) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authApi.login(email, password);
      setAuthState(prev => ({ ...prev, user, isLoading: false }));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }));
    }
  });

  // Register handler
  useActionHandler('register', async ({ email, password, name }) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authApi.register(email, password, name);
      setAuthState(prev => ({ ...prev, user, isLoading: false }));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }));
    }
  });

  // Logout handler
  useActionHandler('logout', async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authApi.logout();
      setAuthState({ user: null, isLoading: false, error: null });
      localStorage.removeItem('user');
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  });

  // Update profile handler
  useActionHandler('updateProfile', async ({ name, avatar }) => {
    if (!authState.user) return;
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const updatedUser = await authApi.updateProfile(authState.user.id, { name, avatar });
      setAuthState(prev => ({ ...prev, user: updatedUser, isLoading: false }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      }));
    }
  });

  // Clear error handler
  useActionHandler('clearError', () => {
    setAuthState(prev => ({ ...prev, error: null }));
  });

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState(prev => ({ ...prev, user }));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// Context for sharing auth state
const AuthContext = React.createContext<AuthState>({
  user: null,
  isLoading: false,
  error: null
});

function useAuth() {
  return React.useContext(AuthContext);
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const action = useAction();
  const { isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('login', { email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
      {error && (
        <div style={{ color: 'red' }}>
          {error}
          <button onClick={() => action.dispatch('clearError')}>×</button>
        </div>
      )}
      
      <div>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
      </div>
      
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      
      <p>Test credentials: test@example.com / password</p>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const action = useAction();
  const { isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('register', { email, password, name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      
      {error && (
        <div style={{ color: 'red' }}>
          {error}
          <button onClick={() => action.dispatch('clearError')}>×</button>
        </div>
      )}
      
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      </div>
      
      <div>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
      </div>
      
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

function UserProfile() {
  const { user, isLoading, error } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const action = useAction();

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('updateProfile', { name });
    setIsEditing(false);
  };

  const handleLogout = () => {
    action.dispatch('logout');
  };

  if (!user) return null;

  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      
      {error && (
        <div style={{ color: 'red' }}>
          {error}
          <button onClick={() => action.dispatch('clearError')}>×</button>
        </div>
      )}
      
      <div>
        <p>Email: {user.email}</p>
        
        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <div>
            <p>Name: {user.name}</p>
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>
      
      <button onClick={handleLogout} disabled={isLoading}>
        {isLoading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

function AuthApp() {
  const { user } = useAuth();
  const [view, setView] = useState<'login' | 'register'>('login');

  if (user) {
    return <UserProfile />;
  }

  return (
    <div>
      <div>
        <button 
          onClick={() => setView('login')}
          disabled={view === 'login'}
        >
          Login
        </button>
        <button 
          onClick={() => setView('register')}
          disabled={view === 'register'}
        >
          Register
        </button>
      </div>
      
      {view === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

function App() {
  return (
    <Provider>
      <AuthProvider>
        <AuthApp />
      </AuthProvider>
    </Provider>
  );
}
```

## Shopping Cart with Async Operations

A shopping cart that demonstrates async operations, error handling, and complex state management.

```typescript
import React, { useState, useEffect } from 'react';
import { createActionContext } from '@context-action/react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartActions {
  loadProducts: void;
  addToCart: { productId: string; quantity?: number };
  removeFromCart: { productId: string };
  updateQuantity: { productId: string; quantity: number };
  clearCart: void;
  checkout: { paymentMethod: string };
}

const { Provider, useAction, useActionHandler } = createActionContext<CartActions>();

// Mock API
const api = {
  async getProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: '1', name: 'JavaScript Book', price: 29.99, image: '📚', stock: 10 },
      { id: '2', name: 'React Mug', price: 15.99, image: '☕', stock: 5 },
      { id: '3', name: 'TypeScript Sticker', price: 3.99, image: '🏷️', stock: 20 },
      { id: '4', name: 'Node.js T-Shirt', price: 24.99, image: '👕', stock: 0 }, // Out of stock
    ];
  },

  async checkout(items: CartItem[], paymentMethod: string): Promise<{ orderId: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate checkout failure occasionally
    if (Math.random() < 0.2) {
      throw new Error('Payment processing failed. Please try again.');
    }
    
    return { orderId: Math.random().toString(36).slice(2) };
  }
};

function ShoppingCartProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Load products handler
  useActionHandler('loadProducts', async () => {
    setLoading(true);
    setError(null);
    
    try {
      const products = await api.getProducts();
      setProducts(products);
    } catch (error) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  });

  // Add to cart handler
  useActionHandler('addToCart', ({ productId, quantity = 1 }) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      setError('Product not found');
      return;
    }

    if (product.stock === 0) {
      setError('Product is out of stock');
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === productId);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          setError(`Only ${product.stock} items available`);
          return prev;
        }
        
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          setError(`Only ${product.stock} items available`);
          return prev;
        }
        
        return [...prev, { product, quantity }];
      }
    });
    
    setError(null);
  });

  // Remove from cart handler
  useActionHandler('removeFromCart', ({ productId }) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  });

  // Update quantity handler
  useActionHandler('updateQuantity', ({ productId, quantity }) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      setError(`Only ${product.stock} items available`);
      return;
    }

    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  });

  // Clear cart handler
  useActionHandler('clearCart', () => {
    setCart([]);
  });

  // Checkout handler
  useActionHandler('checkout', async ({ paymentMethod }) => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const result = await api.checkout(cart, paymentMethod);
      setCart([]); // Clear cart on successful checkout
      alert(`Order successful! Order ID: ${result.orderId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  });

  // Load products on mount
  useEffect(() => {
    const action = { dispatch: (type: string) => {} }; // Simplified for example
    // In real app, you'd get this from useAction hook
  }, []);

  return (
    <CartContext.Provider value={{
      products,
      cart,
      loading,
      error,
      checkoutLoading,
      clearError: () => setError(null)
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Context for sharing cart state
interface CartContextType {
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  checkoutLoading: boolean;
  clearError: () => void;
}

const CartContext = React.createContext<CartContextType>({
  products: [],
  cart: [],
  loading: false,
  error: null,
  checkoutLoading: false,
  clearError: () => {}
});

function useCart() {
  return React.useContext(CartContext);
}

function ProductList() {
  const { products, loading, error } = useCart();
  const action = useAction();

  useEffect(() => {
    action.dispatch('loadProducts');
  }, []);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const action = useAction();
  const { error, clearError } = useCart();

  const handleAddToCart = () => {
    clearError();
    action.dispatch('addToCart', { productId: product.id });
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ fontSize: '3rem', textAlign: 'center' }}>{product.image}</div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <p>Stock: {product.stock}</p>
      
      <button 
        onClick={handleAddToCart}
        disabled={product.stock === 0}
      >
        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}

function Cart() {
  const { cart, error, checkoutLoading, clearError } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const action = useAction();

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    clearError();
    action.dispatch('checkout', { paymentMethod });
  };

  return (
    <div>
      <h2>Shopping Cart</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: '0.5rem' }}>×</button>
        </div>
      )}

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {cart.map(item => (
            <CartItem key={item.product.id} item={item} />
          ))}
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ccc' }}>
            <h3>Total: ${total.toFixed(2)}</h3>
            
            <div style={{ margin: '1rem 0' }}>
              <label>
                Payment Method:
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="credit-card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="apple-pay">Apple Pay</option>
                </select>
              </label>
            </div>
            
            <div>
              <button 
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{ marginRight: '0.5rem' }}
              >
                {checkoutLoading ? 'Processing...' : `Checkout ($${total.toFixed(2)})`}
              </button>
              
              <button onClick={() => action.dispatch('clearCart')}>
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CartItem({ item }: { item: CartItem }) {
  const action = useAction();

  const handleQuantityChange = (quantity: number) => {
    action.dispatch('updateQuantity', { productId: item.product.id, quantity });
  };

  const handleRemove = () => {
    action.dispatch('removeFromCart', { productId: item.product.id });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
      <span style={{ fontSize: '2rem', marginRight: '1rem' }}>{item.product.image}</span>
      
      <div style={{ flex: 1 }}>
        <h4>{item.product.name}</h4>
        <p>${item.product.price} each</p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => handleQuantityChange(item.quantity - 1)}>-</button>
        <span>{item.quantity}</span>
        <button onClick={() => handleQuantityChange(item.quantity + 1)}>+</button>
        
        <button onClick={handleRemove} style={{ marginLeft: '1rem', color: 'red' }}>
          Remove
        </button>
      </div>
      
      <div style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
        ${(item.product.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<'products' | 'cart'>('products');
  const { cart } = useCart();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <nav style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => setView('products')}
          style={{ marginRight: '1rem' }}
        >
          Products
        </button>
        <button onClick={() => setView('cart')}>
          Cart ({cartItemCount})
        </button>
      </nav>

      {view === 'products' ? <ProductList /> : <Cart />}
    </div>
  );
}

function ShoppingApp() {
  return (
    <Provider>
      <ShoppingCartProvider>
        <App />
      </ShoppingCartProvider>
    </Provider>
  );
}
```

## Form with Validation

A complex form demonstrating validation, field dependencies, and async submission.

```typescript
import React, { useState } from 'react';
import { createActionContext } from '@context-action/react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  country: string;
  agreeToTerms: boolean;
  newsletter: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface FormActions {
  updateField: { field: keyof FormData; value: any };
  validateField: { field: keyof FormData };
  validateForm: void;
  submitForm: void;
  resetForm: void;
}

const { Provider, useAction, useActionHandler } = createActionContext<FormActions>();

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  age: 18,
  country: '',
  agreeToTerms: false,
  newsletter: false
};

function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation rules
  const validateField = (field: keyof FormData, value: any, allData: FormData): string => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return !value || value.trim().length < 2 ? 'Must be at least 2 characters' : '';
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email' : '';
        
      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
        
      case 'confirmPassword':
        return value !== allData.password ? 'Passwords do not match' : '';
        
      case 'age':
        const ageNum = Number(value);
        if (ageNum < 13) return 'Must be at least 13 years old';
        if (ageNum > 120) return 'Please enter a valid age';
        return '';
        
      case 'country':
        return !value ? 'Please select a country' : '';
        
      case 'agreeToTerms':
        return !value ? 'You must agree to the terms' : '';
        
      default:
        return '';
    }
  };

  // Update field handler
  useActionHandler('updateField', ({ field, value }) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
      }
      
      // Re-validate dependent fields
      if (field === 'password' && newData.confirmPassword) {
        const confirmPasswordError = validateField('confirmPassword', newData.confirmPassword, newData);
        setErrors(prevErrors => ({ ...prevErrors, confirmPassword: confirmPasswordError }));
      }
      
      return newData;
    });
  });

  // Validate single field handler
  useActionHandler('validateField', ({ field }) => {
    const error = validateField(field, formData[field], formData);
    setErrors(prev => ({ ...prev, [field]: error }));
  });

  // Validate entire form handler
  useActionHandler('validateForm', () => {
    const newErrors: ValidationErrors = {};
    
    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  });

  // Submit form handler
  useActionHandler('submitForm', async () => {
    setSubmitError(null);
    
    // Validate form first
    const newErrors: ValidationErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setSubmitError('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate occasional server error
      if (Math.random() < 0.2) {
        throw new Error('Server error. Please try again.');
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setFormData(initialFormData);
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  });

  // Reset form handler
  useActionHandler('resetForm', () => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  });

  return (
    <FormContext.Provider value={{
      formData,
      errors,
      isSubmitting,
      submitError,
      submitSuccess
    }}>
      {children}
    </FormContext.Provider>
  );
}

// Context for sharing form state
interface FormContextType {
  formData: FormData;
  errors: ValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

const FormContext = React.createContext<FormContextType>({
  formData: initialFormData,
  errors: {},
  isSubmitting: false,
  submitError: null,
  submitSuccess: false
});

function useForm() {
  return React.useContext(FormContext);
}

function RegistrationForm() {
  const { formData, errors, isSubmitting, submitError, submitSuccess } = useForm();
  const action = useAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    action.dispatch('submitForm');
  };

  const handleFieldChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number'
      ? Number(e.target.value)
      : e.target.value;
      
    action.dispatch('updateField', { field, value });
  };

  const handleFieldBlur = (field: keyof FormData) => () => {
    action.dispatch('validateField', { field });
  };

  if (submitSuccess) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>✅ Registration Successful!</h2>
        <p>Welcome! Your account has been created.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Registration Form</h1>
      
      {submitError && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffe6e6' }}>
          {submitError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>
            First Name *
            <input
              type="text"
              value={formData.firstName}
              onChange={handleFieldChange('firstName')}
              onBlur={handleFieldBlur('firstName')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.firstName ? 'red' : undefined
              }}
            />
          </label>
          {errors.firstName && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.firstName}</div>}
        </div>

        <div>
          <label>
            Last Name *
            <input
              type="text"
              value={formData.lastName}
              onChange={handleFieldChange('lastName')}
              onBlur={handleFieldBlur('lastName')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.lastName ? 'red' : undefined
              }}
            />
          </label>
          {errors.lastName && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.lastName}</div>}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Email *
          <input
            type="email"
            value={formData.email}
            onChange={handleFieldChange('email')}
            onBlur={handleFieldBlur('email')}
            style={{ 
              width: '100%', 
              marginTop: '0.25rem',
              borderColor: errors.email ? 'red' : undefined
            }}
          />
        </label>
        {errors.email && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.email}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>
            Password *
            <input
              type="password"
              value={formData.password}
              onChange={handleFieldChange('password')}
              onBlur={handleFieldBlur('password')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.password ? 'red' : undefined
              }}
            />
          </label>
          {errors.password && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.password}</div>}
        </div>

        <div>
          <label>
            Confirm Password *
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={handleFieldChange('confirmPassword')}
              onBlur={handleFieldBlur('confirmPassword')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.confirmPassword ? 'red' : undefined
              }}
            />
          </label>
          {errors.confirmPassword && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.confirmPassword}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>
            Age *
            <input
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={handleFieldChange('age')}
              onBlur={handleFieldBlur('age')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.age ? 'red' : undefined
              }}
            />
          </label>
          {errors.age && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.age}</div>}
        </div>

        <div>
          <label>
            Country *
            <select
              value={formData.country}
              onChange={handleFieldChange('country')}
              onBlur={handleFieldBlur('country')}
              style={{ 
                width: '100%', 
                marginTop: '0.25rem',
                borderColor: errors.country ? 'red' : undefined
              }}
            >
              <option value="">Select a country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
              <option value="AU">Australia</option>
              <option value="other">Other</option>
            </select>
          </label>
          {errors.country && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.country}</div>}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={ { display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleFieldChange('agreeToTerms')}
            onBlur={handleFieldBlur('agreeToTerms')}
            style={{ marginRight: '0.5rem' }}
          />
          I agree to the Terms of Service and Privacy Policy *
        </label>
        {errors.agreeToTerms && <div style={{ color: 'red', fontSize: '0.875rem' }}>{errors.agreeToTerms}</div>}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={formData.newsletter}
            onChange={handleFieldChange('newsletter')}
            style={{ marginRight: '0.5rem' }}
          />
          Subscribe to our newsletter for updates
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            flex: 1, 
            padding: '0.75rem',
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
        
        <button 
          type="button"
          onClick={() => action.dispatch('resetForm')}
          disabled={isSubmitting}
          style={{ 
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

function App() {
  return (
    <Provider>
      <FormProvider>
        <div style={{ padding: '2rem' }}>
          <RegistrationForm />
        </div>
      </FormProvider>
    </Provider>
  );
}
```

These examples demonstrate various patterns and techniques available in Context Action:

- **Basic state management** with simple actions
- **Complex async operations** with loading states and error handling
- **Form validation** with field dependencies and real-time feedback
- **Priority-based handlers** for execution order control
- **Integration patterns** with external APIs and services
- **Error boundaries** and recovery mechanisms
- **Performance optimization** techniques
- **TypeScript integration** for type safety

Each example is self-contained and can be used as a starting point for your own applications.