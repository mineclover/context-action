import { storeActionRegister } from './index';
import { StoreScenarios } from '../stores';
import type { ChatMessage } from '../types';

// Chat action handlers - 한 번만 등록되도록 컴포넌트 외부에서 정의
let handlersRegistered = false;

export function registerChatHandlers() {
  if (handlersRegistered) return;
  
  // StoreScenarios.Provider는 컴포넌트이므로 조건문에서 제거
  const messagesStore = null; // Provider 컨텍스트 내에서만 접근 가능
  
  storeActionRegister.register(
    'sendMessage',
    ({ message, sender, type }) => {
      // Store는 Provider 컨텍스트 내에서만 접근 가능하므로 
      // 실제 구현은 컴포넌트에서 처리
      console.log('sendMessage action dispatched', { message, sender, type });
    }
  );

  storeActionRegister.register(
    'deleteMessage',
    ({ messageId }) => {
      console.log('deleteMessage action dispatched', { messageId });
    }
  );

  storeActionRegister.register('clearChat', () => {
    console.log('clearChat action dispatched');
  });

  handlersRegistered = true;
}

// Action handler factory - Provider 컨텍스트에서 실제 store와 연결
export function createChatHandlers(messagesStore: any) {
  return {
    sendMessage: ({ message, sender, type }: { message: string; sender: string; type: ChatMessage['type'] }) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        message,
        timestamp: new Date(),
        type,
      };
      messagesStore.update((prev: ChatMessage[]) => [...prev, newMessage]);
    },

    deleteMessage: ({ messageId }: { messageId: string }) => {
      messagesStore.update((prev: ChatMessage[]) =>
        prev.filter((msg: ChatMessage) => msg.id !== messageId)
      );
    },

    clearChat: () => {
      messagesStore.setValue([]);
    },
  };
}