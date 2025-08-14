# Action Only Pattern Example

This example demonstrates the **Action Only Pattern** for pure action dispatching without state management, ideal for event systems, command patterns, and business logic orchestration.

## Use Cases

- Event tracking and analytics
- Command patterns and business logic
- Cross-component communication
- Side effects and API calls
- User interaction handling

## Complete Example

### 1. Define Action Types

```typescript
// types/events.ts
import type { ActionPayloadMap } from '@context-action/core';

export interface EventActions extends ActionPayloadMap {
  // Analytics events
  trackEvent: { 
    event: string; 
    data: any; 
    category?: string; 
  };
  
  // User interaction events
  userInteraction: { 
    type: 'click' | 'scroll' | 'hover'; 
    element: string; 
    timestamp?: number; 
  };
  
  // Error logging
  logError: { 
    error: string; 
    context: any; 
    severity: 'low' | 'medium' | 'high' | 'critical'; 
  };
  
  // API events
  apiCall: { 
    endpoint: string; 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'; 
    payload?: any; 
  };
  
  // System events
  systemEvent: { 
    type: 'startup' | 'shutdown' | 'error' | 'warning'; 
    message: string; 
    metadata?: Record<string, any>; 
  };
}
```

### 2. Create Action Context

```typescript
// contexts/EventContext.tsx
import { createActionContext } from '@context-action/react';
import type { EventActions } from '../types/events';

export const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');
```

### 3. Event Handler Components

```typescript
// components/handlers/AnalyticsHandler.tsx
import React, { useCallback } from 'react';
import { useEventActionHandler } from '../../contexts/EventContext';

export function AnalyticsHandler() {
  // Track events with Google Analytics
  useEventActionHandler('trackEvent', useCallback(async (payload, controller) => {
    try {
      // Enrich payload with metadata
      controller.modifyPayload(current => ({
        ...current,
        timestamp: Date.now(),
        sessionId: getSessionId(),
        userId: getCurrentUserId()
      }));
      
      // Send to analytics service
      await gtag('event', payload.event, {
        event_category: payload.category || 'general',
        event_label: JSON.stringify(payload.data),
        custom_parameter_1: payload.data
      });
      
      // Set result for other handlers
      controller.setResult({ 
        provider: 'google-analytics', 
        sent: true,
        timestamp: Date.now()
      });
      
      return { success: true, provider: 'GA4' };
      
    } catch (error) {
      controller.setResult({ 
        provider: 'google-analytics', 
        sent: false, 
        error: (error as Error).message 
      });
      
      // Don't abort - let other analytics providers try
      return { success: false, error: (error as Error).message };
    }
  }, []), { priority: 100, id: 'google-analytics' });
  
  // Backup analytics provider
  useEventActionHandler('trackEvent', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const gaFailed = results.some(r => r.provider === 'google-analytics' && !r.sent);
    
    if (gaFailed) {
      // Try alternative analytics service
      await alternativeAnalytics.track(payload.event, payload.data);
      return { success: true, provider: 'alternative', fallback: true };
    }
    
    return { success: true, provider: 'alternative', skipped: true };
  }, []), { priority: 80, id: 'alternative-analytics' });
  
  return null; // This component only handles events
}
```

```typescript
// components/handlers/ErrorHandler.tsx
import React, { useCallback } from 'react';
import { useEventAction, useEventActionHandler } from '../../contexts/EventContext';

export function ErrorHandler() {
  const dispatch = useEventAction();
  
  // Error logging with different severity levels
  useEventActionHandler('logError', useCallback(async (payload, controller) => {
    const errorLog = {
      error: payload.error,
      context: payload.context,
      severity: payload.severity,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to error reporting service based on severity
    switch (payload.severity) {
      case 'critical':
        // Immediate alert
        await errorReporter.captureException(errorLog, { level: 'fatal' });
        // Also trigger system event
        dispatch('systemEvent', {
          type: 'error',
          message: `Critical error: ${payload.error}`,
          metadata: errorLog
        });
        break;
        
      case 'high':
        await errorReporter.captureException(errorLog, { level: 'error' });
        break;
        
      case 'medium':
        await errorReporter.captureMessage(errorLog, { level: 'warning' });
        break;
        
      case 'low':
        // Just log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Low severity error:', errorLog);
        }
        break;
    }
    
    controller.setResult({ 
      logged: true, 
      severity: payload.severity,
      timestamp: errorLog.timestamp
    });
    
    return { success: true, errorId: generateErrorId() };
    
  }, [dispatch]), { priority: 90, id: 'error-logger' });
  
  return null;
}
```

### 4. User Interaction Components

```typescript
// components/InteractiveButton.tsx
import React from 'react';
import { useEventAction } from '../contexts/EventContext';

interface InteractiveButtonProps {
  children: React.ReactNode;
  eventName: string;
  eventData?: any;
  onClick?: () => void;
}

export function InteractiveButton({ 
  children, 
  eventName, 
  eventData, 
  onClick 
}: InteractiveButtonProps) {
  const dispatch = useEventAction();
  
  const handleClick = async () => {
    // Track user interaction
    dispatch('userInteraction', {
      type: 'click',
      element: eventName,
      timestamp: Date.now()
    });
    
    // Track custom event
    dispatch('trackEvent', {
      event: eventName,
      data: eventData || {},
      category: 'user-interaction'
    });
    
    // Execute custom onClick if provided
    if (onClick) {
      try {
        onClick();
      } catch (error) {
        dispatch('logError', {
          error: (error as Error).message,
          context: { component: 'InteractiveButton', eventName },
          severity: 'medium'
        });
      }
    }
  };
  
  const handleHover = () => {
    dispatch('userInteraction', {
      type: 'hover',
      element: eventName
    });
  };
  
  return (
    <button 
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="interactive-button"
    >
      {children}
    </button>
  );
}
```

### 5. API Integration Component

```typescript
// components/ApiManager.tsx
import React, { useCallback } from 'react';
import { useEventAction, useEventActionHandler } from '../contexts/EventContext';

export function ApiManager() {
  const dispatch = useEventAction();
  
  // API call handler with comprehensive pipeline
  useEventActionHandler('apiCall', useCallback(async (payload, controller) => {
    const startTime = Date.now();
    
    try {
      // Pre-processing
      controller.modifyPayload(current => ({
        ...current,
        timestamp: startTime,
        requestId: generateRequestId(),
        headers: {
          ...current.headers,
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId()
        }
      }));
      
      // Make API call
      const response = await fetch(payload.endpoint, {
        method: payload.method,
        headers: payload.headers,
        body: payload.payload ? JSON.stringify(payload.payload) : undefined
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Track successful API call
      dispatch('trackEvent', {
        event: 'api_call_success',
        data: {
          endpoint: payload.endpoint,
          method: payload.method,
          duration,
          status: response.status
        },
        category: 'api'
      });
      
      controller.setResult({
        step: 'api-call',
        success: true,
        status: response.status,
        duration,
        data
      });
      
      return { success: true, data, duration };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed API call
      dispatch('logError', {
        error: (error as Error).message,
        context: {
          endpoint: payload.endpoint,
          method: payload.method,
          duration,
          payload: payload.payload
        },
        severity: 'high'
      });
      
      controller.abort(`API call failed: ${(error as Error).message}`);
    }
  }, [dispatch]), { priority: 100, id: 'api-handler' });
  
  return null;
}
```

### 6. Main Application

```typescript
// App.tsx
import React from 'react';
import { EventActionProvider } from './contexts/EventContext';
import { AnalyticsHandler } from './components/handlers/AnalyticsHandler';
import { ErrorHandler } from './components/handlers/ErrorHandler';
import { ApiManager } from './components/ApiManager';
import { InteractiveButton } from './components/InteractiveButton';
import { SystemMonitor } from './components/SystemMonitor';

export default function App() {
  return (
    <EventActionProvider>
      {/* Handler components - register event processors */}
      <AnalyticsHandler />
      <ErrorHandler />
      <ApiManager />
      <SystemMonitor />
      
      {/* UI components - dispatch events */}
      <div className="app">
        <header>
          <h1>Action Only Pattern Demo</h1>
        </header>
        
        <main>
          <section>
            <h2>Interactive Elements</h2>
            
            <InteractiveButton 
              eventName="cta_click"
              eventData={{ section: 'hero', variant: 'primary' }}
            >
              Call to Action
            </InteractiveButton>
            
            <InteractiveButton 
              eventName="feature_explore"
              eventData={{ feature: 'analytics' }}
              onClick={() => console.log('Exploring analytics feature')}
            >
              Explore Analytics
            </InteractiveButton>
          </section>
          
          <section>
            <h2>System Actions</h2>
            <ApiTestComponent />
            <ErrorTestComponent />
          </section>
        </main>
      </div>
    </EventActionProvider>
  );
}
```

### 7. System Monitoring

```typescript
// components/SystemMonitor.tsx
import React, { useCallback, useEffect } from 'react';
import { useEventAction, useEventActionHandler } from '../contexts/EventContext';

export function SystemMonitor() {
  const dispatch = useEventAction();
  
  // System event handler
  useEventActionHandler('systemEvent', useCallback(async (payload, controller) => {
    const systemLog = {
      type: payload.type,
      message: payload.message,
      metadata: payload.metadata || {},
      timestamp: Date.now(),
      severity: getSeverityFromType(payload.type)
    };
    
    // Log to console with appropriate level
    switch (systemLog.severity) {
      case 'critical':
        console.error('🚨 CRITICAL:', systemLog);
        break;
      case 'high':
        console.error('❌ ERROR:', systemLog);
        break;
      case 'medium':
        console.warn('⚠️  WARNING:', systemLog);
        break;
      case 'low':
        console.info('ℹ️  INFO:', systemLog);
        break;
    }
    
    // Send to monitoring service
    if (systemLog.severity === 'critical' || systemLog.severity === 'high') {
      await monitoringService.alert(systemLog);
    }
    
    controller.setResult({ 
      logged: true, 
      severity: systemLog.severity,
      alertSent: systemLog.severity === 'critical'
    });
    
    return systemLog;
  }, []), { priority: 95, id: 'system-monitor' });
  
  // Monitor page performance
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          dispatch('trackEvent', {
            event: 'page_load_performance',
            data: {
              loadTime: entry.loadEventEnd - entry.loadEventStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              firstContentfulPaint: entry.loadEventEnd
            },
            category: 'performance'
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    
    return () => observer.disconnect();
  }, [dispatch]);
  
  // Monitor errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      dispatch('logError', {
        error: event.message,
        context: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        },
        severity: 'high'
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      dispatch('logError', {
        error: String(event.reason),
        context: { type: 'unhandled-rejection' },
        severity: 'critical'
      });
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [dispatch]);
  
  return null;
}

function getSeverityFromType(type: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (type) {
    case 'error': return 'critical';
    case 'warning': return 'high';
    case 'startup': case 'shutdown': return 'medium';
    default: return 'low';
  }
}
```

### 8. API Testing Component

```typescript
// components/ApiTestComponent.tsx
import React from 'react';
import { useEventAction } from '../contexts/EventContext';

export function ApiTestComponent() {
  const dispatch = useEventAction();
  
  const testApiCall = async () => {
    try {
      await dispatch('apiCall', {
        endpoint: 'https://jsonplaceholder.typicode.com/users/1',
        method: 'GET'
      });
    } catch (error) {
      console.error('API test failed:', error);
    }
  };
  
  const testFailedApiCall = async () => {
    try {
      await dispatch('apiCall', {
        endpoint: 'https://invalid-url-that-will-fail.com/api',
        method: 'GET'
      });
    } catch (error) {
      console.error('Expected API failure:', error);
    }
  };
  
  return (
    <div className="api-test">
      <h3>API Testing</h3>
      <button onClick={testApiCall}>
        Test Successful API Call
      </button>
      <button onClick={testFailedApiCall}>
        Test Failed API Call
      </button>
    </div>
  );
}
```

### 9. Error Testing Component

```typescript
// components/ErrorTestComponent.tsx
import React from 'react';
import { useEventAction } from '../contexts/EventContext';

export function ErrorTestComponent() {
  const dispatch = useEventAction();
  
  const triggerError = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    dispatch('logError', {
      error: `Test ${severity} severity error`,
      context: {
        component: 'ErrorTestComponent',
        action: 'triggerError',
        testMode: true
      },
      severity
    });
  };
  
  const triggerSystemEvent = () => {
    dispatch('systemEvent', {
      type: 'warning',
      message: 'Test system warning triggered',
      metadata: { source: 'user-action', test: true }
    });
  };
  
  return (
    <div className="error-test">
      <h3>Error Testing</h3>
      <div className="error-buttons">
        <button onClick={() => triggerError('low')}>
          Low Severity Error
        </button>
        <button onClick={() => triggerError('medium')}>
          Medium Severity Error
        </button>
        <button onClick={() => triggerError('high')}>
          High Severity Error
        </button>
        <button onClick={() => triggerError('critical')}>
          Critical Error
        </button>
      </div>
      <button onClick={triggerSystemEvent}>
        Trigger System Event
      </button>
    </div>
  );
}
```

## Advanced Pipeline Control

### Multi-Stage Processing

```typescript
function AdvancedEventProcessor() {
  const dispatch = useEventAction();
  
  // Stage 1: Input validation and enrichment
  useEventActionHandler('trackEvent', useCallback((payload, controller) => {
    // Validate required fields
    if (!payload.event) {
      controller.abort('Event name is required');
      return;
    }
    
    // Enrich payload
    controller.modifyPayload(current => ({
      ...current,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getCurrentUserId(),
      pageUrl: window.location.href,
      referrer: document.referrer
    }));
    
    controller.setResult({ stage: 'validation', valid: true });
    return { stage: 'validation', success: true };
  }, []), { priority: 100, id: 'validator' });
  
  // Stage 2: Rate limiting
  useEventActionHandler('trackEvent', useCallback((payload, controller) => {
    const rateLimiter = getRateLimiter(payload.event);
    
    if (!rateLimiter.isAllowed()) {
      // Don't abort - just skip this event
      controller.setResult({ stage: 'rate-limit', allowed: false });
      return { stage: 'rate-limit', skipped: true };
    }
    
    rateLimiter.consume();
    controller.setResult({ stage: 'rate-limit', allowed: true });
    return { stage: 'rate-limit', success: true };
  }, []), { priority: 90, id: 'rate-limiter' });
  
  // Stage 3: Primary analytics
  useEventActionHandler('trackEvent', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const rateLimited = results.some(r => r.stage === 'rate-limit' && !r.allowed);
    
    if (rateLimited) {
      return { stage: 'analytics', skipped: true, reason: 'rate-limited' };
    }
    
    // Send to primary analytics
    await primaryAnalytics.track(payload.event, payload.data);
    
    controller.setResult({ stage: 'analytics', provider: 'primary', sent: true });
    return { stage: 'analytics', success: true, provider: 'primary' };
  }, []), { priority: 80, id: 'primary-analytics' });
  
  // Stage 4: Secondary analytics (backup)
  useEventActionHandler('trackEvent', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const primaryFailed = !results.some(r => 
      r.stage === 'analytics' && r.provider === 'primary' && r.sent
    );
    
    if (primaryFailed) {
      await secondaryAnalytics.track(payload.event, payload.data);
      return { stage: 'backup-analytics', success: true, provider: 'secondary' };
    }
    
    return { stage: 'backup-analytics', skipped: true, reason: 'primary-succeeded' };
  }, []), { priority: 70, id: 'backup-analytics' });
  
  return null;
}
```

## Handler Composition Patterns

### Sequential Processing

```typescript
function SequentialProcessor() {
  // Handler 1: Preparation
  useEventActionHandler('processData', useCallback((payload, controller) => {
    const prepared = prepareData(payload.data);
    controller.modifyPayload(current => ({ ...current, data: prepared }));
    return { step: 'preparation', success: true };
  }, []), { priority: 100 });
  
  // Handler 2: Validation  
  useEventActionHandler('processData', useCallback((payload, controller) => {
    const isValid = validateData(payload.data);
    if (!isValid) {
      controller.abort('Data validation failed');
      return;
    }
    return { step: 'validation', success: true };
  }, []), { priority: 90 });
  
  // Handler 3: Processing
  useEventActionHandler('processData', useCallback((payload) => {
    const result = processData(payload.data);
    return { step: 'processing', success: true, result };
  }, []), { priority: 80 });
  
  return null;
}
```

## Key Benefits

✅ **Type Safety**: Full TypeScript support with automatic type inference  
✅ **Pipeline Control**: Advanced control flow with abort, modify, and result management  
✅ **Priority Execution**: Handlers execute in priority order for predictable behavior  
✅ **Error Resilience**: Individual handler failures don't stop the entire pipeline  
✅ **Automatic Cleanup**: React integration handles registration/cleanup automatically  
✅ **Lightweight**: No state management overhead, focused on action processing

## Best Practices

1. **Use Handler Components**: Create dedicated components for handler registration
2. **Priority Planning**: Assign priorities based on execution order needs
3. **Error Handling**: Use `controller.abort()` for critical failures, return errors for non-critical
4. **Payload Enrichment**: Use `controller.modifyPayload()` to add metadata
5. **Result Sharing**: Use `controller.setResult()` and `getResults()` for handler coordination
6. **useCallback**: Always wrap handlers with `useCallback` for performance

## Related

- **[Action Pipeline Guide](../guide/action-pipeline)** - Comprehensive action pipeline documentation
- **[ActionRegister API](../api/core/action-register)** - Core action system
- **[PipelineController API](../api/core/pipeline-controller)** - Pipeline control methods
- **[Pattern Composition Example](./pattern-composition)** - Combining with Store Pattern