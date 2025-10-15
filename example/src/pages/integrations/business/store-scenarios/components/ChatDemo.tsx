import { useStoreValue, createStoreContext, createActionContext } from '@context-action/react';
import { createRefContext } from '@context-action/react';
import React, { useCallback, useEffect, memo, useRef } from 'react';
import { useActionLoggerWithToast } from '@/components/LogMonitor';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { ChatMessage } from '../types';

// UI State Management with Context-Action
const {
  Provider: ChatUIStoreProvider,
  useStore: useChatUIStore
} = createStoreContext('ChatUI', {
  newMessage: { initialValue: '' },
  currentUser: { initialValue: '김개발' },
  messageType: { initialValue: 'text' as ChatMessage['type'] },
  isTyping: { initialValue: false }
});

// UI Actions for chat interactions
interface ChatUIActions {
  updateNewMessage: { message: string };
  setCurrentUser: { user: string };
  setMessageType: { type: ChatMessage['type'] };
  setIsTyping: { typing: boolean };
  clearNewMessage: void;
}

const {
  Provider: ChatUIActionProvider,
  useActionDispatch: useChatUIAction,
  useActionHandler: useChatUIActionHandler
} = createActionContext<ChatUIActions>('ChatUI');
import '../styles/chat-scroll.css';

const CHAT_USERS = ['김개발', '이디자인', '박매니저', '최기획'];

// Chat ref context 정의 - RefTarget 제약조건 충족
interface ChatRefs {
  messagesContainer: HTMLDivElement;
  messagesEnd: HTMLDivElement;
  readonly [key: string]: any;
}

// Chat ref context 생성
const ChatRefsContext = createRefContext<ChatRefs>('ChatDemo');

// 헬퍼 함수들을 컴포넌트 외부로 이동
const getMessageTime = (timestamp: Date) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getUserColor = (sender: string) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const index = CHAT_USERS.indexOf(sender) % colors.length;
  return colors[index];
};

const getUserAvatar = (sender: string) => {
  const avatars = ['👨‍💻', '🎨', '💼', '📊'];
  const index = CHAT_USERS.indexOf(sender) % avatars.length;
  return avatars[index];
};

// 빠른 메시지 옵션들을 상수로 분리
const QUICK_MESSAGES = [
  { text: '안녕하세요! 👋', type: 'text' as const },
  { text: '좋은 아이디어입니다!', type: 'text' as const },
  { text: '확인했습니다.', type: 'text' as const },
  { text: '감사합니다!', type: 'text' as const },
  { text: '다시 한번 설명해주세요.', type: 'text' as const },
  { text: '동의합니다 👍', type: 'text' as const },
  { text: '잠시만요...', type: 'text' as const },
  { text: '완료했습니다! ✅', type: 'text' as const },
] as const;

// 채팅 헤더 컴포넌트
interface ChatHeaderProps {
  messageCount: number;
  onClearChat: () => void;
}

const ChatHeader = memo(({ messageCount, onClearChat }: ChatHeaderProps) => {
  return (
    <div className="chat-header">
      <div className="chat-title">
        <h3>💬 실시간 채팅 데모</h3>
        <span className="badge">
          {messageCount} 메시지
        </span>
      </div>
      <div className="chat-actions">
        <button
          onClick={onClearChat}
          className="btn btn-sm btn-danger"
          disabled={!messageCount}
        >
          🗑️ 전체 삭제
        </button>
      </div>
    </div>
  );
});

// 사용자 선택자 컴포넌트
interface UserSelectorProps {
  currentUser: string;
  onUserChange: (user: string) => void;
  onUserSwitch: (user: string, previousUser: string) => void;
}

const UserSelector = memo(({ currentUser, onUserChange, onUserSwitch }: UserSelectorProps) => {
  const handleUserClick = useCallback((user: string) => {
    onUserSwitch(user, currentUser);
    onUserChange(user);
  }, [currentUser, onUserChange, onUserSwitch]);

  return (
    <div className="user-selector">
      <span className="label">현재 사용자:</span>
      {CHAT_USERS.map((user) => (
        <button
          key={user}
          onClick={() => handleUserClick(user)}
          className={`user-btn ${currentUser === user ? 'active' : ''}`}
          style={{ borderColor: getUserColor(user) }}
        >
          {getUserAvatar(user)} {user}
        </button>
      ))}
    </div>
  );
});

// 메시지 컴포넌트
interface MessageItemProps {
  message: ChatMessage;
  currentUser: string;
  onDelete: (messageId: string) => void;
}

const messageItemAreEqual = (prevProps: MessageItemProps, nextProps: MessageItemProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.currentUser === nextProps.currentUser &&
    prevProps.onDelete === nextProps.onDelete &&
    // Deep comparison for message object might be needed
    prevProps.message.message === nextProps.message.message &&
    prevProps.message.sender === nextProps.message.sender &&
    prevProps.message.type === nextProps.message.type
  );
};

const MessageItem = memo(({ message, currentUser, onDelete }: MessageItemProps) => {
  const handleDelete = useCallback(() => {
    onDelete(message.id);
  }, [message.id, onDelete]);

  return (
    <div className={`message ${message.sender === currentUser ? 'own' : 'other'}`}>
      <div className="message-avatar">
        {getUserAvatar(message.sender)}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span
            className="message-sender"
            style={{ color: getUserColor(message.sender) }}
          >
            {message.sender}
          </span>
          <span className="message-time">
            {getMessageTime(message.timestamp)}
          </span>
          {message.type !== 'text' && (
            <span className="message-type-badge">
              {message.type === 'image' ? '🖼️' : '📎'}
            </span>
          )}
        </div>
        <div className="message-text">{message.message}</div>
        {message.sender === currentUser && (
          <button
            onClick={handleDelete}
            className="message-delete"
            title="메시지 삭제"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}, messageItemAreEqual);

// 문자 입력 중 표시 컴포넌트
const TypingIndicator = memo(() => {
  return (
    <div className="message other typing">
      <div className="message-avatar">💭</div>
      <div className="message-content">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
});

// 채팅 메시지 목록 컴포넌트
interface MessagesListProps {
  messages: ChatMessage[];
  currentUser: string;
  isTyping: boolean;
  onDeleteMessage: (messageId: string) => void;
  messagesContainerRef: any;
  messagesEndRef: any;
}

// Custom equality function for props comparison
const areEqual = (prevProps: MessagesListProps, nextProps: MessagesListProps) => {
  // Compare primitive props
  if (
    prevProps.currentUser !== nextProps.currentUser ||
    prevProps.isTyping !== nextProps.isTyping
  ) {
    return false;
  }

  // Compare messages array - shallow comparison should be sufficient
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  
  // For messages, check if the last few messages are the same (performance optimization)
  const checkCount = Math.min(5, prevProps.messages.length);
  for (let i = prevProps.messages.length - checkCount; i < prevProps.messages.length; i++) {
    if (prevProps.messages[i]?.id !== nextProps.messages[i]?.id) {
      return false;
    }
  }

  // Compare function references
  if (prevProps.onDeleteMessage !== nextProps.onDeleteMessage) {
    return false;
  }

  // Skip ref comparison as they are stable references from useRefHandler
  return true;
};

const MessagesList = memo(({ 
  messages, 
  currentUser, 
  isTyping, 
  onDeleteMessage, 
  messagesContainerRef, 
  messagesEndRef 
}: MessagesListProps) => {
  return (
    <div ref={messagesContainerRef.setRef} className="chat-messages">
      {messages?.length === 0 ? (
        <div className="chat-empty">
          <div className="empty-icon">💬</div>
          <div className="empty-message">채팅을 시작해보세요!</div>
          <div className="empty-hint">
            아래에서 메시지를 입력하거나 빠른 메시지를 선택하세요
          </div>
        </div>
      ) : (
        <>
          {messages?.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUser={currentUser}
              onDelete={onDeleteMessage}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef.setRef} />
        </>
      )}
    </div>
  );
}, areEqual);

// 빠른 메시지 컴포넌트
interface QuickMessagesProps {
  onSendQuickMessage: (text: string, type: ChatMessage['type']) => void;
}

const QuickMessages = memo(({ onSendQuickMessage }: QuickMessagesProps) => {
  return (
    <div className="quick-messages">
      <span className="label">빠른 메시지:</span>
      <div className="quick-message-list">
        {QUICK_MESSAGES.map((msg, index) => (
          <button
            key={index}
            onClick={() => onSendQuickMessage(msg.text, msg.type)}
            className="quick-message-btn"
          >
            {msg.text}
          </button>
        ))}
      </div>
    </div>
  );
});

// 메시지 타입 선택자 컴포넌트
interface MessageTypeSelectorProps {
  messageType: ChatMessage['type'];
  onTypeChange: (type: ChatMessage['type']) => void;
}

const MessageTypeSelector = memo(({ messageType, onTypeChange }: MessageTypeSelectorProps) => {
  return (
    <div className="message-type-selector">
      <label className="radio-label">
        <input
          type="radio"
          value="text"
          checked={messageType === 'text'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
        />
        <span>💬 텍스트</span>
      </label>
      <label className="radio-label">
        <input
          type="radio"
          value="image"
          checked={messageType === 'image'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
        />
        <span>🖼️ 이미지</span>
      </label>
      <label className="radio-label">
        <input
          type="radio"
          value="file"
          checked={messageType === 'file'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
        />
        <span>📎 파일</span>
      </label>
    </div>
  );
});

// 메시지 입력 영역 컴포넌트
interface MessageInputProps {
  newMessage: string;
  currentUser: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

const MessageInput = memo(({ newMessage, currentUser, onMessageChange, onSendMessage }: MessageInputProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  return (
    <div className="chat-input-area">
      <div className="input-wrapper">
        <textarea
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${currentUser}로 메시지 입력... (Enter로 전송, Shift+Enter로 줄바꿨)`}
          className="chat-input"
          rows={2}
        />
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
          className="btn btn-primary send-btn"
        >
          📤 전송
        </button>
      </div>
    </div>
  );
});

/**
 * 실시간 채팅 시스템 데모 컴포넌트
 * 메시지 스트리밍과 자동 스크롤 기능을 보여주는 Declarative Store 패턴 예제
 *
 * @implements store-integration-pattern
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * // 실시간 채팅을 위한 Declarative Store 패턴
 * const messagesStore = StoreScenarios.useStore('messages'); // 자동 타입 추론: Store<ChatMessage[]>
 * const messages = useStoreValue(messagesStore);
 * @since 2.0.0
 */
function ChatComponent() {
  const messagesStore = StoreScenarios.useStore('messages');
  const messages = useStoreValue(messagesStore);
  
  // Context-Action UI state instead of React useState
  const newMessageStore = useChatUIStore('newMessage');
  const currentUserStore = useChatUIStore('currentUser');
  const messageTypeStore = useChatUIStore('messageType');
  const isTypingStore = useChatUIStore('isTyping');
  
  const newMessage = useStoreValue(newMessageStore);
  const currentUser = useStoreValue(currentUserStore);
  const messageType = useStoreValue(messageTypeStore);
  const isTyping = useStoreValue(isTypingStore);
  
  const uiDispatch = useChatUIAction();
  
  // Ref 핸들러들 - createRefContext 사용
  const messagesContainerRef = ChatRefsContext.useRefHandler('messagesContainer');
  const messagesEndRef = ChatRefsContext.useRefHandler('messagesEnd');
  
  const logger = useActionLoggerWithToast();

  // 🔧 Fix 1: Debouncing for automatic responses
  const autoResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔧 Fix 3: Stable action handlers - use refs to avoid re-registration
  const handlersRef = useRef({
    sendMessage: ({ message, sender, type }: { message: string; sender: string; type: ChatMessage['type'] }) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        message,
        timestamp: new Date(),
        type,
      };
      messagesStore.updateValue((prev) => [...prev, newMessage]);
    },
    deleteMessage: ({ messageId }: { messageId: string }) => {
      messagesStore.updateValue((prev) =>
        prev.filter((msg) => msg.id !== messageId)
      );
    },
    clearChat: () => {
      messagesStore.setValue([]);
    }
  });

  // Keep handlers updated with latest store references
  useEffect(() => {
    handlersRef.current = {
      sendMessage: ({ message, sender, type }: { message: string; sender: string; type: ChatMessage['type'] }) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender,
          message,
          timestamp: new Date(),
          type,
        };
        messagesStore.updateValue((prev) => [...prev, newMessage]);
      },
      deleteMessage: ({ messageId }: { messageId: string }) => {
        messagesStore.updateValue((prev) =>
          prev.filter((msg) => msg.id !== messageId)
        );
      },
      clearChat: () => {
        messagesStore.setValue([]);
      }
    };
  }, [messagesStore]);

  // Stable wrapper functions
  const sendMessageHandler = useCallback((payload: any) => handlersRef.current.sendMessage(payload), []);
  const deleteMessageHandler = useCallback((payload: any) => handlersRef.current.deleteMessage(payload), []);
  const clearChatHandler = useCallback(() => handlersRef.current.clearChat(), []);

  // 🔧 Fix 3: Stabilize action handler registration - register only once
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('sendMessage', sendMessageHandler),
      storeActionRegister.register('deleteMessage', deleteMessageHandler),
      storeActionRegister.register('clearChat', clearChatHandler),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      // 🔧 Fix 2: Clean up all timers on unmount
      if (autoResponseTimeoutRef.current) {
        clearTimeout(autoResponseTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []); // 🔧 Remove dependencies to prevent re-registration
  
  // UI Action handlers for form interactions
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


  // 🔧 Fix 2: Improved scroll management with timer cleanup
  useEffect(() => {
    // Clear existing scroll timer
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      messagesContainerRef.withTarget((container) => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      });
    }, 100);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages?.length]); // messagesContainerRef 의존성 제거

  // 🔧 Fix 2: Improved typing simulation with timer cleanup
  const simulateTyping = useCallback(() => {
    // Clear existing typing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    uiDispatch('setIsTyping', { typing: true });
    typingTimeoutRef.current = setTimeout(() => {
      uiDispatch('setIsTyping', { typing: false });
    }, 2000);
  }, [uiDispatch]);

  const sendMessage = useCallback(() => {
    if (newMessage.trim()) {
      logger.logAction('sendChatMessage', {
        message: newMessage.trim(),
        sender: currentUser,
        type: messageType,
        messageLength: newMessage.length,
        currentMessageCount: messages?.length ?? 0,
      });

      storeActionRegister.dispatch('sendMessage', {
        message: newMessage.trim(),
        sender: currentUser,
        type: messageType,
      });

      uiDispatch('clearNewMessage');

      // 🔧 Fix 1: Debounced automatic response simulation (30% chance with debouncing)
      if (Math.random() < 0.3) {
        // Clear existing auto response timer to prevent multiple responses
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
  }, [newMessage, currentUser, messageType, messages?.length, logger, simulateTyping]);

  const clearChat = useCallback(() => {
    if (window.confirm('모든 메시지를 삭제하시겠습니까?')) {
      logger.logAction('clearChat', {
        messageCount: messages?.length ?? 0,
      });
      storeActionRegister.dispatch('clearChat');
    }
  }, [messages?.length, logger]);

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

  // 사용자 전환 핸들러
  const handleUserSwitch = useCallback((newUser: string, previousUser: string) => {
    logger.logAction('switchChatUser', {
      newUser,
      previousUser,
    });
  }, [logger]);

  return (
    <div className="chat-demo">
      <ChatHeader 
        messageCount={messages?.length ?? 0} 
        onClearChat={clearChat} 
      />
      
      <UserSelector
        currentUser={currentUser}
        onUserChange={(user) => uiDispatch('setCurrentUser', { user })}
        onUserSwitch={handleUserSwitch}
      />
      
      <MessagesList
        messages={messages || []}
        currentUser={currentUser}
        isTyping={isTyping}
        onDeleteMessage={deleteMessage}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
      />
      
      <QuickMessages 
        onSendQuickMessage={sendQuickMessage} 
      />
      
      <MessageTypeSelector
        messageType={messageType}
        onTypeChange={(type) => uiDispatch('setMessageType', { type })}
      />
      
      <MessageInput
        newMessage={newMessage}
        currentUser={currentUser}
        onMessageChange={(message) => uiDispatch('updateNewMessage', { message })}
        onSendMessage={sendMessage}
      />
    </div>
  );
}

export function ChatDemo() {
  return (
    <ChatUIActionProvider>
      <ChatUIStoreProvider>
        <ChatRefsContext.Provider>
          <ChatComponent />
        </ChatRefsContext.Provider>
      </ChatUIStoreProvider>
    </ChatUIActionProvider>
  );
}