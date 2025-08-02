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
    <div className={`demo-card logger-card ${className}`}>
      <div className="card-header">
        <h3>{title}</h3>
        {showControls && (
          <div className="button-group">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(Number(e.target.value))}
              className="select-input"
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
              className="btn btn-small btn-secondary"
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
      <div className="log-container" style={{ maxHeight }}>
        <div className="log-empty">로그가 아직 기록되지 않았습니다...</div>
      </div>
    );
  }

  return (
    <div className="log-container" style={{ maxHeight }}>
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

  return (
    <div className={`log-entry log-${log.type}`}>
      <span className="log-id" title={log.id}>
        {shortId}
      </span>
      <span className="log-time">{log.timestamp}</span>
      <span 
        className="log-level" 
        style={{ color: getLogLevelColor(log.level) }}
      >
        {getLogLevelName(log.level)}
      </span>
      <span 
        className="log-type" 
        style={{ color: getLogTypeColor(log.type) }}
      >
        {log.type.toUpperCase()}
      </span>
      {log.priority !== undefined && (
        <span className="log-priority">{log.priority}</span>
      )}
      <span className="log-message">{log.message}</span>
      {log.details && (
        <LogDetails details={log.details} />
      )}
    </div>
  );
}

/**
 * 로그 상세 정보 컴포넌트
 */
interface LogDetailsProps {
  details: any;
}

function LogDetails({ details }: LogDetailsProps) {
  return (
    <details className="log-details">
      <summary>Details</summary>
      <pre>{JSON.stringify(details, null, 2)}</pre>
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
    <div className="log-stats">
      <div className="stat-item">
        <span className="stat-label">Total Logs:</span>
        <span className="stat-value">{logs.length}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Current Level:</span>
        <span className="stat-value">{getLogLevelName(currentLevel)}</span>
      </div>
    </div>
  );
}