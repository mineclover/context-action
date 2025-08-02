import { createStore } from '@context-action/react';
import type { 
  User, 
  Product, 
  CartItem, 
  TodoItem, 
  ChatMessage, 
  FormData, 
  AppSettings, 
  NotificationItem 
} from '../types';

// 초기 데이터
const defaultUser: User = {
  id: 'user-1',
  name: '김개발',
  email: 'dev@example.com',
  lastLogin: new Date(Date.now() - 60000),
  preferences: {
    theme: 'light',
    language: 'ko',
    notifications: true
  }
};

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'MacBook Pro M3',
    price: 2500000,
    category: '노트북',
    inStock: 5,
    rating: 4.8
  },
  {
    id: 'prod-2',
    name: 'iPhone 15 Pro',
    price: 1400000,
    category: '스마트폰',
    inStock: 12,
    rating: 4.9
  },
  {
    id: 'prod-3',
    name: 'AirPods Pro',
    price: 320000,
    category: '오디오',
    inStock: 8,
    rating: 4.7
  },
  {
    id: 'prod-4',
    name: 'iPad Air',
    price: 950000,
    category: '태블릿',
    inStock: 0,
    rating: 4.6
  }
];

const initialTodos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Store 시스템 문서 작성',
    completed: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000),
    dueDate: new Date(Date.now() + 86400000)
  },
  {
    id: 'todo-2',
    title: '코드 리뷰 완료',
    completed: true,
    priority: 'medium',
    createdAt: new Date(Date.now() - 3600000)
  }
];

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: '시스템',
    message: '채팅 시스템이 시작되었습니다.',
    timestamp: new Date(Date.now() - 300000),
    type: 'text'
  },
  {
    id: 'msg-2',
    sender: '김개발',
    message: '안녕하세요! 테스트 메시지입니다.',
    timestamp: new Date(Date.now() - 120000),
    type: 'text'
  }
];

const defaultFormData: FormData = {
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
};

const defaultSettings: AppSettings = {
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
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '환영합니다!',
    message: 'Store Demo 시스템에 오신 것을 환영합니다',
    type: 'info',
    timestamp: new Date(Date.now() - 60000),
    read: false
  },
  {
    id: 'notif-2',
    title: '시스템 업데이트',
    message: '새로운 기능이 추가되었습니다',
    type: 'success',
    timestamp: new Date(Date.now() - 300000),
    read: true
  }
];

// 스토어 생성
export const userStore = createStore<User>('demo-user', defaultUser);
export const productsStore = createStore<Product[]>('demo-products', initialProducts);
export const cartStore = createStore<CartItem[]>('demo-cart', []);
export const todosStore = createStore<TodoItem[]>('demo-todos', initialTodos);
export const chatStore = createStore<ChatMessage[]>('demo-chat', initialMessages);
export const formStore = createStore<FormData>('demo-form', defaultFormData);
export const settingsStore = createStore<AppSettings>('demo-settings', defaultSettings);
export const notificationsStore = createStore<NotificationItem[]>('demo-notifications', initialNotifications);

// 스토어 리셋 함수들
export const resetAllStores = () => {
  userStore.setValue(defaultUser);
  cartStore.setValue([]);
  todosStore.setValue(initialTodos);
  chatStore.setValue(initialMessages);
  formStore.setValue(defaultFormData);
  settingsStore.setValue(defaultSettings);
  notificationsStore.setValue(initialNotifications);
};

export const resetUserStore = () => userStore.setValue(defaultUser);
export const resetCartStore = () => cartStore.setValue([]);
export const resetTodosStore = () => todosStore.setValue(initialTodos);
export const resetChatStore = () => chatStore.setValue(initialMessages);
export const resetFormStore = () => formStore.setValue(defaultFormData);
export const resetSettingsStore = () => settingsStore.setValue(defaultSettings);
export const resetNotificationsStore = () => notificationsStore.setValue(initialNotifications);