import { useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import type { ChatMessage } from '../types';
import {
  useChatUIAction,
  useChatUIStore,
} from '../contexts/ChatUIContexts';

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
