import {
  createActionContext,
  ActionPayloadMap,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Section,
  Label,
} from '../../components/ui';

// Demo action interfaces
interface EventActions extends ActionPayloadMap {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
  apiCall: { endpoint: string; method: string };
  notification: { message: string; type: 'info' | 'warning' | 'success' | 'error' };
}

interface SystemActions extends ActionPayloadMap {
  systemStart: void;
  systemStop: void;
  configUpdate: { key: string; value: any };
  healthCheck: { service: string };
}

// Create Action Contexts with Renaming Pattern
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

const {
  Provider: SystemActionProvider,
  useActionDispatch: useSystemAction,
  useActionHandler: useSystemActionHandler
} = createActionContext<SystemActions>('System');

// Basic Action Demo
function BasicActionDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useEventAction();
  const [clickCount, setClickCount] = useState(0);
  const [lastClick, setLastClick] = useState<{ x: number; y: number } | null>(null);
  
  // Register action handlers with proper memoization
  const userClickHandler = useCallback((payload: { x: number; y: number }, controller: any) => {
    logger.logSystem('👆 User click handler triggered');
    setLastClick(payload);
    setClickCount(prev => prev + 1);
    
    // Pure side effects - no state management
    console.log('User clicked at:', payload.x, payload.y);
  }, [logger]);

  const analyticsHandler = useCallback(async (payload: { event: string; data: any }) => {
    logger.logSystem('📊 Analytics handler triggered');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Analytics sent:', payload);
  }, [logger]);

  const userHoverHandler = useCallback((payload: { elementId: string }) => {
    logger.logSystem('🖱️ User hover handler triggered');
  }, [logger]);
  
  // Register handlers using renamed hooks
  useEventActionHandler('userClick', userClickHandler);
  useEventActionHandler('analytics', analyticsHandler);
  useEventActionHandler('userHover', userHoverHandler);
  
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Dispatch multiple actions
    dispatch('userClick', { x, y });
    dispatch('analytics', { 
      event: 'click', 
      data: { 
        timestamp: Date.now(),
        count: clickCount + 1
      } 
    });
  };

  const handleHover = (elementId: string) => {
    dispatch('userHover', { elementId });
  };
  
  return (
    <DemoCard title="Basic Action Usage">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Click Stats</Label>
            <div className="text-sm space-y-1">
              <div>Count: {clickCount}</div>
              <div>Last Click: {lastClick ? `(${lastClick.x}, ${lastClick.y})` : 'None'}</div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Actions</Label>
            <div className="text-sm space-y-1">
              <div>userClick: {clickCount} dispatched</div>
              <div>analytics: {clickCount} dispatched</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              onClick={handleClick} 
              variant="primary" 
              size="sm"
              onMouseEnter={() => handleHover('click-button')}
            >
              Click Me (Dispatches 2 Actions)
            </Button>
            <Button 
              onClick={() => handleHover('hover-button')} 
              variant="secondary" 
              size="sm"
            >
              Hover Action
            </Button>
          </div>
          
          <div 
            className="h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
            onClick={handleClick}
          >
            <span className="text-gray-500 text-sm">Click anywhere to dispatch actions</span>
          </div>
        </div>

        <CodeExample>
{`// 1. Define Actions (ActionPayloadMap optional)
interface EventActions extends ActionPayloadMap {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

// 2. Create Context with Renaming Pattern
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

// 3. Component Usage
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  // Register action handlers (properly memoized)
  const userClickHandler = useCallback((payload, controller) => {
    console.log('User clicked at:', payload.x, payload.y);
  }, []);
  
  useEventActionHandler('userClick', userClickHandler);
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Advanced Features Demo
function AdvancedFeaturesDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useEventAction();
  const [results, setResults] = useState<string[]>([]);
  
  // Advanced handler with result handling
  const apiCallHandler = useCallback(async (payload: { endpoint: string; method: string }, controller: any) => {
    logger.log('info', '🌐 API call handler started', payload);
    
    try {
      // Simulate API call with potential abort
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000);
        
        // Listen for abort signal
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Request aborted'));
        });
      });
      
      const result = `${payload.method} ${payload.endpoint} - Success`;
      logger.log('info', '✅ API call completed', { result });
      setResults(prev => [...prev, result]);
      
    } catch (error) {
      const errorMsg = `${payload.method} ${payload.endpoint} - ${(error as Error).message}`;
      logger.log('error', '❌ API call failed', { error: errorMsg });
      setResults(prev => [...prev, errorMsg]);
    }
  }, [logger]);

  const notificationHandler = useCallback((payload: { message: string; type: string }) => {
    logger.log('info', '🔔 Notification handler triggered', payload);
    setResults(prev => [...prev, `${payload.type.toUpperCase()}: ${payload.message}`]);
  }, [logger]);
  
  useEventActionHandler('apiCall', apiCallHandler);
  useEventActionHandler('notification', notificationHandler);
  
  const handleApiCall = async () => {
    try {
      const result = await dispatch('apiCall', { 
        endpoint: '/users', 
        method: 'GET' 
      });
      
      dispatch('notification', { 
        message: 'API call succeeded', 
        type: 'success' 
      });
      
    } catch (error) {
      dispatch('notification', { 
        message: 'API call failed', 
        type: 'error' 
      });
    }
  };

  const handleMultipleActions = async () => {
    // Dispatch multiple actions with different behaviors
    dispatch('notification', { message: 'Starting batch operations...', type: 'info' });
    
    Promise.all([
      dispatch('apiCall', { endpoint: '/posts', method: 'GET' }),
      dispatch('apiCall', { endpoint: '/comments', method: 'GET' })
    ]).then(() => {
      dispatch('notification', { message: 'All operations completed', type: 'success' });
    }).catch(() => {
      dispatch('notification', { message: 'Some operations failed', type: 'warning' });
    });
  };

  const clearResults = () => {
    setResults([]);
  };
  
  return (
    <DemoCard title="Advanced Features">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold">Action Results</Label>
          <div className="min-h-24 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded border text-sm">
            {results.length === 0 ? (
              <span className="text-gray-500">No results yet...</span>
            ) : (
              results.map((result, index) => (
                <div key={index} className="py-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleApiCall} variant="primary" size="sm">
            Single API Call
          </Button>
          <Button onClick={handleMultipleActions} variant="secondary" size="sm">
            Multiple Actions
          </Button>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>

        <CodeExample>
{`// Advanced handler with result handling
const apiCallHandler = useCallback(async (payload, controller) => {
  try {
    // Check for abort signal
    controller.signal.addEventListener('abort', () => {
      throw new Error('Request aborted');
    });
    
    const response = await fetch(payload.endpoint);
    return await response.json();
    
  } catch (error) {
    controller.abort('API call failed', error);
    throw error;
  }
}, []);

useEventActionHandler('apiCall', apiCallHandler);

// Usage with result handling
const handleApiCall = async () => {
  try {
    const result = await dispatch('apiCall', { endpoint: '/users' });
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed:', error);
  }
};`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Multiple Context Demo
function MultipleContextDemo() {
  const logger = useActionLoggerWithToast();
  const [systemStatus, setSystemStatus] = useState('stopped');
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  
  return (
    <SystemActionProvider>
      <MultipleContextContent />
    </SystemActionProvider>
  );
  
  function MultipleContextContent() {
    const systemDispatch = useSystemAction();
    
    // System action handlers
    const systemStartHandler = useCallback(() => {
      logger.log('info', '🚀 System starting...');
      setSystemStatus('running');
    }, [logger]);

    const systemStopHandler = useCallback(() => {
      logger.log('info', '🛑 System stopping...');
      setSystemStatus('stopped');
    }, [logger]);

    const configUpdateHandler = useCallback((payload: { key: string; value: any }) => {
      logger.log('info', '⚙️ Config updated', payload);
      setConfigValues(prev => ({ ...prev, [payload.key]: payload.value }));
    }, [logger]);

    const healthCheckHandler = useCallback(async (payload: { service: string }) => {
      logger.log('info', '💓 Health check', payload);
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 200));
      const result = { service: payload.service, status: 'healthy', timestamp: Date.now() };
      logger.log('info', '✅ Health check completed', result);
    }, [logger]);
    
    useSystemActionHandler('systemStart', systemStartHandler);
    useSystemActionHandler('systemStop', systemStopHandler);
    useSystemActionHandler('configUpdate', configUpdateHandler);
    useSystemActionHandler('healthCheck', healthCheckHandler);
    
    const handleSystemToggle = () => {
      if (systemStatus === 'stopped') {
        systemDispatch('systemStart');
      } else {
        systemDispatch('systemStop');
      }
    };

    const handleConfigUpdate = () => {
      systemDispatch('configUpdate', { 
        key: 'debug', 
        value: !configValues.debug 
      });
    };

    const handleHealthCheck = async () => {
      try {
        await systemDispatch('healthCheck', { service: 'api' });
        logger.log('info', '✅ Health check completed');
      } catch (error) {
        logger.log('error', '❌ Health check failed', error);
      }
    };
    
    return (
      <DemoCard title="Multiple Action Contexts">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Label className="font-semibold">System Status</Label>
              <div className="text-sm space-y-1">
                <div>Status: <span className={systemStatus === 'running' ? 'text-green-600' : 'text-red-600'}>{systemStatus}</span></div>
                <div>Config Keys: {Object.keys(configValues).length}</div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Label className="font-semibold">Configuration</Label>
              <div className="text-sm space-y-1">
                {Object.keys(configValues).length === 0 ? (
                  <div className="text-gray-500">No config values</div>
                ) : (
                  Object.entries(configValues).map(([key, value]) => (
                    <div key={key}>{key}: {String(value)}</div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleSystemToggle} 
              variant={systemStatus === 'running' ? 'secondary' : 'primary'} 
              size="sm"
            >
              {systemStatus === 'running' ? 'Stop System' : 'Start System'}
            </Button>
            <Button onClick={handleConfigUpdate} variant="secondary" size="sm">
              Toggle Debug Config
            </Button>
            <Button onClick={handleHealthCheck} variant="outline" size="sm">
              Health Check
            </Button>
          </div>

          <CodeExample>
{`// Multiple Action Contexts
interface SystemActions extends ActionPayloadMap {
  systemStart: void;
  systemStop: void;
  configUpdate: { key: string; value: any };
}

const {
  Provider: SystemActionProvider,
  useActionDispatch: useSystemAction,
  useActionHandler: useSystemActionHandler
} = createActionContext<SystemActions>('System');

function SystemComponent() {
  const systemDispatch = useSystemAction();
  
  const systemStartHandler = useCallback(() => {
    console.log('System starting...');
  }, []);
  
  useSystemActionHandler('systemStart', systemStartHandler);
  
  return (
    <button onClick={() => systemDispatch('systemStart')}>
      Start System
    </button>
  );
}`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Main Component
function ActionBasicUsagePage() {
  return (
    <PageWithLogMonitor pageId="action-basic-usage">
      <EventActionProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Action Basic Usage
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Fundamental Action Only pattern with type-safe dispatching and handler registration.
              Perfect for event systems, analytics, and side effects handling.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Basic Action Usage">
              <BasicActionDemo />
            </Section>

            <Section title="Advanced Features">
              <AdvancedFeaturesDemo />
            </Section>

            <Section title="Multiple Contexts">
              <MultipleContextDemo />
            </Section>

            <Section title="Key Features & Best Practices">
              <DemoCard title="Action Pattern Guidelines">
                <div className="space-y-4">
                  <div className="prose">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700">✅ Features</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Type-safe action dispatching</li>
                          <li>Action handler registration with proper cleanup</li>
                          <li>Abort support for cancellable operations</li>
                          <li>Result handling with async support</li>
                          <li>Lightweight (no store overhead)</li>
                          <li>Priority-based handler execution</li>
                          <li>Multiple context support</li>
                          <li>Memoized handler registration</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700">🎯 Best For</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Pure side effects (analytics, logging)</li>
                          <li>Event systems and cross-component communication</li>
                          <li>Command patterns and user actions</li>
                          <li>API integration and external service calls</li>
                          <li>Notifications and toast messages</li>
                          <li>System commands and configuration</li>
                          <li>Modular architecture with team separation</li>
                          <li>Actions that don't require state management</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </EventActionProvider>
    </PageWithLogMonitor>
  );
}

export default ActionBasicUsagePage;