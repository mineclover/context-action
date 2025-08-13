/**
 * @fileoverview Mouse Actions - 액션 타입 정의
 * 
 * 마우스 이벤트 관련 모든 액션 타입 정의
 */

import type { ActionPayloadMap } from '@context-action/core';
export interface MousePosition {
  x: number;
  y: number;
}

/**
 * 마우스 이벤트 액션 맵
 */
export interface MouseActions extends ActionPayloadMap {
  /** 마우스 이동 액션 */
  'mouse.move': {
    position: MousePosition;
    timestamp: number;
  };
  
  /** 마우스 클릭 액션 */
  'mouse.click': {
    position: MousePosition;
    button: number;
    timestamp: number;
  };
  
  /** 마우스 영역 진입 액션 */
  'mouse.enter': {
    position: MousePosition;
    timestamp: number;
  };
  
  /** 마우스 영역 이탈 액션 */
  'mouse.leave': {
    position: MousePosition;
    timestamp: number;
  };
  
  /** 마우스 이동 시작 액션 */
  'mouse.moveStart': {
    position: MousePosition;
    timestamp: number;
  };
  
  /** 마우스 이동 종료 액션 */
  'mouse.moveEnd': {
    position: MousePosition;
    timestamp: number;
  };
  
  /** 상태 리셋 액션 */
  'mouse.reset': void;
}

/**
 * 액션 타입 상수
 */
export const MOUSE_ACTIONS = {
  MOVE: 'mouse.move' as const,
  CLICK: 'mouse.click' as const,
  ENTER: 'mouse.enter' as const,
  LEAVE: 'mouse.leave' as const,
  MOVE_START: 'mouse.moveStart' as const,
  MOVE_END: 'mouse.moveEnd' as const,
  RESET: 'mouse.reset' as const,
} as const;