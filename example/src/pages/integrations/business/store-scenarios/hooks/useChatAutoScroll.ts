import { createRefContext } from '@context-action/react';
import { useEffect, useRef } from 'react';

// Chat ref context 정의
interface ChatRefs {
  messagesContainer: HTMLDivElement;
  messagesEnd: HTMLDivElement;
  readonly [key: string]: any;
}

// Chat ref context 생성
export const ChatRefsContext = createRefContext<ChatRefs>('ChatDemo');

/**
 * 채팅 자동 스크롤 훅
 * 메시지 추가 시 자동으로 하단으로 스크롤
 */
export function useChatAutoScroll(messageCount: number) {
  const messagesContainerRef =
    ChatRefsContext.useRefHandler('messagesContainer');
  const messagesEndRef = ChatRefsContext.useRefHandler('messagesEnd');
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      messagesContainerRef.withTarget((container) => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }, 100);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messageCount]); // messagesContainerRef 의존성 제거

  return {
    messagesContainerRef,
    messagesEndRef,
  };
}
