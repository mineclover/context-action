import type { EventHandler, IEventBus, Unsubscribe } from './types';

/**
 * EventBus 클래스 - Store 간 비동기 통신
 * 
 * 핵심 기능:
 * 1. 이벤트 발행/구독 (publish-subscribe 패턴)
 * 2. 이벤트 히스토리 관리
 * 3. 스코프드 이벤트 버스 생성
 * 4. 에러 처리 및 정리
 * 
 * 사용 시나리오:
 * - Store 간 비동기 통신
 * - 전역 이벤트 관리
 * - 도메인별 이벤트 분리
 */
export class EventBus implements IEventBus {
  private events = new Map<string, Set<EventHandler>>();
  private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * 이벤트 구독
   * 핵심 기능: 특정 이벤트에 핸들러 등록 및 구독 해제 함수 반환
   */
  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const handlers = this.events.get(event)!;
    handlers.add(handler as EventHandler);
    
    return () => {
      handlers.delete(handler as EventHandler);
      
      // Clean up empty handler sets
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    };
  }

  /**
   * 일회성 이벤트 구독
   * 핵심 기능: 이벤트 한 번 발생 시 자동 구독 해제
   */
  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    const wrappedHandler = (data: T) => {
      handler(data);
      unsubscribe();
    };
    
    const unsubscribe = this.on(event, wrappedHandler);
    return unsubscribe;
  }

  /**
   * 이벤트 발행
   * 핵심 기능: 등록된 모든 핸들러에게 이벤트 전달 및 히스토리 기록
   */
  emit<T = any>(event: string, data?: T): void {
    // Add to history
    this._addToHistory(event, data);
    
    const handlers = this.events.get(event);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove event handler(s)
   */
  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // Remove all handlers for this event
      this.events.delete(event);
    } else {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.delete(handler);
        
        if (handlers.size === 0) {
          this.events.delete(event);
        }
      }
    }
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get all event names
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get handler count for an event
   */
  getHandlerCount(event: string): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get total handler count
   */
  getTotalHandlerCount(): number {
    let total = 0;
    this.events.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }

  /**
   * Get event history
   */
  getHistory(): ReadonlyArray<{ event: string; data: any; timestamp: number }> {
    return this.eventHistory;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Create a scoped event emitter
   */
  scope(prefix: string): ScopedEventBus {
    return new ScopedEventBus(this, prefix);
  }

  private _addToHistory(event: string, data: any): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

/**
 * 스코프드 EventBus 클래스
 * 핵심 기능: 모든 이벤트에 접두사 추가하여 도메인별 이벤트 분리
 * 
 * 사용 예시: 'user:login', 'cart:addItem' 등으로 도메인별 이벤트 관리
 */
export class ScopedEventBus implements IEventBus {
  constructor(
    private parent: EventBus,
    private prefix: string
  ) {}

  on<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    return this.parent.on(this._scopedEvent(event), handler);
  }

  emit<T = any>(event: string, data?: T): void {
    this.parent.emit(this._scopedEvent(event), data);
  }

  off(event: string, handler?: EventHandler): void {
    this.parent.off(this._scopedEvent(event), handler);
  }

  clear(): void {
    // Clear only scoped events
    this.parent.getEventNames()
      .filter(name => name.startsWith(this.prefix + ':'))
      .forEach(name => this.parent.off(name));
  }

  private _scopedEvent(event: string): string {
    return `${this.prefix}:${event}`;
  }
}
