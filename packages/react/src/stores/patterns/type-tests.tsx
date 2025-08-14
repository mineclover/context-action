/**
 * Type Test File for Declarative Store Pattern V2
 * 
 * This file contains comprehensive type tests to verify the implementation
 * works correctly with both explicit generics and type inference.
 */

import { createDeclarativeStorePattern } from './declarative-store-pattern-v2';
import { createActionContext } from '../../actions/ActionContext';
import type { ActionPayloadMap } from '@context-action/core';

// ============================================================================
// TYPE DEFINITIONS FOR TESTING
// ============================================================================

/**
 * Test interfaces for explicit generic usage
 */
interface UserStores {
  profile: { id: string; name: string; email: string };
  settings: { theme: 'light' | 'dark'; language: string };
  preferences: { notifications: boolean; autoSave: boolean };
}

interface AppStores {
  counter: number;
  user: { id: string; name: string };
  todos: Array<{ id: string; text: string; completed: boolean }>;
  metadata: { version: string; lastModified: Date };
}

interface TestActions extends ActionPayloadMap {
  updateProfile: { id: string; name: string };
  toggleTheme: void;
  addTodo: { text: string };
}

// ============================================================================
// EXPLICIT GENERIC TESTS - 명시적 제네릭 타입 사용
// ============================================================================

/**
 * ✅ CORRECT: Explicit generics with direct values
 * 명시적 제네릭 + 직접 값 제공 (InitialStores<T> 구조)
 */
const ExplicitGenericWithDirectValues = createDeclarativeStorePattern<UserStores>('UserApp', {
  // 직접 값 제공 - UserStores 타입과 일치해야 함
  profile: { id: '', name: '', email: '' },
  settings: { theme: 'light', language: 'en' },
  preferences: { notifications: true, autoSave: false }
});

/**
 * ✅ CORRECT: Explicit generics with config objects
 * 명시적 제네릭 + 설정 객체 제공 (InitialStores<T> 구조)
 */
const ExplicitGenericWithConfig = createDeclarativeStorePattern<UserStores>('UserAppConfig', {
  // 설정 객체 사용 - initialValue가 UserStores 타입과 일치해야 함
  profile: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow'
  },
  settings: {
    initialValue: { theme: 'light', language: 'en' },
    strategy: 'deep',
    description: 'User settings store'
  },
  preferences: {
    initialValue: { notifications: true, autoSave: false }
  }
});

/**
 * ✅ CORRECT: Explicit generics with mixed direct values and config
 * 명시적 제네릭 + 직접 값과 설정 객체 혼합
 */
const ExplicitGenericMixed = createDeclarativeStorePattern<AppStores>('AppMixed', {
  counter: 0,  // 직접 값
  user: { id: '', name: '' },  // 직접 값
  todos: [],  // 직접 값 (빈 배열)
  metadata: {  // 설정 객체
    initialValue: { version: '1.0.0', lastModified: new Date() },
    strategy: 'shallow'
  }
});

// ============================================================================
// TYPE INFERENCE TESTS - 타입 추론 사용
// ============================================================================

/**
 * ✅ CORRECT: Type inference with direct values
 * 타입 추론 + 직접 값 제공
 */
const TypeInferenceDirectValues = createDeclarativeStorePattern('InferredApp', {
  counter: 0,  // 추론: Store<number>
  user: { id: '', name: '', email: '' },  // 추론: Store<{id: string, name: string, email: string}>
  isLoggedIn: false,  // 추론: Store<boolean>
  tags: ['react', 'typescript'],  // 추론: Store<string[]>
  settings: { theme: 'light' as const, language: 'en' }  // 추론: Store<{theme: 'light', language: string}>
});

/**
 * ✅ CORRECT: Type inference with config objects
 * 타입 추론 + 설정 객체 제공
 */
const TypeInferenceWithConfig = createDeclarativeStorePattern('InferredConfig', {
  counter: {
    initialValue: 0,
    strategy: 'reference'
  },
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow',
    description: 'User profile data'
  },
  preferences: {
    initialValue: { notifications: true, autoSave: false },
    strategy: 'deep'
  }
});

/**
 * ✅ CORRECT: Type inference with complex nested types
 * 타입 추론 + 복잡한 중첩 타입
 */
const TypeInferenceComplex = createDeclarativeStorePattern('ComplexInferred', {
  // 중첩 객체
  appState: {
    ui: { loading: false, error: null as string | null },
    data: { items: [], pagination: { page: 1, total: 0 } }
  },
  // 배열 타입
  todos: [] as Array<{ id: string; text: string; completed: boolean }>,
  // Date 객체
  timestamps: {
    created: new Date(),
    updated: new Date()
  },
  // 복잡한 설정 객체
  complexConfig: {
    initialValue: {
      features: {
        darkMode: true,
        notifications: false
      },
      api: {
        baseUrl: 'https://api.example.com',
        timeout: 5000
      }
    },
    strategy: 'deep' as const
  }
});

// ============================================================================
// ACTION CONTEXT TESTS - Action Context 오버로드 테스트
// ============================================================================

/**
 * ✅ CORRECT: New API with contextName first
 * 새로운 API - contextName 우선
 */
const NewActionContextAPI = createActionContext<TestActions>('TestActions', {
  registry: {
    debug: true,
    maxHandlers: 10
  }
});

/**
 * ✅ CORRECT: Legacy API with config only
 * 레거시 API - 설정 객체만
 */
const LegacyActionContextAPI = createActionContext<TestActions>({
  name: 'LegacyTestActions',
  registry: {
    debug: false
  }
});

// ============================================================================
// USAGE PATTERN TESTS - 실제 사용 패턴 테스트
// ============================================================================

/**
 * Hook usage test component
 */
function TestComponent() {
  // Explicit generic pattern usage
  const explicitProfileStore = ExplicitGenericWithDirectValues.useStore('profile');
  const explicitSettingsStore = ExplicitGenericWithConfig.useStore('settings');
  
  // Type inference pattern usage
  const inferredCounterStore = TypeInferenceDirectValues.useStore('counter');
  const inferredUserStore = TypeInferenceWithConfig.useStore('user');
  
  // Action context usage
  const dispatch = NewActionContextAPI.useActionDispatch();
  const { dispatchWithResult } = NewActionContextAPI.useActionDispatchWithResult();
  
  // Register action handler
  NewActionContextAPI.useActionHandler('updateProfile', async (payload: { id: string; name: string }) => {
    // payload는 { id: string; name: string } 타입으로 추론됨
    console.log('Updating profile:', payload.id, payload.name);
  });
  
  // Complex store access
  const complexStore = TypeInferenceComplex.useStore('appState');
  
  return null; // Test component doesn't render anything
}

// ============================================================================
// TYPE VALIDATION TESTS - 컴파일 타임 타입 검증
// ============================================================================

/**
 * These tests should compile without errors if the implementation is correct
 */
function typeValidationTests() {
  // Test 1: Explicit generic stores should enforce correct types
  const profileStore = ExplicitGenericWithDirectValues.useStore('profile');
  // profileStore는 Store<{ id: string; name: string; email: string }> 타입이어야 함
  
  const settingsStore = ExplicitGenericMixed.useStore('metadata');
  // settingsStore는 Store<{ version: string; lastModified: Date }> 타입이어야 함
  
  // Test 2: Type inference should work correctly
  const counterStore = TypeInferenceDirectValues.useStore('counter');
  // counterStore는 Store<number> 타입이어야 함
  
  const userStore = TypeInferenceWithConfig.useStore('user');
  // userStore는 Store<{ id: string; name: string; email: string }> 타입이어야 함
  
  // Test 3: Action dispatch should be type-safe
  const dispatch = NewActionContextAPI.useActionDispatch();
  
  // 올바른 호출 - 컴파일 성공해야 함
  dispatch('updateProfile', { id: '123', name: 'John' });
  dispatch('toggleTheme'); // void payload
  dispatch('addTodo', { text: 'Learn TypeScript' });
  
  // Test 4: Store manager should work
  const manager = ExplicitGenericWithDirectValues.useStoreManager();
  const info = manager.getInfo();
  console.log('Store info:', info.name, info.storeCount);
}

// ============================================================================
// ERROR CASE TESTS - 에러 케이스 테스트 (주석 처리됨)
// ============================================================================

/**
 * These should cause TypeScript compilation errors (commented out)
 */
/*
// ❌ ERROR: Wrong type for explicit generic
const WrongExplicitType = createDeclarativeStorePattern<UserStores>('Wrong', {
  profile: { id: 123, name: '', email: '' }, // ❌ id should be string, not number
  settings: { theme: 'invalid', language: 'en' }, // ❌ theme should be 'light' | 'dark'
  preferences: { notifications: 'yes', autoSave: false } // ❌ notifications should be boolean
});

// ❌ ERROR: Missing required properties
const MissingProperties = createDeclarativeStorePattern<UserStores>('Missing', {
  profile: { id: '', name: '' }, // ❌ Missing email property
  settings: { theme: 'light' }, // ❌ Missing language property
  // ❌ Missing preferences entirely
});

// ❌ ERROR: Wrong action payload type
function errorActionTest() {
  const dispatch = NewActionContextAPI.useActionDispatch();
  
  dispatch('updateProfile', { id: 123, name: 'John' }); // ❌ id should be string
  dispatch('toggleTheme', { unnecessary: 'payload' }); // ❌ void action doesn't accept payload
  dispatch('addTodo', { text: 123 }); // ❌ text should be string
  dispatch('nonExistentAction', {}); // ❌ Action doesn't exist
}
*/

// ============================================================================
// EXPORT FOR USAGE TESTING
// ============================================================================

export {
  ExplicitGenericWithDirectValues,
  ExplicitGenericWithConfig,
  ExplicitGenericMixed,
  TypeInferenceDirectValues,
  TypeInferenceWithConfig,
  TypeInferenceComplex,
  NewActionContextAPI,
  LegacyActionContextAPI,
  TestComponent,
  typeValidationTests
};

/**
 * TYPE TEST SUMMARY
 * 
 * ✅ Explicit Generic Tests (명시적 제네릭):
 * - Direct values: createDeclarativeStorePattern<T>(name, directValues)
 * - Config objects: createDeclarativeStorePattern<T>(name, configObjects)
 * - Mixed approach: createDeclarativeStorePattern<T>(name, mixedValues)
 * 
 * ✅ Type Inference Tests (타입 추론):
 * - Direct values: createDeclarativeStorePattern(name, directValues)
 * - Config objects: createDeclarativeStorePattern(name, configObjects)
 * - Complex types: Arrays, Dates, nested objects
 * 
 * ✅ Action Context Tests:
 * - New API: createActionContext<T>(contextName, config?)
 * - Legacy API: createActionContext<T>(config)
 * 
 * ✅ Integration Tests:
 * - Hook usage patterns
 * - Type safety validation
 * - Component integration
 * 
 * All tests should compile without TypeScript errors when the implementation is correct.
 */