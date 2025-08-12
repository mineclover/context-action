/**
 * @fileoverview Mouse Render Service - 순수한 렌더링 로직
 * 
 * DOM 직접 조작을 통한 렌더링만 담당
 */

import type { MousePosition, ClickHistory } from './MousePathService';

export interface RenderElements {
  cursor?: HTMLDivElement | null;
  trail?: HTMLDivElement | null;
  pathSvg?: SVGPathElement | null;
  clickContainer?: HTMLDivElement | null;
}

export interface StatusElements {
  position?: HTMLSpanElement | null;
  moves?: HTMLSpanElement | null;
  clicks?: HTMLSpanElement | null;
  velocity?: HTMLSpanElement | null;
  status?: HTMLSpanElement | null;
  inside?: HTMLSpanElement | null;
  lastActivity?: HTMLSpanElement | null;
}

/**
 * 마우스 렌더링 서비스
 */
export class MouseRenderService {
  private elements: RenderElements = {};
  private statusElements: StatusElements = {};
  private clickCounter = 0;

  /**
   * 렌더링 요소들 등록
   */
  setElements(elements: RenderElements): void {
    this.elements = { ...elements };
  }

  /**
   * 상태 표시 요소들 등록
   */
  setStatusElements(statusElements: StatusElements): void {
    this.statusElements = { ...statusElements };
  }

  /**
   * 커서 위치 렌더링
   */
  renderCursorPosition(position: MousePosition): void {
    if (!this.elements.cursor || !this.elements.trail) return;

    // 유효하지 않은 위치 필터링
    if (position.x === -999 || position.y === -999) return;
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 MouseRenderService: Blocked 0,0 position rendering');
      return;
    }

    const cursor = this.elements.cursor;
    const trail = this.elements.trail;

    // 직접 CSS transform으로 최고 성능
    requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`;
      trail.style.transform = `translate3d(${position.x - 12}px, ${position.y - 12}px, 0)`;
    });
  }

  /**
   * 경로 렌더링
   */
  renderPath(path: MousePosition[]): void {
    if (!this.elements.pathSvg) return;

    if (path.length < 2) {
      this.elements.pathSvg.setAttribute('d', '');
      return;
    }

    const visiblePath = path.slice(0, 10);
    const pathData = `M ${visiblePath.map(point => `${point.x} ${point.y}`).join(' L ')}`;
    this.elements.pathSvg.setAttribute('d', pathData);
  }

  /**
   * 클릭 애니메이션 렌더링
   */
  renderClickAnimation(click: ClickHistory): void {
    if (!this.elements.clickContainer) return;
    if (click.x === -999 || click.y === -999 || (click.x === 0 && click.y === 0)) return;

    const clickId = `click-${this.clickCounter++}`;
    
    // 클릭 요소 생성
    const clickElement = document.createElement('div');
    clickElement.id = clickId;
    clickElement.className = 'absolute pointer-events-none';
    clickElement.style.cssText = `
      left: ${click.x - 15}px;
      top: ${click.y - 15}px;
      width: 30px;
      height: 30px;
    `;

    clickElement.innerHTML = `
      <div class="relative w-full h-full">
        <div class="absolute inset-0 rounded-full border-2 border-yellow-400"
             style="background: radial-gradient(circle, rgba(250, 204, 21, 0.8) 0%, transparent 70%);
                    box-shadow: 0 0 10px rgba(250, 204, 21, 0.8);
                    will-change: transform, opacity;
                    backface-visibility: hidden;"></div>
        <div class="absolute inset-2 bg-yellow-400 rounded-full flex items-center justify-center"
             style="opacity: 1; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
          <span class="text-xs font-bold text-yellow-900">1</span>
        </div>
      </div>
    `;

    this.elements.clickContainer.appendChild(clickElement);

    // 간단한 CSS 애니메이션
    clickElement.style.transform = 'scale(0)';
    clickElement.style.opacity = '0';
    
    requestAnimationFrame(() => {
      clickElement.style.transition = 'all 0.6s ease-out';
      clickElement.style.transform = 'scale(1.2)';
      clickElement.style.opacity = '1';
      
      setTimeout(() => {
        clickElement.style.transform = 'scale(0)';
        clickElement.style.opacity = '0';
        
        setTimeout(() => {
          if (clickElement.parentNode) {
            clickElement.parentNode.removeChild(clickElement);
          }
        }, 200);
      }, 400);
    });
  }

  /**
   * 상태 정보 렌더링
   */
  renderStatus(data: {
    position?: MousePosition;
    moveCount?: number;
    clickCount?: number;
    velocity?: number;
    isMoving?: boolean;
    isInside?: boolean;
    lastActivity?: number | null;
    activityStatus?: 'idle' | 'moving' | 'clicking';
  }): void {
    if (data.position && this.statusElements.position) {
      this.statusElements.position.textContent = `(${data.position.x}, ${data.position.y})`;
    }

    if (data.moveCount !== undefined && this.statusElements.moves) {
      this.statusElements.moves.textContent = data.moveCount.toString();
    }

    if (data.clickCount !== undefined && this.statusElements.clicks) {
      this.statusElements.clicks.textContent = data.clickCount.toString();
    }

    if (data.velocity !== undefined && this.statusElements.velocity) {
      this.statusElements.velocity.textContent = `${data.velocity.toFixed(2)} px/ms`;
    }

    // activityStatus가 있으면 우선 사용, 없으면 isMoving 사용
    if (data.activityStatus !== undefined && this.statusElements.status) {
      const statusText = data.activityStatus === 'moving' ? '🔄 Moving' : 
                        data.activityStatus === 'clicking' ? '👆 Clicking' : '⏸️ Idle';
      const statusColor = data.activityStatus === 'moving' ? 'text-blue-600' : 
                         data.activityStatus === 'clicking' ? 'text-purple-600' : 'text-gray-400';
      
      this.statusElements.status.textContent = statusText;
      this.statusElements.status.className = `font-mono ${statusColor}`;
    } else if (data.isMoving !== undefined && this.statusElements.status) {
      this.statusElements.status.textContent = data.isMoving ? '🔄 Moving' : '⏸️ Idle';
      this.statusElements.status.className = `font-mono ${data.isMoving ? 'text-blue-600' : 'text-gray-400'}`;
    }

    if (data.isInside !== undefined && this.statusElements.inside) {
      this.statusElements.inside.textContent = data.isInside ? '✓ Yes' : '✗ No';
      this.statusElements.inside.className = `font-mono ${data.isInside ? 'text-green-600' : 'text-orange-600'}`;
    }

    if (data.lastActivity !== undefined && this.statusElements.lastActivity) {
      if (data.lastActivity) {
        this.statusElements.lastActivity.textContent = `Last activity: ${new Date(data.lastActivity).toLocaleTimeString()}`;
        this.statusElements.lastActivity.style.display = '';
      } else {
        this.statusElements.lastActivity.style.display = 'none';
      }
    }
  }

  /**
   * 가시성 토글
   */
  setVisibility(isVisible: boolean): void {
    if (!this.elements.cursor || !this.elements.trail) return;

    const cursor = this.elements.cursor;
    const trail = this.elements.trail;

    if (isVisible) {
      cursor.style.opacity = '1';
      trail.style.opacity = '1';
      cursor.style.transform += ' scale(1)';
      trail.style.transform += ' scale(1)';
    } else {
      cursor.style.opacity = '0';
      trail.style.opacity = '0';
      cursor.style.transform += ' scale(0)';
      trail.style.transform += ' scale(0)';
    }
  }

  /**
   * 전체 렌더링 초기화
   */
  reset(): void {
    // 경로 초기화
    if (this.elements.pathSvg) {
      this.elements.pathSvg.setAttribute('d', '');
    }

    // 클릭 요소들 초기화
    if (this.elements.clickContainer) {
      this.elements.clickContainer.innerHTML = '';
    }

    // 상태 초기화
    this.renderStatus({
      position: { x: -999, y: -999 },
      moveCount: 0,
      clickCount: 0,
      velocity: 0,
      isMoving: false,
      isInside: false,
      lastActivity: null
    });

    // 가시성 숨김
    this.setVisibility(false);
  }
}