import { useCallback, useRef, useEffect } from 'react';
import type { Store } from '@context-action/react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { storeActionRegister } from '../actions';
import type { ChatMessage } from '../types';

const CHAT_USERS = ['김개발', '이디자인', '박매니저', '최기획'];

interface UseChatActionsProps {
  messagesStore: Store<ChatMessage[]>;
  newMessage: string;
  currentUser: string;
  messageType: ChatMessage['type'];
  clearNewMessage: () => void;
  setIsTyping: (typing: boolean) => void;
}

/**
 * 채팅 액션 관리 훅
 * sendMessage, deleteMessage, clearChat 등 고수준 액션 처리
 */
export function useChatActions({
  messagesStore,
  newMessage,
  currentUser,
  messageType,
  clearNewMessage,
  setIsTyping,
}: UseChatActionsProps) {
  const logger = useActionLoggerWithToast();

  // Timer refs for cleanup
  const autoResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoResponseTimeoutRef.current) {
        clearTimeout(autoResponseTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Typing simulation with timer cleanup
  const simulateTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [setIsTyping]);

  const sendMessage = useCallback(() => {
    if (newMessage.trim()) {
      const currentCount = messagesStore.getValue()?.length ?? 0;
      logger.logAction('sendChatMessage', {
        message: newMessage.trim(),
        sender: currentUser,
        type: messageType,
        messageLength: newMessage.length,
        currentMessageCount: currentCount,
      });

      storeActionRegister.dispatch('sendMessage', {
        message: newMessage.trim(),
        sender: currentUser,
        type: messageType,
      });

      clearNewMessage();

      // Debounced automatic response simulation (30% chance)
      if (Math.random() < 0.3) {
        if (autoResponseTimeoutRef.current) {
          clearTimeout(autoResponseTimeoutRef.current);
        }

        const otherUsers = CHAT_USERS.filter((user) => user !== currentUser);
        const randomUser =
          otherUsers[Math.floor(Math.random() * otherUsers.length)];
        const responses = [
          '좋은 아이디어네요! 👍',
          '동의합니다.',
          '더 자세히 설명해주실 수 있나요?',
          '한번 시도해볼게요.',
          '확인했습니다! ✅',
          '감사합니다.',
          '다음에 논의해보죠.',
          '이해했습니다.',
        ];
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        if (randomResponse && randomUser) {
          simulateTyping();

          autoResponseTimeoutRef.current = setTimeout(() => {
            storeActionRegister.dispatch('sendMessage', {
              message: randomResponse,
              sender: randomUser,
              type: 'text',
            });
          }, 1500);
        }
      }
    }
  }, [
    newMessage,
    currentUser,
    messageType,
    messagesStore,
    logger,
    simulateTyping,
    clearNewMessage,
  ]);

  const clearChat = useCallback(() => {
    if (window.confirm('모든 메시지를 삭제하시겠습니까?')) {
      const currentCount = messagesStore.getValue()?.length ?? 0;
      logger.logAction('clearChat', {
        messageCount: currentCount,
      });
      storeActionRegister.dispatch('clearChat');
    }
  }, [messagesStore, logger]);

  const deleteMessage = useCallback(
    (messageId: string) => {
      logger.logAction('deleteMessage', { messageId });
      storeActionRegister.dispatch('deleteMessage', { messageId });
    },
    [logger]
  );

  const sendQuickMessage = useCallback(
    (text: string, type: ChatMessage['type']) => {
      logger.logAction('sendQuickMessage', {
        message: text,
        sender: currentUser,
        type,
      });

      storeActionRegister.dispatch('sendMessage', {
        message: text,
        sender: currentUser,
        type,
      });
    },
    [currentUser, logger]
  );

  const handleUserSwitch = useCallback(
    (newUser: string, previousUser: string) => {
      logger.logAction('switchChatUser', {
        newUser,
        previousUser,
      });
    },
    [logger]
  );

  return {
    sendMessage,
    clearChat,
    deleteMessage,
    sendQuickMessage,
    handleUserSwitch,
  };
}
