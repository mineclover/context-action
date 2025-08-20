/**
 * @fileoverview Universal Reference Store (Internal API)
 * 
 * DOM 요소, Three.js 객체 등을 위한 확장된 Store 클래스
 * 마운트 대기, 동시성 제어, 자동 cleanup을 포함
 * 
 * @internal
 * @warning This is an internal API. Use `createRefContext()` instead for all ref management.
 * Direct RefStore usage is only intended for advanced framework development.
 */

import { Store } from '../stores/core/Store';
import { OperationQueue } from './OperationQueue';
import type { 
  RefTarget, 
  RefState, 
  RefOperation, 
  RefOperationOptions, 
  RefOperationResult,
  RefInitConfig,
  RefEvent,
  RefEventListener,
} from './types';

/**
 * 참조 전용 확장 Store 클래스 (Internal API)
 * 
 * @internal Use `createRefContext()` instead of directly instantiating RefStore
 * 
 * 기존 Store의 모든 기능을 상속받으며, 추가로 다음 기능을 제공:
 * 1. Promise 기반 마운트 대기
 * 2. 동시성 안전한 작업 처리
 * 3. 자동 cleanup 및 메모리 관리
 * 4. 이벤트 시스템
 * 5. 타입별 특화 기능 (DOM, Three.js)
 */
export class RefStore<T extends RefTarget = RefTarget> extends Store<RefState<T>> {
  private config: RefInitConfig<T>;
  private operationQueue: OperationQueue;
  private eventListeners = new Set<RefEventListener<T>>();
  private mountResolvers = new Set<(target: T) => void>();
  private mountRejectors = new Set<(error: Error) => void>();
  private isCleaningUp = false;
  private mountTimeoutId?: NodeJS.Timeout;
  private currentMountPromise: Promise<T> | null = null;
  
  // RefStore specific concurrency control (to override parent's private fields)
  private refIsUpdating = false;
  private refUpdateQueue: Array<() => void> = [];

  constructor(config: RefInitConfig<T>) {
    const initialState: RefState<T> = {
      target: null,
      isReady: false,
      isMounted: false,
      mountPromise: null,
      error: null,
      metadata: config.initialMetadata || {}
    };

    super(config.name, initialState);
    
    this.config = config;
    this.operationQueue = new OperationQueue();

    // RefStore에서는 참조 비교만 사용 - DOM 요소 호환성을 위해
    this.setComparisonOptions({ 
      strategy: 'reference'  // 참조 비교로 복사 문제 회피
    });

    // 모든 ref는 싱글톤이므로 항상 참조 비교만 사용
    this.setCustomComparator((oldState: RefState<T>, newState: RefState<T>) => {
      // target은 참조 비교, 나머지는 값 비교
      return Object.is(oldState.target, newState.target) &&
             oldState.isReady === newState.isReady &&
             oldState.isMounted === newState.isMounted &&
             Object.is(oldState.error, newState.error);
    });

    // 마운트 타임아웃 설정
    if (config.mountTimeout && config.mountTimeout > 0) {
      this.mountTimeoutId = setTimeout(() => {
        this.handleMountTimeout();
      }, config.mountTimeout);
    }
  }

  /**
   * 참조 객체 설정 (마운트)
   * React ref callback에서 호출되는 핵심 메서드
   */
  setRef = (target: T | null): void => {
    if (this.isCleaningUp) {
      return;
    }

    // const currentState = this.getValue(); // 필요 시 주석 해제

    if (target === null) {
      // Unmount
      this.handleUnmount().catch((error) => {
        console.warn(`Unmount failed for ${this.name}:`, error);
      });
    } else {
      // Mount
      this.handleMount(target);
    }
  };

  /**
   * 마운트 대기 Promise (최적화된 단일 인스턴스)
   * DOM이나 객체가 준비될 때까지 대기
   */
  waitForMount(): Promise<T> {
    const currentState = this.getValue();
    
    if (currentState.target && currentState.isReady) {
      // 이미 마운트됨
      return Promise.resolve(currentState.target);
    }

    // 기존 Promise가 있으면 재사용
    if (this.currentMountPromise) {
      return this.currentMountPromise;
    }

    // 새로운 단일 Promise 생성
    this.currentMountPromise = new Promise<T>((resolve, reject) => {
      this.mountResolvers.add(resolve);
      this.mountRejectors.add(reject);
    });

    // 상태에 Promise 저장
    this.update(state => ({
      ...state,
      mountPromise: this.currentMountPromise
    }));

    return this.currentMountPromise;
  }

  /**
   * 참조 객체와 함께 안전한 작업 수행
   * 마운트 대기 + 동시성 제어 + 에러 처리를 포함
   */
  async withTarget<R>(
    operation: RefOperation<T, R>,
    options: RefOperationOptions = {}
  ): Promise<RefOperationResult<R>> {
    try {
      // 마운트 대기
      const target = await this.waitForMount();
      
      // 큐를 통한 순차 실행
      return await this.operationQueue.enqueue(
        this.name,
        target,
        operation,
        options
      );
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 현재 참조 객체가 준비되었는지 확인
   */
  isReady(): boolean {
    const state = this.getValue();
    return state.isReady && state.target !== null;
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: RefEventListener<T>): () => void {
    this.eventListeners.add(listener);
    
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * 강제 cleanup 및 리소스 해제
   */
  async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      return;
    }

    this.isCleaningUp = true;

    try {
      // 마운트 타임아웃 클리어
      if (this.mountTimeoutId) {
        clearTimeout(this.mountTimeoutId);
        this.mountTimeoutId = undefined;
      }

      // 대기 중인 모든 작업 취소
      this.operationQueue.shutdown();

      // 현재 참조 객체 cleanup
      const currentState = this.getValue();
      if (currentState.target && this.config.cleanup) {
        try {
          await this.config.cleanup(currentState.target);
        } catch (error) {
          console.warn(`Cleanup failed for ${this.name}:`, error);
        }
      }

      // 마운트 대기자들에게 에러 전달
      const cleanupError = new Error(`RefStore ${this.name} is being cleaned up`);
      this.mountRejectors.forEach(reject => reject(cleanupError));
      this.mountRejectors.clear();
      this.mountResolvers.clear();
      
      // Promise 인스턴스 초기화
      this.currentMountPromise = null;

      // 상태 초기화
      this.setValue({
        target: null,
        isReady: false,
        isMounted: false,
        mountPromise: null,
        error: null,
        metadata: this.config.initialMetadata || {}
      });

      // cleanup 이벤트 발생
      this.emitEvent({
        type: 'cleanup',
        refName: this.name,
        timestamp: Date.now()
      });

    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * 마운트 처리
   */
  private handleMount(target: T): void {
    // 타입 검증
    if (this.config.validator && !this.config.validator(target)) {
      const error = new Error(`Invalid target type for ${this.name}`);
      this.handleError(error);
      return;
    }

    // 마운트 타임아웃 클리어
    if (this.mountTimeoutId) {
      clearTimeout(this.mountTimeoutId);
      this.mountTimeoutId = undefined;
    }

    // 상태 업데이트
    this.update(state => ({
      ...state,
      target,
      isReady: true,
      isMounted: true,
      mountedAt: Date.now(),
      error: null
    }));

    // 마운트 대기자들에게 알림
    this.mountResolvers.forEach(resolve => resolve(target));
    this.mountResolvers.clear();
    this.mountRejectors.clear();
    
    // Promise 인스턴스 초기화
    this.currentMountPromise = null;

    // mount 이벤트 발생
    this.emitEvent({
      type: 'mount',
      refName: this.name,
      target,
      timestamp: Date.now()
    });

    // ready 이벤트 발생
    this.emitEvent({
      type: 'ready',
      refName: this.name,
      target,
      timestamp: Date.now()
    });
  }

  /**
   * 언마운트 처리
   */
  private async handleUnmount(): Promise<void> {
    const currentState = this.getValue();
    
    if (currentState.target) {
      // autoCleanup이 활성화된 경우 cleanup 함수 호출
      if (this.config.autoCleanup !== false && this.config.cleanup) {
        try {
          await this.config.cleanup(currentState.target);
        } catch (error) {
          console.warn(`Cleanup failed during unmount for ${this.name}:`, error);
        }
      }
    }

    // Promise 인스턴스 초기화
    this.currentMountPromise = null;
    
    // 상태 업데이트
    this.update(state => ({
      ...state,
      target: null,
      isReady: false,
      isMounted: false,
      mountPromise: null
    }));

    // unmount 이벤트 발생
    this.emitEvent({
      type: 'unmount',
      refName: this.name,
      timestamp: Date.now()
    });
  }

  /**
   * 마운트 타임아웃 처리
   */
  private handleMountTimeout(): void {
    const error = new Error(`Mount timeout for ${this.name} after ${this.config.mountTimeout}ms`);
    this.handleError(error);
  }

  /**
   * 에러 처리
   */
  private handleError(error: Error): void {
    this.update(state => ({
      ...state,
      error,
      isReady: false
    }));

    // 마운트 대기자들에게 에러 전달
    this.mountRejectors.forEach(reject => reject(error));
    this.mountRejectors.clear();
    this.mountResolvers.clear();
    
    // Promise 인스턴스 초기화
    this.currentMountPromise = null;

    // error 이벤트 발생
    this.emitEvent({
      type: 'error',
      refName: this.name,
      error,
      timestamp: Date.now()
    });
  }


  /**
   * 이벤트 발생
   */
  private emitEvent(event: RefEvent<T>): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn(`RefStore event listener error:`, error);
      }
    });
  }

  /**
   * RefStore는 DOM 요소를 포함하므로 불변성 복사를 비활성화
   * getValue는 원본 참조를 반환 (DOM 요소 호환성을 위해)
   */
  override getValue(): RefState<T> {
    return this._value; // 복사하지 않고 원본 참조 반환
  }

  /**
   * RefStore는 DOM 요소를 포함하므로 불변성 복사를 비활성화
   * setValue는 복사하지 않고 직접 설정
   */
  override setValue(value: RefState<T>): void {
    // 강화된 값 비교 시스템 (복사 없이)
    const hasChanged = this._compareValues(this._value, value);
    
    if (hasChanged) {
      this._value = value; // 복사하지 않고 직접 할당
      // 새 스냅샷 생성
      this._snapshot = this._createSnapshot();
      
      // 듀얼 모드 알림 시스템
      this._scheduleNotification();
    }
  }

  /**
   * RefStore는 DOM 요소를 포함하므로 불변성 복사를 비활성화
   * update도 복사하지 않고 직접 처리
   */
  override update(updater: (current: RefState<T>) => RefState<T>): void {
    // 동시성 보호: update 진행 중이면 큐에 추가
    if (this.refIsUpdating) {
      this.refUpdateQueue.push(() => this.update(updater));
      return;
    }

    try {
      this.refIsUpdating = true;
      // RefStore는 복사하지 않고 현재 값 직접 전달
      const currentValue = this._value;
      
      const updatedValue = updater(currentValue);
      
      // setValue로 업데이트 (복사 없이)
      this.setValue(updatedValue);
    } finally {
      this.refIsUpdating = false;
      
      // 큐에 대기 중인 업데이트 처리
      if (this.refUpdateQueue.length > 0) {
        const nextUpdate = this.refUpdateQueue.shift();
        if (nextUpdate) {
          // 다음 마이크로태스크에서 실행하여 스택 오버플로우 방지
          Promise.resolve().then(nextUpdate);
        }
      }
    }
  }

  /**
   * RefStore용 커스텀 스냅샷 생성 - DOM 요소 호환성을 위해 복사하지 않음
   */
  protected override _createSnapshot(): import('../stores/core/types').Snapshot<RefState<T>> {
    // RefStore는 DOM 요소를 포함하므로 복사하지 않고 원본 참조 사용
    return {
      value: this._value, // 복사 없이 원본 참조 사용
      name: this.name,
      lastUpdate: Date.now()
    };
  }

  /**
   * Store 해제 시 자동 cleanup
   */
  override clearListeners(): void {
    super.clearListeners();
    
    if (this.config.autoCleanup !== false) {
      this.cleanup().catch(error => {
        console.warn(`Auto cleanup failed for ${this.name}:`, error);
      });
    }
  }
}

/**
 * RefStore 팩토리 함수 (Internal API)
 * 
 * @internal Use `createRefContext()` instead of directly creating RefStore instances
 * @warning This function is for internal framework use only
 */
export function createRefStore<T extends RefTarget>(
  config: RefInitConfig<T>
): RefStore<T> {
  return new RefStore<T>(config);
}


