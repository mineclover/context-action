import { useCallback, useEffect, useRef } from 'react';
import { useStoreValue } from '@context-action/react';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { ChatMessage } from '../types';

/**
 * 채팅 메시지 스토어 관리 및 액션 핸들러 훅
 * 메시지 CRUD 작업을 처리하고 스토어와 동기화
 */
export function useChatMessages() {
  const messagesStore = StoreScenarios.useStore('messages');
  const messages = useStoreValue(messagesStore);

  // Stable action handlers using refs to avoid re-registration
  const handlersRef = useRef({
    sendMessage: ({
      message,
      sender,
      type,
    }: {
      message: string;
      sender: string;
      type: ChatMessage['type'];
    }) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        message,
        timestamp: new Date(),
        type,
      };
      messagesStore.update((prev) => [...prev, newMessage]);
    },
    deleteMessage: ({ messageId }: { messageId: string }) => {
      messagesStore.update((prev) =>
        prev.filter((msg) => msg.id !== messageId)
      );
    },
    clearChat: () => {
      messagesStore.setValue([]);
    },
  });

  // Keep handlers updated with latest store references
  useEffect(() => {
    handlersRef.current = {
      sendMessage: ({
        message,
        sender,
        type,
      }: {
        message: string;
        sender: string;
        type: ChatMessage['type'];
      }) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender,
          message,
          timestamp: new Date(),
          type,
        };
        messagesStore.update((prev) => [...prev, newMessage]);
      },
      deleteMessage: ({ messageId }: { messageId: string }) => {
        messagesStore.update((prev) =>
          prev.filter((msg) => msg.id !== messageId)
        );
      },
      clearChat: () => {
        messagesStore.setValue([]);
      },
    };
  }, [messagesStore]);

  // Stable wrapper functions
  const sendMessageHandler = useCallback(
    (payload: any) => handlersRef.current.sendMessage(payload),
    []
  );
  const deleteMessageHandler = useCallback(
    (payload: any) => handlersRef.current.deleteMessage(payload),
    []
  );
  const clearChatHandler = useCallback(
    () => handlersRef.current.clearChat(),
    []
  );

  // Register action handlers once
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('sendMessage', sendMessageHandler),
      storeActionRegister.register('deleteMessage', deleteMessageHandler),
      storeActionRegister.register('clearChat', clearChatHandler),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sendMessageHandler, deleteMessageHandler, clearChatHandler]);

  return {
    messages,
    messagesStore,
    messageCount: messages?.length ?? 0,
  };
}
