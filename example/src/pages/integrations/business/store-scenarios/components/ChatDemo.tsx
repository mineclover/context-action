import { useStoreValue } from '@context-action/react';
import React, { memo, useCallback } from 'react';
import type { ChatMessage } from '../types';
import {
  useChatMessages,
  useChatUIState,
  useChatUIActionHandlers,
  useChatActions,
  useChatAutoScroll,
  ChatUIStoreProvider,
  ChatUIActionProvider,
  ChatRefsContext,
} from '../hooks';
import '../styles/chat-scroll.css';

const CHAT_USERS = ['김개발', '이디자인', '박매니저', '최기획'];

// 헬퍼 함수들
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

// 빠른 메시지 옵션
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

const ChatHeader = memo(({ messageCount, onClearChat }: ChatHeaderProps) => (
  <div className="chat-header">
    <div className="chat-title">
      <h3>💬 실시간 채팅 데모</h3>
      <span className="badge">{messageCount} 메시지</span>
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
));

// 사용자 선택자 컴포넌트
interface UserSelectorProps {
  currentUser: string;
  onUserChange: (user: string) => void;
  onUserSwitch: (user: string, previousUser: string) => void;
}

const UserSelector = memo(
  ({ currentUser, onUserChange, onUserSwitch }: UserSelectorProps) => {
    const handleUserClick = useCallback(
      (user: string) => {
        onUserSwitch(user, currentUser);
        onUserChange(user);
      },
      [currentUser, onUserChange, onUserSwitch]
    );

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
  }
);

// 메시지 컴포넌트
interface MessageItemProps {
  message: ChatMessage;
  currentUser: string;
  onDelete: (messageId: string) => void;
}

const messageItemAreEqual = (
  prevProps: MessageItemProps,
  nextProps: MessageItemProps
) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.currentUser === nextProps.currentUser &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.message.message === nextProps.message.message &&
    prevProps.message.sender === nextProps.message.sender &&
    prevProps.message.type === nextProps.message.type
  );
};

const MessageItem = memo(
  ({ message, currentUser, onDelete }: MessageItemProps) => {
    const handleDelete = useCallback(() => {
      onDelete(message.id);
    }, [message.id, onDelete]);

    return (
      <div
        className={`message ${message.sender === currentUser ? 'own' : 'other'}`}
      >
        <div className="message-avatar">{getUserAvatar(message.sender)}</div>
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
  },
  messageItemAreEqual
);

// 타이핑 인디케이터
const TypingIndicator = memo(() => (
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
));

// 메시지 목록 컴포넌트
interface MessagesListProps {
  messages: ChatMessage[];
  currentUser: string;
  isTyping: boolean;
  onDeleteMessage: (messageId: string) => void;
  messagesContainerRef: any;
  messagesEndRef: any;
}

const areEqual = (
  prevProps: MessagesListProps,
  nextProps: MessagesListProps
) => {
  if (
    prevProps.currentUser !== nextProps.currentUser ||
    prevProps.isTyping !== nextProps.isTyping
  ) {
    return false;
  }

  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  const checkCount = Math.min(5, prevProps.messages.length);
  for (
    let i = prevProps.messages.length - checkCount;
    i < prevProps.messages.length;
    i++
  ) {
    if (prevProps.messages[i]?.id !== nextProps.messages[i]?.id) {
      return false;
    }
  }

  if (prevProps.onDeleteMessage !== nextProps.onDeleteMessage) {
    return false;
  }

  return true;
};

const MessagesList = memo(
  ({
    messages,
    currentUser,
    isTyping,
    onDeleteMessage,
    messagesContainerRef,
    messagesEndRef,
  }: MessagesListProps) => (
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
  ),
  areEqual
);

// 빠른 메시지 컴포넌트
interface QuickMessagesProps {
  onSendQuickMessage: (text: string, type: ChatMessage['type']) => void;
}

const QuickMessages = memo(({ onSendQuickMessage }: QuickMessagesProps) => (
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
));

// 메시지 타입 선택자 컴포넌트
interface MessageTypeSelectorProps {
  messageType: ChatMessage['type'];
  onTypeChange: (type: ChatMessage['type']) => void;
}

const MessageTypeSelector = memo(
  ({ messageType, onTypeChange }: MessageTypeSelectorProps) => (
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
  )
);

// 메시지 입력 영역 컴포넌트
interface MessageInputProps {
  newMessage: string;
  currentUser: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

const MessageInput = memo(
  ({
    newMessage,
    currentUser,
    onMessageChange,
    onSendMessage,
  }: MessageInputProps) => {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSendMessage();
        }
      },
      [onSendMessage]
    );

    return (
      <div className="chat-input-area">
        <div className="input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${currentUser}로 메시지 입력... (Enter로 전송, Shift+Enter로 줄바꿈)`}
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
  }
);

/**
 * 채팅 UI 액션 핸들러 등록 컴포넌트
 * 액션과 스토어를 연결하는 역할
 */
function ChatUIActionHandlerSetup({ children }: { children: React.ReactNode }) {
  useChatUIActionHandlers();
  return <>{children}</>;
}

/**
 * 실시간 채팅 시스템 데모 컴포넌트 (메인 로직)
 * 커스텀 훅으로 분리된 로직을 조합하여 사용
 */
function ChatComponent() {
  // 메시지 스토어 및 핸들러
  const { messages, messagesStore, messageCount } = useChatMessages();

  // UI 상태 관리
  const {
    newMessage,
    currentUser,
    messageType,
    isTyping,
    handleUserChange,
    handleMessageTypeChange,
    handleNewMessageChange,
    clearNewMessage,
    setIsTyping,
  } = useChatUIState();

  // 자동 스크롤
  const { messagesContainerRef, messagesEndRef } =
    useChatAutoScroll(messageCount);

  // 채팅 액션
  const {
    sendMessage,
    clearChat,
    deleteMessage,
    sendQuickMessage,
    handleUserSwitch,
  } = useChatActions({
    messagesStore,
    newMessage,
    currentUser,
    messageType,
    clearNewMessage,
    setIsTyping,
  });

  return (
    <div className="chat-demo">
      <ChatHeader messageCount={messageCount} onClearChat={clearChat} />

      <UserSelector
        currentUser={currentUser}
        onUserChange={handleUserChange}
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

      <QuickMessages onSendQuickMessage={sendQuickMessage} />

      <MessageTypeSelector
        messageType={messageType}
        onTypeChange={handleMessageTypeChange}
      />

      <MessageInput
        newMessage={newMessage}
        currentUser={currentUser}
        onMessageChange={handleNewMessageChange}
        onSendMessage={sendMessage}
      />
    </div>
  );
}

/**
 * ChatDemo - Provider 구성
 * Context-Action 패턴을 사용한 Provider 계층 구조
 */
export function ChatDemo() {
  return (
    <ChatUIActionProvider>
      <ChatUIStoreProvider>
        <ChatRefsContext.Provider>
          <ChatUIActionHandlerSetup>
            <ChatComponent />
          </ChatUIActionHandlerSetup>
        </ChatRefsContext.Provider>
      </ChatUIStoreProvider>
    </ChatUIActionProvider>
  );
}
