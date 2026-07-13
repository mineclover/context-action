/**
 * @fileoverview Chat UI Context-Layered boundaries
 * @module ChatUIContexts
 */

import { createActionContext, createStoreContext } from '@context-action/react';
import type { ChatMessage } from '../types';

export interface ChatUIActions {
  updateNewMessage: { message: string };
  setCurrentUser: { user: string };
  setMessageType: { type: ChatMessage['type'] };
  setIsTyping: { typing: boolean };
  clearNewMessage: void;
}

export const { Provider: ChatUIStoreProvider, useStore: useChatUIStore } =
  createStoreContext('ChatUI', {
    newMessage: { initialValue: '' },
    currentUser: { initialValue: '김개발' },
    messageType: { initialValue: 'text' as ChatMessage['type'] },
    isTyping: { initialValue: false },
  });

export const {
  Provider: ChatUIActionProvider,
  useActionDispatch: useChatUIAction,
  useActionHandler: useChatUIActionHandler,
} = createActionContext<ChatUIActions>('ChatUI');
