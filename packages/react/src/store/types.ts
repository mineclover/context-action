/**
 * Store 시스템 핵심 타입 정의
 * 핵심 기능: Store, Registry, Event 시스템에 필요한 모든 TypeScript 타입 제공
 */

// === 기본 구독 타입 ===
// 핵심 설계: Observer 패턴을 위한 기본 타입 정의
export type Listener = () => void;                                  // 변경 알림 콜백
export type Unsubscribe = () => void;                               // 구독 해제 함수
export type Subscribe = (listener: Listener) => Unsubscribe;         // 구독 함수

// === Store 스냅샷 인터페이스 ===
// 핵심 설계: 불변 Store 상태 스냅샷 (최적화 및 디버깅용)
export interface Snapshot<T = any> {
  value: T;           // Store의 현재 값
  name: string;       // Store 식별자
  lastUpdate: number; // 마지막 업데이트 타임스탬프
}

// === 핵심 Store 인터페이스 ===
// 핵심 설계: useSyncExternalStore 호환 및 Observer 패턴 구현
export interface IStore<T = any> {
  readonly name: string;                    // Store 고유 식별자
  subscribe: Subscribe;                     // React useSyncExternalStore 호환
  getSnapshot: () => Snapshot<T>;           // React useSyncExternalStore 호환
  setValue: (value: T) => void;             // Store 값 설정
  getValue: () => T;                        // Store 값 직접 접근
  getListenerCount?: () => number;          // 디버깅/모니터링용
}

// === Store Registry 인터페이스 ===
// 핵심 설계: 다중 Store 중앙 관리 및 동적 접근
export interface IStoreRegistry {
  readonly name: string;                           // Registry 식별자
  subscribe: Subscribe;                            // Registry 변경 구독
  getSnapshot: () => Array<[string, IStore]>;      // 등록된 Store 목록 스냅샷
  register: (name: string, store: IStore) => void; // Store 등록
  unregister: (name: string) => void;              // Store 등록 해제
  getStore: (name: string) => IStore | undefined;  // 이름으로 Store 조회
  getAllStores: () => Map<string, IStore>;         // 전체 Store 목록
  hasStore: (name: string) => boolean;             // Store 존재 여부 확인
}

// === 이벤트 시스템 타입 ===
// 핵심 설계: Store 간 비동기 통신을 위한 Pub-Sub 패턴
export interface EventHandler<T = any> {
  (data: T): void;  // 이벤트 핸들러 시그니처
}

export interface IEventBus {
  on: <T = any>(event: string, handler: EventHandler<T>) => Unsubscribe;  // 이벤트 구독
  emit: <T = any>(event: string, data?: T) => void;                       // 이벤트 발행
  off: (event: string, handler?: EventHandler) => void;                   // 구독 해제
  clear: () => void;                                                      // 전체 정리
}

// === Hook 설정 타입 ===
// 핵심 설계: React Hook 옵틸마이제이션 및 에러 처리
export interface StoreSyncConfig<T, R = Snapshot<T>> {
  defaultValue?: T;                           // 기본값 (초기 렌더링용)
  selector?: (snapshot: Snapshot<T>) => R;    // 선택적 구독 (성능 최적화)
}

export interface HookOptions<T> {
  defaultValue?: T;                     // 기본값
  onError?: (error: Error) => void;     // 에러 핸들러
  dependencies?: React.DependencyList;  // React useEffect 의존성
}

// === Context 타입 ===
// 핵심 설계: React Context API를 통한 Store 공유
export interface StoreContextType {
  storeRegistryRef: React.RefObject<IStoreRegistry>;  // Registry 참조 (RefObject 패턴)
}

export interface StoreContextReturn {
  Provider: React.FC<{ children: React.ReactNode }>;  // Context Provider 컴포넌트
  useStoreContext: () => StoreContextType;            // Context 접근 Hook
  useStoreRegistry: () => IStoreRegistry;             // Registry 접근 Hook
}

// === Registry 동기화 타입 ===
// 핵심 설계: 동적 Store 접근 및 생성 옵션
export interface RegistryStoreMap {
  [key: string]: any;  // 타입 유연성을 위한 맵 타입
}

export interface DynamicStoreOptions<T> {
  defaultValue?: T;                              // 기본값
  createIfNotExists?: boolean;                   // 없을 때 자동 생성 여부
  onNotFound?: (storeName: string) => void;      // Store 찾기 실패 콜백
}
