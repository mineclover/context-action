import React, { useState, useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore } from '../stores';

// Visual feedback component for real-time execution monitoring
export function VisualFeedback() {
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);
  
  const [executionFlows, setExecutionFlows] = useState<any[]>([]);
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set());

  // Track execution flows from logs
  useEffect(() => {
    if (logs.length === 0) return;

    const recentLogs = logs.slice(-10);
    const flows = recentLogs.map((log, index) => ({
      id: `${log.timestamp}-${index}`,
      message: log.message,
      level: log.level,
      timestamp: log.timestamp,
      isNew: Date.now() - log.timestamp < 3000, // Consider new if < 3s old
      category: detectCategory(log.message)
    }));

    setExecutionFlows(flows);

    // Track active actions
    const actions = new Set<string>();
    recentLogs.forEach(log => {
      if (log.message.includes('started')) {
        const action = extractActionName(log.message);
        if (action) actions.add(action);
      } else if (log.message.includes('completed') || log.message.includes('failed')) {
        const action = extractActionName(log.message);
        if (action) actions.delete(action);
      }
    });
    setActiveActions(actions);
  }, [logs]);

  return (
    <div className="fixed top-4 left-4 z-40 max-w-sm">
      {/* Active Executions */}
      {activeActions.size > 0 && (
        <div className="bg-blue-500 text-white p-3 rounded-lg shadow-lg mb-2 animate-pulse">
          <div className="font-semibold text-sm mb-1">🔄 Active Executions</div>
          <div className="space-y-1">
            {Array.from(activeActions).map(action => (
              <div key={action} className="text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                {action}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Flow Animation */}
      <div className="space-y-1">
        {executionFlows.slice(-3).map((flow) => (
          <ExecutionFlowItem key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  );
}

// Individual execution flow item with animation
function ExecutionFlowItem({ flow }: { flow: any }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRemove, setShouldRemove] = useState(false);

  useEffect(() => {
    // Animate in
    const timeout1 = setTimeout(() => setIsVisible(true), 100);
    
    // Animate out after 3 seconds
    const timeout2 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setShouldRemove(true), 300);
    }, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  if (shouldRemove) return null;

  const getFlowStyle = () => {
    switch (flow.level) {
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return flow.message.includes('completed') || flow.message.includes('passed')
          ? 'bg-green-500 text-white border-green-600'
          : 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getIcon = () => {
    if (flow.message.includes('started')) return '🚀';
    if (flow.message.includes('completed')) return '✅';
    if (flow.message.includes('failed')) return '❌';
    if (flow.message.includes('passed')) return '✅';
    if (flow.message.includes('running')) return '🔄';
    if (flow.level === 'error') return '🔴';
    if (flow.level === 'warning') return '🟡';
    return '🔵';
  };

  return (
    <div
      className={`
        transition-all duration-300 ease-out transform
        ${isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : '-translate-x-full opacity-0 scale-95'
        }
        ${getFlowStyle()}
        p-2 rounded-lg shadow-lg border-l-4
        max-w-xs
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">
            {flow.category}
          </div>
          <div className="text-xs opacity-90 truncate">
            {flow.message}
          </div>
        </div>
      </div>
    </div>
  );
}

// Status indicator for execution states
export function ExecutionStatusIndicator() {
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);
  
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    if (logs.length === 0) {
      setStatus('idle');
      return;
    }

    const recentLogs = logs.slice(-5);
    const hasRecent = recentLogs.some(log => Date.now() - log.timestamp < 2000);
    
    if (hasRecent) {
      const hasError = recentLogs.some(log => log.level === 'error');
      const hasStarted = recentLogs.some(log => log.message.includes('started'));
      const hasCompleted = recentLogs.some(log => log.message.includes('completed'));
      
      if (hasError) {
        setStatus('error');
      } else if (hasStarted && !hasCompleted) {
        setStatus('running');
      } else if (hasCompleted) {
        setStatus('success');
      }
      
      setLastActivity(Date.now());
    } else {
      setStatus('idle');
    }
  }, [logs]);

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: '🔄',
          color: 'bg-blue-500',
          pulse: true,
          label: 'Running'
        };
      case 'success':
        return {
          icon: '✅',
          color: 'bg-green-500',
          pulse: false,
          label: 'Success'
        };
      case 'error':
        return {
          icon: '❌',
          color: 'bg-red-500',
          pulse: true,
          label: 'Error'
        };
      default:
        return {
          icon: '⚪',
          color: 'bg-gray-400',
          pulse: false,
          label: 'Idle'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-white text-sm
        ${config.color}
        ${config.pulse ? 'animate-pulse' : ''}
      `}>
        <span className={config.pulse ? 'animate-spin' : ''}>{config.icon}</span>
        <span>{config.label}</span>
        {status !== 'idle' && (
          <span className="text-xs opacity-75">
            {new Date(lastActivity).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Performance metrics overlay
export function PerformanceOverlay() {
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);
  
  const [metrics, setMetrics] = useState({
    totalExecutions: 0,
    averageTime: 0,
    successRate: 0,
    activeHandlers: 0
  });

  useEffect(() => {
    // Calculate metrics from logs
    const executions = logs.filter(log => 
      log.message.includes('completed') || log.message.includes('failed')
    );
    
    const successes = logs.filter(log => log.message.includes('completed'));
    const runningActions = logs.filter(log => 
      log.message.includes('started') && 
      Date.now() - log.timestamp < 5000
    );

    setMetrics({
      totalExecutions: executions.length,
      averageTime: Math.random() * 100 + 50, // Simulated for demo
      successRate: executions.length > 0 ? (successes.length / executions.length) * 100 : 0,
      activeHandlers: runningActions.length
    });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-30 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs">
      <div className="font-semibold mb-2">📊 Performance Metrics</div>
      <div className="space-y-1">
        <div>Executions: {metrics.totalExecutions}</div>
        <div>Avg Time: {metrics.averageTime.toFixed(1)}ms</div>
        <div>Success Rate: {metrics.successRate.toFixed(1)}%</div>
        <div>Active: {metrics.activeHandlers}</div>
      </div>
    </div>
  );
}

// Helper functions
function detectCategory(message: string): string {
  if (message.includes('deployment')) return 'Deployment';
  if (message.includes('credit') || message.includes('discount')) return 'Business';
  if (message.includes('permission') || message.includes('admin')) return 'Security';
  if (message.includes('user') || message.includes('processing')) return 'Processing';
  if (message.includes('schedule') || message.includes('hours')) return 'Schedule';
  return 'System';
}

function extractActionName(message: string): string | null {
  const patterns = [
    /(\w+)\s+(deployment|processing|check|calculation)/,
    /(deployment|processing|user|order|system)\s+(\w+)/,
    /(\w+)\s+(started|completed|failed)/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1] || match[2] || 'Unknown';
    }
  }
  
  return null;
}

// Combined visual feedback component
export function CombinedVisualFeedback() {
  return (
    <>
      <VisualFeedback />
      <ExecutionStatusIndicator />
      <PerformanceOverlay />
    </>
  );
}