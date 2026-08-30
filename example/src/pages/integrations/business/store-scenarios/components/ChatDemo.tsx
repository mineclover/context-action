import React, { memo, useCallback } from 'react';
import { buttonVariants } from '@/components/ui/variants';
import {
  ChatUIActionProvider,
  ChatUIStoreProvider,
} from '../contexts/ChatUIContexts';
import { ChatUIHandlerRegistry } from '../handlers/ChatUIHandlerRegistry';
import {
  ChatRefsContext,
  useChatActions,
  useChatAutoScroll,
  useChatMessages,
  useChatUIState,
} from '../hooks';
import type { ChatMessage } from '../types';
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
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-t-xl">
    <div className="flex items-center gap-2">
      <h3>💬 실시간 채팅 데모</h3>
      <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
        {messageCount} 메시지
      </span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onClearChat}
        className={buttonVariants({ variant: 'danger', size: 'sm' })}
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
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">현재 사용자:</span>
        {CHAT_USERS.map((user) => (
          <button
            key={user}
            onClick={() => handleUserClick(user)}
            className={`px-3 py-1 text-sm rounded-lg transition-all ${currentUser === user ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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

export const ChatMessageItem = memo(
  ({ message, currentUser, onDelete }: MessageItemProps) => {
    const isOwnMessage = message.sender === currentUser;
    const handleDelete = useCallback(() => {
      onDelete(message.id);
    }, [message.id, onDelete]);

    return (
      <div
        data-message-id={message.id}
        className={`flex items-start gap-3 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500 text-white text-sm">
          {getUserAvatar(message.sender)}
        </div>
        <div
          className={`relative max-w-[78%] p-3 rounded-2xl shadow-sm border ${
            isOwnMessage
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-100 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-sm font-medium ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-700'
              }`}
              style={
                isOwnMessage
                  ? undefined
                  : { color: getUserColor(message.sender) }
              }
            >
              {message.sender}
            </span>
            <span
              className={`text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {getMessageTime(message.timestamp)}
            </span>
            {message.type !== 'text' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  isOwnMessage
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.type === 'image' ? '🖼️' : '📎'}
              </span>
            )}
          </div>
          <div
            className={`text-sm leading-relaxed ${
              isOwnMessage ? 'text-white' : 'text-gray-900'
            }`}
          >
            {message.message}
          </div>
          {isOwnMessage && (
            <button
              onClick={handleDelete}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
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
  <div className="flex gap-3 max-w-md">
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm">
      💭
    </div>
    <div className="bg-gray-100 p-3 rounded-2xl">
      <div className="flex space-x-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
          style={{ animationDelay: '0.1s' }}
        ></span>
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
          style={{ animationDelay: '0.2s' }}
        ></span>
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
    <div
      ref={messagesContainerRef.setRef}
      className="flex-1 p-4 space-y-4 overflow-y-auto max-h-96 bg-gray-50 rounded-b-xl"
    >
      {messages?.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💬</div>
          <div className="text-lg text-gray-600 mb-2">채팅을 시작해보세요!</div>
          <div className="text-sm text-gray-500">
            아래에서 메시지를 입력하거나 빠른 메시지를 선택하세요
          </div>
        </div>
      ) : (
        <>
          {messages?.map((message) => (
            <ChatMessageItem
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
  <div className="mb-4">
    <span className="text-sm font-medium text-gray-700 mr-2">빠른 메시지:</span>
    <div className="flex flex-wrap gap-2">
      {QUICK_MESSAGES.map((msg, index) => (
        <button
          key={index}
          onClick={() => onSendQuickMessage(msg.text, msg.type)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
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
    <div className="flex gap-4 mb-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value="text"
          checked={messageType === 'text'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">💬 텍스트</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value="image"
          checked={messageType === 'image'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">🖼️ 이미지</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value="file"
          checked={messageType === 'file'}
          onChange={(e) => onTypeChange(e.target.value as ChatMessage['type'])}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">📎 파일</span>
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
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${currentUser}로 메시지 입력... (Enter로 전송, Shift+Enter로 줄바꿈)`}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={2}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className={buttonVariants({ variant: 'primary' })}
          >
            📤 전송
          </button>
        </div>
      </div>
    );
  }
);

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
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
          <ChatUIHandlerRegistry>
            <ChatComponent />
          </ChatUIHandlerRegistry>
        </ChatRefsContext.Provider>
      </ChatUIStoreProvider>
    </ChatUIActionProvider>
  );
}
