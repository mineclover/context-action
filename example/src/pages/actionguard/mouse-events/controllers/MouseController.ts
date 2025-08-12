/**
 * @fileoverview Mouse Controller - 비즈니스 로직 컨트롤러
 * 
 * Path Service와 Render Service를 조합하여 마우스 이벤트 비즈니스 로직 처리
 */

import { MousePathService, type MousePosition, type ClickHistory } from '../services/MousePathService';
import { MouseRenderService } from '../services/MouseRenderService';
import { MOUSE_ACTIONS, type MouseActions } from '../types/MouseActions';

export interface MouseControllerConfig {
  throttleMs?: number;
  maxPathPoints?: number;
  maxClickHistory?: number;
  moveEndDelayMs?: number;
}

/**
 * 마우스 이벤트 컨트롤러
 */
export class MouseController {
  private pathService: MousePathService;
  private renderService: MouseRenderService;
  private config: Required<MouseControllerConfig>;
  
  private moveEndTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: MouseControllerConfig = {}) {
    this.pathService = new MousePathService();
    this.renderService = new MouseRenderService();
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
  initialize(elements: {
    renderElements: Parameters<MouseRenderService['setElements']>[0];
    statusElements: Parameters<MouseRenderService['setStatusElements']>[0];
  }): void {
    this.renderService.setElements(elements.renderElements);
    this.renderService.setStatusElements(elements.statusElements);
    this.isInitialized = true;
  }

  /**
   * 마우스 이동 처리
   */
  handleMove(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 MouseController: Blocked 0,0 position in handleMove');
      return;
    }

    // Path 데이터 업데이트
    const pathData = this.pathService.updatePosition(position, timestamp);
    
    // 첫 번째 이동이면 이동 시작 처리
    if (!pathData.isMoving && pathData.moveCount === 1) {
      this.handleMoveStart(position, timestamp);
    }

    // 렌더링
    this.renderService.renderCursorPosition(pathData.currentPosition);
    this.renderService.renderPath(this.pathService.getValidPath());
    this.renderService.renderStatus({
      position: pathData.currentPosition,
      moveCount: pathData.moveCount,
      velocity: pathData.velocity,
    });

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
      console.warn('🔴 MouseController: Blocked 0,0 position in handleClick');
      return;
    }

    // Path 데이터 업데이트
    const pathData = this.pathService.addClick(position, timestamp);
    
    // 렌더링
    this.renderService.renderClickAnimation(pathData.clickHistory[0]);
    this.renderService.renderStatus({
      clickCount: pathData.clickCount,
    });
  }

  /**
   * 마우스 영역 진입 처리
   */
  handleEnter(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    const pathData = this.pathService.setInsideArea(true, position);
    
    // 렌더링
    this.renderService.setVisibility(true);
    this.renderService.renderCursorPosition(pathData.currentPosition);
    this.renderService.renderStatus({
      position: pathData.currentPosition,
      isInside: true,
    });
  }

  /**
   * 마우스 영역 이탈 처리
   */
  handleLeave(position: MousePosition, timestamp: number): void {
    if (!this.isInitialized) return;

    const pathData = this.pathService.setInsideArea(false);
    
    // 렌더링
    this.renderService.setVisibility(false);
    this.renderService.renderStatus({
      isInside: false,
      isMoving: false,
      velocity: 0,
    });

    // 이동 상태 종료
    this.pathService.setMoving(false);
  }

  /**
   * 마우스 이동 시작 처리
   */
  private handleMoveStart(position: MousePosition, timestamp: number): void {
    const pathData = this.pathService.setMoving(true);
    
    this.renderService.renderStatus({
      isMoving: true,
      lastActivity: timestamp,
    });
  }

  /**
   * 마우스 이동 종료 처리
   */
  private handleMoveEnd(position: MousePosition, timestamp: number): void {
    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 MouseController: Blocked 0,0 position in handleMoveEnd');
      return;
    }

    const pathData = this.pathService.setMoving(false);
    
    this.renderService.renderStatus({
      isMoving: false,
      velocity: 0,
    });
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

    // Path 데이터 리셋
    this.pathService.reset();
    
    // 렌더링 리셋
    this.renderService.reset();
    
    // 타이머 정리
    if (this.moveEndTimeout) {
      clearTimeout(this.moveEndTimeout);
      this.moveEndTimeout = null;
    }
  }

  /**
   * 현재 상태 조회
   */
  getCurrentData() {
    return this.pathService.getData();
  }

  /**
   * 서비스 인스턴스 접근 (필요시)
   */
  get services() {
    return {
      path: this.pathService,
      render: this.renderService,
    };
  }
}