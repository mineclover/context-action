/**
 * @fileoverview Chat UI handler registry
 * @module ChatUIHandlerRegistry
 */

import React from 'react';
import {
  useChatUIActionHandler,
  useChatUIStore,
} from '../contexts/ChatUIContexts';

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

export function ChatUIHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  useChatUIActionHandlers();
  return <>{children}</>;
}
