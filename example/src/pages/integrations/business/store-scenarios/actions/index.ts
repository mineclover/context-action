import { ActionRegister } from '@context-action/react';
import { setupSelectiveActionToast } from '@/components/ToastSystem';
import { createLogger, LogLevel } from '@/utils/logger';
import type { StoreFullActionMap } from '../types';

/**
 * Store scenarios 데모용 액션 시스템 설정
 * ActionRegister를 중심으로 하는 액션 파이프라인과 로깅 시스템을 구성
 *
 * @implements actionregister
 * @implements action-pipeline-system
 * @memberof core-concepts
 * @example
 * // 액션 핸들러 등록 (컴포넌트 내부에서)
 * useEffect(() => {
 *   const unsubscribe = storeActionRegister.register('updateUser', ({ user }, controller) => {
 *     userStore.setValue(user);
 *
 *   });
 *   return unsubscribe;
 * }, [userStore]);
 * @since 1.0.0
 */

// 로거 및 액션 레지스터 설정
export const logger = createLogger(LogLevel.DEBUG);
export const storeActionRegister = new ActionRegister<StoreFullActionMap>({
  name: 'StoreActions',
});

// 토스트 시스템과 연동 - 주요 액션들만 추적
// 🔧 Fixed: Removal actions now safely excluded in setupSelectiveActionToast
const trackedActions = [
  'updateProfile',
  'toggleTheme',
  'addToCart',
  'removeFromCart',
  'addTodo',
  'toggleTodo',
  'deleteTodo',
  'sendMessage',
  'deleteMessage',
  'clearChat',
  'updateFormField',
  'nextStep',
  'resetSettings',
];

setupSelectiveActionToast(storeActionRegister, trackedActions);

// 💡 Rate limiting 활성화 (필요시):
// setupSelectiveActionToast(storeActionRegister, trackedActions, {
//   enableRateLimit: true,
//   maxToasts: 5,        // 1초당 최대 5개
//   resetInterval: 1000  // 1초마다 리셋
// });

// 액션 핸들러는 이제 각 컴포넌트에서 개별적으로 등록됩니다.
// Context Store 패턴을 사용하여 각 컴포넌트가 필요한 스토어에 직접 접근합니다.
export const registerStoreActions = () => {
  // 더 이상 여기서 액션을 등록하지 않습니다.
  // 각 컴포넌트에서 필요한 액션만 등록하도록 변경되었습니다.
  return () => {}; // 빈 unsubscribe 함수 반환
};
