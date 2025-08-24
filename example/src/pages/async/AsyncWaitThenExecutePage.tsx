import React, { useCallback, useState, useRef } from 'react';
import { createDeclarativeStorePattern, createActionContext, createRefContext } from '@context-action/react';
import { LogMonitorProvider, useLogMonitor } from '../logger/LogMonitorProvider';

// Define action types for wait-then-execute demonstrations
interface WaitExecuteActions {
  basicWaitExecute: { elementKey: string; content: string };
  animationSequence: { elementKey: string; animation: string };
  multiElementCoordination: { elements: string[]; operation: string };
  sequentialOperations: { steps: Array<{ element: string; action: string; data: any }> };
  formValidation: { formData: any };
  modalOperations: { action: 'open' | 'focus' | 'close' };
  canvasDrawing: { shape: 'circle' | 'rectangle' | 'line'; color: string };
}

// Ref types for various elements
type WaitExecuteRefs = {
  dynamicContent: HTMLDivElement;
  animationTarget: HTMLDivElement;
  sourceElement: HTMLDivElement;
  targetElement: HTMLDivElement;
  setupElement: HTMLDivElement;
  processElement: HTMLDivElement;
  completeElement: HTMLDivElement;
  formElement: HTMLFormElement;
  formInput: HTMLInputElement;
  modalElement: HTMLDialogElement;
  modalInput: HTMLInputElement;
  canvasElement: HTMLCanvasElement;
  workArea: HTMLDivElement;
};

// Store for tracking element states and operations
const {
  Provider: WaitExecuteStoreProvider,
  useStore: useWaitExecuteStore,
} = createDeclarativeStorePattern('WaitExecute', {
  elementStates: { 
    initialValue: {} as Record<string, { mounted: boolean; ready: boolean; timestamp: number }> 
  },
  animationQueue: { initialValue: [] as Array<{ element: string; animation: string; timestamp: number }> },
  operationHistory: { initialValue: [] as Array<{ operation: string; elements: string[]; success: boolean; timestamp: number }> },
  canvasOperations: { initialValue: [] as Array<{ shape: string; color: string; timestamp: number }> },
  formState: { 
    initialValue: { 
      isValid: false, 
      errors: [] as string[], 
      lastValidation: 0 
    } 
  }
});

// Action context
const {
  Provider: WaitExecuteActionProvider,
  useActionDispatch: useWaitExecuteAction,
  useActionHandler: useWaitExecuteActionHandler
} = createActionContext<WaitExecuteActions>('WaitExecuteActions');

// Ref context
const {
  Provider: WaitExecuteRefProvider,
  useRefHandler: useWaitExecuteRef,
  useWaitForRefs
} = createRefContext<WaitExecuteRefs>('WaitExecuteRefs');

function AsyncWaitThenExecutePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Wait-Then-Execute Pattern</h1>
      <p className="text-lg text-gray-600 mb-8">
        Pattern for safely executing DOM operations after ensuring element availability using waitForRefs.
        This prevents errors from attempting to manipulate DOM elements before they're ready.
      </p>
      
      <LogMonitorProvider>
        <WaitExecuteStoreProvider>
          <WaitExecuteActionProvider>
            <WaitExecuteRefProvider>
              <div className="space-y-8">
                <BasicWaitExecuteDemo />
                <AnimationSequenceDemo />
                <MultiElementCoordinationDemo />
                <SequentialOperationsDemo />
                <FormValidationDemo />
                <ModalOperationsDemo />
                <CanvasDrawingDemo />
                <BestPracticesSection />
              </div>
            </WaitExecuteRefProvider>
          </WaitExecuteActionProvider>
        </WaitExecuteStoreProvider>
      </LogMonitorProvider>
    </div>
  );
}

function BasicWaitExecuteDemo() {
  const { log } = useLogMonitor();
  const [showElement, setShowElement] = useState(false);
  const dispatch = useWaitExecuteAction();
  const dynamicContentRef = useWaitExecuteRef('dynamicContent');
  const waitForRefs = useWaitForRefs();
  const elementStatesStore = useWaitExecuteStore('elementStates');
  
  // Basic wait-then-execute handler
  useWaitExecuteActionHandler('basicWaitExecute', useCallback(async (payload, controller) => {
    try {
      log(`⏳ Waiting for element: ${payload.elementKey}`);
      
      // Wait for the element to be available
      await waitForRefs(payload.elementKey as keyof WaitExecuteRefs);
      log(`✅ Element ${payload.elementKey} is now available`);
      
      // Update element state tracking
      const currentStates = elementStatesStore.getValue();
      elementStatesStore.setValue({
        ...currentStates,
        [payload.elementKey]: {
          mounted: true,
          ready: true,
          timestamp: Date.now()
        }
      });
      
      // Safely access and manipulate the element
      if (payload.elementKey === 'dynamicContent' && dynamicContentRef.target) {
        const element = dynamicContentRef.target;
        
        // Apply content and styles
        element.textContent = payload.content;
        element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s ease';
        element.style.color = 'white';
        element.style.fontWeight = 'bold';
        
        // Add some visual feedback
        element.classList.add('animate-pulse');
        
        // Reset after a delay
        setTimeout(() => {
          if (element) {
            element.style.transform = 'scale(1)';
            element.classList.remove('animate-pulse');
          }
        }, 1000);
        
        log(`🎯 Successfully updated ${payload.elementKey} with content: "${payload.content}"`);
      }
      
    } catch (error) {
      log(`❌ Wait-then-execute failed for ${payload.elementKey}: ${error}`);
    }
  }, [waitForRefs, dynamicContentRef, elementStatesStore, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">Basic Wait-Then-Execute</h2>
      <p className="text-gray-600 mb-4">
        Fundamental pattern: wait for element availability, then safely perform DOM operations.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <button
            onClick={() => setShowElement(!showElement)}
            className={`px-4 py-2 rounded transition-colors ${
              showElement 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {showElement ? 'Hide' : 'Show'} Dynamic Element
          </button>
          
          {showElement && (
            <>
              <button
                onClick={() => dispatch('basicWaitExecute', { 
                  elementKey: 'dynamicContent', 
                  content: 'Hello, Wait-Then-Execute!' 
                })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update with Greeting
              </button>
              
              <button
                onClick={() => dispatch('basicWaitExecute', { 
                  elementKey: 'dynamicContent', 
                  content: `Updated at ${new Date().toLocaleTimeString()}` 
                })}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Update with Timestamp
              </button>
              
              <button
                onClick={() => dispatch('basicWaitExecute', { 
                  elementKey: 'dynamicContent', 
                  content: `Random: ${Math.random().toString(36).substring(2, 8)}` 
                })}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Update with Random
              </button>
            </>
          )}
        </div>
        
        {showElement && (
          <div
            ref={dynamicContentRef.setRef}
            className="p-6 bg-blue-50 border border-blue-200 rounded transition-all duration-300 min-h-[80px] flex items-center justify-center text-lg"
          >
            Waiting for content update...
          </div>
        )}
        
        <ElementStateIndicator elementKey="dynamicContent" />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const actionHandler = useCallback(async () => {
  await waitForRefs('targetElement');
  
  const element = elementRef.target;
  if (element) {
    // Safe DOM manipulation
    element.style.transform = 'scale(1.1)';
    element.focus();
  }
}, [waitForRefs, elementRef]);`}
        </pre>
      </div>
    </section>
  );
}

function AnimationSequenceDemo() {
  const { log } = useLogMonitor();
  const dispatch = useWaitExecuteAction();
  const animationTargetRef = useWaitExecuteRef('animationTarget');
  const waitForRefs = useWaitForRefs();
  const animationQueueStore = useWaitExecuteStore('animationQueue');
  
  // Animation sequence handler
  useWaitExecuteActionHandler('animationSequence', useCallback(async (payload, controller) => {
    try {
      log(`🎬 Starting animation sequence: ${payload.animation}`);
      
      // Wait for animation target
      await waitForRefs(payload.elementKey as keyof WaitExecuteRefs);
      
      const element = animationTargetRef.target;
      if (!element) {
        throw new Error('Animation target not found');
      }
      
      // Add to animation queue
      const currentQueue = animationQueueStore.getValue();
      animationQueueStore.setValue([
        ...currentQueue,
        { element: payload.elementKey, animation: payload.animation, timestamp: Date.now() }
      ]);
      
      // Apply animation based on type
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      
      switch (payload.animation) {
        case 'bounce':
          element.style.transform = 'translateY(-20px) scale(1.1)';
          element.style.background = 'linear-gradient(45deg, #FF6B35, #F7931E)';
          setTimeout(() => {
            if (element) {
              element.style.transform = 'translateY(0) scale(1)';
              element.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            }
          }, 300);
          break;
          
        case 'spin':
          element.style.transform = 'rotate(360deg) scale(1.2)';
          element.style.background = 'linear-gradient(45deg, #11998e, #38ef7d)';
          setTimeout(() => {
            if (element) {
              element.style.transform = 'rotate(0deg) scale(1)';
              element.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            }
          }, 600);
          break;
          
        case 'pulse':
          element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
          element.style.transform = 'scale(1.15)';
          setTimeout(() => {
            if (element) {
              element.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              element.style.transform = 'scale(1)';
            }
          }, 600);
          break;
          
        case 'shake':
          let iterations = 0;
          const shakeInterval = setInterval(() => {
            if (element && iterations < 6) {
              const offset = iterations % 2 === 0 ? '5px' : '-5px';
              element.style.transform = `translateX(${offset})`;
              iterations++;
            } else {
              clearInterval(shakeInterval);
              if (element) element.style.transform = 'translateX(0)';
            }
          }, 100);
          break;
      }
      
      log(`✅ Animation ${payload.animation} applied successfully`);
      
    } catch (error) {
      log(`❌ Animation sequence failed: ${error}`);
    }
  }, [waitForRefs, animationTargetRef, animationQueueStore, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-purple-600">Animation Sequence</h2>
      <p className="text-gray-600 mb-4">
        Advanced wait-then-execute for coordinated animation sequences with proper timing.
      </p>
      
      <div className="flex flex-col items-center space-y-4">
        <div
          ref={animationTargetRef.setRef}
          className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
        >
          Animation<br/>Target
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => dispatch('animationSequence', { elementKey: 'animationTarget', animation: 'bounce' })}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Bounce
          </button>
          
          <button
            onClick={() => dispatch('animationSequence', { elementKey: 'animationTarget', animation: 'spin' })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Spin
          </button>
          
          <button
            onClick={() => dispatch('animationSequence', { elementKey: 'animationTarget', animation: 'pulse' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Pulse
          </button>
          
          <button
            onClick={() => dispatch('animationSequence', { elementKey: 'animationTarget', animation: 'shake' })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Shake
          </button>
        </div>
        
        <AnimationQueueDisplay />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Animation Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const animateElement = useCallback(async () => {
  // Wait for element to be available
  await waitForRefs('animationTarget');
  
  const element = animationTargetRef.target;
  if (!element) return;
  
  // Apply animation sequence
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'scale(1.2)';
  
  // Reset after animation
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 300);
}, [waitForRefs, animationTargetRef]);`}
        </pre>
      </div>
    </section>
  );
}

function MultiElementCoordinationDemo() {
  const { log } = useLogMonitor();
  const dispatch = useWaitExecuteAction();
  const sourceElementRef = useWaitExecuteRef('sourceElement');
  const targetElementRef = useWaitExecuteRef('targetElement');
  const waitForRefs = useWaitForRefs();
  const [sourceData, setSourceData] = useState('Initial Data');
  
  // Multi-element coordination handler
  useWaitExecuteActionHandler('multiElementCoordination', useCallback(async (payload, controller) => {
    try {
      log(`🔗 Starting multi-element coordination: ${payload.operation}`);
      
      // Wait for multiple elements
      await Promise.all([
        waitForRefs('sourceElement'),
        waitForRefs('targetElement')
      ]);
      
      log('✅ All elements are available');
      
      const source = sourceElementRef.target;
      const target = targetElementRef.target;
      
      if (source && target) {
        switch (payload.operation) {
          case 'transfer':
            // Transfer data from source to target
            const sourceText = source.textContent || '';
            target.textContent = `Received: ${sourceText}`;
            target.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            target.style.color = 'white';
            
            // Visual feedback on source
            source.style.opacity = '0.7';
            source.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
              if (source) {
                source.style.opacity = '1';
                source.style.transform = 'scale(1)';
              }
            }, 500);
            break;
            
          case 'synchronize':
            // Synchronize both elements
            const timestamp = new Date().toLocaleTimeString();
            source.textContent = `Sync: ${timestamp}`;
            target.textContent = `Sync: ${timestamp}`;
            
            // Synchronized animation
            [source, target].forEach(el => {
              el.style.transition = 'all 0.3s ease';
              el.style.transform = 'scale(1.05)';
              el.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
              el.style.color = 'white';
              
              setTimeout(() => {
                if (el) {
                  el.style.transform = 'scale(1)';
                }
              }, 300);
            });
            break;
            
          case 'chain':
            // Chain reaction effect
            source.style.background = 'linear-gradient(45deg, #FF6B35, #F7931E)';
            source.style.transform = 'rotate(5deg)';
            
            setTimeout(() => {
              if (target) {
                target.style.background = 'linear-gradient(45deg, #FF6B35, #F7931E)';
                target.style.transform = 'rotate(-5deg)';
                target.textContent = `Chain reaction from source!`;
              }
            }, 200);
            
            setTimeout(() => {
              if (source) source.style.transform = 'rotate(0deg)';
              if (target) target.style.transform = 'rotate(0deg)';
            }, 600);
            break;
        }
        
        log(`🎯 Multi-element operation "${payload.operation}" completed successfully`);
      } else {
        throw new Error('Elements not available after waiting');
      }
      
    } catch (error) {
      log(`❌ Multi-element coordination failed: ${error}`);
    }
  }, [waitForRefs, sourceElementRef, targetElementRef, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">Multi-Element Coordination</h2>
      <p className="text-gray-600 mb-4">
        Coordinating operations across multiple elements by waiting for all required elements first.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={sourceData}
            onChange={(e) => setSourceData(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter source data"
          />
          
          <button
            onClick={() => {
              if (sourceElementRef.target) {
                sourceElementRef.target.textContent = sourceData;
              }
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Update Source
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Source Element</h4>
            <div
              ref={sourceElementRef.setRef}
              className="p-4 bg-blue-50 border border-blue-200 rounded min-h-[80px] flex items-center justify-center transition-all duration-300"
            >
              Source Data Container
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Target Element</h4>
            <div
              ref={targetElementRef.setRef}
              className="p-4 bg-green-50 border border-green-200 rounded min-h-[80px] flex items-center justify-center transition-all duration-300"
            >
              Target Data Container
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => dispatch('multiElementCoordination', { elements: ['sourceElement', 'targetElement'], operation: 'transfer' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Transfer Data
          </button>
          
          <button
            onClick={() => dispatch('multiElementCoordination', { elements: ['sourceElement', 'targetElement'], operation: 'synchronize' })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Synchronize
          </button>
          
          <button
            onClick={() => dispatch('multiElementCoordination', { elements: ['sourceElement', 'targetElement'], operation: 'chain' })}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Chain Reaction
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Multi-Element Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const coordinateElements = useCallback(async () => {
  // Wait for multiple elements
  await Promise.all([
    waitForRefs('sourceElement'),
    waitForRefs('targetElement')
  ]);
  
  const source = sourceElementRef.target;
  const target = targetElementRef.target;
  
  if (source && target) {
    // Safe to coordinate between elements
    const sourceData = source.dataset.value;
    target.textContent = \`Received: \${sourceData}\`;
  }
}, [waitForRefs, sourceElementRef, targetElementRef]);`}
        </pre>
      </div>
    </section>
  );
}

function SequentialOperationsDemo() {
  const { log } = useLogMonitor();
  const dispatch = useWaitExecuteAction();
  const setupElementRef = useWaitExecuteRef('setupElement');
  const processElementRef = useWaitExecuteRef('processElement');
  const completeElementRef = useWaitExecuteRef('completeElement');
  const waitForRefs = useWaitForRefs();
  const operationHistoryStore = useWaitExecuteStore('operationHistory');
  
  // Sequential operations handler
  useWaitExecuteActionHandler('sequentialOperations', useCallback(async (payload, controller) => {
    const operationStart = Date.now();
    let success = true;
    
    try {
      log('🔄 Starting sequential operations workflow');
      
      for (const [index, step] of payload.steps.entries()) {
        log(`📍 Step ${index + 1}: ${step.action} on ${step.element}`);
        
        // Wait for each element sequentially
        await waitForRefs(step.element as keyof WaitExecuteRefs);
        
        let element: HTMLElement | null = null;
        
        // Get the appropriate element reference
        switch (step.element) {
          case 'setupElement':
            element = setupElementRef.target;
            break;
          case 'processElement':
            element = processElementRef.target;
            break;
          case 'completeElement':
            element = completeElementRef.target;
            break;
        }
        
        if (!element) {
          throw new Error(`Element ${step.element} not found`);
        }
        
        // Perform the action
        switch (step.action) {
          case 'prepare':
            element.classList.add('bg-yellow-100', 'border-yellow-300');
            element.classList.remove('bg-gray-50', 'border-gray-200', 'bg-green-100', 'border-green-300');
            element.textContent = `🔄 ${step.data.message}`;
            break;
            
          case 'process':
            element.classList.add('bg-blue-100', 'border-blue-300');
            element.classList.remove('bg-gray-50', 'border-gray-200', 'bg-yellow-100', 'border-yellow-300');
            element.textContent = `⚙️ ${step.data.message}`;
            
            // Add processing animation
            element.style.animation = 'pulse 1s infinite';
            break;
            
          case 'complete':
            element.classList.add('bg-green-100', 'border-green-300');
            element.classList.remove('bg-gray-50', 'border-gray-200', 'bg-blue-100', 'border-blue-300');
            element.textContent = `✅ ${step.data.message}`;
            element.style.animation = '';
            break;
            
          case 'reset':
            element.classList.add('bg-gray-50', 'border-gray-200');
            element.classList.remove('bg-yellow-100', 'border-yellow-300', 'bg-blue-100', 'border-blue-300', 'bg-green-100', 'border-green-300');
            element.textContent = step.data.message;
            element.style.animation = '';
            break;
        }
        
        // Add delay between steps for visibility
        if (index < payload.steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      log('✅ All sequential operations completed successfully');
      
    } catch (error) {
      log(`❌ Sequential operations failed: ${error}`);
      success = false;
    }
    
    // Record operation history
    const currentHistory = operationHistoryStore.getValue();
    operationHistoryStore.setValue([
      ...currentHistory,
      {
        operation: 'Sequential Workflow',
        elements: payload.steps.map(step => step.element),
        success,
        timestamp: Date.now()
      }
    ]);
    
  }, [waitForRefs, setupElementRef, processElementRef, completeElementRef, operationHistoryStore, log]));
  
  const executeWorkflow = useCallback(() => {
    dispatch('sequentialOperations', {
      steps: [
        { element: 'setupElement', action: 'prepare', data: { message: 'Preparing workflow...' } },
        { element: 'processElement', action: 'process', data: { message: 'Processing data...' } },
        { element: 'completeElement', action: 'complete', data: { message: 'Workflow completed!' } }
      ]
    });
  }, [dispatch]);
  
  const resetWorkflow = useCallback(() => {
    dispatch('sequentialOperations', {
      steps: [
        { element: 'setupElement', action: 'reset', data: { message: 'Setup Stage - Ready' } },
        { element: 'processElement', action: 'reset', data: { message: 'Process Stage - Ready' } },
        { element: 'completeElement', action: 'reset', data: { message: 'Complete Stage - Ready' } }
      ]
    });
  }, [dispatch]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-orange-600">Sequential Operations</h2>
      <p className="text-gray-600 mb-4">
        Step-by-step operations that wait for each element before proceeding to the next.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Step 1: Setup</h4>
            <div
              ref={setupElementRef.setRef}
              className="p-4 bg-gray-50 border border-gray-200 rounded min-h-[80px] flex items-center justify-center text-center transition-all duration-300"
            >
              Setup Stage - Ready
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Step 2: Process</h4>
            <div
              ref={processElementRef.setRef}
              className="p-4 bg-gray-50 border border-gray-200 rounded min-h-[80px] flex items-center justify-center text-center transition-all duration-300"
            >
              Process Stage - Ready
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Step 3: Complete</h4>
            <div
              ref={completeElementRef.setRef}
              className="p-4 bg-gray-50 border border-gray-200 rounded min-h-[80px] flex items-center justify-center text-center transition-all duration-300"
            >
              Complete Stage - Ready
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={executeWorkflow}
            className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Execute Sequential Workflow
          </button>
          
          <button
            onClick={resetWorkflow}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset Workflow
          </button>
        </div>
        
        <OperationHistoryDisplay />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Sequential Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const sequentialOperations = useCallback(async () => {
  // Step 1: Wait and setup
  await waitForRefs('setupElement');
  const setupEl = setupElementRef.target;
  if (setupEl) {
    setupEl.classList.add('preparing');
  }
  
  // Step 2: Wait for next element
  await waitForRefs('processElement');
  const processEl = processElementRef.target;
  if (processEl) {
    processEl.classList.add('active');
  }
  
  // Step 3: Final element
  await waitForRefs('completeElement');
  const completeEl = completeElementRef.target;
  if (completeEl) {
    completeEl.classList.add('done');
  }
}, [waitForRefs, setupElementRef, processElementRef, completeElementRef]);`}
        </pre>
      </div>
    </section>
  );
}

function FormValidationDemo() {
  const { log } = useLogMonitor();
  const dispatch = useWaitExecuteAction();
  const formElementRef = useWaitExecuteRef('formElement');
  const formInputRef = useWaitExecuteRef('formInput');
  const waitForRefs = useWaitForRefs();
  const formStateStore = useWaitExecuteStore('formState');
  
  // Form validation handler
  useWaitExecuteActionHandler('formValidation', useCallback(async (payload, controller) => {
    try {
      log('📝 Starting form validation workflow');
      
      // Wait for form elements before validation
      await Promise.all([
        waitForRefs('formElement'),
        waitForRefs('formInput')
      ]);
      
      const form = formElementRef.target;
      const input = formInputRef.target;
      
      if (!form || !input) {
        throw new Error('Form elements not available');
      }
      
      log('✅ Form elements are ready for validation');
      
      // Validate form data
      const errors: string[] = [];
      const { email, name, message } = payload.formData;
      
      if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email is required');
      }
      
      if (!message || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters');
      }
      
      const isValid = errors.length === 0;
      
      // Update form state
      formStateStore.setValue({
        isValid,
        errors,
        lastValidation: Date.now()
      });
      
      // Visual feedback on form
      if (isValid) {
        form.style.border = '2px solid #4CAF50';
        form.style.background = '#E8F5E8';
        input.style.border = '2px solid #4CAF50';
        log('✅ Form validation passed');
      } else {
        form.style.border = '2px solid #F44336';
        form.style.background = '#FFF5F5';
        input.style.border = '2px solid #F44336';
        log(`❌ Form validation failed: ${errors.join(', ')}`);
      }
      
      // Focus on input if validation fails
      if (!isValid) {
        input.focus();
        input.style.outline = '2px solid #F44336';
        
        setTimeout(() => {
          input.style.outline = '';
        }, 2000);
      }
      
    } catch (error) {
      log(`❌ Form validation error: ${error}`);
    }
  }, [waitForRefs, formElementRef, formInputRef, formStateStore, log]));
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">Form Validation</h2>
      <p className="text-gray-600 mb-4">
        Wait for form elements before performing validation and applying visual feedback.
      </p>
      
      <div className="space-y-4">
        <form
          ref={formElementRef.setRef}
          className="p-4 border border-gray-200 rounded transition-all duration-300 space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              ref={formInputRef.setRef}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your message"
              rows={3}
            />
          </div>
        </form>
        
        <div className="flex gap-4">
          <button
            onClick={() => dispatch('formValidation', { formData })}
            className="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Validate Form
          </button>
          
          <button
            onClick={() => {
              setFormData({ name: 'John Doe', email: 'john@example.com', message: 'This is a valid test message.' });
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Fill Valid Data
          </button>
          
          <button
            onClick={() => {
              setFormData({ name: '', email: 'invalid', message: 'Short' });
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Fill Invalid Data
          </button>
        </div>
        
        <FormStateDisplay />
      </div>
    </section>
  );
}

function ModalOperationsDemo() {
  const { log } = useLogMonitor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useWaitExecuteAction();
  const modalElementRef = useWaitExecuteRef('modalElement');
  const modalInputRef = useWaitExecuteRef('modalInput');
  const waitForRefs = useWaitForRefs();
  
  // Modal operations handler
  useWaitExecuteActionHandler('modalOperations', useCallback(async (payload, controller) => {
    try {
      log(`🎭 Modal operation: ${payload.action}`);
      
      switch (payload.action) {
        case 'open':
          setIsModalOpen(true);
          
          // Wait for modal to be mounted
          await waitForRefs('modalElement');
          
          const modal = modalElementRef.target;
          if (modal && 'showModal' in modal) {
            (modal as HTMLDialogElement).showModal();
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            modal.style.transition = 'all 0.3s ease';
            
            // Animate in
            setTimeout(() => {
              modal.style.opacity = '1';
              modal.style.transform = 'scale(1)';
            }, 10);
            
            log('✅ Modal opened and animated in');
          }
          break;
          
        case 'focus':
          // Wait for modal input to be available
          await waitForRefs('modalInput');
          
          const input = modalInputRef.target;
          if (input) {
            input.focus();
            input.select();
            log('✅ Modal input focused');
          }
          break;
          
        case 'close':
          const modalToClose = modalElementRef.target;
          if (modalToClose) {
            modalToClose.style.opacity = '0';
            modalToClose.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
              if ('close' in modalToClose) {
                (modalToClose as HTMLDialogElement).close();
              }
              setIsModalOpen(false);
              log('✅ Modal closed and animated out');
            }, 300);
          }
          break;
      }
      
    } catch (error) {
      log(`❌ Modal operation failed: ${error}`);
    }
  }, [waitForRefs, modalElementRef, modalInputRef, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-teal-600">Modal Operations</h2>
      <p className="text-gray-600 mb-4">
        Ensure modal is mounted before focusing inputs or performing operations.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => dispatch('modalOperations', { action: 'open' })}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          Open Modal
        </button>
      </div>
      
      {isModalOpen && (
        <dialog
          ref={modalElementRef.setRef}
          className="backdrop:bg-black backdrop:opacity-50 bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
        >
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Modal Dialog</h3>
            
            <p className="text-gray-600">
              This modal demonstrates wait-then-execute for modal operations.
            </p>
            
            <input
              ref={modalInputRef.setRef}
              type="text"
              placeholder="Focus will be set here"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              defaultValue="Auto-focused input"
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => dispatch('modalOperations', { action: 'focus' })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Focus Input
              </button>
              
              <button
                onClick={() => dispatch('modalOperations', { action: 'close' })}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close Modal
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}

function CanvasDrawingDemo() {
  const { log } = useLogMonitor();
  const dispatch = useWaitExecuteAction();
  const canvasElementRef = useWaitExecuteRef('canvasElement');
  const waitForRefs = useWaitForRefs();
  const canvasOperationsStore = useWaitExecuteStore('canvasOperations');
  
  // Canvas drawing handler
  useWaitExecuteActionHandler('canvasDrawing', useCallback(async (payload, controller) => {
    try {
      log(`🎨 Drawing ${payload.shape} in ${payload.color}`);
      
      // Wait for canvas element before rendering
      await waitForRefs('canvasElement');
      
      const canvas = canvasElementRef.target;
      if (!canvas) {
        throw new Error('Canvas element not available');
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      // Set drawing properties
      ctx.strokeStyle = payload.color;
      ctx.fillStyle = payload.color;
      ctx.lineWidth = 3;
      
      // Draw shape at random position
      const x = Math.random() * (canvas.width - 100) + 50;
      const y = Math.random() * (canvas.height - 100) + 50;
      
      switch (payload.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, 2 * Math.PI);
          ctx.fill();
          break;
          
        case 'rectangle':
          ctx.fillRect(x, y, 60, 40);
          break;
          
        case 'line':
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 60, y + 40);
          ctx.stroke();
          break;
      }
      
      // Record operation
      const currentOps = canvasOperationsStore.getValue();
      canvasOperationsStore.setValue([
        ...currentOps,
        { shape: payload.shape, color: payload.color, timestamp: Date.now() }
      ]);
      
      log(`✅ ${payload.shape} drawn successfully in ${payload.color}`);
      
    } catch (error) {
      log(`❌ Canvas drawing failed: ${error}`);
    }
  }, [waitForRefs, canvasElementRef, canvasOperationsStore, log]));
  
  const clearCanvas = useCallback(() => {
    const canvas = canvasElementRef.target;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvasOperationsStore.setValue([]);
        log('🗑️ Canvas cleared');
      }
    }
  }, [canvasElementRef, canvasOperationsStore, log]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-pink-600">Canvas Drawing</h2>
      <p className="text-gray-600 mb-4">
        Wait for canvas element before rendering to ensure safe drawing operations.
      </p>
      
      <div className="space-y-4">
        <canvas
          ref={canvasElementRef.setRef}
          width={400}
          height={200}
          className="border border-gray-300 rounded bg-white"
        />
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => dispatch('canvasDrawing', { shape: 'circle', color: '#FF6B35' })}
            className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
          >
            Orange Circle
          </button>
          
          <button
            onClick={() => dispatch('canvasDrawing', { shape: 'rectangle', color: '#4CAF50' })}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Green Rectangle
          </button>
          
          <button
            onClick={() => dispatch('canvasDrawing', { shape: 'line', color: '#2196F3' })}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Blue Line
          </button>
          
          <button
            onClick={() => dispatch('canvasDrawing', { shape: 'circle', color: '#9C27B0' })}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            Purple Circle
          </button>
          
          <button
            onClick={clearCanvas}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Clear Canvas
          </button>
        </div>
        
        <CanvasOperationsDisplay />
      </div>
    </section>
  );
}

// Helper components
function ElementStateIndicator({ elementKey }: { elementKey: string }) {
  const elementStates = useWaitExecuteStore('elementStates').getValue();
  const state = elementStates[elementKey];
  
  if (!state) return null;
  
  return (
    <div className="p-3 bg-gray-50 rounded border text-sm">
      <div className="font-medium text-gray-700 mb-1">Element State: {elementKey}</div>
      <div className="space-y-1">
        <div>Mounted: <span className={state.mounted ? 'text-green-600' : 'text-gray-600'}>
          {state.mounted ? '✅' : '❌'}
        </span></div>
        <div>Ready: <span className={state.ready ? 'text-green-600' : 'text-gray-600'}>
          {state.ready ? '✅' : '❌'}
        </span></div>
        <div>Timestamp: <span className="font-mono text-xs">
          {new Date(state.timestamp).toLocaleTimeString()}
        </span></div>
      </div>
    </div>
  );
}

function AnimationQueueDisplay() {
  const animationQueue = useWaitExecuteStore('animationQueue').getValue();
  
  return (
    <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
      <div className="font-medium text-purple-700 mb-1">Animation Queue</div>
      <div>Total Animations: <span className="font-mono">{animationQueue.length}</span></div>
      {animationQueue.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="font-medium">Recent:</div>
          {animationQueue.slice(-3).map((anim, index) => (
            <div key={anim.timestamp} className="text-xs flex justify-between items-center bg-white px-2 py-1 rounded">
              <span>{anim.animation} on {anim.element}</span>
              <span className="text-purple-600 font-mono">
                {new Date(anim.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OperationHistoryDisplay() {
  const history = useWaitExecuteStore('operationHistory').getValue();
  
  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm">
      <div className="font-medium text-orange-700 mb-1">Operation History</div>
      <div>Total Operations: <span className="font-mono">{history.length}</span></div>
      {history.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="font-medium">Recent:</div>
          {history.slice(-3).map((op, index) => (
            <div key={op.timestamp} className="text-xs flex justify-between items-center bg-white px-2 py-1 rounded">
              <span>{op.operation} ({op.elements.length} elements)</span>
              <span className={`font-mono ${op.success ? 'text-green-600' : 'text-red-600'}`}>
                {op.success ? '✅' : '❌'} {new Date(op.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormStateDisplay() {
  const formState = useWaitExecuteStore('formState').getValue();
  
  return (
    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm">
      <div className="font-medium text-indigo-700 mb-2">Form Validation State</div>
      <div className="space-y-1">
        <div>Valid: <span className={`font-mono ${formState.isValid ? 'text-green-600' : 'text-red-600'}`}>
          {formState.isValid ? '✅ Valid' : '❌ Invalid'}
        </span></div>
        
        {formState.errors.length > 0 && (
          <div>
            <div className="font-medium text-red-600">Errors:</div>
            {formState.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-600 ml-2">• {error}</div>
            ))}
          </div>
        )}
        
        {formState.lastValidation > 0 && (
          <div>Last Validated: <span className="font-mono text-xs">
            {new Date(formState.lastValidation).toLocaleTimeString()}
          </span></div>
        )}
      </div>
    </div>
  );
}

function CanvasOperationsDisplay() {
  const operations = useWaitExecuteStore('canvasOperations').getValue();
  
  return (
    <div className="p-3 bg-pink-50 border border-pink-200 rounded text-sm">
      <div className="font-medium text-pink-700 mb-1">Canvas Operations</div>
      <div>Total Shapes: <span className="font-mono">{operations.length}</span></div>
      {operations.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="font-medium">Recent Shapes:</div>
          {operations.slice(-3).map((op, index) => (
            <div key={op.timestamp} className="text-xs flex justify-between items-center bg-white px-2 py-1 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: op.color }}
                />
                <span>{op.shape}</span>
              </div>
              <span className="text-pink-600 font-mono">
                {new Date(op.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BestPracticesSection() {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Wait-Then-Execute Best Practices</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">✅ Best Practices</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Always Check Element:</strong> Verify element exists after waiting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Graceful Degradation:</strong> Handle cases where elements don't mount</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Cleanup:</strong> Remove event listeners and clear timeouts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Performance:</strong> Use hardware-accelerated properties when possible</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-blue-600 mb-3">🎯 Common Use Cases</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Form Validation:</strong> Wait for form elements before validation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Animation Sequences:</strong> Coordinate animations across multiple elements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Data Visualization:</strong> Wait for canvas/SVG elements before rendering</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Modal Operations:</strong> Ensure modal is mounted before focusing inputs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Drag & Drop:</strong> Wait for drop zones before enabling drag operations</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AsyncWaitThenExecutePage;