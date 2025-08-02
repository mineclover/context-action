import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createStore, useStoreValue, ActionRegister, ActionPayloadMap, createLogger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { PageWithLogMonitor } from '../../components/LogMonitor';

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
    if (editForm) {
      storeActionRegister.dispatch('updateUser', { user: editForm });
    }
    setIsEditing(false);
  }, [editForm]);

  const handleCancel = useCallback(() => {
    setEditForm(user);
    setIsEditing(false);
  }, [user]);

  const toggleTheme = useCallback(() => {
    if (user?.preferences) {
      const newTheme = user.preferences.theme === 'light' ? 'dark' : 'light';
      storeActionRegister.dispatch('updateUser', { 
        user: { ...user, preferences: { ...user.preferences, theme: newTheme } }
      });
    }
  }, [user]);

  return (
    <div className="demo-card">
      <h3>👤 User Profile Management</h3>
      
      {!isEditing ? (
        <div className="user-profile-view">
          <div className="profile-info">
            <div className="profile-field">
              <strong>Name:</strong> {user?.name ?? 'Unknown'}
            </div>
            <div className="profile-field">
              <strong>Email:</strong> {user?.email ?? 'Unknown'}
            </div>
            <div className="profile-field">
              <strong>Theme:</strong> 
              <span className={`theme-badge ${user?.preferences?.theme ?? 'light'}`}>
                {user?.preferences?.theme ?? 'light'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Last Login:</strong> {user?.lastLogin?.toLocaleString() ?? 'Never'}
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
              value={editForm?.name ?? ''}
              onChange={(e) => editForm && setEditForm({ ...editForm, name: e.target.value })}
              className="text-input"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={editForm?.email ?? ''}
              onChange={(e) => editForm && setEditForm({ ...editForm, email: e.target.value })}
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
    if (!cart || !products) return 0;
    return cart?.reduce((total, item) => {
      const product = products?.find(p => p.id === item.productId);
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
          {products?.map(product => (
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
          <h4>Cart ({cart?.length ?? 0} items)</h4>
          {(cart?.length ?? 0) > 0 && (
            <button onClick={clearCart} className="btn btn-small btn-danger">
              Clear Cart
            </button>
          )}
        </div>
        
        {cart?.length ?? 0 === 0 ? (
          <div className="cart-empty">Your cart is empty</div>
        ) : (
          <>
            <div className="cart-list">
              {cart?.map(item => {
                const product = products?.find(p => p.id === item.productId);
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

  const completedCount = todos?.filter(todo => todo.completed).length ?? 0;

  return (
    <div className="demo-card">
      <h3>✅ Todo List Manager</h3>
      
      <div className="todo-stats">
        <span className="todo-total">Total: {todos?.length ?? 0}</span>
        <span className="todo-completed">Completed: {completedCount}</span>
        <span className="todo-pending">Pending: {(todos?.length ?? 0) - completedCount}</span>
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
        {todos?.map(todo => (
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
        
        {(todos?.length ?? 0) === 0 && (
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
        <span>Messages: {messages?.length ?? 0}</span>
      </div>

      <div className="chat-messages">
        {messages?.map(message => (
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
                value={formData?.personalInfo?.firstName ?? ''}
                onChange={(e) => updatePersonalInfo({ firstName: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={formData?.personalInfo?.lastName ?? ''}
                onChange={(e) => updatePersonalInfo({ lastName: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={formData?.personalInfo?.email ?? ''}
                onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                value={formData?.personalInfo?.phone ?? ''}
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
                value={formData?.address?.street ?? ''}
                onChange={(e) => updateAddress({ street: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>City:</label>
              <input
                type="text"
                value={formData?.address?.city ?? ''}
                onChange={(e) => updateAddress({ city: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Zip Code:</label>
              <input
                type="text"
                value={formData?.address?.zipCode ?? ''}
                onChange={(e) => updateAddress({ zipCode: e.target.value })}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <select
                value={formData?.address?.country ?? ''}
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
                  checked={formData?.preferences?.newsletter ?? false}
                  onChange={(e) => updatePreferences({ newsletter: e.target.checked })}
                />
                Subscribe to newsletter
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData?.preferences?.marketing ?? false}
                  onChange={(e) => updatePreferences({ marketing: e.target.checked })}
                />
                Receive marketing emails
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData?.preferences?.analytics ?? false}
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
  const [testScenario, setTestScenario] = useState<string>('');
  const [simulationResults, setSimulationResults] = useState<string[]>([]);

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

  // 테스트 시나리오 실행
  const runTestScenario = useCallback((scenario: string) => {
    setTestScenario(scenario);
    setSimulationResults([]);
    
    const results: string[] = [];
    
    switch (scenario) {
      case 'auto-save-test':
        results.push('🔄 Auto-save 테스트 시작...');
        results.push('📝 사용자가 문서를 편집 중...');
        results.push(`⏰ ${settings?.general?.autoSave ? 'Auto-save 활성화됨' : 'Auto-save 비활성화됨'}`);
        if (settings?.general?.autoSave) {
          results.push('💾 자동 저장 실행됨');
          results.push('✅ 데이터 손실 방지됨');
        } else {
          results.push('⚠️ 자동 저장되지 않음');
          results.push('❌ 데이터 손실 위험');
        }
        break;
        
      case 'performance-test':
        results.push('🚀 성능 테스트 시작...');
        results.push(`💾 캐시 크기: ${settings?.performance?.cacheSize ?? 100}MB`);
        results.push(`🔧 압축 레벨: ${settings?.performance?.compressionLevel ?? 5}`);
        results.push(`⚡ 지연 로딩: ${settings?.performance?.lazyLoading ? '활성화' : '비활성화'}`);
        
        const cacheSize = settings?.performance?.cacheSize ?? 100;
        const compressionLevel = settings?.performance?.compressionLevel ?? 5;
        const lazyLoading = settings?.performance?.lazyLoading ?? false;
        
        if (cacheSize > 200 && compressionLevel > 7 && lazyLoading) {
          results.push('🏆 최적 성능 설정');
          results.push('⚡ 빠른 로딩 속도');
        } else if (cacheSize < 50 || compressionLevel < 3) {
          results.push('🐌 낮은 성능 설정');
          results.push('⏳ 느린 로딩 속도');
        } else {
          results.push('⚖️ 중간 성능 설정');
          results.push('📊 적절한 성능');
        }
        break;
        
      case 'security-test':
        results.push('🔒 보안 테스트 시작...');
        results.push(`⏱️ 세션 타임아웃: ${settings?.security?.sessionTimeout ?? 30}분`);
        results.push(`🔐 2FA: ${settings?.security?.twoFactorAuth ? '활성화' : '비활성화'}`);
        results.push(`🔑 비밀번호 만료: ${settings?.security?.passwordExpiry ?? 90}일`);
        
        const sessionTimeout = settings?.security?.sessionTimeout ?? 30;
        const twoFactorAuth = settings?.security?.twoFactorAuth ?? false;
        const passwordExpiry = settings?.security?.passwordExpiry ?? 90;
        
        if (sessionTimeout <= 15 && twoFactorAuth && passwordExpiry <= 60) {
          results.push('🛡️ 높은 보안 설정');
          results.push('✅ 강력한 보안 정책');
        } else if (sessionTimeout > 60 || !twoFactorAuth) {
          results.push('⚠️ 낮은 보안 설정');
          results.push('❌ 보안 위험');
        } else {
          results.push('🛡️ 중간 보안 설정');
          results.push('📊 적절한 보안');
        }
        break;
        
      case 'exit-confirmation-test':
        results.push('🚪 종료 확인 테스트...');
        results.push('📝 사용자가 작업 중인 문서가 있음');
        results.push(`❓ 종료 확인: ${settings?.general?.confirmOnExit ? '활성화' : '비활성화'}`);
        
        if (settings?.general?.confirmOnExit) {
          results.push('💬 "저장하지 않고 종료하시겠습니까?" 대화상자 표시');
          results.push('✅ 데이터 손실 방지됨');
        } else {
          results.push('🚪 즉시 종료됨');
          results.push('❌ 저장되지 않은 데이터 손실');
        }
        break;
        
      case 'view-mode-test':
        results.push('👁️ 뷰 모드 테스트...');
        results.push(`📋 기본 뷰: ${settings?.general?.defaultView ?? 'list'}`);
        
        const viewMode = settings?.general?.defaultView ?? 'list';
        switch (viewMode) {
          case 'list':
            results.push('📋 리스트 뷰로 표시');
            results.push('📊 간단한 정보 표시');
            break;
          case 'grid':
            results.push('🔲 그리드 뷰로 표시');
            results.push('🖼️ 썸네일 형태로 표시');
            break;
          case 'card':
            results.push('🃏 카드 뷰로 표시');
            results.push('📄 상세 정보 포함 표시');
            break;
        }
        break;
    }
    
    setSimulationResults(results);
  }, [settings]);

  return (
    <div className="demo-card">
      <h3>⚙️ Settings Management</h3>
      
      {/* 테스트 시나리오 섹션 */}
      <div className="test-scenarios">
        <h4>🧪 테스트 시나리오</h4>
        <div className="scenario-buttons">
          <button 
            onClick={() => runTestScenario('auto-save-test')}
            className="btn btn-primary btn-small"
          >
            Auto-save 테스트
          </button>
          <button 
            onClick={() => runTestScenario('performance-test')}
            className="btn btn-primary btn-small"
          >
            성능 테스트
          </button>
          <button 
            onClick={() => runTestScenario('security-test')}
            className="btn btn-primary btn-small"
          >
            보안 테스트
          </button>
          <button 
            onClick={() => runTestScenario('exit-confirmation-test')}
            className="btn btn-primary btn-small"
          >
            종료 확인 테스트
          </button>
          <button 
            onClick={() => runTestScenario('view-mode-test')}
            className="btn btn-primary btn-small"
          >
            뷰 모드 테스트
          </button>
        </div>
        
        {testScenario && (
          <div className="simulation-results">
            <h5>📊 시뮬레이션 결과</h5>
            <div className="results-list">
              {simulationResults.map((result, index) => (
                <div key={index} className="result-item">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="settings-sections">
        <div className="settings-section">
          <h4>General Settings</h4>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings?.general?.autoSave ?? false}
                onChange={(e) => updateGeneral({ autoSave: e.target.checked })}
              />
              Auto Save
            </label>
            <small>문서 편집 시 자동 저장</small>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings?.general?.confirmOnExit ?? false}
                onChange={(e) => updateGeneral({ confirmOnExit: e.target.checked })}
              />
              Confirm on Exit
            </label>
            <small>종료 시 확인 대화상자 표시</small>
          </div>
          <div className="setting-item">
            <label>Default View:</label>
            <select
              value={settings?.general?.defaultView ?? 'list'}
              onChange={(e) => updateGeneral({ defaultView: e.target.value as any })}
              className="select-input small"
            >
              <option value="list">List</option>
              <option value="grid">Grid</option>
              <option value="card">Card</option>
            </select>
            <small>기본 표시 모드</small>
          </div>
        </div>

        <div className="settings-section">
          <h4>Performance</h4>
          <div className="setting-item">
            <label>Cache Size: {settings?.performance?.cacheSize ?? 100}MB</label>
            <input
              type="range"
              min="10"
              max="500"
              value={settings?.performance?.cacheSize ?? 100}
              onChange={(e) => updatePerformance({ cacheSize: Number(e.target.value) })}
              className="range-input"
            />
            <small>메모리 캐시 크기 (성능에 영향)</small>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings?.performance?.lazyLoading ?? false}
                onChange={(e) => updatePerformance({ lazyLoading: e.target.checked })}
              />
              Lazy Loading
            </label>
            <small>필요할 때만 데이터 로드</small>
          </div>
          <div className="setting-item">
            <label>Compression Level: {settings?.performance?.compressionLevel ?? 5}</label>
            <input
              type="range"
              min="1"
              max="9"
              value={settings?.performance?.compressionLevel ?? 5}
              onChange={(e) => updatePerformance({ compressionLevel: Number(e.target.value) })}
              className="range-input"
            />
            <small>데이터 압축 레벨 (1=빠름, 9=높은 압축)</small>
          </div>
        </div>

        <div className="settings-section">
          <h4>Security</h4>
          <div className="setting-item">
            <label>Session Timeout: {settings?.security?.sessionTimeout ?? 30} min</label>
            <input
              type="range"
              min="5"
              max="120"
              value={settings?.security?.sessionTimeout ?? 30}
              onChange={(e) => updateSecurity({ sessionTimeout: Number(e.target.value) })}
              className="range-input"
            />
            <small>자동 로그아웃 시간</small>
          </div>
          <div className="setting-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings?.security?.twoFactorAuth ?? false}
                onChange={(e) => updateSecurity({ twoFactorAuth: e.target.checked })}
              />
              Two-Factor Authentication
            </label>
            <small>이중 인증 활성화</small>
          </div>
          <div className="setting-item">
            <label>Password Expiry: {settings?.security?.passwordExpiry ?? 90} days</label>
            <input
              type="range"
              min="30"
              max="365"
              value={settings?.security?.passwordExpiry ?? 90}
              onChange={(e) => updateSecurity({ passwordExpiry: Number(e.target.value) })}
              className="range-input"
            />
            <small>비밀번호 만료 기간</small>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={resetToDefaults} className="btn btn-warning">
          Reset to Defaults
        </button>
      </div>
      
      {/* 시스템 이점 설명 */}
      <div className="system-benefits">
        <h4>🎯 시스템 이점</h4>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h5>🔄 실시간 반영</h5>
            <p>설정 변경이 즉시 모든 컴포넌트에 반영됩니다.</p>
          </div>
          <div className="benefit-item">
            <h5>📊 타입 안전성</h5>
            <p>TypeScript로 설정 타입이 보장되어 런타임 에러를 방지합니다.</p>
          </div>
          <div className="benefit-item">
            <h5>🎛️ 중앙화된 관리</h5>
            <p>모든 설정이 하나의 스토어에서 관리되어 일관성을 보장합니다.</p>
          </div>
          <div className="benefit-item">
            <h5>🔍 디버깅 용이성</h5>
            <p>ActionRegister를 통한 모든 설정 변경이 로깅되어 추적이 쉽습니다.</p>
          </div>
        </div>
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
          <span>Total Products: {products?.length ?? 0}</span>
          <span>Categories: {new Set(products?.map(p => p.category)).size}</span>
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
        {products?.map(product => (
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
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

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
          <span>Total: {notifications?.length ?? 0}</span>
          <span>Unread: {unreadCount}</span>
        </div>
        <div className="notification-actions">
          <button onClick={addNotification} className="btn btn-primary">
            Add Random
          </button>
          {(notifications?.length ?? 0) > 0 && (
            <button onClick={clearAll} className="btn btn-danger">
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="notification-list">
        {(notifications?.length ?? 0) === 0 ? (
          <div className="notification-empty">No notifications</div>
        ) : (
          notifications?.map(notification => (
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
  const [activeDemo, setActiveDemo] = useState<string>('user-profile');
  const [showAllDemos, setShowAllDemos] = useState<boolean>(false);

  const demos = [
    { id: 'user-profile', title: '👤 User Profile', description: 'Complex object updates with nested properties', component: <UserProfileDemo /> },
    { id: 'shopping-cart', title: '🛒 Shopping Cart', description: 'Array manipulation with quantity tracking', component: <ShoppingCartDemo /> },
    { id: 'todo-list', title: '✅ Todo List', description: 'CRUD operations with filtering and sorting', component: <TodoListDemo /> },
    { id: 'chat', title: '💬 Real-time Chat', description: 'Message streaming with auto-scroll', component: <ChatDemo /> },
    { id: 'form-wizard', title: '📋 Form Wizard', description: 'Multi-step form data validation', component: <FormWizardDemo /> },
    { id: 'settings', title: '⚙️ Settings', description: 'Hierarchical configuration management', component: <SettingsDemo /> },
    { id: 'product-catalog', title: '📦 Product Catalog', description: 'Dynamic inventory management', component: <ProductCatalogDemo /> },
    { id: 'notifications', title: '🔔 Notifications', description: 'Event-driven alerts system', component: <NotificationDemo /> }
  ];

  const currentDemo = demos.find(demo => demo.id === activeDemo);

  return (
    <PageWithLogMonitor pageId="store-full-demo" title="Store System - 8 Real-world Scenarios">
      <div className="page-container">
        <header className="page-header">
          <h1>Store System - 8 Real-world Scenarios</h1>
          <p className="page-description">
            Explore comprehensive store management patterns through 8 practical scenarios.
            Each demo showcases different aspects of reactive state management.
          </p>
        </header>

        <StoreFullActionSetup />

        {/* Demo Navigation */}
        <div className="demo-navigation">
          <div className="demo-tabs">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`demo-tab ${activeDemo === demo.id ? 'active' : ''}`}
              >
                <span className="tab-title">{demo.title}</span>
                <span className="tab-description">{demo.description}</span>
              </button>
            ))}
          </div>
          
          <div className="view-controls">
            <button
              onClick={() => setShowAllDemos(!showAllDemos)}
              className={`btn ${showAllDemos ? 'btn-secondary' : 'btn-primary'}`}
            >
              {showAllDemos ? '🎯 Focus Mode' : '🌐 Show All'}
            </button>
          </div>
        </div>

        {/* Demo Content */}
        {showAllDemos ? (
          <div className="demo-grid full-demo-grid">
            <UserProfileDemo />
            <ShoppingCartDemo />
            <TodoListDemo />
            <ChatDemo />
            <FormWizardDemo />
            <SettingsDemo />
            <ProductCatalogDemo />
            <NotificationDemo />
          </div>
        ) : (
          <div className="focused-demo">
            <div className="demo-header">
              <h2>{currentDemo?.title}</h2>
              <p>{currentDemo?.description}</p>
            </div>
            <div className="demo-content">
              {currentDemo?.component}
            </div>
            
            {/* Demo Navigator */}
            <div className="demo-navigator">
              <button
                onClick={() => {
                  const currentIndex = demos.findIndex(d => d.id === activeDemo);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : demos.length - 1;
                  setActiveDemo(demos[prevIndex].id);
                }}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
              
              <span className="demo-counter">
                {demos.findIndex(d => d.id === activeDemo) + 1} of {demos.length}
              </span>
              
              <button
                onClick={() => {
                  const currentIndex = demos.findIndex(d => d.id === activeDemo);
                  const nextIndex = currentIndex < demos.length - 1 ? currentIndex + 1 : 0;
                  setActiveDemo(demos[nextIndex].id);
                }}
                className="btn btn-primary"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Store Patterns Summary */}
        <div className="patterns-summary">
          <h3>📚 Store Management Patterns Overview</h3>
          <div className="patterns-grid">
            {demos.map((demo, index) => (
              <div 
                key={demo.id} 
                className={`pattern-item ${activeDemo === demo.id ? 'active' : ''}`}
                onClick={() => setActiveDemo(demo.id)}
              >
                <h4>{index + 1}. {demo.title}</h4>
                <p>{demo.description}</p>
                {activeDemo === demo.id && <div className="pattern-indicator">Currently Viewing</div>}
              </div>
            ))}
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

        {/* Benefits Section */}
        <div className="system-benefits">
          <h3>🎯 Store System Benefits</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h4>🔄 Reactive Updates</h4>
              <p>모든 컴포넌트가 자동으로 상태 변경에 반응하여 업데이트됩니다.</p>
            </div>
            <div className="benefit-item">
              <h4>📊 Type Safety</h4>
              <p>TypeScript 타입 시스템으로 런타임 에러를 방지합니다.</p>
            </div>
            <div className="benefit-item">
              <h4>🎛️ Centralized State</h4>
              <p>모든 상태가 중앙에서 관리되어 예측 가능한 데이터 흐름을 제공합니다.</p>
            </div>
            <div className="benefit-item">
              <h4>🔍 DevTools Integration</h4>
              <p>강력한 디버깅 도구와 로깅 시스템이 내장되어 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default StoreFullDemoPage;