import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider,
  useConditionalAction,
  useConditionalStore,
  useConditionalActionHandler
} from '../stores';
import { useStoreValue } from '@context-action/react';
import { mockServices } from '../mockServices';

// Time-Based Execution State Interface
interface TimeState {
  currentTime: Date;
  isBusinessHours: boolean;
  operationType: 'deployment' | 'maintenance' | 'dataProcessing' | 'backup' | 'emergency';
  emergencyOverride: boolean;
  taskId: string;
  schedulingResults: TimeEvaluationResult[];
}

interface TimeEvaluationResult {
  evaluationType: string;
  allowed: boolean;
  reason: string;
  nextAvailableTime?: Date;
  executionWindow?: { start: Date; end: Date };
  timestamp: Date;
}

// Operation timing rules
const operationRules = {
  deployment: {
    businessHours: true,
    weekdays: true,
    emergencyOverride: true,
    description: 'Standard deployments during business hours'
  },
  maintenance: {
    businessHours: false,
    weekdays: false, 
    emergencyOverride: false,
    description: 'Maintenance during off-hours'
  },
  dataProcessing: {
    businessHours: false,
    weekdays: true,
    emergencyOverride: true,
    description: 'Heavy processing outside business hours'
  },
  backup: {
    businessHours: false,
    weekdays: false,
    emergencyOverride: false,
    description: 'Backups during off-hours'
  },
  emergency: {
    businessHours: true,
    weekdays: true,
    emergencyOverride: false, // Always allowed
    description: 'Emergency fixes execute immediately'
  }
};

function TimeBasedExecutionContent() {
  const dispatch = useConditionalAction();
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  // Time-Based State
  const [timeState, setTimeState] = useState<TimeState>({
    currentTime: new Date(),
    isBusinessHours: false,
    operationType: 'deployment',
    emergencyOverride: false,
    taskId: `task-${Date.now()}`,
    schedulingResults: []
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());

  // Update current time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeState(prev => ({ ...prev, currentTime: new Date() }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Temporal Guard Pattern: Time constraint evaluation
  useConditionalActionHandler('evaluateScheduling', useCallback(async (payload: any, controller) => {
    setIsProcessing(true);
    setTimeState(prev => ({ ...prev, schedulingResults: [] }));
    
    const evaluationResults: TimeEvaluationResult[] = [];
    const operationRule = operationRules[payload.operationType];
    const currentTime = payload.simulatedTime || new Date();
    
    try {
      // Step 1: Emergency Override Check
      if (payload.operationType === 'emergency' || payload.emergencyOverride) {
        evaluationResults.push({
          evaluationType: 'Emergency Override',
          allowed: true,
          reason: payload.operationType === 'emergency' ? 'Emergency operation - immediate execution' : 'Emergency override activated',
          timestamp: new Date()
        });

        setTimeState(prev => ({ 
          ...prev, 
          schedulingResults: evaluationResults 
        }));

        // Execute immediately for emergencies
        const taskResult = await mockServices.executeScheduledTask(payload.taskId);
        
        logsStore.setValue(prev => [...prev, {
          timestamp: new Date(),
          action: 'evaluateScheduling',
          level: 'warning' as const,
          details: `Emergency execution: ${payload.operationType} - ${taskResult.result}`
        }]);

        setIsProcessing(false);
        return;
      }

      // Step 2: Business Hours Evaluation - Temporal Guard Pattern
      const businessHoursResult = await mockServices.checkBusinessHours(currentTime);
      const requiresBusinessHours = operationRule.businessHours;
      const businessHoursAllowed = requiresBusinessHours ? businessHoursResult.isBusinessTime : !businessHoursResult.isBusinessHours;
      
      evaluationResults.push({
        evaluationType: 'Business Hours Check',
        allowed: businessHoursAllowed,
        reason: requiresBusinessHours 
          ? (businessHoursResult.isBusinessTime ? 'Within business hours' : `Outside business hours. Next: ${businessHoursResult.nextBusinessHour?.toLocaleString()}`)
          : (businessHoursResult.isBusinessHours ? 'During business hours - waiting for off-hours' : 'Outside business hours - optimal timing'),
        nextAvailableTime: requiresBusinessHours && !businessHoursResult.isBusinessTime ? businessHoursResult.nextBusinessHour : undefined,
        timestamp: new Date()
      });

      if (!businessHoursAllowed) {
        // Schedule for later - Temporal Guard Pattern deferred execution
        const scheduledTime = requiresBusinessHours 
          ? businessHoursResult.nextBusinessHour || new Date(Date.now() + 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 8 * 60 * 60 * 1000); // Wait 8 hours for off-hours

        const scheduleResult = await mockServices.scheduleTask(payload.taskId, scheduledTime);
        
        evaluationResults.push({
          evaluationType: 'Task Scheduling',
          allowed: true,
          reason: `Task scheduled for ${scheduleResult.scheduledTime.toLocaleString()}`,
          executionWindow: { 
            start: scheduleResult.scheduledTime, 
            end: new Date(scheduleResult.scheduledTime.getTime() + 2 * 60 * 60 * 1000) 
          },
          timestamp: new Date()
        });

        setTimeState(prev => ({ ...prev, schedulingResults: evaluationResults }));
        
        logsStore.setValue(prev => [...prev, {
          timestamp: new Date(),
          action: 'evaluateScheduling',
          level: 'info' as const,
          details: `Task scheduled: ${payload.operationType} at ${scheduleResult.scheduledTime.toLocaleString()}`
        }]);

        controller.abort(`Operation deferred: ${evaluationResults[evaluationResults.length - 1].reason}`);
        setIsProcessing(false);
        return;
      }

      // Step 3: Immediate Execution - Temporal Guard Pattern allows
      evaluationResults.push({
        evaluationType: 'Execution Decision',
        allowed: true,
        reason: 'All temporal constraints satisfied - executing immediately',
        timestamp: new Date()
      });

      setTimeState(prev => ({ ...prev, schedulingResults: evaluationResults }));

      // Execute the task
      const taskResult = await mockServices.executeScheduledTask(payload.taskId);
      
      evaluationResults.push({
        evaluationType: 'Task Execution',
        allowed: taskResult.executed,
        reason: taskResult.result,
        timestamp: new Date()
      });

      setTimeState(prev => ({ ...prev, schedulingResults: evaluationResults }));

      logsStore.setValue(prev => [...prev, {
        timestamp: new Date(),
        action: 'evaluateScheduling',
        level: taskResult.executed ? 'success' as const : 'error' as const,
        details: `${payload.operationType} execution: ${taskResult.result} (${taskResult.executionTime.toFixed(0)}ms)`
      }]);

    } catch (error) {
      evaluationResults.push({
        evaluationType: 'Error Handling',
        allowed: false,
        reason: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      });

      setTimeState(prev => ({ ...prev, schedulingResults: evaluationResults }));
    } finally {
      setIsProcessing(false);
    }
  }, []));

  const handleScheduleTask = () => {
    dispatch('evaluateScheduling', {
      operationType: timeState.operationType,
      emergencyOverride: timeState.emergencyOverride,
      taskId: timeState.taskId,
      simulatedTime: simulatedTime
    });
  };

  const handleTimeSimulation = (hours: number) => {
    const newTime = new Date(simulatedTime.getTime() + hours * 60 * 60 * 1000);
    setSimulatedTime(newTime);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeStatus = (date: Date) => {
    const hour = date.getHours();
    const day = date.getDay();
    const isBusinessHours = hour >= 9 && hour < 17;
    const isWeekday = day >= 1 && day <= 5;
    return {
      isBusinessHours,
      isWeekday,
      isBusinessTime: isBusinessHours && isWeekday,
      status: isBusinessHours && isWeekday ? 'Business Hours' : 
              isWeekday ? 'After Hours' : 'Weekend'
    };
  };

  const currentTimeStatus = getTimeStatus(simulatedTime);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/actionguard/conditional" 
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              ← Back to Patterns
            </Link>
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              🏠 Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">⏰ Time-Based Execution</h1>
          <p className="text-lg text-gray-600 mb-4">
            Temporal Guard Pattern: Time constraint evaluation with business hours and scheduling logic
          </p>
          
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <p className="text-sm text-pink-800">
              <strong>Temporal Guard Pattern:</strong> Handlers evaluate time constraints before execution. 
              Operations are scheduled, deferred, or executed immediately based on business rules and emergency overrides.
            </p>
          </div>
        </div>

        {/* Time Simulation & Controls */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Task Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Time (Simulated)</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{formatTime(simulatedTime)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    currentTimeStatus.isBusinessTime ? 'bg-green-100 text-green-800' :
                    currentTimeStatus.isWeekday ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {currentTimeStatus.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => handleTimeSimulation(-8)}
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -8h
                  </button>
                  <button 
                    onClick={() => handleTimeSimulation(-1)}
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -1h
                  </button>
                  <button 
                    onClick={() => setSimulatedTime(new Date())}
                    className="px-2 py-1 text-xs bg-blue-200 rounded hover:bg-blue-300"
                  >
                    Now
                  </button>
                  <button 
                    onClick={() => handleTimeSimulation(1)}
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +1h
                  </button>
                  <button 
                    onClick={() => handleTimeSimulation(8)}
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +8h
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation Type</label>
                <select 
                  value={timeState.operationType}
                  onChange={(e) => setTimeState(prev => ({ 
                    ...prev, 
                    operationType: e.target.value as any,
                    taskId: `task-${Date.now()}`
                  }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {Object.entries(operationRules).map(([key, rule]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} - {rule.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emergencyOverride"
                  checked={timeState.emergencyOverride}
                  onChange={(e) => setTimeState(prev => ({ ...prev, emergencyOverride: e.target.checked }))}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="emergencyOverride" className="text-sm font-medium text-gray-700">
                  Emergency Override (Execute Immediately)
                </label>
              </div>

              <button
                onClick={handleScheduleTask}
                disabled={isProcessing}
                className="w-full bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Evaluating...' : 'Evaluate Scheduling'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Temporal Evaluation Results</h2>
            
            {timeState.schedulingResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Configure operation and click "Evaluate Scheduling" to see time-based decisions
              </div>
            ) : (
              <div className="space-y-3">
                {timeState.schedulingResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      result.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {result.allowed ? '✅' : '⏰'} {result.evaluationType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 mb-1">
                      {result.reason}
                    </div>
                    {result.nextAvailableTime && (
                      <div className="text-xs text-blue-600">
                        Next available: {formatTime(result.nextAvailableTime)}
                      </div>
                    )}
                    {result.executionWindow && (
                      <div className="text-xs text-purple-600">
                        Window: {formatTime(result.executionWindow.start)} - {formatTime(result.executionWindow.end)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operation Rules Reference */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-pink-900 mb-4">Temporal Guard Pattern Rules</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-pink-800 mb-3">Operation Timing Rules</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(operationRules).map(([type, rule]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="font-medium capitalize">{type}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.businessHours ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.businessHours ? 'Business Hours' : 'Off Hours'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-pink-800 mb-3">Pattern Benefits</h3>
              <ul className="text-sm text-pink-700 space-y-1">
                <li>• <strong>Risk Mitigation:</strong> Critical operations during support hours</li>
                <li>• <strong>Resource Optimization:</strong> Heavy tasks when resources available</li>
                <li>• <strong>Business Alignment:</strong> Respect business operational hours</li>
                <li>• <strong>Emergency Flexibility:</strong> Override mechanisms for critical issues</li>
                <li>• <strong>Automatic Scheduling:</strong> Deferred execution for optimal timing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Logs Display */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Temporal Execution Logs</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={`ml-2 ${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      log.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {log.action}
                    </span>
                    <span className="ml-2 text-gray-700">{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TimeBasedExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <TimeBasedExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}