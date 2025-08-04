/**
 * @fileoverview HMR Specialized Logging System
 * HMR 작업에 특화된 로깅 시스템 - 기존 Logger 시스템을 확장
 * 개발 환경에서 HMR 상태 변화를 상세히 추적하고 시각화
 */

import { LogArtHelpers } from '@context-action/logger';

/**
 * HMR 로그 카테고리
 */
export type HMRLogCategory = 
  | 'state-save'     // 상태 저장
  | 'state-restore'  // 상태 복원
  | 'handler-backup' // 핸들러 백업
  | 'handler-restore'// 핸들러 복원
  | 'module-reload'  // 모듈 리로드
  | 'error'          // 오류
  | 'system';        // 시스템

/**
 * HMR 로그 레벨
 */
export type HMRLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * HMR 로그 엔트리
 */
export interface HMRLogEntry {
  id: string;
  timestamp: Date;
  level: HMRLogLevel;
  category: HMRLogCategory;
  message: string;
  details?: any;
  context?: {
    storeName?: string;
    actionType?: string;
    handlerId?: string;
    executionTime?: number;
    module?: string;
  };
}

/**
 * HMR 로그 구독자
 */
export type HMRLogSubscriber = (entry: HMRLogEntry) => void;

/**
 * HMR 전용 로거 클래스
 * 기존 LogArtHelpers를 활용하면서 HMR에 특화된 기능 제공
 */
class HMRLogger {
  private static instance: HMRLogger | null = null;
  private subscribers: Set<HMRLogSubscriber> = new Set();
  private logHistory: HMRLogEntry[] = [];
  private maxHistorySize = 100;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development' &&
      ((import.meta as any).hot || (typeof module !== 'undefined' && (module as any)?.hot))
    );
  }

  static getInstance(): HMRLogger {
    if (!HMRLogger.instance) {
      HMRLogger.instance = new HMRLogger();
    }
    return HMRLogger.instance;
  }

  /**
   * 로그 구독
   */
  subscribe(subscriber: HMRLogSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * 로그 기록
   */
  private log(
    level: HMRLogLevel,
    category: HMRLogCategory,
    message: string,
    details?: any,
    context?: HMRLogEntry['context']
  ): void {
    if (!this.isEnabled) return;

    const entry: HMRLogEntry = {
      id: `hmr_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      context,
    };

    // 히스토리에 추가
    this.logHistory.unshift(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(0, this.maxHistorySize);
    }

    // 구독자들에게 알림
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(entry);
      } catch (error) {
        console.error('HMR Logger: Subscriber error:', error);
      }
    });

    // 콘솔에 로그 출력
    this.outputToConsole(entry);
  }

  /**
   * 콘솔 출력
   */
  private outputToConsole(entry: HMRLogEntry): void {
    const { level, category, message, details, context } = entry;

    // 카테고리별 아이콘
    const categoryIcons: Record<HMRLogCategory, string> = {
      'state-save': '💾',
      'state-restore': '🔄',
      'handler-backup': '📦',
      'handler-restore': '🚀',
      'module-reload': '🔥',
      'error': '❌',
      'system': '⚙️',
    };

    const icon = categoryIcons[category] || '🔍';
    const prefix = `${icon} [HMR:${category.toUpperCase()}]`;
    const fullMessage = `${prefix} ${message}`;

    // 레벨별 로그 출력
    switch (level) {
      case 'debug':
        console.debug(
          LogArtHelpers.store.debug(fullMessage),
          details ? `\n  Details:` : '',
          details ? details : '',
          context ? `\n  Context:` : '',
          context ? context : ''
        );
        break;
      case 'info':
        console.info(
          LogArtHelpers.store.info(fullMessage),
          details ? `\n  Details:` : '',
          details ? details : '',
          context ? `\n  Context:` : '',
          context ? context : ''
        );
        break;
      case 'warn':
        console.warn(
          LogArtHelpers.store.error('HMR 경고', fullMessage),
          details ? `\n  Details:` : '',
          details ? details : '',
          context ? `\n  Context:` : '',
          context ? context : ''
        );
        break;
      case 'error':
        console.error(
          LogArtHelpers.store.error('HMR 오류', fullMessage),
          details ? `\n  Details:` : '',
          details ? details : '',
          context ? `\n  Context:` : '',
          context ? context : ''
        );
        break;
    }
  }

  /**
   * Store 상태 저장 로그
   */
  logStateSave(storeName: string, details?: any): void {
    this.log('debug', 'state-save', `Store 상태 저장: ${storeName}`, details, {
      storeName,
    });
  }

  /**
   * Store 상태 복원 로그
   */
  logStateRestore(storeName: string, success: boolean, details?: any): void {
    this.log(
      success ? 'info' : 'warn',
      'state-restore',
      `Store 상태 복원 ${success ? '성공' : '실패'}: ${storeName}`,
      details,
      { storeName }
    );
  }

  /**
   * Action 핸들러 백업 로그
   */
  logHandlerBackup(actionType: string, handlerId: string, details?: any): void {
    this.log('debug', 'handler-backup', `핸들러 백업: ${actionType}#${handlerId}`, details, {
      actionType,
      handlerId,
    });
  }

  /**
   * Action 핸들러 복원 로그
   */
  logHandlerRestore(
    actionType: string, 
    handlerId: string, 
    success: boolean, 
    details?: any
  ): void {
    this.log(
      success ? 'info' : 'warn',
      'handler-restore',
      `핸들러 복원 ${success ? '성공' : '실패'}: ${actionType}#${handlerId}`,
      details,
      { actionType, handlerId }
    );
  }

  /**
   * 모듈 리로드 로그
   */
  logModuleReload(module: string, details?: any): void {
    this.log('info', 'module-reload', `모듈 리로드: ${module}`, details, {
      module,
    });
  }

  /**
   * HMR 오류 로그
   */
  logError(message: string, error?: Error | any, context?: HMRLogEntry['context']): void {
    this.log('error', 'error', message, {
      error: (error as any)?.message || error,
      stack: (error as any)?.stack,
    }, context);
  }

  /**
   * HMR 시스템 로그
   */
  logSystem(message: string, details?: any, context?: HMRLogEntry['context']): void {
    this.log('info', 'system', message, details, context);
  }

  /**
   * 성능 측정과 함께 로그
   */
  logWithTiming<T>(
    category: HMRLogCategory,
    message: string,
    operation: () => T,
    context?: Omit<HMRLogEntry['context'], 'executionTime'>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const executionTime = Math.round((performance.now() - startTime) * 10) / 10;
      
      this.log('debug', category, `${message} (${executionTime}ms)`, undefined, {
        ...context,
        executionTime,
      });
      
      return result;
    } catch (error) {
      const executionTime = Math.round((performance.now() - startTime) * 10) / 10;
      
      this.log('error', 'error', `${message} 실패 (${executionTime}ms)`, {
        error: (error as any)?.message || error,
        stack: (error as any)?.stack,
      }, {
        ...context,
        executionTime,
      });
      
      throw error;
    }
  }

  /**
   * 로그 히스토리 조회
   */
  getHistory(category?: HMRLogCategory, level?: HMRLogLevel): HMRLogEntry[] {
    let filtered = this.logHistory;

    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    return filtered;
  }

  /**
   * 로그 히스토리 정리
   */
  clearHistory(): void {
    this.logHistory = [];
    this.logSystem('로그 히스토리 정리됨');
  }

  /**
   * HMR 통계 생성
   */
  getStats(): {
    totalLogs: number;
    byCategory: Record<HMRLogCategory, number>;
    byLevel: Record<HMRLogLevel, number>;
    errorCount: number;
    lastActivity: Date | null;
  } {
    const byCategory = {} as Record<HMRLogCategory, number>;
    const byLevel = {} as Record<HMRLogLevel, number>;

    this.logHistory.forEach(entry => {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
    });

    return {
      totalLogs: this.logHistory.length,
      byCategory,
      byLevel,
      errorCount: byLevel.error || 0,
      lastActivity: this.logHistory.length > 0 ? this.logHistory[0].timestamp : null,
    };
  }

  /**
   * 활성화 상태 확인
   */
  get enabled(): boolean {
    return this.isEnabled;
  }
}

/**
 * HMR 로거 싱글톤 인스턴스
 */
export const hmrLogger = HMRLogger.getInstance();

/**
 * HMR 로그 유틸리티 함수들
 */
export const HMRLogUtils = {
  /**
   * Store 관련 로그 헬퍼
   */
  store: {
    saved: (storeName: string, details?: any) => 
      hmrLogger.logStateSave(storeName, details),
    
    restored: (storeName: string, success: boolean, details?: any) => 
      hmrLogger.logStateRestore(storeName, success, details),
    
    withTiming: <T>(storeName: string, operation: string, fn: () => T) =>
      hmrLogger.logWithTiming('state-save', `Store ${operation}: ${storeName}`, fn, {
        storeName,
      }),
  },

  /**
   * Action 관련 로그 헬퍼
   */
  action: {
    backed: (actionType: string, handlerId: string, details?: any) =>
      hmrLogger.logHandlerBackup(actionType, handlerId, details),
    
    restored: (actionType: string, handlerId: string, success: boolean, details?: any) =>
      hmrLogger.logHandlerRestore(actionType, handlerId, success, details),
    
    withTiming: <T>(actionType: string, operation: string, fn: () => T) =>
      hmrLogger.logWithTiming('handler-backup', `Action ${operation}: ${actionType}`, fn, {
        actionType,
      }),
  },

  /**
   * 시스템 관련 로그 헬퍼
   */
  system: {
    moduleReload: (module: string, details?: any) =>
      hmrLogger.logModuleReload(module, details),
    
    info: (message: string, details?: any, context?: HMRLogEntry['context']) =>
      hmrLogger.logSystem(message, details, context),
    
    error: (message: string, error?: Error | any, context?: HMRLogEntry['context']) =>
      hmrLogger.logError(message, error, context),
  },
};