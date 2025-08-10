/**
 * @fileoverview LogMonitor 스토어 레지스트리
 * @module LogMonitorStoreRegistry
 */

import { LogLevel } from '@context-action/logger';
import { createStore } from '@context-action/react';
import type { LogEntry, LogMonitorConfig, LogMonitorStores } from './types';

/**
 * 기본 로그 모니터 설정
 */
const DEFAULT_CONFIG: LogMonitorConfig = {
  maxLogs: 50,
  defaultLogLevel: LogLevel.DEBUG,
  enableToast: true,
  enableAutoCleanup: true,
};

/**
 * 페이지별 독립적인 스토어 관리를 위한 레지스트리 클래스
 *
 * 싱글톤 패턴을 사용하여 전역에서 하나의 인스턴스만 존재하도록 보장하며,
 * 각 페이지별로 독립적인 로그 스토어를 관리합니다.
 */
export class LogMonitorStoreRegistry {
  private static instance: LogMonitorStoreRegistry;
  private storeMap = new Map<string, LogMonitorStores>();

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): LogMonitorStoreRegistry {
    if (!LogMonitorStoreRegistry.instance) {
      LogMonitorStoreRegistry.instance = new LogMonitorStoreRegistry();
    }
    return LogMonitorStoreRegistry.instance;
  }

  /**
   * 페이지 ID에 따른 스토어 세트 반환
   *
   * @param pageId - 페이지 식별자
   * @param initialLogLevel - 초기 로그 레벨
   * @param initialConfig - 초기 설정 (기본값과 병합됨)
   * @returns 해당 페이지의 스토어 세트
   */
  getStores(
    pageId: string,
    initialLogLevel: LogLevel = LogLevel.DEBUG,
    initialConfig: Partial<LogMonitorConfig> = {}
  ): LogMonitorStores {
    if (!this.storeMap.has(pageId)) {
      const config = { ...DEFAULT_CONFIG, ...initialConfig };

      const stores: LogMonitorStores = {
        logs: createStore(`logs-${pageId}`, [] as LogEntry[]),
        logLevel: createStore(`logLevel-${pageId}`, initialLogLevel),
        config: createStore(`config-${pageId}`, config),
      };

      this.storeMap.set(pageId, stores);
    }
    return this.storeMap.get(pageId)!;
  }

  /**
   * 특정 페이지의 스토어 정리
   *
   * @param pageId - 정리할 페이지 ID
   */
  clearStores(pageId: string): void {
    this.storeMap.delete(pageId);
  }

  /**
   * 모든 페이지 스토어 정리 (앱 종료 시 사용)
   */
  clearAllStores(): void {
    this.storeMap.clear();
  }

  /**
   * 등록된 모든 페이지 ID 목록 반환
   */
  getAllPageIds(): string[] {
    return Array.from(this.storeMap.keys());
  }

  /**
   * 특정 페이지가 등록되어 있는지 확인
   */
  hasPage(pageId: string): boolean {
    return this.storeMap.has(pageId);
  }

  /**
   * 등록된 페이지 수 반환
   */
  getPageCount(): number {
    return this.storeMap.size;
  }

  /**
   * 모든 페이지의 총 로그 수 반환 (디버깅용)
   */
  getTotalLogCount(): number {
    let totalCount = 0;
    for (const stores of this.storeMap.values()) {
      totalCount += stores.logs.getValue().length;
    }
    return totalCount;
  }
}

/**
 * 전역 스토어 레지스트리 인스턴스 export
 */
export const logMonitorStoreRegistry = LogMonitorStoreRegistry.getInstance();
