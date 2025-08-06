import { createDeclarativeStores, type StorePayloadMap, type StoreSchema } from '@context-action/react';
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

/**
 * Store-scenarios용 Declarative Store 패턴
 * 컴파일타임 타입 안전성과 미리 정의된 스키마를 제공
 * 
 * @implements store-registry
 * @implements store-integration-pattern
 * @memberof core-concepts
 * @since 2.0.0
 */
interface StoreScenarios extends StorePayloadMap {
  user: User;
  products: Product[];
  cart: CartItem[];
  todos: TodoItem[];
  messages: ChatMessage[];
  formData: FormData;
  settings: AppSettings;
  notifications: NotificationItem[];
}

// 초기 데이터 export
export const defaultUser: User = {
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

export const initialProducts: Product[] = [
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

export const initialTodos: TodoItem[] = [
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

export const initialMessages: ChatMessage[] = [
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

export const defaultFormData: FormData = {
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

export const defaultSettings: AppSettings = {
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

export const initialNotifications: NotificationItem[] = [
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

const storeScenariosSchema: StoreSchema<StoreScenarios> = {
  user: {
    initialValue: defaultUser,
    description: 'User profile and preferences',
    tags: ['user', 'profile']
  },
  products: {
    initialValue: initialProducts,
    description: 'Product catalog',
    tags: ['shopping', 'products']
  },
  cart: {
    initialValue: [],
    description: 'Shopping cart items',
    tags: ['shopping', 'cart']
  },
  todos: {
    initialValue: initialTodos,
    description: 'Todo list items',
    tags: ['productivity', 'todos']
  },
  messages: {
    initialValue: initialMessages,
    description: 'Chat messages',
    tags: ['communication', 'chat']
  },
  formData: {
    initialValue: defaultFormData,
    description: 'Form wizard data',
    tags: ['forms', 'wizard']
  },
  settings: {
    initialValue: defaultSettings,
    description: 'Application settings',
    tags: ['settings', 'configuration']
  },
  notifications: {
    initialValue: initialNotifications,
    description: 'System notifications',
    tags: ['notifications', 'system']
  }
};

export const StoreScenarios = createDeclarativeStores('StoreScenarios', storeScenariosSchema);

// Declarative Store 패턴을 사용하여 타입 안전한 스토어 접근을 제공합니다.
// 예시:
// const userStore = StoreScenarios.useStore('user'); // 자동 타입 추론: Store<User>
// const cartStore = StoreScenarios.useStore('cart'); // 자동 타입 추론: Store<CartItem[]>