/**
 * 독립적인 로깅 모듈
 * 의존성 순환을 방지하기 위해 분리된 로깅 시스템
 */

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'system' | 'action' | 'error';
  message: string;
  context?: Record<string, any>;
}

class LoggingModule {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // 디바운스된 로깅으로 무한루프 방지
  logSystem(message: string, context?: Record<string, any>) {
    const key = `system-${message}`;
    
    // 기존 타이머 클리어
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // 새 타이머 설정 (100ms 디바운스)
    const timer = setTimeout(() => {
      this.addLog({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'system',
        message,
        context
      });
      this.debounceTimers.delete(key);
    }, 100);

    this.debounceTimers.set(key, timer);
  }

  logAction(action: string, context?: Record<string, any>) {
    this.addLog({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'action',
      message: `액션 실행: ${action}`,
      context
    });
  }

  private addLog(log: LogEntry) {
    this.logs.push(log);
    
    // 최대 100개 로그만 유지
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // 리스너들에게 알림
    this.listeners.forEach(listener => {
      try {
        listener([...this.logs]);
      } catch (error) {
        console.error('Logging listener error:', error);
      }
    });
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.add(listener);
    
    // 현재 로그 즉시 전달
    listener([...this.logs]);

    // 구독 해제 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => {
      try {
        listener([]);
      } catch (error) {
        console.error('Logging listener error:', error);
      }
    });
  }

  destroy() {
    // 모든 타이머 클리어
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.listeners.clear();
    this.logs = [];
  }
}

// 싱글톤 인스턴스
export const loggingModule = new LoggingModule();

export type { LogEntry };