/**
 * @fileoverview LogMonitor 유틸리티 함수들
 * @module LogMonitorUtils
 */

import { LogLevel } from '@context-action/logger';
import type { LogEntry, LogEntryType, ActionMessageMap, LogLevelColorMap, LogTypeColorMap } from './types';

/**
 * 로그 엔트리 ID 생성
 * 
 * @param pageId - 페이지 식별자
 * @returns 고유한 로그 엔트리 ID
 */
export function generateLogEntryId(pageId: string): string {
  return `${pageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 현재 시간을 로케일 형식으로 반환
 * 
 * @returns 포맷된 시간 문자열
 */
export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString();
}

/**
 * 로그 레벨에 따른 색상 반환
 */
export const LOG_LEVEL_COLORS: LogLevelColorMap = {
  [LogLevel.TRACE]: '#9ca3af',
  [LogLevel.DEBUG]: '#3b82f6',
  [LogLevel.INFO]: '#10b981',
  [LogLevel.WARN]: '#f59e0b',
  [LogLevel.ERROR]: '#ef4444',
  [LogLevel.NONE]: '#6b7280',
};

/**
 * 로그 타입에 따른 색상 반환
 */
export const LOG_TYPE_COLORS: LogTypeColorMap = {
  action: '#2563eb',
  system: '#059669',
  middleware: '#7c3aed',
  error: '#dc2626',
};

/**
 * 로그 레벨 이름 매핑
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE',
};

/**
 * 로그 레벨에 따른 색상 반환
 * 
 * @param level - 로그 레벨
 * @returns 해당 레벨의 색상
 */
export function getLogLevelColor(level: LogLevel): string {
  return LOG_LEVEL_COLORS[level] || '#6b7280';
}

/**
 * 로그 타입에 따른 색상 반환
 * 
 * @param type - 로그 타입
 * @returns 해당 타입의 색상
 */
export function getLogTypeColor(type: LogEntryType): string {
  return LOG_TYPE_COLORS[type] || '#6b7280';
}

/**
 * 로그 레벨 이름 반환
 * 
 * @param level - 로그 레벨
 * @returns 해당 레벨의 이름
 */
export function getLogLevelName(level: LogLevel): string {
  return LOG_LEVEL_NAMES[level] || 'UNKNOWN';
}

/**
 * 로그 엔트리 생성 팩토리 함수
 * 
 * @param pageId - 페이지 식별자
 * @param entry - 로그 엔트리 기본 정보
 * @returns 완성된 로그 엔트리
 */
export function createLogEntry(
  pageId: string,
  entry: Omit<LogEntry, 'id' | 'timestamp'>
): LogEntry {
  return {
    ...entry,
    id: generateLogEntryId(pageId),
    timestamp: getCurrentTimeString(),
  };
}

/**
 * 로그 배열에서 최대 개수 유지 (오래된 것부터 제거)
 * 
 * @param logs - 현재 로그 배열
 * @param newLog - 새로 추가할 로그
 * @param maxLogs - 최대 로그 개수
 * @returns 업데이트된 로그 배열
 */
export function maintainMaxLogs(
  logs: LogEntry[],
  newLog: LogEntry,
  maxLogs: number
): LogEntry[] {
  const updatedLogs = [...logs, newLog];
  
  if (updatedLogs.length > maxLogs) {
    return updatedLogs.slice(-maxLogs);
  }
  
  return updatedLogs;
}

/**
 * 액션명 → 한국어 메시지 매핑
 * 
 * 실제 사용 시에는 이 매핑을 외부 설정 파일이나 
 * 국제화(i18n) 시스템으로 교체하는 것을 권장합니다.
 */
export const ACTION_MESSAGES: ActionMessageMap = {
  // Store 시나리오 액션들
  updateUser: { title: '프로필 저장', message: '사용자 프로필이 업데이트되었습니다', type: 'success' },
  updateUserTheme: { title: '테마 변경', message: '테마가 변경되었습니다', type: 'success' },
  updateUserLanguage: { title: '언어 변경', message: '언어가 변경되었습니다', type: 'success' },
  toggleNotifications: { title: '알림 설정', message: '알림 설정이 변경되었습니다', type: 'success' },
  
  // 장바구니 액션들
  addToCart: { title: '장바구니 추가', message: '상품이 장바구니에 추가되었습니다', type: 'success' },
  removeFromCart: { title: '장바구니 제거', message: '상품이 장바구니에서 제거되었습니다', type: 'info' },
  updateCartQuantity: { title: '수량 변경', message: '상품 수량이 변경되었습니다', type: 'success' },
  clearCart: { title: '장바구니 비우기', message: '장바구니가 비워졌습니다', type: 'info' },
  
  // 할일 액션들
  addTodo: { title: '할일 추가', message: '새로운 할일이 추가되었습니다', type: 'success' },
  toggleTodo: { title: '할일 상태 변경', message: '할일 상태가 변경되었습니다', type: 'success' },
  deleteTodo: { title: '할일 삭제', message: '할일이 삭제되었습니다', type: 'info' },
  updateTodoPriority: { title: '우선순위 변경', message: '할일 우선순위가 변경되었습니다', type: 'success' },
  
  // 채팅 액션들
  sendChatMessage: { title: '메시지 전송', message: '메시지가 전송되었습니다', type: 'success' },
  deleteChatMessage: { title: '메시지 삭제', message: '메시지가 삭제되었습니다', type: 'info' },
  clearChat: { title: '채팅 초기화', message: '채팅이 초기화되었습니다', type: 'info' },
  
  // React Provider 액션들
  updateCounter: { title: '카운터 변경', message: '카운터 값이 변경되었습니다', type: 'success' },
  resetCounter: { title: '카운터 리셋', message: '카운터가 초기화되었습니다', type: 'info' },
  updateMessage: { title: '메시지 변경', message: '메시지가 업데이트되었습니다', type: 'success' },
  resetMessage: { title: '메시지 리셋', message: '메시지가 초기화되었습니다', type: 'info' },
  
  // Core Basic 액션들
  increment: { title: '증가', message: '값이 증가되었습니다', type: 'success' },
  decrement: { title: '감소', message: '값이 감소되었습니다', type: 'success' },
  reset: { title: '리셋', message: '값이 초기화되었습니다', type: 'info' },
  updateValue: { title: '값 변경', message: '값이 업데이트되었습니다', type: 'success' },
  
  // Core Advanced 액션들
  multiply: { title: '곱하기', message: '값이 곱해졌습니다', type: 'success' },
  divide: { title: '나누기', message: '값이 나누어졌습니다', type: 'success' },
  priorityTest: { title: '우선순위 테스트', message: '우선순위 테스트가 실행되었습니다', type: 'info' },
  
  // Store Basic 액션들
  updateUserName: { title: '이름 변경', message: '사용자 이름이 변경되었습니다', type: 'success' },
  updateUserEmail: { title: '이메일 변경', message: '사용자 이메일이 변경되었습니다', type: 'success' },
  
  // React Hooks 액션들
  updateList: { title: '리스트 업데이트', message: '리스트가 업데이트되었습니다', type: 'success' },
  heavyCalculation: { title: '연산 실행', message: '무거운 연산이 실행되었습니다', type: 'info' },
  conditionalHandler: { title: '조건부 핸들러', message: '조건부 핸들러가 실행되었습니다', type: 'info' },
  dynamicHandler: { title: '동적 핸들러', message: '동적 핸들러가 실행되었습니다', type: 'info' },
  memoryIntensive: { title: '메모리 집약 작업', message: '메모리 집약적인 작업이 실행되었습니다', type: 'info' },
  rerenderTrigger: { title: '리렌더 트리거', message: '리렌더가 트리거되었습니다', type: 'info' },
  
  // 컨텍스트 액션들
  globalMessage: { title: '전역 메시지', message: '전역 메시지가 전송되었습니다', type: 'success' },
  broadcastEvent: { title: '이벤트 브로드캐스트', message: '이벤트가 브로드캐스트되었습니다', type: 'info' },
  localAction: { title: '로컬 액션', message: '로컬 액션이 실행되었습니다', type: 'success' },
  nestedUpdate: { title: '중첩 업데이트', message: '중첩된 업데이트가 실행되었습니다', type: 'success' },
};

/**
 * 액션 타입에 따른 메시지 반환
 * 
 * @param actionType - 액션 타입
 * @returns 해당 액션의 메시지 정보 또는 기본값
 */
export function getActionMessage(actionType: string) {
  return ACTION_MESSAGES[actionType] || {
    title: actionType,
    message: `${actionType} 액션이 실행되었습니다`,
    type: 'success' as const,
  };
}