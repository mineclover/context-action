import { useCallback } from 'react';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import type { ChatMessage } from '../types';

// UI State Store Context
export const { Provider: ChatUIStoreProvider, useStore: useChatUIStore } =
  createStoreContext('ChatUI', {
    newMessage: { initialValue: '' },
    currentUser: { initialValue: '김개발' },
    messageType: { initialValue: 'text' as ChatMessage['type'] },
    isTyping: { initialValue: false },
  });

// UI Actions for chat interactions
interface ChatUIActions {
  updateNewMessage: { message: string };
  setCurrentUser: { user: string };
  setMessageType: { type: ChatMessage['type'] };
  setIsTyping: { typing: boolean };
  clearNewMessage: void;
}

export const {
  Provider: ChatUIActionProvider,
  useActionDispatch: useChatUIAction,
  useActionHandler: useChatUIActionHandler,
} = createActionContext<ChatUIActions>('ChatUI');

/**
 * 채팅 UI 상태 관리 훅
 * newMessage, currentUser, messageType, isTyping 등 UI 상태를 관리
 */
export function useChatUIState() {
  const newMessageStore = useChatUIStore('newMessage');
  const currentUserStore = useChatUIStore('currentUser');
  const messageTypeStore = useChatUIStore('messageType');
  const isTypingStore = useChatUIStore('isTyping');

  const newMessage = useStoreValue(newMessageStore);
  const currentUser = useStoreValue(currentUserStore);
  const messageType = useStoreValue(messageTypeStore);
  const isTyping = useStoreValue(isTypingStore);

  const uiDispatch = useChatUIAction();

  // Stable handlers for UI state changes
  const handleUserChange = useCallback(
    (user: string) => uiDispatch('setCurrentUser', { user }),
    [uiDispatch]
  );

  const handleMessageTypeChange = useCallback(
    (type: ChatMessage['type']) => uiDispatch('setMessageType', { type }),
    [uiDispatch]
  );

  const handleNewMessageChange = useCallback(
    (message: string) => uiDispatch('updateNewMessage', { message }),
    [uiDispatch]
  );

  const clearNewMessage = useCallback(
    () => uiDispatch('clearNewMessage'),
    [uiDispatch]
  );

  const setIsTyping = useCallback(
    (typing: boolean) => uiDispatch('setIsTyping', { typing }),
    [uiDispatch]
  );

  return {
    // State values
    newMessage,
    currentUser,
    messageType,
    isTyping,
    // Stores
    newMessageStore,
    currentUserStore,
    messageTypeStore,
    isTypingStore,
    // Dispatch
    uiDispatch,
    // Handlers
    handleUserChange,
    handleMessageTypeChange,
    handleNewMessageChange,
    clearNewMessage,
    setIsTyping,
  };
}

/**
 * UI 액션 핸들러 등록 훅
 * ChatUIActionProvider 내부에서 사용되어 액션을 스토어와 연결
 */
export function useChatUIActionHandlers() {
  const newMessageStore = useChatUIStore('newMessage');
  const currentUserStore = useChatUIStore('currentUser');
  const messageTypeStore = useChatUIStore('messageType');
  const isTypingStore = useChatUIStore('isTyping');

  useChatUIActionHandler('updateNewMessage', async ({ message }) => {
    newMessageStore.setValue(message);
  });

  useChatUIActionHandler('setCurrentUser', async ({ user }) => {
    currentUserStore.setValue(user);
  });

  useChatUIActionHandler('setMessageType', async ({ type }) => {
    messageTypeStore.setValue(type);
  });

  useChatUIActionHandler('setIsTyping', async ({ typing }) => {
    isTypingStore.setValue(typing);
  });

  useChatUIActionHandler('clearNewMessage', async () => {
    newMessageStore.setValue('');
  });
}
