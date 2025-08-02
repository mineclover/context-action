import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createStore, useStoreValue, ActionRegister, ActionPayloadMap, createLogger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';

// 8가지 실제 시나리오 타입들
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastLogin: Date;
  preferences: {
    theme: 'light' | 'dark';
    language: 'ko' | 'en';
    notifications: boolean;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: number;
  rating: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface FormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    newsletter: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

interface AppSettings {
  general: {
    autoSave: boolean;
    confirmOnExit: boolean;
    defaultView: 'list' | 'grid' | 'card';
  };
  performance: {
    cacheSize: number;
    lazyLoading: boolean;
    compressionLevel: number;
  };
  security: {
    sessionTimeout: number;
    twoFactorAuth: boolean;
    passwordExpiry: number;
  };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

// 액션 타입 정의
interface StoreFullActionMap extends ActionPayloadMap {
  // User Management
  updateUser: { user: Partial<User> };
  deleteUser: { userId: string };
  
  // Shopping Cart
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  updateCartQuantity: { productId: string; quantity: number };
  clearCart: void;
  
  // Todo Management
  addTodo: { title: string; priority: TodoItem['priority']; dueDate?: Date };
  toggleTodo: { todoId: string };
  deleteTodo: { todoId: string };
  updateTodo: { todoId: string; updates: Partial<TodoItem> };
  
  // Real-time Chat
  sendMessage: { message: string; sender: string; type: ChatMessage['type'] };
  deleteMessage: { messageId: string };
  
  // Form Wizard
  updatePersonalInfo: { data: Partial<FormData['personalInfo']> };
  updateAddress: { data: Partial<FormData['address']> };
  updatePreferences: { data: Partial<FormData['preferences']> };
  resetForm: void;
  
  // Settings Management
  updateGeneralSettings: { settings: Partial<AppSettings['general']> };
  updatePerformanceSettings: { settings: Partial<AppSettings['performance']> };
  updateSecuritySettings: { settings: Partial<AppSettings['security']> };
  resetToDefaults: void;
  
  // Product Catalog
  addProduct: { product: Omit<Product, 'id'> };
  updateProduct: { productId: string; updates: Partial<Product> };
  deleteProduct: { productId: string };
  filterProducts: { category?: string; minPrice?: number; maxPrice?: number };
  
  // Notification System
  addNotification: { notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> };
  markAsRead: { notificationId: string };
  deleteNotification: { notificationId: string };
  clearAllNotifications: void;
}

// 스토어 인스턴스들 생성 (8가지 시나리오)
const userStore = createStore<User>('user-profile', {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  lastLogin: new Date(),
  preferences: {
    theme: 'light',
    language: 'ko',
    notifications: true
  }
});

const productsStore = createStore<Product[]>('products-catalog', [
  { id: 'p1', name: 'MacBook Pro', price: 2499000, category: 'laptop', inStock: 15, rating: 4.8 },
  { id: 'p2', name: 'iPhone 15', price: 1349000, category: 'phone', inStock: 32, rating: 4.6 },
  { id: 'p3', name: 'AirPods Pro', price: 329000, category: 'audio', inStock: 87, rating: 4.7 },
]);

const cartStore = createStore<CartItem[]>('shopping-cart', []);

const todosStore = createStore<TodoItem[]>('todo-list', [
  {
    id: 'todo-1',
    title: 'Complete project documentation',
    completed: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000),
    dueDate: new Date(Date.now() + 172800000)
  }
]);

const chatStore = createStore<ChatMessage[]>('chat-messages', [
  {
    id: 'msg-1',
    sender: 'System',
    message: 'Welcome to the chat!',
    timestamp: new Date(Date.now() - 300000),
    type: 'text'
  }
]);

const formStore = createStore<FormData>('wizard-form', {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  address: {
    street: '',
    city: '',
    zipCode: '',
    country: 'Korea'
  },
  preferences: {
    newsletter: false,
    marketing: false,
    analytics: false
  }
});

const settingsStore = createStore<AppSettings>('app-settings', {
  general: {
    autoSave: true,
    confirmOnExit: false,
    defaultView: 'list'
  },
  performance: {
    cacheSize: 100,
    lazyLoading: true,
    compressionLevel: 3
  },
  security: {
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90
  }
});

const notificationsStore = createStore<NotificationItem[]>('notifications', [
  {
    id: 'notif-1',
    title: 'Welcome!',
    message: 'Thanks for using our Store Demo system',
    type: 'info',
    timestamp: new Date(Date.now() - 60000),
    read: false
  }
]);

// 액션 레지스터 및 로거 설정
const logger = createLogger(LogLevel.DEBUG);
const storeActionRegister = new ActionRegister<StoreFullActionMap>({ logger });

// 1. User Profile Management Demo
function UserProfileDemo() {
  const user = useStoreValue(userStore);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);

  const handleSave = useCallback(() => {
    storeActionRegister.dispatch('updateUser', { user: editForm });
    setIsEditing(false);
  }, [editForm]);

  const handleCancel = useCallback(() => {
    setEditForm(user);
    setIsEditing(false);
  }, [user]);

  const toggleTheme = useCallback(() => {
    const newTheme = user.preferences.theme === 'light' ? 'dark' : 'light';
    storeActionRegister.dispatch('updateUser', { 
      user: { preferences: { ...user.preferences, theme: newTheme } }
    });
  }, [user.preferences]);

  return (
    <div className="demo-card">
      <h3>👤 User Profile Management</h3>
      
      {!isEditing ? (
        <div className="user-profile-view">
          <div className="profile-info">
            <div className="profile-field">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="profile-field">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="profile-field">
              <strong>Theme:</strong> 
              <span className={`theme-badge ${user.preferences.theme}`}>
                {user.preferences.theme}
              </span>
            </div>
            <div className="profile-field">
              <strong>Last Login:</strong> {user.lastLogin.toLocaleString()}
            </div>
          </div>
          
          <div className="button-group">
            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
            <button onClick={toggleTheme} className="btn btn-secondary">
              Toggle Theme
            </button>
          </div>
        </div>
      ) : (
        <div className="user-profile-edit">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="text-input"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="text-input"
            />
          </div>
          
          <div className="button-group">
            <button onClick={handleSave} className="btn btn-success">
              Save
            </button>
            <button onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Shopping Cart Demo
function ShoppingCartDemo() {
  const products = useStoreValue(productsStore);
  const cart = useStoreValue(cartStore);

  const totalAmount = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);

  const addToCart = useCallback((productId: string) => {
    storeActionRegister.dispatch('addToCart', { productId, quantity: 1 });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      storeActionRegister.dispatch('removeFromCart', { productId });
    } else {
      storeActionRegister.dispatch('updateCartQuantity', { productId, quantity });
    }
  }, []);

  const clearCart = useCallback(() => {
    storeActionRegister.dispatch('clearCart');
  }, []);

  return (
    <div className="demo-card">
      <h3>🛒 Shopping Cart System</h3>
      
      <div className="cart-products">
        <h4>Available Products:</h4>
        <div className="product-list">
          {products.map(product => (
            <div key={product.id} className="product-item">
              <div className="product-info">
                <span className="product-name">{product.name}</span>
                <span className="product-price">₩{product.price.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => addToCart(product.id)}
                className="btn btn-small btn-primary"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-items">
        <div className="cart-header">
          <h4>Cart ({cart.length} items)</h4>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-small btn-danger">
              Clear Cart
            </button>
          )}
        </div>
        
        {cart.length === 0 ? (
          <div className="cart-empty">Your cart is empty</div>
        ) : (
          <>
            <div className="cart-list">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return product ? (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <span className="item-name">{product.name}</span>
                      <span className="item-price">₩{product.price.toLocaleString()}</span>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="btn btn-small btn-secondary"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="btn btn-small btn-secondary"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
            
            <div className="cart-total">
              <strong>Total: ₩{totalAmount.toLocaleString()}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 3. Todo List Demo
function TodoListDemo() {
  const todos = useStoreValue(todosStore);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');

  const addTodo = useCallback(() => {
    if (newTodo.trim()) {
      storeActionRegister.dispatch('addTodo', { 
        title: newTodo.trim(), 
        priority,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      });
      setNewTodo('');
    }
  }, [newTodo, priority]);

  const toggleTodo = useCallback((todoId: string) => {
    storeActionRegister.dispatch('toggleTodo', { todoId });
  }, []);

  const deleteTodo = useCallback((todoId: string) => {
    storeActionRegister.dispatch('deleteTodo', { todoId });
  }, []);

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="demo-card">
      <h3>✅ Todo List Manager</h3>
      
      <div className="todo-stats">
        <span className="todo-total">Total: {todos.length}</span>
        <span className="todo-completed">Completed: {completedCount}</span>
        <span className="todo-pending">Pending: {todos.length - completedCount}</span>
      </div>

      <div className="todo-input">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo..."
          className="text-input"
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value as TodoItem['priority'])}
          className="select-input small"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={addTodo} className="btn btn-primary">
          Add
        </button>
      </div>

      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <div className="todo-content">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
              />
              <div className="todo-text">
                <span className="todo-title">{todo.title}</span>
                <div className="todo-meta">
                  <span className={`priority-badge ${todo.priority}`}>
                    {todo.priority}
                  </span>
                  {todo.dueDate && (
                    <span className="due-date">
                      Due: {todo.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteTodo(todo.id)}
              className="btn btn-small btn-danger"
            >
              ×
            </button>
          </div>
        ))}
        
        {todos.length === 0 && (
          <div className="todo-empty">No todos yet. Add one above!</div>
        )}
      </div>
    </div>
  );
}

// 4. Real-time Chat Demo
function ChatDemo() {
  const messages = useStoreValue(chatStore);
  const [newMessage, setNewMessage] = useState('');
  const [sender] = useState(`User-${Math.floor(Math.random() * 1000)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(() => {
    if (newMessage.trim()) {
      storeActionRegister.dispatch('sendMessage', {
        message: newMessage.trim(),
        sender,
        type: 'text'
      });
      setNewMessage('');
    }
  }, [newMessage, sender]);

  const deleteMessage = useCallback((messageId: string) => {
    storeActionRegister.dispatch('deleteMessage', { messageId });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="demo-card chat-card">
      <h3>💬 Real-time Chat</h3>
      
      <div className="chat-info">
        <span>Connected as: <strong>{sender}</strong></span>
        <span>Messages: {messages.length}</span>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender === sender ? 'own' : 'other'}`}>
            <div className="message-header">
              <span className="message-sender">{message.sender}</span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.sender === sender && (
                <button 
                  onClick={() => deleteMessage(message.id)}
                  className="btn btn-tiny btn-danger"
                >
                  ×
                </button>
              )}
            </div>
            <div className="message-content">{message.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="text-input"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="btn btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}

// 5. Form Wizard Demo
function FormWizardDemo() {
  const formData = useStoreValue(formStore);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['Personal Info', 'Address', 'Preferences'];

  const updatePersonalInfo = useCallback((data: Partial<FormData['personalInfo']>) => {
    storeActionRegister.dispatch('updatePersonalInfo', { data });
  }, []);

  const updateAddress = useCallback((data: Partial<FormData['address']>) => {
    storeActionRegister.dispatch('updateAddress', { data });
  }, []);

  const updatePreferences = useCallback((data: Partial<FormData['preferences']>) => {
    storeActionRegister.dispatch('updatePreferences', { data });
  }, []);

  const resetForm = useCallback(() => {
    storeActionRegister.dispatch('resetForm');
    setCurrentStep(0);
  }, []);

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 0));

  return (
    <div className="demo-card">
      <h3>📋 Multi-step Form Wizard</h3>
      
      <div className="wizard-progress">
        {steps.map((step, index) => (
          <div 
            key={step} 
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {currentStep === 0 && (
          <div className="form-step">
            <h4>Personal Information</h4>
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                value={formData.personalInfo.firstName}
                onChange={(e) => updatePersonalInfo({ firstName: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={formData.personalInfo.lastName}
                onChange={(e) => updatePersonalInfo({ lastName: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                value={formData.personalInfo.phone}
                onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                className="text-input"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="form-step">
            <h4>Address Information</h4>
            <div className="form-group">
              <label>Street:</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => updateAddress({ street: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>City:</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => updateAddress({ city: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Zip Code:</label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => updateAddress({ zipCode: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <select
                value={formData.address.country}
                onChange={(e) => updateAddress({ country: e.target.value })}
                className="select-input"
              >
                <option value="Korea">Korea</option>
                <option value="USA">USA</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            <h4>Preferences</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.newsletter}
                  onChange={(e) => updatePreferences({ newsletter: e.target.checked })}
                />
                Subscribe to newsletter
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.marketing}
                  onChange={(e) => updatePreferences({ marketing: e.target.checked })}
                />
                Receive marketing emails
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.preferences.analytics}
                  onChange={(e) => updatePreferences({ analytics: e.target.checked })}
                />
                Allow analytics tracking
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-controls">
        <button 
          onClick={prevStep} 
          disabled={currentStep === 0}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        <button onClick={resetForm} className="btn btn-warning">
          Reset
        </button>
        
        <button 
          onClick={nextStep} 
          disabled={currentStep === steps.length - 1}
          className="btn btn-primary"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// 6. Settings Management Demo
function SettingsDemo() {
  const settings = useStoreValue(settingsStore);

  const updateGeneral = useCallback((updates: Partial<AppSettings['general']>) => {
    storeActionRegister.dispatch('updateGeneralSettings', { settings: updates });
  }, []);

  const updatePerformance = useCallback((updates: Partial<AppSettings['performance']>) => {
    storeActionRegister.dispatch('updatePerformanceSettings', { settings: updates });
  }, []);

  const updateSecurity = useCallback((updates: Partial<AppSettings['security']>) => {
    storeActionRegister.dispatch('updateSecuritySettings', { settings: updates });
  }, []);

  const resetToDefaults = useCallback(() => {
    storeActionRegister.dispatch('resetToDefaults');
  }, []);

  return (
    <div className="demo-card">
      <h3>⚙️ Settings Management</h3>
      
      <div className="settings-sections">
        <div className="settings-section">
          <h4>General Settings</h4>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.general.autoSave}
                onChange={(e) => updateGeneral({ autoSave: e.target.checked })}
              />
              Auto Save
            </label>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.general.confirmOnExit}
                onChange={(e) => updateGeneral({ confirmOnExit: e.target.checked })}
              />
              Confirm on Exit
            </label>
          </div>
          <div className="setting-item">
            <label>Default View:</label>
            <select
              value={settings.general.defaultView}
              onChange={(e) => updateGeneral({ defaultView: e.target.value as any })}
              className="select-input small"
            >
              <option value="list">List</option>
              <option value="grid">Grid</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h4>Performance</h4>
          <div className="setting-item">
            <label>Cache Size: {settings.performance.cacheSize}MB</label>
            <input
              type="range"
              min="10"
              max="500"
              value={settings.performance.cacheSize}
              onChange={(e) => updatePerformance({ cacheSize: Number(e.target.value) })}
              className="range-input"
            />
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.performance.lazyLoading}
                onChange={(e) => updatePerformance({ lazyLoading: e.target.checked })}
              />
              Lazy Loading
            </label>
          </div>
          <div className="setting-item">
            <label>Compression Level: {settings.performance.compressionLevel}</label>
            <input
              type="range"
              min="1"
              max="9"
              value={settings.performance.compressionLevel}
              onChange={(e) => updatePerformance({ compressionLevel: Number(e.target.value) })}
              className="range-input"
            />
          </div>
        </div>

        <div className="settings-section">
          <h4>Security</h4>
          <div className="setting-item">
            <label>Session Timeout: {settings.security.sessionTimeout} min</label>
            <input
              type="range"
              min="5"
              max="120"
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSecurity({ sessionTimeout: Number(e.target.value) })}
              className="range-input"
            />
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => updateSecurity({ twoFactorAuth: e.target.checked })}
              />
              Two-Factor Authentication
            </label>
          </div>
          <div className="setting-item">
            <label>Password Expiry: {settings.security.passwordExpiry} days</label>
            <input
              type="range"
              min="30"
              max="365"
              value={settings.security.passwordExpiry}
              onChange={(e) => updateSecurity({ passwordExpiry: Number(e.target.value) })}
              className="range-input"
            />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={resetToDefaults} className="btn btn-warning">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// 7. Product Catalog Demo
function ProductCatalogDemo() {
  const products = useStoreValue(productsStore);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: 'laptop',
    inStock: 0,
    rating: 5
  });

  const addProduct = useCallback(() => {
    if (newProduct.name.trim()) {
      storeActionRegister.dispatch('addProduct', { product: newProduct });
      setNewProduct({
        name: '',
        price: 0,
        category: 'laptop',
        inStock: 0,
        rating: 5
      });
      setShowAddForm(false);
    }
  }, [newProduct]);

  const deleteProduct = useCallback((productId: string) => {
    storeActionRegister.dispatch('deleteProduct', { productId });
  }, []);

  const categories = ['laptop', 'phone', 'audio', 'accessories'];

  return (
    <div className="demo-card">
      <h3>🏪 Product Catalog</h3>
      
      <div className="catalog-header">
        <div className="catalog-stats">
          <span>Total Products: {products.length}</span>
          <span>Categories: {new Set(products.map(p => p.category)).size}</span>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-product-form">
          <h4>Add New Product</h4>
          <div className="form-row">
            <input
              type="text"
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="text-input"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              className="text-input small"
            />
          </div>
          <div className="form-row">
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="select-input"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Stock"
              value={newProduct.inStock}
              onChange={(e) => setNewProduct({ ...newProduct, inStock: Number(e.target.value) })}
              className="text-input small"
            />
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              placeholder="Rating"
              value={newProduct.rating}
              onChange={(e) => setNewProduct({ ...newProduct, rating: Number(e.target.value) })}
              className="text-input small"
            />
          </div>
          <button onClick={addProduct} className="btn btn-success">
            Add Product
          </button>
        </div>
      )}

      <div className="product-catalog">
        {products.map(product => (
          <div key={product.id} className="catalog-product">
            <div className="product-header">
              <h4>{product.name}</h4>
              <span className="product-category">{product.category}</span>
            </div>
            <div className="product-details">
              <div className="product-price">₩{product.price.toLocaleString()}</div>
              <div className="product-stock">Stock: {product.inStock}</div>
              <div className="product-rating">⭐ {product.rating}</div>
            </div>
            <button 
              onClick={() => deleteProduct(product.id)}
              className="btn btn-small btn-danger"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. Notification System Demo
function NotificationDemo() {
  const notifications = useStoreValue(notificationsStore);
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback(() => {
    const types: NotificationItem['type'][] = ['info', 'success', 'warning', 'error'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    storeActionRegister.dispatch('addNotification', {
      notification: {
        title: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Notification`,
        message: `This is a ${randomType} notification created at ${new Date().toLocaleTimeString()}`,
        type: randomType
      }
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    storeActionRegister.dispatch('markAsRead', { notificationId });
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    storeActionRegister.dispatch('deleteNotification', { notificationId });
  }, []);

  const clearAll = useCallback(() => {
    storeActionRegister.dispatch('clearAllNotifications');
  }, []);

  return (
    <div className="demo-card">
      <h3>🔔 Notification System</h3>
      
      <div className="notification-header">
        <div className="notification-stats">
          <span>Total: {notifications.length}</span>
          <span>Unread: {unreadCount}</span>
        </div>
        <div className="notification-actions">
          <button onClick={addNotification} className="btn btn-primary">
            Add Random
          </button>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="btn btn-danger">
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No notifications</div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">
                  {notification.timestamp.toLocaleString()}
                </div>
              </div>
              <div className="notification-controls">
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="btn btn-tiny btn-info"
                  >
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="btn btn-tiny btn-danger"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Action Handlers Setup
function StoreFullActionSetup() {
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // User Management Handlers
    unsubscribers.push(
      storeActionRegister.register('updateUser', ({ user }, controller) => {
        userStore.update(prev => ({ ...prev, ...user }));
        controller.next();
      })
    );

    // Shopping Cart Handlers
    unsubscribers.push(
      storeActionRegister.register('addToCart', ({ productId, quantity }, controller) => {
        cartStore.update(prev => {
          const existing = prev.find(item => item.productId === productId);
          if (existing) {
            return prev.map(item =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }
          return [...prev, { productId, quantity, addedAt: new Date() }];
        });
        controller.next();
      }),

      storeActionRegister.register('removeFromCart', ({ productId }, controller) => {
        cartStore.update(prev => prev.filter(item => item.productId !== productId));
        controller.next();
      }),

      storeActionRegister.register('updateCartQuantity', ({ productId, quantity }, controller) => {
        cartStore.update(prev => 
          prev.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        );
        controller.next();
      }),

      storeActionRegister.register('clearCart', (_, controller) => {
        cartStore.setValue([]);
        controller.next();
      })
    );

    // Todo Management Handlers
    unsubscribers.push(
      storeActionRegister.register('addTodo', ({ title, priority, dueDate }, controller) => {
        const newTodo: TodoItem = {
          id: `todo-${Date.now()}`,
          title,
          completed: false,
          priority,
          createdAt: new Date(),
          dueDate
        };
        todosStore.update(prev => [...prev, newTodo]);
        controller.next();
      }),

      storeActionRegister.register('toggleTodo', ({ todoId }, controller) => {
        todosStore.update(prev =>
          prev.map(todo =>
            todo.id === todoId
              ? { ...todo, completed: !todo.completed }
              : todo
          )
        );
        controller.next();
      }),

      storeActionRegister.register('deleteTodo', ({ todoId }, controller) => {
        todosStore.update(prev => prev.filter(todo => todo.id !== todoId));
        controller.next();
      })
    );

    // Chat Handlers
    unsubscribers.push(
      storeActionRegister.register('sendMessage', ({ message, sender, type }, controller) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender,
          message,
          timestamp: new Date(),
          type
        };
        chatStore.update(prev => [...prev, newMessage]);
        controller.next();
      }),

      storeActionRegister.register('deleteMessage', ({ messageId }, controller) => {
        chatStore.update(prev => prev.filter(msg => msg.id !== messageId));
        controller.next();
      })
    );

    // Form Wizard Handlers
    unsubscribers.push(
      storeActionRegister.register('updatePersonalInfo', ({ data }, controller) => {
        formStore.update(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, ...data }
        }));
        controller.next();
      }),

      storeActionRegister.register('updateAddress', ({ data }, controller) => {
        formStore.update(prev => ({
          ...prev,
          address: { ...prev.address, ...data }
        }));
        controller.next();
      }),

      storeActionRegister.register('updatePreferences', ({ data }, controller) => {
        formStore.update(prev => ({
          ...prev,
          preferences: { ...prev.preferences, ...data }
        }));
        controller.next();
      }),

      storeActionRegister.register('resetForm', (_, controller) => {
        formStore.setValue({
          personalInfo: { firstName: '', lastName: '', email: '', phone: '' },
          address: { street: '', city: '', zipCode: '', country: 'Korea' },
          preferences: { newsletter: false, marketing: false, analytics: false }
        });
        controller.next();
      })
    );

    // Settings Handlers
    unsubscribers.push(
      storeActionRegister.register('updateGeneralSettings', ({ settings }, controller) => {
        settingsStore.update(prev => ({
          ...prev,
          general: { ...prev.general, ...settings }
        }));
        controller.next();
      }),

      storeActionRegister.register('updatePerformanceSettings', ({ settings }, controller) => {
        settingsStore.update(prev => ({
          ...prev,
          performance: { ...prev.performance, ...settings }
        }));
        controller.next();
      }),

      storeActionRegister.register('updateSecuritySettings', ({ settings }, controller) => {
        settingsStore.update(prev => ({
          ...prev,
          security: { ...prev.security, ...settings }
        }));
        controller.next();
      }),

      storeActionRegister.register('resetToDefaults', (_, controller) => {
        settingsStore.setValue({
          general: { autoSave: true, confirmOnExit: false, defaultView: 'list' },
          performance: { cacheSize: 100, lazyLoading: true, compressionLevel: 3 },
          security: { sessionTimeout: 30, twoFactorAuth: false, passwordExpiry: 90 }
        });
        controller.next();
      })
    );

    // Product Catalog Handlers
    unsubscribers.push(
      storeActionRegister.register('addProduct', ({ product }, controller) => {
        const newProduct: Product = {
          ...product,
          id: `p${Date.now()}`
        };
        productsStore.update(prev => [...prev, newProduct]);
        controller.next();
      }),

      storeActionRegister.register('deleteProduct', ({ productId }, controller) => {
        productsStore.update(prev => prev.filter(p => p.id !== productId));
        controller.next();
      })
    );

    // Notification Handlers
    unsubscribers.push(
      storeActionRegister.register('addNotification', ({ notification }, controller) => {
        const newNotification: NotificationItem = {
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date(),
          read: false
        };
        notificationsStore.update(prev => [...prev, newNotification]);
        controller.next();
      }),

      storeActionRegister.register('markAsRead', ({ notificationId }, controller) => {
        notificationsStore.update(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: true }
              : notif
          )
        );
        controller.next();
      }),

      storeActionRegister.register('deleteNotification', ({ notificationId }, controller) => {
        notificationsStore.update(prev => prev.filter(notif => notif.id !== notificationId));
        controller.next();
      }),

      storeActionRegister.register('clearAllNotifications', (_, controller) => {
        notificationsStore.setValue([]);
        controller.next();
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return null;
}

function StoreFullDemoPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Store System - 8 Real-world Scenarios</h1>
        <p className="page-description">
          Explore comprehensive store management patterns through 8 practical scenarios:
          user profiles, shopping carts, todo lists, real-time chat, form wizards,
          settings management, product catalogs, and notification systems.
        </p>
      </header>

      <StoreFullActionSetup />

      <div className="demo-grid full-demo-grid">
        <UserProfileDemo />
        <ShoppingCartDemo />
        <TodoListDemo />
        <ChatDemo />
        <FormWizardDemo />
        <SettingsDemo />
        <ProductCatalogDemo />
        <NotificationDemo />
        
        {/* Store Patterns Summary */}
        <div className="demo-card info-card full-width">
          <h3>Store Management Patterns</h3>
          <div className="patterns-grid">
            <div className="pattern-item">
              <h4>1. User Profile</h4>
              <p>Complex object updates with nested properties and real-time sync</p>
            </div>
            <div className="pattern-item">
              <h4>2. Shopping Cart</h4>
              <p>Array manipulation with quantity tracking and calculated totals</p>
            </div>
            <div className="pattern-item">
              <h4>3. Todo List</h4>
              <p>CRUD operations with filtering, sorting, and status management</p>
            </div>
            <div className="pattern-item">
              <h4>4. Real-time Chat</h4>
              <p>Message streaming with auto-scroll and user-specific actions</p>
            </div>
            <div className="pattern-item">
              <h4>5. Form Wizard</h4>
              <p>Multi-step form data with validation and progress tracking</p>
            </div>
            <div className="pattern-item">
              <h4>6. Settings</h4>
              <p>Hierarchical configuration with defaults and reset functionality</p>
            </div>
            <div className="pattern-item">
              <h4>7. Product Catalog</h4>
              <p>Dynamic inventory with category filtering and stock management</p>
            </div>
            <div className="pattern-item">
              <h4>8. Notifications</h4>
              <p>Event-driven alerts with read status and batch operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="code-example">
        <h3>Advanced Store Patterns</h3>
        <pre className="code-block">
{`// 1. Complex Object Updates
const userStore = createStore<User>('user', defaultUser);

// Nested property updates
userStore.update(prev => ({
  ...prev,
  preferences: { ...prev.preferences, theme: 'dark' }
}));

// 2. Array Operations
const cartStore = createStore<CartItem[]>('cart', []);

// Add or update item
cartStore.update(prev => {
  const existing = prev.find(item => item.productId === productId);
  if (existing) {
    return prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  return [...prev, { productId, quantity: 1, addedAt: new Date() }];
});

// 3. Real-time Updates
const chatStore = createStore<ChatMessage[]>('chat', []);

// Stream new messages
chatStore.update(prev => [...prev, newMessage]);

// 4. Multi-step Form Data
const formStore = createStore<FormData>('form', initialForm);

// Step-by-step updates
formStore.update(prev => ({
  ...prev,
  personalInfo: { ...prev.personalInfo, ...updates }
}));`}
        </pre>
      </div>
    </div>
  );
}

export default StoreFullDemoPage;