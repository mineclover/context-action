/**
 * @fileoverview Store-Based Mouse Controller - 스토어 기반 컨트롤러
 * 
 * MouseStoreManager를 사용하여 리액티브한 마우스 이벤트 처리를 담당
 */

import type { MousePosition } from '../stores/MouseStoreDefinitions';
import { MouseStoreManager } from '../stores/MouseStoreManager';
import { createMouseStoreCollection } from '../stores/MouseStoreDefinitions';

export interface StoreBasedMouseControllerConfig {
  throttleMs?: number;
  maxPathPoints?: number;
  maxClickHistory?: number;
  moveEndDelayMs?: number;
}

/**
 * 스토어 기반 마우스 이벤트 컨트롤러
 */
export class StoreBasedMouseController {
  private storeManager: MouseStoreManager;
  private config: Required<StoreBasedMouseControllerConfig>;
  
  private moveEndTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: StoreBasedMouseControllerConfig = {}) {
    // 스토어 컬렉션 생성 및 매니저 초기화
    const stores = createMouseStoreCollection();
    this.storeManager = new MouseStoreManager(stores);
    
    this.config = {
      throttleMs: 16, // ~60fps
      maxPathPoints: 20,
      maxClickHistory: 10,
      moveEndDelayMs: 100,
      ...config,
    };
  }

  /**
   * 컨트롤러 초기화
   */
  initialize(options?: { renderElements?: any; statusElements?: any }): void {
    this.isInitialized = true;
    console.log('🏪 StoreBasedMouseController initialized with reactive stores', options);
  }

  /**
   * 마우스 이동 이벤트 처리
   */
  handleMouseMove(position: MousePosition): void {
    if (!this.isInitialized) return;

    // 이동 상태 업데이트
    this.storeManager.updatePosition(position);
    this.storeManager.addPathPoint(position);
    this.storeManager.setMoving(true);

    // 스로틀링된 moveEnd 감지
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
    }

    this.moveEndTimeout = setTimeout(() => {
      this.storeManager.setMoving(false);
      this.moveEndTimeout = null;
    }, this.config.moveEndDelayMs);
  }

  /**
   * 마우스 클릭 이벤트 처리
   */
  handleMouseClick(position: MousePosition, button: number = 0): void {
    if (!this.isInitialized) return;

    const timestamp = Date.now();
    this.storeManager.addClick({
      ...position,
      button,
      timestamp,
    });
  }

  /**
   * 마우스 진입 이벤트 처리
   */
  handleMouseEnter(): void {
    if (!this.isInitialized) return;
    this.storeManager.setInsideArea(true);
  }

  /**
   * 마우스 이탈 이벤트 처리
   */
  handleMouseLeave(): void {
    if (!this.isInitialized) return;
    this.storeManager.setInsideArea(false);
    this.storeManager.setMoving(false);
  }

  /**
   * 마우스 이동 이벤트 처리 (컨테이너 호환)
   */
  handleMove(position: MousePosition, timestamp: number): void {
    this.handleMouseMove(position);
  }

  /**
   * 마우스 클릭 이벤트 처리 (컨테이너 호환)
   */
  handleClick(position: MousePosition, button: number, timestamp: number): void {
    this.handleMouseClick(position, button);
  }

  /**
   * 마우스 진입 이벤트 처리 (컨테이너 호환)
   */
  handleEnter(position: MousePosition, timestamp: number): void {
    this.handleMouseEnter();
  }

  /**
   * 마우스 이탈 이벤트 처리 (컨테이너 호환)
   */
  handleLeave(position: MousePosition, timestamp: number): void {
    this.handleMouseLeave();
  }

  /**
   * 리셋 이벤트 처리 (컨테이너 호환)
   */
  handleReset(): void {
    this.reset();
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    if (!this.isInitialized) return;

    // 스토어 상태 초기화
    this.storeManager.reset();
    
    // 타이머 정리
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
      this.moveEndTimeout = null;
    }

    console.log('🏪 StoreBasedMouseController reset');
  }

  /**
   * 스토어 컬렉션 반환 (React 컴포넌트에서 구독용)
   */
  getStores() {
    return this.storeManager.stores;
  }

  /**
   * 스토어 매니저 반환 (React 컴포넌트에서 구독용)
   */
  getStoreManager(): MouseStoreManager {
    return this.storeManager;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.reset();
    this.isInitialized = false;
  }
}