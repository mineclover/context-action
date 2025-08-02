// 공통 타입 정의

export interface User {
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

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: number;
  rating: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export interface FormData {
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

export interface AppSettings {
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

export interface NotificationItem {
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

// 액션 타입 맵 정의
export interface UserProfileActions {
  updateUser: { user: User };
  updateUserTheme: { theme: 'light' | 'dark' };
  updateUserLanguage: { language: 'ko' | 'en' };
  toggleNotifications: { enabled: boolean };
}

export interface ShoppingCartActions {
  addToCart: { productId: string; quantity: number };
  removeFromCart: { productId: string };
  updateCartQuantity: { productId: string; quantity: number };
  clearCart: {};
}

export interface TodoActions {
  addTodo: { title: string; priority: TodoItem['priority'] };
  toggleTodo: { todoId: string };
  deleteTodo: { todoId: string };
  updateTodoPriority: { todoId: string; priority: TodoItem['priority'] };
}

export interface ChatActions {
  sendMessage: { message: string; sender: string; type: ChatMessage['type'] };
  deleteMessage: { messageId: string };
  clearChat: {};
}

export interface FormWizardActions {
  updatePersonalInfo: { data: Partial<FormData['personalInfo']> };
  updateAddress: { data: Partial<FormData['address']> };
  updatePreferences: { data: Partial<FormData['preferences']> };
  resetForm: {};
}

export interface SettingsActions {
  updateGeneralSettings: { data: Partial<AppSettings['general']> };
  updatePerformanceSettings: { data: Partial<AppSettings['performance']> };
  updateSecuritySettings: { data: Partial<AppSettings['security']> };
  resetSettings: {};
}

export interface NotificationActions {
  addNotification: { notification: Omit<NotificationItem, 'id' | 'timestamp'> };
  markAsRead: { notificationId: string };
  deleteNotification: { notificationId: string };
  clearAllNotifications: {};
}

// 전체 액션 맵
export interface StoreFullActionMap extends 
  UserProfileActions,
  ShoppingCartActions,
  TodoActions,
  ChatActions,
  FormWizardActions,
  SettingsActions,
  NotificationActions {
  [key: string]: any; // ActionPayloadMap 제약조건을 만족하기 위한 인덱스 시그니처
}