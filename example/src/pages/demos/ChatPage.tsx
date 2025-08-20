/**
 * @fileoverview Chat Demo Page - Individual Demo
 * 실시간 메시징과 사용자 관리, 메시지 히스토리를 포함한 채팅 시스템
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor/';
import { ChatDemo } from './store-scenarios/components';
import { StoreScenarios } from './store-scenarios/stores';

export function ChatPage() {
  return (
    <PageWithLogMonitor
      pageId="chat-demo"
      title="Chat Demo"
    >
      <StoreScenarios.Provider>
        <div className="max-w-5xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl mb-8 border border-green-200">
            <div className="flex items-start gap-6">
              <div className="text-5xl">💬</div>
              <div>
                <h1 className="text-3xl font-bold text-green-900 mb-4">Real-time Chat System Demo</h1>
                <p className="text-green-800 text-lg mb-4">
                  실시간 <strong>메시징과 사용자 관리</strong>, 메시지 히스토리를 포함한 채팅 시스템입니다.
                  실제 채팅 애플리케이션에서 사용되는 핵심 기능들을 구현했습니다.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">💬</span>
                    <span className="font-semibold text-green-800">
                      핵심 기능: 실시간 메시징 + 자동 스크롤 + 사용자 전환
                    </span>
                  </div>
                  <p className="text-green-800 text-sm">
                    메시지 전송, 사용자 전환, 자동 응답, 타이핑 인디케이터, 스마트 스크롤 기능을 제공합니다.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">💬 채팅 기능</h3>
                    <ul className="text-green-700 space-y-2 text-sm">
                      <li>• <strong>Multi-User Chat</strong>: 다중 사용자 지원</li>
                      <li>• <strong>Message Types</strong>: 텍스트, 이미지, 파일</li>
                      <li>• <strong>Auto Response</strong>: 자동 응답 시뮬레이션</li>
                      <li>• <strong>Typing Indicator</strong>: 타이핑 상태 표시</li>
                      <li>• <strong>Message History</strong>: 메시지 기록 관리</li>
                      <li>• <strong>Quick Messages</strong>: 빠른 메시지 템플릿</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">⚡ UX 특징</h3>
                    <ul className="text-green-700 space-y-2 text-sm">
                      <li>• 스마트 자동 스크롤</li>
                      <li>• 키보드 단축키 (Enter 전송)</li>
                      <li>• 사용자별 색상 구분</li>
                      <li>• 메시지 삭제 기능</li>
                      <li>• 실시간 메시지 카운터</li>
                      <li>• 반응형 UI 디자인</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className="text-3xl">💬</span>
                      Live Demo
                    </h2>
                    <p className="text-green-100 text-sm mt-2 leading-relaxed">
                      다양한 사용자로 전환하며 실시간 채팅을 체험해보세요
                    </p>
                  </div>
                  <div className="text-right text-green-100 text-xs">
                    <div>Real-time Chat</div>
                    <div>Auto Scroll</div>
                    <div>Multi Users</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ChatDemo />
              </div>
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🔧 기술적 구현 세부사항</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">Store Architecture</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>messagesStore</strong>: 메시지 히스토리 관리</li>
                  <li>• <strong>Immutable Updates</strong>: 메시지 배열 불변성</li>
                  <li>• <strong>Real-time Updates</strong>: 즉시 UI 반영</li>
                  <li>• <strong>Message Validation</strong>: 입력 검증</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-blue-600">Advanced Features</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Auto Scroll</strong>: 스마트 스크롤 관리</li>
                  <li>• <strong>Ref Management</strong>: DOM 참조 최적화</li>
                  <li>• <strong>Event Handling</strong>: 키보드 이벤트</li>
                  <li>• <strong>CSS Animations</strong>: 타이핑 애니메이션</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🎯 채팅 시스템 특징</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-purple-600">사용자 경험</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 사용자별 아바타 및 색상</li>
                  <li>• 메시지 시간 표시</li>
                  <li>• 자신의 메시지 구분</li>
                  <li>• 스크롤 상태 표시</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-orange-600">자동화 기능</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 30% 확률 자동 응답</li>
                  <li>• 타이핑 인디케이터 (2초)</li>
                  <li>• 다양한 응답 메시지</li>
                  <li>• 지연 시뮬레이션</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-red-600">스크롤 최적화</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 자동 최하단 스크롤</li>
                  <li>• 사용자 스크롤 감지</li>
                  <li>• 수동 스크롤 모드</li>
                  <li>• 최신으로 이동 버튼</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">💻 핵심 코드 패턴</h2>
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-4">실시간 채팅 구현</h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// 1. 메시지 전송 핸들러
const sendMessageHandler = useCallback(
  ({ message, sender, type }: { message: string; sender: string; type: ChatMessage['type'] }) => {
    const newMessage: ChatMessage = {
      id: \`msg-\${Date.now()}\`,
      sender,
      message,
      timestamp: new Date(),
      type,
    };
    messagesStore.update((prev) => [...prev, newMessage]);
  },
  [messagesStore]
);

// 2. 자동 스크롤 관리
const { 
  isUserScrolling, 
  shouldAutoScroll, 
  forceScrollToBottom,
  enableAutoScroll
} = useAutoScroll(messagesContainerRef, messages ?? []);

// 3. 자동 응답 시뮬레이션
const sendMessage = useCallback(() => {
  if (newMessage.trim()) {
    storeActionRegister.dispatch('sendMessage', {
      message: newMessage.trim(),
      sender: currentUser,
      type: messageType,
    });
    
    setNewMessage('');
    
    // 30% 확률로 자동 응답
    if (Math.random() < 0.3) {
      const otherUsers = CHAT_USERS.filter(user => user !== currentUser);
      const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      const responses = ['좋은 아이디어네요! 👍', '동의합니다.', '확인했습니다! ✅'];
      
      simulateTyping();
      setTimeout(() => {
        storeActionRegister.dispatch('sendMessage', {
          message: responses[Math.floor(Math.random() * responses.length)],
          sender: randomUser,
          type: 'text',
        });
      }, 1500);
    }
  }
}, [newMessage, currentUser, messageType]);`}
              </pre>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">🔗 관련 리소스</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a 
                href="/demos/store-scenarios"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🏪 전체 Store 데모 컬렉션
              </a>
              <a 
                href="/refs/canvas"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🎨 Canvas Ref Demo
              </a>
              <a 
                href="/actionguard/scroll"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                📜 Advanced Scroll Demo
              </a>
            </div>
          </div>
        </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}