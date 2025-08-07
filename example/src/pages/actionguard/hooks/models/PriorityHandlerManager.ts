import { ActionRegister, UnregisterFunction } from '@context-action/core';
import { HandlerConfig } from '../usePriorityActionHandlers';

/**
 * Model Layer: 핸들러 등록/해제 비즈니스 로직
 * 순수한 비즈니스 로직만 담당, React 의존성 없음
 */
export class PriorityHandlerManager {
  private unregisterFunctions = new Map<string, UnregisterFunction>();
  private actionRegister: ActionRegister<any> | null = null;

  constructor(actionRegister?: ActionRegister<any>) {
    this.actionRegister = actionRegister || null;
  }

  /**
   * ActionRegister 설정
   */
  setActionRegister(actionRegister: ActionRegister<any>) {
    this.actionRegister = actionRegister;
  }

  /**
   * 핸들러 등록
   */
  registerHandlers(
    configs: HandlerConfig[],
    handlerFactory: (config: HandlerConfig, handlerId: string) => any
  ): string[] {
    if (!this.actionRegister) {
      throw new Error('ActionRegister가 설정되지 않았습니다.');
    }

    const registeredIds: string[] = [];
    const registeredPriorities = new Set<number>();

    configs.forEach((config) => {
      // 중복 우선순위 스킵
      if (registeredPriorities.has(config.priority)) {
        return;
      }
      registeredPriorities.add(config.priority);

      const handlerId = `priority-${config.priority}`;
      
      // 이미 등록된 핸들러 스킵
      if (this.unregisterFunctions.has(handlerId)) {
        return;
      }

      // 핸들러 함수 생성
      const handlerFunction = handlerFactory(config, handlerId);

      // 핸들러 등록
      const unregister = this.actionRegister.register('priorityTest', handlerFunction, {
        id: handlerId,
        priority: config.priority,
        blocking: true
      });

      // unregister 함수 저장
      this.unregisterFunctions.set(handlerId, unregister);
      registeredIds.push(handlerId);
    });

    return registeredIds;
  }

  /**
   * 단일 핸들러 등록 (unregister 함수 저장용)
   */
  registerSingleHandler(handlerId: string, unregisterFunction: UnregisterFunction): void {
    this.unregisterFunctions.set(handlerId, unregisterFunction);
  }

  /**
   * 특정 핸들러 해제
   */
  unregisterHandler(handlerId: string): boolean {
    const unregister = this.unregisterFunctions.get(handlerId);
    if (unregister) {
      unregister();
      this.unregisterFunctions.delete(handlerId);
      return true;
    }
    return false;
  }

  /**
   * 모든 핸들러 해제
   */
  unregisterAllHandlers(): string[] {
    const unregisteredIds: string[] = [];
    
    this.unregisterFunctions.forEach((unregister, handlerId) => {
      unregister();
      unregisteredIds.push(handlerId);
    });
    
    this.unregisterFunctions.clear();
    return unregisteredIds;
  }

  /**
   * 등록된 핸들러 ID 목록 조회
   */
  getRegisteredHandlerIds(): string[] {
    return Array.from(this.unregisterFunctions.keys());
  }

  /**
   * 핸들러 등록 여부 확인
   */
  isHandlerRegistered(handlerId: string): boolean {
    return this.unregisterFunctions.has(handlerId);
  }

  /**
   * 등록된 핸들러 개수
   */
  getRegisteredCount(): number {
    return this.unregisterFunctions.size;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    this.unregisterAllHandlers();
    this.actionRegister = null;
  }
}