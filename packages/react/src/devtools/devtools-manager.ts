/**
 * DevTools 메인 관리자
 * Store 모니터링, Action 로깅, 성능 측정 등을 종합적으로 관리
 */

import { Store } from '../stores/core/Store';
import { globalErrorBoundary } from '../utils/error-boundary';
import type { 
  DevToolsAction, 
  DevToolsState, 
  StoreChange, 
  PerformanceMetrics,
  DevToolsConnection
} from './types';

export interface DevToolsConfig {
  /** DevTools 활성화 여부 */
  enabled?: boolean;
  /** 최대 액션 히스토리 개수 */
  maxActions?: number;
  /** 성능 모니터링 활성화 */
  enablePerformanceMonitoring?: boolean;
  /** Store 변경 로깅 */
  enableStoreLogging?: boolean;
  /** Action 로깅 */
  enableActionLogging?: boolean;
  /** Time travel 기능 활성화 */
  enableTimeTravel?: boolean;
  /** Redux DevTools Extension 연결 */
  connectToReduxDevTools?: boolean;
  /** 개발 환경에서만 활성화 */
  developmentOnly?: boolean;
}

/**
 * Context-Action DevTools 메인 매니저
 */
export class DevToolsManager {
  private config: Required<DevToolsConfig>;
  private state: DevToolsState;
  private connections = new Set<DevToolsConnection>();
  private storeSubscriptions = new Map<string, (() => void)[]>();
  private performanceStartTimes = new Map<string, number>();
  
  // Redux DevTools Extension 연결
  private reduxDevToolsConnection: DevToolsConnection | null = null;

  constructor(config: DevToolsConfig = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      maxActions: 100,
      enablePerformanceMonitoring: true,
      enableStoreLogging: true,
      enableActionLogging: true,
      enableTimeTravel: true,
      connectToReduxDevTools: true,
      developmentOnly: true,
      ...config
    };

    this.state = {
      stores: {},
      actions: [],
      performance: {
        totalActions: 0,
        averageActionTime: 0,
        slowActions: []
      }
    };

    if (this.isEnabled()) {
      this.setupReduxDevToolsConnection();
    }
  }

  /**
   * DevTools 활성화 여부 확인
   */
  private isEnabled(): boolean {
    if (this.config.developmentOnly && process.env.NODE_ENV !== 'development') {
      return false;
    }
    return this.config.enabled;
  }

  /**
   * Redux DevTools Extension 연결 설정
   */
  private setupReduxDevToolsConnection(): void {
    if (!this.config.connectToReduxDevTools) return;

    try {
      const devToolsExtension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
      if (devToolsExtension) {
        this.reduxDevToolsConnection = devToolsExtension.connect({
          name: 'Context-Action DevTools',
          features: {
            pause: true,
            lock: true,
            persist: true,
            export: true,
            import: 'custom',
            jump: this.config.enableTimeTravel,
            skip: true,
            reorder: true,
            dispatch: true,
            test: true
          }
        });

        if (this.reduxDevToolsConnection) {
          this.reduxDevToolsConnection.init(this.state);

          // Redux DevTools에서 오는 메시지 처리
          this.reduxDevToolsConnection.subscribe((message: any) => {
            this.handleReduxDevToolsMessage(message);
          });
        }
      }
    } catch (error) {
      globalErrorBoundary.handleError(
        error instanceof Error ? error : new Error('Failed to setup Redux DevTools'),
        { operation: 'devtools-setup' }
      );
    }
  }

  /**
   * Redux DevTools 메시지 처리
   */
  private handleReduxDevToolsMessage(message: any): void {
    switch (message.type) {
      case 'DISPATCH':
        if (message.payload?.type === 'JUMP_TO_STATE') {
          this.handleTimeTravel(message.state);
        }
        break;
      case 'START':
        // DevTools가 시작될 때의 처리
        break;
      case 'STOP':
        // DevTools가 중지될 때의 처리
        break;
    }
  }

  /**
   * Time travel 처리
   */
  private handleTimeTravel(targetState: any): void {
    if (!this.config.enableTimeTravel) return;

    try {
      // 모든 Store를 targetState로 복원
      Object.entries(targetState.stores).forEach(([storeName, storeState]: [string, any]) => {
        // 실제 구현에서는 StoreRegistry를 통해 Store를 찾아서 setValue 호출
        console.log(`Time travel: ${storeName}`, storeState);
      });
    } catch (error) {
      globalErrorBoundary.handleError(
        error instanceof Error ? error : new Error('Time travel failed'),
        { operation: 'time-travel' }
      );
    }
  }

  /**
   * Store 등록 및 모니터링 시작
   */
  registerStore<T>(store: Store<T>, storeName?: string): () => void {
    if (!this.isEnabled()) return () => {};

    const name = storeName || store.name;
    
    // 초기 상태 저장
    this.state.stores[name] = {
      value: store.getValue(),
      timestamp: Date.now(),
      version: 0
    };

    // Store 변경 구독
    const unsubscribe = store.subscribe(() => {
      if (this.config.enableStoreLogging) {
        this.handleStoreChange({
          storeName: name,
          oldValue: this.state.stores[name]?.value,
          newValue: store.getValue(),
          timestamp: Date.now()
        });
      }
    });

    // 구독 해제 함수들 저장
    if (!this.storeSubscriptions.has(name)) {
      this.storeSubscriptions.set(name, []);
    }
    this.storeSubscriptions.get(name)!.push(unsubscribe);

    return () => {
      this.unregisterStore(name);
    };
  }

  /**
   * Store 등록 해제
   */
  private unregisterStore(storeName: string): void {
    const subscriptions = this.storeSubscriptions.get(storeName);
    if (subscriptions) {
      subscriptions.forEach(unsub => unsub());
      this.storeSubscriptions.delete(storeName);
    }
    delete this.state.stores[storeName];
  }

  /**
   * Store 변경 처리
   */
  private handleStoreChange(change: StoreChange): void {
    const { storeName, newValue, timestamp } = change;
    
    // 상태 업데이트
    this.state.stores[storeName] = {
      value: newValue,
      timestamp,
      version: (this.state.stores[storeName]?.version || 0) + 1
    };

    // DevTools에 전송
    const action: DevToolsAction = {
      type: '@context-action/STORE_UPDATE',
      payload: { storeName, value: newValue },
      timestamp
    };

    this.sendToDevTools(action);
  }

  /**
   * Action 로깅 시작
   */
  startActionLogging(actionName: string, payload?: any, storeName?: string): string {
    if (!this.isEnabled() || !this.config.enableActionLogging) {
      return '';
    }

    const actionId = `${actionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.config.enablePerformanceMonitoring) {
      this.performanceStartTimes.set(actionId, performance.now());
    }

    const action: DevToolsAction = {
      type: '@context-action/ACTION_DISPATCH',
      payload: { actionName, payload, storeName },
      timestamp: Date.now()
    };

    this.addAction(action);
    return actionId;
  }

  /**
   * Action 로깅 완료
   */
  completeActionLogging(
    actionId: string, 
    result?: any, 
    error?: Error,
    metrics?: PerformanceMetrics
  ): void {
    if (!this.isEnabled() || !actionId) return;

    const duration = this.config.enablePerformanceMonitoring && this.performanceStartTimes.has(actionId)
      ? performance.now() - this.performanceStartTimes.get(actionId)!
      : undefined;

    if (duration !== undefined) {
      this.performanceStartTimes.delete(actionId);
      
      // 성능 통계 업데이트
      this.updatePerformanceStats(duration);
    }

    const action: DevToolsAction = {
      type: '@context-action/ACTION_COMPLETE',
      payload: { result, error: error?.message, metrics },
      timestamp: Date.now(),
      duration
    };

    this.addAction(action);
    this.sendToDevTools(action);
  }

  /**
   * Action을 히스토리에 추가
   */
  private addAction(action: DevToolsAction): void {
    this.state.actions.push(action);
    
    // 최대 개수 제한
    if (this.state.actions.length > this.config.maxActions) {
      this.state.actions = this.state.actions.slice(-this.config.maxActions);
    }
  }

  /**
   * 성능 통계 업데이트
   */
  private updatePerformanceStats(duration: number): void {
    const perf = this.state.performance;
    perf.totalActions++;
    
    // 평균 계산
    perf.averageActionTime = (
      (perf.averageActionTime * (perf.totalActions - 1) + duration) / perf.totalActions
    );

    // 느린 액션 추적 (평균의 2배 이상)
    if (duration > perf.averageActionTime * 2) {
      perf.slowActions.push({
        type: '@context-action/SLOW_ACTION',
        payload: { duration },
        timestamp: Date.now(),
        duration
      });

      // 느린 액션도 최대 개수 제한
      if (perf.slowActions.length > 20) {
        perf.slowActions = perf.slowActions.slice(-20);
      }
    }
  }

  /**
   * DevTools에 데이터 전송
   */
  private sendToDevTools(action: DevToolsAction): void {
    // Redux DevTools에 전송
    if (this.reduxDevToolsConnection) {
      this.reduxDevToolsConnection.send(action, this.state);
    }

    // 다른 연결된 DevTools에 전송
    this.connections.forEach(connection => {
      try {
        connection.send(action, this.state);
      } catch (error) {
        console.warn('Failed to send to DevTools connection:', error);
      }
    });
  }

  /**
   * 현재 상태 스냅샷 가져오기
   */
  getStateSnapshot(): DevToolsState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * DevTools 연결 추가
   */
  addConnection(connection: DevToolsConnection): () => void {
    this.connections.add(connection);
    
    // 초기 상태 전송
    connection.init(this.state);

    return () => {
      this.connections.delete(connection);
    };
  }

  /**
   * 모든 연결 해제 및 정리
   */
  dispose(): void {
    // Store 구독 해제
    this.storeSubscriptions.forEach(subscriptions => {
      subscriptions.forEach(unsub => unsub());
    });
    this.storeSubscriptions.clear();

    // Redux DevTools 연결 해제
    if (this.reduxDevToolsConnection) {
      this.reduxDevToolsConnection.unsubscribe();
      this.reduxDevToolsConnection = null;
    }

    // 모든 연결 정리
    this.connections.clear();
    this.performanceStartTimes.clear();
  }

  /**
   * DevTools 설정 업데이트
   */
  updateConfig(newConfig: Partial<DevToolsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Redux DevTools 재연결이 필요한 경우
    if (newConfig.connectToReduxDevTools !== undefined) {
      if (this.reduxDevToolsConnection) {
        this.reduxDevToolsConnection.unsubscribe();
        this.reduxDevToolsConnection = null;
      }
      if (newConfig.connectToReduxDevTools && this.isEnabled()) {
        this.setupReduxDevToolsConnection();
      }
    }
  }

  /**
   * 성능 리포트 생성
   */
  generatePerformanceReport(): {
    totalActions: number;
    averageActionTime: number;
    slowestActions: DevToolsAction[];
    storeUpdateCount: number;
    memoryUsage?: number;
  } {
    const storeUpdateActions = this.state.actions.filter(
      action => action.type === '@context-action/STORE_UPDATE'
    );

    return {
      totalActions: this.state.performance.totalActions,
      averageActionTime: this.state.performance.averageActionTime,
      slowestActions: this.state.performance.slowActions.slice(-5),
      storeUpdateCount: storeUpdateActions.length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }
}

/**
 * 글로벌 DevTools 인스턴스
 */
export const globalDevTools = new DevToolsManager();