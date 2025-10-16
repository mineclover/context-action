import { useCallback, useState } from 'react';
import { useLogMonitorActions } from '@/components/LogMonitor';
import { Button, Card, CardContent } from '@/components/ui';
import { LogLevel } from '@/utils/logger';

export function LogMonitorLiveDemo() {
  const { addLog, clearLogs, setLogLevel } = useLogMonitorActions();
  const [counter, setCounter] = useState(0);

  const handleInfoLog = useCallback(() => {
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: `정보 로그 - 카운터: ${counter}`,
      details: {
        counter,
        action: 'demo-info',
        timestamp: Date.now(),
        context: 'Live Demo',
      },
    });
    setCounter((prev) => prev + 1);
  }, [addLog, counter]);

  const handleWarningLog = useCallback(() => {
    addLog({
      level: LogLevel.WARN,
      type: 'system',
      message: '경고 로그 - 주의가 필요합니다',
      details: {
        warning: 'demo-warning',
        severity: 'medium',
        context: 'Live Demo',
      },
    });
  }, [addLog]);

  const handleErrorLog = useCallback(() => {
    addLog({
      level: LogLevel.ERROR,
      type: 'action',
      message: '에러 로그 - 데모 에러 발생',
      details: {
        error: 'demo-error',
        severity: 'high',
        action: 'demo-error',
        context: 'Live Demo',
      },
    });
  }, [addLog]);

  const handleComplexLog = useCallback(() => {
    addLog({
      level: LogLevel.DEBUG,
      type: 'system',
      message: '복잡한 데이터가 포함된 로그',
      details: {
        complexData: {
          user: { id: 123, name: 'Demo User' },
          settings: { theme: 'dark', language: 'ko' },
          metadata: {
            component: 'LogMonitorLiveDemo',
            timestamp: new Date().toISOString(),
            sessionId: `demo-session-${Math.random().toString(36).substr(2, 9)}`,
          },
        },
        action: 'complex-demo',
        context: 'Live Demo',
      },
    });
  }, [addLog]);

  const handleClearLogs = useCallback(() => {
    clearLogs();
  }, [clearLogs]);

  const handleChangeLogLevel = useCallback(
    (level: LogLevel) => {
      setLogLevel(level);
      addLog({
        level: LogLevel.INFO,
        type: 'system',
        message: `로그 레벨 변경: ${level}`,
        details: {
          newLevel: level,
          action: 'change-log-level',
          context: 'Live Demo',
        },
      });
    },
    [setLogLevel, addLog]
  );

  return (
    <Card className="border-l-4 border-l-blue-600 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900">
            🧪 LogMonitor Live Demo
          </h4>
          <div className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
            Counter: {counter}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h5 className="font-semibold text-gray-900 mb-2">기본 로그 생성</h5>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="success" onClick={handleInfoLog}>
                📝 INFO 로그
              </Button>
              <Button size="sm" variant="warning" onClick={handleWarningLog}>
                ⚠️ WARNING 로그
              </Button>
              <Button size="sm" variant="danger" onClick={handleErrorLog}>
                ❌ ERROR 로그
              </Button>
              <Button size="sm" variant="secondary" onClick={handleComplexLog}>
                🔍 복잡한 데이터 로그
              </Button>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 mb-2">로그 레벨 제어</h5>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeLogLevel(LogLevel.TRACE)}
              >
                TRACE
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeLogLevel(LogLevel.DEBUG)}
              >
                DEBUG
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeLogLevel(LogLevel.INFO)}
              >
                INFO
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeLogLevel(LogLevel.WARN)}
              >
                WARN
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeLogLevel(LogLevel.ERROR)}
              >
                ERROR
              </Button>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 mb-2">로그 관리</h5>
            <Button size="sm" variant="secondary" onClick={handleClearLogs}>
              🗑️ 모든 로그 삭제
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-900 font-medium">
              💡 <strong>사용법:</strong> 위 버튼들을 클릭하여 다양한 로그를
              생성하고, 오른쪽 LogMonitor 패널에서 실시간으로 로그가 수집되는
              것을 확인하세요.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              로그 레벨을 변경하면 해당 레벨 이상의 로그만 표시됩니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
