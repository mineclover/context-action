/**
 * Domain Events System
 * 
 * 도메인 이벤트 시스템으로 도메인 간 결합도를 낮추고
 * 비즈니스 규칙을 명시적으로 표현
 */

/**
 * 기본 도메인 이벤트 추상 클래스
 */
export abstract class DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;
  readonly eventVersion: number;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
    this.eventVersion = 1;
  }

  /**
   * 이벤트 이름 반환 (구현체에서 정의)
   */
  abstract getEventName(): string;

  /**
   * 이벤트 데이터 반환 (구현체에서 정의)
   */
  abstract getData(): Record<string, unknown>;

  /**
   * 이벤트 고유 ID 생성
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 이벤트를 JSON으로 직렬화
   */
  toJSON(): {
    eventName: string;
    eventId: string;
    occurredOn: string;
    eventVersion: number;
    data: Record<string, unknown>;
  } {
    return {
      eventName: this.getEventName(),
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
      data: this.getData()
    };
  }

  /**
   * 이벤트 타입 확인
   */
  isOfType(eventName: string): boolean {
    return this.getEventName() === eventName;
  }
}

/**
 * 도메인 이벤트 발행을 위한 인터페이스
 */
export interface IDomainEventPublisher {
  /**
   * 단일 이벤트 발행
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * 여러 이벤트 일괄 발행
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * 이벤트 스트림 구독
   */
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;

  /**
   * 구독 해제
   */
  unsubscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;
}

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * 핸들러가 처리할 수 있는 이벤트 타입
   */
  getEventName(): string;

  /**
   * 이벤트 처리
   */
  handle(event: T): Promise<void>;

  /**
   * 에러 처리
   */
  onError(event: T, error: Error): Promise<void>;
}

/**
 * 이벤트 저장소 인터페이스 (Event Sourcing용)
 */
export interface IDomainEventStore {
  /**
   * 이벤트 저장
   */
  save(event: DomainEvent): Promise<void>;

  /**
   * 특정 애그리게이트의 이벤트 조회
   */
  getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]>;

  /**
   * 특정 시간 이후 이벤트 조회
   */
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;

  /**
   * 특정 타입의 이벤트 조회
   */
  getEventsByType(eventName: string): Promise<DomainEvent[]>;
}

/**
 * 이벤트 메타데이터
 */
export interface EventMetadata {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly source?: string;
  readonly tags?: string[];
}

/**
 * 메타데이터를 포함한 확장 도메인 이벤트
 */
export abstract class DomainEventWithMetadata extends DomainEvent {
  readonly metadata: EventMetadata;

  constructor(metadata: EventMetadata = {}) {
    super();
    this.metadata = metadata;
  }

  /**
   * 메타데이터 포함 JSON 직렬화
   */
  toJSON(): {
    eventName: string;
    eventId: string;
    occurredOn: string;
    eventVersion: number;
    data: Record<string, unknown>;
    metadata: EventMetadata;
  } {
    return {
      ...super.toJSON(),
      metadata: this.metadata
    };
  }
}

/**
 * 이벤트 발행 결과
 */
export interface PublishResult {
  success: boolean;
  eventId: string;
  error?: Error;
  handledBy: string[];
  failedHandlers: string[];
}

/**
 * 일괄 이벤트 발행 결과
 */
export interface BatchPublishResult {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  results: PublishResult[];
}