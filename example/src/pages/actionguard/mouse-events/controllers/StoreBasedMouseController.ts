/**
 * @fileoverview Store-Based Mouse Controller - 스토어 기반 컨트롤러
 * 
 * MouseStoreManager를 사용하여 리액티브한 마우스 이벤트 처리를 담당
 */

import type { MousePosition } from '../stores/MouseStoreDefinitions';
import { MouseStoreManager } from '../stores/MouseStoreManager';
import { MouseRenderService } from '../services/MouseRenderService';
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
  private renderService: MouseRenderService;
  private config: Required<StoreBasedMouseControllerConfig>;
  
  private moveEndTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: StoreBasedMouseControllerConfig = {}) {
    // 스토어 컬렉션 생성 및 매니저 초기화
    const stores = createMouseStoreCollection();
    this.storeManager = new MouseStoreManager(stores);
    this.renderService = new MouseRenderService();
    
    this.config = {
      throttleMs: 16, // ~60fps
      maxPathPoints: 20,
      maxClickHistory: 10,
      moveEndDelayMs: 100,
      ...config,
    };

    // 스토어 변경 감지 및 렌더링 동기화 설정
    this.setupStoreSubscriptions();
  }

  /**
   * 스토어 구독 설정 - 상태 변경시 자동 렌더링
   */
  private setupStoreSubscriptions(): void {
    const stores = this.storeManager.getStores();

    // 위치 상태 변경 구독
    stores.position.subscribe(() => {
      if (!this.isInitialized) return;
      
      const positionState = stores.position.getValue();
      this.renderService.renderCursorPosition(positionState.current);
      // StatusPanel은 React가 관리하므로 제거
    });

    // 경로 상태 변경 구독  
    stores.path.subscribe(() => {
      if (!this.isInitialized) return;
      
      const pathState = stores.path.getValue();
      this.renderService.renderPath(pathState.validPath);
    });

    // 메트릭 상태 변경 구독 - renderStatus 제거 (React가 관리)
    stores.metrics.subscribe(() => {
      if (!this.isInitialized) return;
      // React 컴포넌트가 자동으로 업데이트하므로 별도 렌더링 불필요
    });

    // 클릭 상태 변경 구독
    stores.clicks.subscribe(() => {
      if (!this.isInitialized) return;
      
      const clicksState = stores.clicks.getValue();
      if (clicksState.lastClick) {
        this.renderService.renderClickAnimation(clicksState.lastClick);
      }
    });

    // 계산된 상태 변경 구독 (선택적 - 디버깅용)
    stores.computed.subscribe(() => {
      if (!this.isInitialized) return;
      
      const computedState = stores.computed.getValue();
      console.log('💫 Computed state updated:', computedState.activityStatus);
    });
  }

  /**
   * 컨트롤러 초기화
   */
  initialize(elements: {
    renderElements: Parameters<MouseRenderService['setElements']>[0];
    statusElements: Parameters<MouseRenderService['setStatusElements']>[0];
  }): void {
    this.renderService.setElements(elements.renderElements);
    this.renderService.setStatusElements(elements.statusElements);
    this.isInitialized = true;
    
    console.log('🏪 StoreBasedMouseController initialized with reactive stores');
  }

  /**
   * 마우스 이동 처리
   */
  handleMove(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 StoreBasedMouseController: Blocked 0,0 position in handleMove');
      return;
    }

    // 스토어에서 현재 상태 조회
    const currentMetrics = this.storeManager.getStores().metrics.getValue();
    
    // 첫 번째 이동이면 이동 시작 처리
    if (!currentMetrics.isMoving && currentMetrics.moveCount === 0) {
      this.handleMoveStart(position, timestamp);
    }

    // 스토어 매니저를 통해 상태 업데이트 (자동으로 렌더링 트리거됨)
    this.storeManager.updatePosition(position, timestamp);

    // 이동 종료 감지 타이머 설정
    this.scheduleMovEnd(position, timestamp);
  }

  /**
   * 마우스 클릭 처리
   */
  handleClick(position: MousePosition, button: number, timestamp: number): void {
    if (!this.isInitialized) return;

    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 StoreBasedMouseController: Blocked 0,0 position in handleClick');
      return;
    }

    // 스토어 매니저를 통해 클릭 추가 (자동으로 렌더링 트리거됨)
    this.storeManager.addClick(position, timestamp);
  }

  /**
   * 마우스 영역 진입 처리
   */
  handleEnter(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    // 스토어 상태 업데이트
    this.storeManager.setInsideArea(true, position);
    
    // 렌더링 가시성 설정
    this.renderService.setVisibility(true);
  }

  /**
   * 마우스 영역 이탈 처리
   */
  handleLeave(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    // 스토어 상태 업데이트
    this.storeManager.setInsideArea(false);
    this.storeManager.setMoving(false);
    
    // 렌더링 가시성 설정
    this.renderService.setVisibility(false);
  }

  /**
   * 마우스 이동 시작 처리
   */
  private handleMoveStart(position: MousePosition, timestamp: number): void {
    this.storeManager.setMoving(true);
  }

  /**
   * 마우스 이동 종료 처리
   */
  private handleMoveEnd(position: MousePosition, timestamp: number): void {
    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 StoreBasedMouseController: Blocked 0,0 position in handleMoveEnd');
      return;
    }

    this.storeManager.setMoving(false);
  }

  /**
   * 이동 종료 스케줄링
   */
  private scheduleMovEnd(position: MousePosition, timestamp: number): void {
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
    }
    
    this.moveEndTimeout = setTimeout(() => {
      this.handleMoveEnd(position, timestamp);
    }, this.config.moveEndDelayMs);
  }

  /**
   * 전체 리셋 처리
   */
  handleReset(): void {
    if (!this.isInitialized) return;

    // 스토어 매니저 리셋
    this.storeManager.reset();
    
    // 렌더링 리셋
    this.renderService.reset();
    
    // 타이머 정리
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
      this.moveEndTimeout = null;
    }

    console.log('🔄 StoreBasedMouseController reset completed');
  }

  // ================================
  // 📊 조회 메서드들
  // ================================

  /**
   * 현재 위치 조회
   */
  getCurrentPosition(): MousePosition {
    return this.storeManager.getCurrentPosition();
  }

  /**
   * 유효한 경로 조회
   */
  getValidPath(): MousePosition[] {
    return this.storeManager.getValidPath();
  }

  /**
   * 현재 메트릭 조회
   */
  getCurrentMetrics() {
    return this.storeManager.getCurrentMetrics();
  }

  /**
   * 스토어 컬렉션 조회 (외부 접근용)
   */
  getStores() {
    return this.storeManager.getStores();
  }

  /**
   * 스토어 매니저 조회
   */
  getStoreManager(): MouseStoreManager {
    return this.storeManager;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
      this.moveEndTimeout = null;
    }
    
    this.storeManager.dispose();
  }
}