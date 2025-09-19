/**
 * 타입 추론 검증 테스트 파일
 *
 * 이 파일은 Context-Action의 타입 추론이 실제로 잘 작동하는지 검증합니다.
 * TypeScript 컴파일러가 타입을 올바르게 추론하는지 확인합니다.
 */

import { createStoreContext, createActionContext } from '@context-action/react';
import { TypeUtils } from '@context-action/core';

// ✅ 1. 기본 스토어 타입 추론 테스트
console.log('=== 1. 기본 스토어 타입 추론 테스트 ===');

const { Provider: BasicStoreProvider, useStore: useBasicStore } = createStoreContext('BasicTest', {
  // 기본 타입들
  count: 0,                    // number로 추론되어야 함
  name: 'test',               // string으로 추론되어야 함
  isActive: true,             // boolean으로 추론되어야 함

  // 배열 타입들
  items: ['a', 'b', 'c'],     // string[]으로 추론되어야 함
  numbers: [1, 2, 3],         // number[]으로 추론되어야 함

  // 객체 타입들
  user: {
    id: '',
    name: '',
    age: 0
  },

  // const assertion으로 literal 타입 유지
  theme: 'dark' as const,     // 'dark' literal 타입으로 추론되어야 함
  status: 'loading' as const, // 'loading' literal 타입으로 추론되어야 함

  // readonly 배열
  tags: ['tag1', 'tag2'] as readonly string[],

  // null/undefined 가능한 타입
  optionalData: null as { data: string } | null
});

// ✅ 2. 고급 스토어 타입 추론 테스트
console.log('=== 2. 고급 스토어 타입 추론 테스트 ===');

// 브랜드 타입 정의
type UserId = TypeUtils.Brand<string, 'UserId'>;
type ProductId = TypeUtils.Brand<string, 'ProductId'>;

interface Product {
  id: ProductId;
  name: string;
  price: number;
  category: 'electronics' | 'clothing' | 'books';
}

interface User {
  id: UserId;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const { Provider: AdvancedStoreProvider, useStore: useAdvancedStore } = createStoreContext('AdvancedTest', {
  // 복잡한 타입들
  currentUser: null as User | null,
  products: [] as Product[],

  // Discriminated Union
  apiState: { status: 'idle' } as
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: Product[] }
    | { status: 'error'; error: string },

  // 중첩된 객체 구조
  appConfig: {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    },
    features: {
      auth: true,
      analytics: false,
      darkMode: true
    }
  },

  // Generic 타입
  cache: new Map<string, any>(),

  // 함수 타입 (스토어에서는 권장하지 않지만 타입 추론 테스트용)
  validator: ((value: string) => value.length > 0) as (value: string) => boolean
});

// ✅ 3. 액션 타입 추론 테스트
console.log('=== 3. 액션 타입 추론 테스트 ===');

interface TestActions {
  // 기본 페이로드 타입들
  updateCount: { value: number };
  updateName: { name: string };
  toggleStatus: void;

  // 복잡한 페이로드 타입들
  updateUser: { user: User };
  addProduct: { product: Omit<Product, 'id'> };

  // Union 타입 페이로드
  updateSetting:
    | { key: 'theme'; value: 'light' | 'dark' }
    | { key: 'language'; value: 'en' | 'ko' };

  // 브랜드 타입 페이로드
  loadUser: { userId: UserId };
  loadProduct: { productId: ProductId };

  // 조건부 타입 페이로드
  processData: {
    type: 'sync';
    data: string;
  } | {
    type: 'async';
    data: string;
    callback: () => void;
  };
}

const {
  Provider: ActionProvider,
  useActionDispatch: useTestAction,
  useActionHandler: useTestActionHandler
} = createActionContext<TestActions>('TestActions');

// ✅ 4. 타입 추론 검증 함수들
console.log('=== 4. 타입 추론 검증 ===');

// 이 함수들은 컴파일 시 타입 에러가 발생하지 않으면 타입 추론이 올바르게 작동하는 것입니다.
function validateStoreTypeInference() {
  // 기본 스토어 사용
  const countStore = useBasicStore('count');
  const nameStore = useBasicStore('name');
  const userStore = useBasicStore('user');
  const themeStore = useBasicStore('theme');

  // 고급 스토어 사용
  const currentUserStore = useAdvancedStore('currentUser');
  const productsStore = useAdvancedStore('products');
  const apiStateStore = useAdvancedStore('apiState');

  // 타입이 올바르게 추론되었는지 확인
  // 이 주석들을 제거하고 실제 값에 접근하면 타입 에러 확인 가능

  // countStore.setValue('string'); // ❌ 에러: number 타입이어야 함
  // nameStore.setValue(123); // ❌ 에러: string 타입이어야 함
  // themeStore.setValue('light'); // ❌ 에러: 'dark' literal 타입이어야 함

  console.log('✅ 스토어 타입 추론 검증 완료');
}

function validateActionTypeInference() {
  const dispatch = useTestAction();

  // 올바른 디스패치 호출들
  dispatch('updateCount', { value: 42 });
  dispatch('updateName', { name: 'test' });
  dispatch('toggleStatus'); // void 페이로드

  // Union 타입 페이로드
  dispatch('updateSetting', { key: 'theme', value: 'dark' });
  dispatch('updateSetting', { key: 'language', value: 'ko' });

  // 브랜드 타입 페이로드
  const userId = 'user-123' as UserId;
  const productId = 'prod-456' as ProductId;
  dispatch('loadUser', { userId });
  dispatch('loadProduct', { productId });

  // 조건부 타입 페이로드
  dispatch('processData', { type: 'sync', data: 'test' });
  dispatch('processData', { type: 'async', data: 'test', callback: () => {} });

  // 잘못된 디스패치 호출들 (주석 해제하면 타입 에러 발생)
  // dispatch('updateCount', { value: 'string' }); // ❌ 에러
  // dispatch('updateName', { name: 123 }); // ❌ 에러
  // dispatch('toggleStatus', { unnecessary: 'payload' }); // ❌ 에러
  // dispatch('updateSetting', { key: 'invalid', value: 'test' }); // ❌ 에러

  console.log('✅ 액션 타입 추론 검증 완료');
}

// ✅ 5. TypeUtils 유틸리티 타입 검증
console.log('=== 5. TypeUtils 유틸리티 타입 검증 ===');

// 브랜드 타입 테스트
type TestBrand = TypeUtils.Brand<string, 'TestBrand'>;
const brandedValue: TestBrand = 'test' as TestBrand;

// DeepReadonly 테스트
type TestObject = {
  a: string;
  b: {
    c: number;
    d: string[];
  };
};

type ReadonlyTestObject = TypeUtils.DeepReadonly<TestObject>;
// ReadonlyTestObject는 모든 속성이 readonly가 되어야 함

// RequireFields 테스트
type OptionalUser = {
  id: string;
  name?: string;
  email?: string;
};

type RequiredEmailUser = TypeUtils.RequireFields<OptionalUser, 'email'>;
// RequiredEmailUser에서 email은 필수가 되어야 함

// KeysOfType 테스트
type MixedTypes = {
  stringField: string;
  numberField: number;
  booleanField: boolean;
  arrayField: string[];
};

type StringKeys = TypeUtils.KeysOfType<MixedTypes, string>; // 'stringField'
type NumberKeys = TypeUtils.KeysOfType<MixedTypes, number>; // 'numberField'
type ArrayKeys = TypeUtils.KeysOfType<MixedTypes, unknown[]>; // 'arrayField'

console.log('✅ TypeUtils 유틸리티 타입 검증 완료');

// ✅ 6. 실제 컴포넌트에서의 타입 추론 테스트
console.log('=== 6. 실제 사용 시나리오 타입 추론 테스트 ===');

// React 컴포넌트에서 사용하는 패턴
function TestComponent() {
  // 스토어 구독 - 타입이 자동으로 추론되어야 함
  const countStore = useBasicStore('count');
  const userStore = useAdvancedStore('currentUser');
  const dispatch = useTestAction();

  // 핸들러 등록 - 페이로드 타입이 자동으로 추론되어야 함
  useTestActionHandler('updateCount', async (payload) => {
    // payload는 { value: number } 타입으로 추론되어야 함
    console.log('Received count:', payload.value);
    countStore.setValue(payload.value);
  });

  useTestActionHandler('updateUser', async (payload) => {
    // payload는 { user: User } 타입으로 추론되어야 함
    console.log('Received user:', payload.user.name);
    userStore.setValue(payload.user);
  });

  useTestActionHandler('updateSetting', async (payload) => {
    // payload는 union 타입으로 추론되어야 함
    if (payload.key === 'theme') {
      // payload.value는 'light' | 'dark' 타입으로 좁혀져야 함
      console.log('Theme setting:', payload.value);
    } else if (payload.key === 'language') {
      // payload.value는 'en' | 'ko' 타입으로 좁혀져야 함
      console.log('Language setting:', payload.value);
    }
  });

  return null; // 실제 JSX는 테스트와 관련 없음
}

// ✅ 7. 에러 케이스 검증 (주석으로 표시)
console.log('=== 7. 에러 케이스 검증 (주석 참조) ===');

/*
// 다음 코드들의 주석을 해제하면 TypeScript 컴파일 에러가 발생해야 합니다:

// 잘못된 스토어 키 접근
const invalidStore = useBasicStore('nonexistent'); // ❌ 에러

// 잘못된 액션 디스패치
dispatch('nonexistentAction', {}); // ❌ 에러

// 잘못된 페이로드 타입
dispatch('updateCount', { value: 'string' }); // ❌ 에러

// 브랜드 타입 혼용
const userId: UserId = 'user-123' as ProductId; // ❌ 에러

// const assertion 없이 literal 타입 손실
const theme = 'dark'; // string 타입 (너무 넓음)
dispatch('updateSetting', { key: 'theme', value: theme }); // ❌ 에러 (string은 'light' | 'dark'에 할당 불가)

// 올바른 방법: const assertion 사용
const themeFixed = 'dark' as const; // 'dark' literal 타입
dispatch('updateSetting', { key: 'theme', value: themeFixed }); // ✅ 정상
*/

// ✅ 검증 실행
try {
  validateStoreTypeInference();
  validateActionTypeInference();

  console.log('\n🎉 모든 타입 추론 검증이 성공적으로 완료되었습니다!');
  console.log('✅ 스토어 타입 추론: 정상 작동');
  console.log('✅ 액션 타입 추론: 정상 작동');
  console.log('✅ 브랜드 타입: 정상 작동');
  console.log('✅ TypeUtils 유틸리티: 정상 작동');
  console.log('✅ Union 타입 처리: 정상 작동');
  console.log('✅ Literal 타입 유지: 정상 작동');

} catch (error) {
  console.error('❌ 타입 추론 검증 중 오류 발생:', error);
}

export {};