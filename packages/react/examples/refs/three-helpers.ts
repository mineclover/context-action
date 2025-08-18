/**
 * @fileoverview Three.js Helper Functions for Examples
 * 
 * Three.js 관련 헬퍼 함수들 - 라이브러리 코드에서 분리
 * 실제 프로덕션에서는 실제 Three.js 타입을 사용하세요
 */

import type { RefInitConfig } from '../../src/refs/types';
import type { 
  ThreeObject, 
  ThreeScene, 
  ThreeCamera, 
  ThreeRenderer, 
  ThreeMesh,
  ThreeValidators as ThreeValidatorsType
} from './three-mock-types';

export { ThreeValidators } from './three-mock-types';
export type { ThreeObject, ThreeScene, ThreeCamera, ThreeRenderer, ThreeMesh } from './three-mock-types';

/**
 * Three.js 참조 정의 헬퍼
 */
export function threeRef<T extends ThreeObject>(
  config?: Partial<Omit<RefInitConfig<T>, 'objectType'>> & {
    expectedType?: string;
    validator?: (target: unknown) => target is T;
  }
): RefInitConfig<T> {
  const baseConfig = {
    name: config?.name || 'three-ref',
    objectType: 'three' as const,
    autoCleanup: true,
    cleanup: async (target: any) => {
      // 기본 Three.js cleanup
      if (target.dispose && typeof target.dispose === 'function') {
        target.dispose();
      }
      if (target.parent && target.parent.remove) {
        target.parent.remove(target);
      }
    },
    ...config
  };

  // 타입별 자동 validator
  if (!baseConfig.validator && config?.expectedType) {
    const validators: ThreeValidatorsType = await import('./three-mock-types').then(m => m.ThreeValidators);
    switch (config.expectedType) {
      case 'Scene':
        baseConfig.validator = validators.Scene.validate as any;
        break;
      case 'Camera':
        baseConfig.validator = validators.Camera.validate as any;
        break;
      case 'Renderer':
        baseConfig.validator = validators.Renderer.validate as any;
        break;
      case 'Mesh':
        baseConfig.validator = validators.Mesh.validate as any;
        break;
    }
  }

  return baseConfig as RefInitConfig<T>;
}

/**
 * Three.js 객체 전용 Context 생성을 위한 헬퍼
 */
/**
 * Three.js 참조를 위한 Context 생성 함수
 */
export function createThreeRefContext<T extends Record<string, ThreeObject>>(
  contextName: string,
  objectConfigs: {
    [K in keyof T]: {
      name: string;
      expectedType?: string;
      autoAddToScene?: boolean;
      autoDispose?: boolean;
      autoCleanupResources?: boolean;
      cleanup?: (target: T[K]) => void | Promise<void>;
    }
  }
) {
  const { createDeclarativeRefPattern } = require('../../src/refs/declarative-ref-pattern');
  const refDefinitions = createThreeRefDefinitions(objectConfigs);
  return createDeclarativeRefPattern(contextName, refDefinitions as any);
}

export function createThreeRefDefinitions<T extends Record<string, any>>(
  objectConfigs: Record<string, Partial<RefInitConfig<any>> & { name: string }>
) {
  const refDefinitions = {} as Record<string, RefInitConfig<any>>;
  
  for (const [name, config] of Object.entries(objectConfigs)) {
    refDefinitions[name] = {
      objectType: 'three',
      autoCleanup: true,
      cleanup: async (target: any) => {
        // 기본 Three.js cleanup
        if (target.dispose && typeof target.dispose === 'function') {
          target.dispose();
        }
        if (target.parent && target.parent.remove) {
          target.parent.remove(target);
        }
      },
      ...config
    } as RefInitConfig<T[typeof name]>;
  }
  
  return refDefinitions;
}