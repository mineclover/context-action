/**
 * @fileoverview Real-Time Debugger - 실시간 디버깅 도구
 *
 * Context Store Pattern의 실시간 상태 변화와 디버깅 정보를 제공
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CodeBlock } from '@/components/ui';

// ================================
// 📊 타입 정의
// ================================

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'position' | 'movement' | 'clicks' | 'computed' | 'system';
  message: string;
  data: any;
  level: 'info' | 'warn' | 'error' | 'debug';
}

interface StateSnapshot {
  timestamp: number;
  position: any;
  movement: any;
  clicks: any;
  computed: any;
}

interface RealTimeDebuggerProps {
  position: any;
  movement: any;
  clicks: any;
  computed: any;
  isVisible: boolean;
  onToggle: () => void;
}

// ================================
// 🔧 실시간 디버거 컴포넌트
// ================================

const RealTimeDebuggerComponent = ({
  position,
  movement,
  clicks,
  computed,
  isVisible,
  onToggle,
}: RealTimeDebuggerProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stateHistory, setStateHistory] = useState<StateSnapshot[]>([]);
  const [filterLevel, setFilterLevel] = useState<
    'all' | 'info' | 'warn' | 'error' | 'debug'
  >('all');
  const [maxLogs, _setMaxLogs] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const logIdCounter = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef<any>({});

  // 로그 추가 함수
  const addLog = (
    type: LogEntry['type'],
    message: string,
    data: any,
    level: LogEntry['level'] = 'info'
  ) => {
    if (isPaused) return;

    const newLog: LogEntry = {
      id: `log-${logIdCounter.current++}`,
      timestamp: Date.now(),
      type,
      message,
      data,
      level,
    };

    setLogs((prevLogs) => [...prevLogs.slice(-(maxLogs - 1)), newLog]);
  };

  // 상태 변화 감지 및 로깅
  useEffect(() => {
    const prev = prevStateRef.current;
    const current = { position, movement, clicks, computed };

    // Position 변화 감지
    if (
      prev.position &&
      (prev.position.current.x !== position.current.x ||
        prev.position.current.y !== position.current.y)
    ) {
      addLog(
        'position',
        'Position updated',
        {
          from: prev.position.current,
          to: position.current,
          insideArea: position.isInsideArea,
        },
        'debug'
      );
    }

    // Movement 변화 감지
    if (prev.movement && prev.movement.moveCount !== movement.moveCount) {
      addLog(
        'movement',
        `Move count increased: ${prev.movement.moveCount} → ${movement.moveCount}`,
        {
          velocity: movement.velocity,
          isMoving: movement.isMoving,
          pathLength: movement.path.length,
        },
        'info'
      );
    }

    // Clicks 변화 감지
    if (prev.clicks && prev.clicks.count !== clicks.count) {
      addLog(
        'clicks',
        `Click registered: total ${clicks.count}`,
        {
          latestClick: clicks.history[0] || null,
          historyLength: clicks.history.length,
        },
        'info'
      );
    }

    // Computed 변화 감지
    if (
      prev.computed &&
      prev.computed.activityStatus !== computed.activityStatus
    ) {
      addLog(
        'computed',
        `Activity status changed: ${prev.computed.activityStatus} → ${computed.activityStatus}`,
        {
          totalEvents: computed.totalEvents,
          validPathLength: computed.validPath.length,
          averageVelocity: computed.averageVelocity,
        },
        'info'
      );
    }

    // 상태 스냅샷 저장
    setStateHistory((prevHistory) => {
      const newSnapshot: StateSnapshot = {
        timestamp: Date.now(),
        position: { ...position },
        movement: { ...movement },
        clicks: { ...clicks },
        computed: { ...computed },
      };

      return [...prevHistory.slice(-49), newSnapshot]; // 최근 50개 스냅샷 유지
    });

    prevStateRef.current = current;
  }, [position, movement, clicks, computed]);

  // 시스템 이벤트 로깅
  useEffect(() => {
    if (isVisible) {
      addLog('system', 'Debugger opened', {}, 'info');
    }
  }, [isVisible]);

  // 필터된 로그
  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return logs;
    return logs.filter((log) => log.level === filterLevel);
  }, [logs, filterLevel]);

  // 자동 스크롤
  useEffect(() => {
    if (logsEndRef.current && !isPaused) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isPaused]);

  // 로그 레벨 색상
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  // 타입 아이콘
  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'position':
        return '📍';
      case 'movement':
        return '🏃';
      case 'clicks':
        return '👆';
      case 'computed':
        return '🧮';
      case 'system':
        return '⚙️';
      default:
        return '📝';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 transition-colors"
      >
        🔧 Debug Console
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 text-white rounded-lg shadow-2xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">🔧</span>
          <span className="font-semibold text-sm">Real-Time Debugger</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              isPaused
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={() => setLogs([])}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
          >
            🗑️
          </button>
          <button
            onClick={onToggle}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 필터 컨트롤 */}
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as any)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs"
        >
          <option value="all">All Logs</option>
          <option value="info">Info</option>
          <option value="warn">Warnings</option>
          <option value="error">Errors</option>
          <option value="debug">Debug</option>
        </select>

        <div className="text-xs text-gray-400">
          {filteredLogs.length} / {logs.length} logs
        </div>
      </div>

      {/* 로그 영역 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
        {filteredLogs.map((log) => (
          <div key={log.id} className="border-l-2 border-gray-600 pl-2">
            <div className="flex items-center gap-2">
              <span>{getTypeIcon(log.type)}</span>
              <span className={`font-medium ${getLevelColor(log.level)}`}>
                {log.message}
              </span>
              <span className="text-gray-500 text-xs ml-auto">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {log.data && Object.keys(log.data).length > 0 && (
              <div className="ml-6 mt-1 p-2 bg-gray-800 rounded text-xs">
                <CodeBlock size="sm">
                  {JSON.stringify(log.data, null, 2)}
                </CodeBlock>
              </div>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* 현재 상태 요약 */}
      <div className="p-2 border-t border-gray-700 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">Position:</span>
            <span className="ml-1">
              ({position.current.x}, {position.current.y})
            </span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span
              className={`ml-1 ${
                computed.activityStatus === 'moving'
                  ? 'text-blue-400'
                  : computed.activityStatus === 'clicking'
                    ? 'text-purple-400'
                    : 'text-gray-400'
              }`}
            >
              {computed.activityStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Events:</span>
            <span className="ml-1">{computed.totalEvents}</span>
          </div>
          <div>
            <span className="text-gray-400">History:</span>
            <span className="ml-1">{stateHistory.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RealTimeDebugger = memo(RealTimeDebuggerComponent);
