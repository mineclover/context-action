/**
 * @fileoverview 리팩토링된 LogMonitor 컴포넌트
 * @module LogMonitor
 */

import React from 'react';
import { LogLevel } from '@context-action/logger';

import type { LogMonitorProps, LogEntry } from './types';
import { useLogMonitor } from './hooks';
import { 
  getLogLevelColor, 
  getLogTypeColor, 
  getLogLevelName 
} from './utils';
import { cn } from '../../lib/utils';
import { 
  logMonitorVariants, 
  logEntryVariants, 
  logLevelBadgeVariants,
  buttonVariants,
  inputVariants
} from '../ui/variants';

/**
 * 로그 모니터 컴포넌트
 * 
 * 로그를 시각화하고 로그 레벨을 제어하는 UI를 제공합니다.
 * 이제 단순하고 재사용 가능한 구조로 리팩토링되었습니다.
 */
export function LogMonitor({ 
  title = "Log Monitor",
  maxHeight = "300px",
  showControls = true,
  className = "",
  config
}: LogMonitorProps) {
  const { logs, clearLogs, logLevel, setLogLevel, updateConfig } = useLogMonitor();

  // 설정 업데이트
  React.useEffect(() => {
    if (config) {
      updateConfig(config);
    }
  }, [config, updateConfig]);

  return (
    <div className={cn(logMonitorVariants({ variant: "default" }), "p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showControls && (
          <div className="flex items-center gap-2">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(Number(e.target.value))}
              className={cn(inputVariants({ size: "sm" }), "w-24")}
              aria-label="로그 레벨 선택"
            >
              <option value={LogLevel.TRACE}>TRACE</option>
              <option value={LogLevel.DEBUG}>DEBUG</option>
              <option value={LogLevel.INFO}>INFO</option>
              <option value={LogLevel.WARN}>WARN</option>
              <option value={LogLevel.ERROR}>ERROR</option>
            </select>
            <button 
              onClick={clearLogs} 
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              aria-label="로그 지우기"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      <LogList logs={logs} maxHeight={maxHeight} />
      <LogStats logs={logs} currentLevel={logLevel} />
    </div>
  );
}

/**
 * 로그 목록 컴포넌트
 */
interface LogListProps {
  logs: LogEntry[];
  maxHeight: string;
}

function LogList({ logs, maxHeight }: LogListProps) {
  if (logs.length === 0) {
    return (
      <div 
        className="bg-gray-50 rounded-lg p-4 text-center text-gray-500" 
        style={{ maxHeight }}
      >
        <div className="text-sm">로그가 아직 기록되지 않았습니다...</div>
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-50 rounded-lg overflow-y-auto" 
      style={{ maxHeight }}
    >
      {[...logs].reverse().map((log) => (
        <LogEntryItem key={log.id} log={log} />
      ))}
    </div>
  );
}

/**
 * 개별 로그 엔트리 컴포넌트
 */
interface LogEntryItemProps {
  log: LogEntry;
}

function LogEntryItem({ log }: LogEntryItemProps) {
  const shortId = log.id.split('-').slice(-1)[0];
  const levelName = getLogLevelName(log.level).toLowerCase();

  return (
    <div className={cn(
      logEntryVariants({ 
        type: log.type as any, 
        level: levelName as any 
      }),
      "grid-cols-[auto_auto_auto_auto_1fr] items-center gap-3"
    )}>
      <span className="text-gray-400 text-xs" title={log.id}>
        {shortId}
      </span>
      <span className="text-gray-500 text-xs whitespace-nowrap">{log.timestamp}</span>
      <span className={cn(logLevelBadgeVariants({ level: levelName as any }))}>
        {getLogLevelName(log.level)}
      </span>
      <span className="text-xs font-medium text-gray-600 uppercase">
        {log.type}
      </span>
      <div className="flex items-center gap-2">
        {log.priority !== undefined && (
          <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
            P{log.priority}
          </span>
        )}
        <span className="text-sm text-gray-900 break-all">{log.message}</span>
      </div>
      {log.details !== undefined && (
        <div className="col-span-5">
          <LogDetails details={log.details} />
        </div>
      )}
    </div>
  );
}

/**
 * 로그 상세 정보 컴포넌트
 */
interface LogDetailsProps {
  details: unknown;
}

function LogDetails({ details }: LogDetailsProps) {
  return (
    <details className="mt-2">
      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
        Details
      </summary>
      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
        {JSON.stringify(details, null, 2)}
      </pre>
    </details>
  );
}

/**
 * 로그 통계 컴포넌트
 */
interface LogStatsProps {
  logs: LogEntry[];
  currentLevel: LogLevel;
}

function LogStats({ logs, currentLevel }: LogStatsProps) {
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Logs:</span>
          <span className="font-medium text-gray-900">{logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Current Level:</span>
          <span className={cn(logLevelBadgeVariants({ level: getLogLevelName(currentLevel).toLowerCase() as any }))}>
            {getLogLevelName(currentLevel)}
          </span>
        </div>
      </div>
    </div>
  );
}