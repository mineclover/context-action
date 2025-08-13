/**
 * @fileoverview Mouse Path Service - 순수한 Path 저장 로직
 *
 * 마우스 경로 데이터 관리를 담당하는 서비스
 */

export interface MousePosition {
  x: number;
  y: number;
}

export interface ClickHistory {
  x: number;
  y: number;
  timestamp: number;
}

export interface MousePathData {
  currentPosition: MousePosition;
  previousPosition: MousePosition;
  movePath: MousePosition[];
  clickHistory: ClickHistory[];
  velocity: number;
  moveCount: number;
  clickCount: number;
  isMoving: boolean;
  isInsideArea: boolean;
  lastMoveTime: number | null;
}

/**
 * 마우스 경로 관리 서비스
 */
export class MousePathService {
  private data: MousePathData = {
    currentPosition: { x: -999, y: -999 },
    previousPosition: { x: -999, y: -999 },
    movePath: [],
    clickHistory: [],
    velocity: 0,
    moveCount: 0,
    clickCount: 0,
    isMoving: false,
    isInsideArea: false,
    lastMoveTime: null,
  };

  private maxPathLength = 20;
  private maxClickHistory = 10;

  /**
   * 현재 데이터 조회
   */
  getData(): MousePathData {
    return { ...this.data };
  }

  /**
   * 마우스 위치 업데이트
   */
  updatePosition(position: MousePosition, timestamp: number): MousePathData {
    const timeDiff = this.data.lastMoveTime
      ? timestamp - this.data.lastMoveTime
      : 0;
    const deltaX = position.x - this.data.currentPosition.x;
    const deltaY = position.y - this.data.currentPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 속도 계산 (px/ms)
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;

    this.data = {
      ...this.data,
      previousPosition: this.data.currentPosition,
      currentPosition: position,
      velocity,
      moveCount: this.data.moveCount + 1,
      lastMoveTime: timestamp,
      movePath: [
        position,
        ...this.data.movePath.slice(0, this.maxPathLength - 1),
      ],
    };

    return this.getData();
  }

  /**
   * 클릭 추가
   */
  addClick(position: MousePosition, timestamp: number): MousePathData {
    const click: ClickHistory = {
      x: position.x,
      y: position.y,
      timestamp,
    };

    this.data = {
      ...this.data,
      clickCount: this.data.clickCount + 1,
      clickHistory: [
        click,
        ...this.data.clickHistory.slice(0, this.maxClickHistory - 1),
      ],
    };

    return this.getData();
  }

  /**
   * 이동 상태 변경
   */
  setMoving(isMoving: boolean): MousePathData {
    this.data = {
      ...this.data,
      isMoving,
      velocity: isMoving ? this.data.velocity : 0,
    };

    return this.getData();
  }

  /**
   * 영역 진입/이탈 상태 변경
   */
  setInsideArea(isInside: boolean, position?: MousePosition): MousePathData {
    this.data = {
      ...this.data,
      isInsideArea: isInside,
      ...(position && { currentPosition: position }),
    };

    return this.getData();
  }

  /**
   * 전체 데이터 리셋
   */
  reset(keepPosition = false): MousePathData {
    const resetData: MousePathData = {
      currentPosition: keepPosition
        ? this.data.currentPosition
        : { x: -999, y: -999 },
      previousPosition: keepPosition
        ? this.data.currentPosition
        : { x: -999, y: -999 },
      movePath: [],
      clickHistory: [],
      velocity: 0,
      moveCount: 0,
      clickCount: 0,
      isMoving: false,
      isInsideArea: false,
      lastMoveTime: null,
    };

    this.data = resetData;
    return this.getData();
  }

  /**
   * 유효한 경로 포인트만 필터링
   */
  getValidPath(): MousePosition[] {
    return this.data.movePath.filter(
      (point) =>
        point.x >= 0 && point.y >= 0 && point.x !== -999 && point.y !== -999
    );
  }

  /**
   * 유효한 클릭 히스토리만 필터링
   */
  getValidClicks(): ClickHistory[] {
    return this.data.clickHistory.filter(
      (click) =>
        click.x >= 0 && click.y >= 0 && click.x !== -999 && click.y !== -999
    );
  }
}
