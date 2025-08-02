import { ActionRegister, createLogger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { setupSelectiveActionToast } from '../../../components/ToastSystem';
import type { StoreFullActionMap, TodoItem, ChatMessage, NotificationItem } from '../types';
import { 
  userStore, 
  productsStore, 
  cartStore, 
  todosStore, 
  chatStore, 
  formStore, 
  settingsStore, 
  notificationsStore 
} from '../stores';

// 로거 및 액션 레지스터 설정
export const logger = createLogger(LogLevel.DEBUG);
export const storeActionRegister = new ActionRegister<StoreFullActionMap>({ logger });

// 액션 핸들러 등록 함수
export const registerStoreActions = () => {
  // 토스트 시스템과 연동 - 주요 액션들만 추적
  const trackedActions = [
    'updateProfile', 'toggleTheme', 'addToCart', 'removeFromCart',
    'addTodo', 'toggleTodo', 'deleteTodo', 'sendMessage', 'deleteMessage',
    'clearChat', 'updateFormField', 'nextStep', 'resetSettings'
  ];
  
  setupSelectiveActionToast(storeActionRegister, trackedActions);
  const unsubscribers: (() => void)[] = [];

  // 1. User Profile Actions
  unsubscribers.push(
    storeActionRegister.register('updateUser', ({ user }, controller) => {
      userStore.setValue(user);
      controller.next();
    }),

    storeActionRegister.register('updateUserTheme', ({ theme }, controller) => {
      userStore.update(prev => ({
        ...prev,
        preferences: { ...prev.preferences, theme }
      }));
      controller.next();
    }),

    storeActionRegister.register('updateUserLanguage', ({ language }, controller) => {
      userStore.update(prev => ({
        ...prev,
        preferences: { ...prev.preferences, language }
      }));
      controller.next();
    }),

    storeActionRegister.register('toggleNotifications', ({ enabled }, controller) => {
      userStore.update(prev => ({
        ...prev,
        preferences: { ...prev.preferences, notifications: enabled }
      }));
      controller.next();
    })
  );

  // 2. Shopping Cart Actions
  unsubscribers.push(
    storeActionRegister.register('addToCart', ({ productId, quantity }, controller) => {
      cartStore.update(prev => {
        const existingItem = prev.find(item => item.productId === productId);
        if (existingItem) {
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
          item.productId === productId ? { ...item, quantity } : item
        )
      );
      controller.next();
    }),

    storeActionRegister.register('clearCart', (_, controller) => {
      cartStore.setValue([]);
      controller.next();
    })
  );

  // 3. Todo Actions
  unsubscribers.push(
    storeActionRegister.register('addTodo', ({ title, priority }, controller) => {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title,
        completed: false,
        priority,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
      };
      todosStore.update(prev => [...prev, newTodo]);
      controller.next();
    }),

    storeActionRegister.register('toggleTodo', ({ todoId }, controller) => {
      todosStore.update(prev =>
        prev.map(todo =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        )
      );
      controller.next();
    }),

    storeActionRegister.register('deleteTodo', ({ todoId }, controller) => {
      todosStore.update(prev => prev.filter(todo => todo.id !== todoId));
      controller.next();
    }),

    storeActionRegister.register('updateTodoPriority', ({ todoId, priority }, controller) => {
      todosStore.update(prev =>
        prev.map(todo =>
          todo.id === todoId ? { ...todo, priority } : todo
        )
      );
      controller.next();
    })
  );

  // 4. Chat Actions
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
    }),

    storeActionRegister.register('clearChat', (_, controller) => {
      chatStore.setValue([]);
      controller.next();
    })
  );

  // 5. Form Wizard Actions
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

  // 6. Settings Actions
  unsubscribers.push(
    storeActionRegister.register('updateGeneralSettings', ({ data }, controller) => {
      settingsStore.update(prev => ({
        ...prev,
        general: { ...prev.general, ...data }
      }));
      controller.next();
    }),

    storeActionRegister.register('updatePerformanceSettings', ({ data }, controller) => {
      settingsStore.update(prev => ({
        ...prev,
        performance: { ...prev.performance, ...data }
      }));
      controller.next();
    }),

    storeActionRegister.register('updateSecuritySettings', ({ data }, controller) => {
      settingsStore.update(prev => ({
        ...prev,
        security: { ...prev.security, ...data }
      }));
      controller.next();
    }),

    storeActionRegister.register('resetSettings', (_, controller) => {
      settingsStore.setValue({
        general: { autoSave: true, confirmOnExit: false, defaultView: 'list' },
        performance: { cacheSize: 100, lazyLoading: true, compressionLevel: 3 },
        security: { sessionTimeout: 30, twoFactorAuth: false, passwordExpiry: 90 }
      });
      controller.next();
    })
  );

  // 7. Notification Actions
  unsubscribers.push(
    storeActionRegister.register('addNotification', ({ notification }, controller) => {
      const newNotification: NotificationItem = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date()
      };
      notificationsStore.update(prev => [newNotification, ...prev]);
      controller.next();
    }),

    storeActionRegister.register('markAsRead', ({ notificationId }, controller) => {
      notificationsStore.update(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
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
};