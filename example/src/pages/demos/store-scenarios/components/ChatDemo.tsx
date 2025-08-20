import { useStoreValue } from '@context-action/react';
import { createRefContext } from '@context-action/react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor/';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { ChatMessage } from '../types';
import { useAutoScroll } from '../hooks/useAutoScroll';
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
  const messagesStore = StoreScenarios.useStore('messages'); // 자동 타입 추론: Store<ChatMessage[]>
  const messages = useStoreValue(messagesStore);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('김개발');
  const [messageType, setMessageType] = useState<ChatMessage['type']>('text');
  const [isTyping, setIsTyping] = useState(false);
  
  // Ref 핸들러들 - 명확히 분리
  const messagesContainerRef = ChatRefsContext.useRefHandler('messagesContainer');
  const messagesEndRef = ChatRefsContext.useRefHandler('messagesEnd');
  
  // 자동 스크롤 관리 - 사이드 이펙트 없는 분리된 로직
  const { 
    isUserScrolling, 
    shouldAutoScroll, 
    forceScrollToBottom,
    enableAutoScroll
  } = useAutoScroll(messagesContainerRef, messages ?? []);
  
  const logger = useActionLoggerWithToast();

  // 액션 핸들러들을 useCallback으로 메모이제이션
  const sendMessageHandler = useCallback(
    ({ message, sender, type }: { message: string; sender: string; type: ChatMessage['type'] }) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender,
        message,
        timestamp: new Date(),
        type,
      };
      messagesStore.update((prev) => [...prev, newMessage]);
    },
    [messagesStore]
  );

  const deleteMessageHandler = useCallback(
    ({ messageId }: { messageId: string }) => {
      messagesStore.update((prev) =>
        prev.filter((msg) => msg.id !== messageId)
      );
    },
    [messagesStore]
  );

  const clearChatHandler = useCallback(() => {
    messagesStore.setValue([]);
  }, [messagesStore]);

  // 필요한 액션 핸들러들을 등록 - 컴포넌트가 마운트될 때 한 번만 실행
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('sendMessage', sendMessageHandler),
      storeActionRegister.register('deleteMessage', deleteMessageHandler),
      storeActionRegister.register('clearChat', clearChatHandler),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sendMessageHandler, deleteMessageHandler, clearChatHandler]); // 메모이제이션된 핸들러들을 의존성에 추가

  // 타이핑 시뮬레이션
  const simulateTyping = useCallback(() => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, []);

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

      setNewMessage('');

      // 다른 사용자의 자동 응답 시뮬레이션 (30% 확률)
      if (Math.random() < 0.3) {
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

        simulateTyping();

        setTimeout(() => {
          storeActionRegister.dispatch('sendMessage', {
            message: randomResponse,
            sender: randomUser,
            type: 'text',
          });
        }, 1500);
      }
    }
  }, [newMessage, currentUser, messageType, messages, logger, simulateTyping]);

  const deleteMessage = useCallback(
    (messageId: string) => {
      const message = messages?.find((m) => m.id === messageId);
      logger.logAction('deleteChatMessage', {
        messageId,
        sender: message?.sender,
        messageContent: message?.message,
      });
      storeActionRegister.dispatch('deleteMessage', { messageId });
    },
    [messages, logger]
  );

  const clearChat = useCallback(() => {
    logger.logAction('clearChat', {
      messageCount: messages?.length ?? 0,
    });
    storeActionRegister.dispatch('clearChat', {});
  }, [messages, logger]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const getMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserColor = (sender: string) => {
    const colors = {
      김개발: '#3b82f6',
      이디자인: '#8b5cf6',
      박매니저: '#10b981',
      최기획: '#f59e0b',
      시스템: '#6b7280',
    };
    return colors[sender as keyof typeof colors] || '#6b7280';
  };

  const getUserAvatar = (sender: string) => {
    const avatars = {
      김개발: '👨‍💻',
      이디자인: '👩‍🎨',
      박매니저: '👨‍💼',
      최기획: '👩‍💼',
      시스템: '🤖',
    };
    return avatars[sender as keyof typeof avatars] || '👤';
  };

  const addQuickMessage = useCallback(
    async (message: string) => {
      logger.logAction('sendQuickMessage', { message, sender: currentUser });
      storeActionRegister.dispatch('sendMessage', {
        message,
        sender: currentUser,
        type: 'text',
      });
      
      // 빠른 메시지 전송 후 강제 스크롤 (사용자 의도)
      setTimeout(() => {
        forceScrollToBottom();
      }, 100);
    },
    [currentUser, logger, forceScrollToBottom]
  );

  return (
    <div className="demo-card">
      <h3>💬 Real-time Chat System</h3>
      <p className="demo-description">
        메시지 스트리밍과 자동 스크롤 기능을 보여주는 실시간 채팅 데모
      </p>

      {/* 채팅 헤더 */}
      <div className="chat-header">
        <div className="chat-info">
          <div className="chat-title">팀 채팅방</div>
          <div className="chat-users">
            {CHAT_USERS.map((user, index) => (
              <span key={user} className="chat-user">
                {getUserAvatar(user)} {user}
                {index < CHAT_USERS.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
        <div className="chat-stats">
          <span className="message-count">
            메시지 {messages?.length ?? 0}개
          </span>
          
          {/* 스크롤 상태 표시 */}
          <div className="scroll-status">
            {isUserScrolling && (
              <span className="scroll-indicator user-scroll" title="사용자가 스크롤 중">
                📜 수동 스크롤
              </span>
            )}
            {!shouldAutoScroll && !isUserScrolling && (
              <button
                onClick={() => {
                  enableAutoScroll();
                  forceScrollToBottom();
                }}
                className="btn btn-small btn-secondary"
                title="자동 스크롤 재활성화"
              >
                ⬇️ 최신으로
              </button>
            )}
          </div>
          
          {(messages?.length ?? 0) > 0 && (
            <button
              onClick={clearChat}
              className="btn btn-small btn-danger"
              title="채팅 기록 삭제"
            >
              🗑️ 전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 현재 사용자 선택 */}
      <div className="user-selector">
        <span className="selector-label">현재 사용자:</span>
        {CHAT_USERS.map((user) => (
          <button
            key={user}
            onClick={() => {
              setCurrentUser(user);
              logger.logAction('switchChatUser', {
                newUser: user,
                previousUser: currentUser,
              });
            }}
            className={`user-btn ${currentUser === user ? 'active' : ''}`}
            style={{ borderColor: getUserColor(user) }}
          >
            {getUserAvatar(user)} {user}
          </button>
        ))}
      </div>

      {/* 채팅 메시지 영역 */}
      <div 
        ref={messagesContainerRef.setRef} 
        className={`chat-messages ${isUserScrolling ? 'user-scrolling' : shouldAutoScroll ? 'auto-scrolling' : ''}`}
      >
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
              <div
                key={message.id}
                className={`message ${message.sender === currentUser ? 'own' : 'other'}`}
              >
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
                  <div className="message-text">
                    {message.type === 'image' && '🖼️ '}
                    {message.type === 'file' && '📎 '}
                    {message.message}
                  </div>
                </div>
                {message.sender === currentUser && (
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="message-delete"
                    title="메시지 삭제"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}

            {/* 타이핑 인디케이터 */}
            {isTyping && (
              <div className="typing-indicator">
                <div className="typing-avatar">👤</div>
                <div className="typing-content">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="typing-text">다른 사용자가 입력 중...</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef.setRef} />
          </>
        )}
      </div>

      {/* 빠른 메시지 */}
      <div className="quick-messages">
        <span className="quick-label">빠른 메시지:</span>
        <div className="quick-buttons">
          {[
            '안녕하세요! 👋',
            '회의 시작하겠습니다',
            '확인했습니다 ✅',
            '수고하셨습니다',
            '질문이 있습니다',
            '나중에 이야기해요',
          ].map((quickMsg) => (
            <button
              key={quickMsg}
              onClick={() => addQuickMessage(quickMsg)}
              className="quick-msg-btn"
            >
              {quickMsg}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 입력 */}
      <div className="chat-input-section">
        <div className="message-type-selector">
          <select
            value={messageType}
            onChange={(e) => {
              const newType = e.target.value as ChatMessage['type'];
              setMessageType(newType);
              logger.logAction('selectMessageType', { type: newType });
            }}
            className="type-select"
          >
            <option value="text">💬 텍스트</option>
            <option value="image">🖼️ 이미지</option>
            <option value="file">📎 파일</option>
          </select>
        </div>

        <div className="chat-input-group">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.length > 0) {
                logger.logAction('typeChatMessage', {
                  length: e.target.value.length,
                });
              }
            }}
            onKeyDown={handleKeyPress}
            placeholder={
              messageType === 'text'
                ? '메시지를 입력하세요... (Enter로 전송)'
                : messageType === 'image'
                  ? '이미지에 대한 설명을 입력하세요...'
                  : '파일에 대한 설명을 입력하세요...'
            }
            className="chat-input"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="btn btn-primary send-btn"
          >
            📤 전송
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatDemo() {
  return (
    <ChatRefsContext.Provider>
      <ChatComponent />
    </ChatRefsContext.Provider>
  );
}
