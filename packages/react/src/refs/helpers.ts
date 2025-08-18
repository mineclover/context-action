/**
 * @fileoverview Reference Management Helper Functions
 * 
 * 범용 참조 정의를 위한 경량화된 헬퍼 함수
 */

import type { 
  RefInitConfig, 
  RefTarget
} from './types';

/**
 * 커스텀 참조 정의 헬퍼
 */
export function customRef<T extends RefTarget>(
  config: Partial<Omit<RefInitConfig<T>, 'objectType'>> & { 
    name: string;
    cleanup?: (target: T) => void | Promise<void>;
  }
): RefInitConfig<T> {
  return {
    objectType: 'custom',
    autoCleanup: true,
    ...config
  } as RefInitConfig<T>;
}



