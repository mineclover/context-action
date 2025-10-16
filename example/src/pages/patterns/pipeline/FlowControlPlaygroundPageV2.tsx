// import React from 'react';

import { useStoreValue } from '@context-action/react';
import { LogMonitor, LogMonitorProvider } from '@/components/LogMonitor';
import { Container, Grid } from '@/components/ui';
import {
  FlowControlActions,
  useFlowControlActions,
} from './actions/FlowControlActions';
import {
  ExecutionMetrics,
  ExecutionPath,
  ResultsDisplay,
  ScenarioDetails,
  ScenarioSelector,
  SystemControls,
} from './components';
// Context-Layered Architecture imports
import {
  FlowControlProvider,
  useFlowControlStore,
} from './contexts/FlowControlContexts';
import {
  ApiHandlers,
  CacheHandlers,
  OrderHandlers,
  SecurityHandlers,
} from './handlers';
// Import existing components (reusable)
import { scenarios } from './scenarios';

// Handler registration and integration component
function FlowControlHandlers() {
  const demoStateStore = useFlowControlStore('demoState');
  const demoState = useStoreValue(demoStateStore);
  const { onExecutionStep, onHandlerExecution } = useFlowControlActions();

  return (
    <>
      <SecurityHandlers
        onExecutionStep={onExecutionStep}
        onHandlerExecution={onHandlerExecution}
        isBusinessHours={demoState.isBusinessHours}
      />
      <CacheHandlers
        onExecutionStep={onExecutionStep}
        onHandlerExecution={onHandlerExecution}
      />
      <OrderHandlers
        onExecutionStep={onExecutionStep}
        onHandlerExecution={onHandlerExecution}
        isBusinessHours={demoState.isBusinessHours}
      />
      <ApiHandlers
        onExecutionStep={onExecutionStep}
        onHandlerExecution={onHandlerExecution}
      />
    </>
  );
}

// Main UI component (pure presentation)
function FlowControlUI() {
  const demoStateStore = useFlowControlStore('demoState');
  const demoState = useStoreValue(demoStateStore);
  const {
    setSelectedScenario,
    executeScenario,
    clearCache,
    toggleBusinessHours,
    adjustSystemLoad,
  } = useFlowControlActions();

  const currentScenario = scenarios[demoState.selectedScenario];

  const handleExecuteScenario = async () => {
    if (!currentScenario) return;
    await executeScenario(demoState.selectedScenario, currentScenario.payload);
  };

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          🔀 Pipeline Flow Control Playground
        </h1>
        <p className="text-gray-600 mb-6">
          Interactive demonstration of Context-Action pipeline flow control
          patterns featuring
          <strong> priority-based execution</strong> (higher numbers execute
          first),
          <strong>dynamic priority jumping</strong>,{' '}
          <strong>early returns</strong>, and
          <strong>conditional branching</strong> with real-time visualization.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Key Concept:</strong> Priority system where{' '}
            <code>P:1000</code> executes before <code>P:50</code>. Use{' '}
            <code>jumpToPriority()</code> to dynamically route execution flow
            based on business logic.
          </p>
        </div>
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mt-4">
          <p className="text-sm text-green-800">
            <strong>🏗️ Architecture:</strong> This demo uses{' '}
            <strong>Context-Layered Architecture</strong> with separate layers
            for contexts, handlers, actions, and views for clean separation of
            concerns.
          </p>
        </div>
      </div>

      <Grid cols={2} gap="md">
        {/* Left Column - Controls and Configuration */}
        <div className="space-y-6">
          {/* Scenario Selection */}
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenario={demoState.selectedScenario}
            onScenarioSelect={setSelectedScenario}
          />

          {/* System Controls */}
          <SystemControls
            systemLoad={demoState.systemLoad}
            isBusinessHours={demoState.isBusinessHours}
            onSystemLoadChange={adjustSystemLoad}
            onToggleBusinessHours={toggleBusinessHours}
            onClearCache={clearCache}
          />

          {/* Current Scenario Details */}
          <ScenarioDetails scenario={currentScenario} />
        </div>

        {/* Right Column - Execution and Results */}
        <div className="space-y-6">
          {/* Execution Controls and Metrics */}
          <ExecutionMetrics
            handlerExecutions={demoState.handlerExecutions}
            executionSteps={demoState.executionPath.length}
            isExecuting={demoState.isExecuting}
            onExecute={handleExecuteScenario}
          />

          {/* Execution Path */}
          <ExecutionPath executionPath={demoState.executionPath} />

          {/* Results */}
          <ResultsDisplay executionResults={demoState.executionResults} />
        </div>
      </Grid>

      {/* Console Log Monitor */}
      <div className="mt-8">
        <LogMonitor />
      </div>
    </Container>
  );
}

// Main page component with full context-layered architecture
export function FlowControlPlaygroundPageV2() {
  return (
    <LogMonitorProvider
      pageId="flow-control-playground-v2"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <FlowControlProvider>
        <FlowControlActions>
          <FlowControlHandlers />
          <FlowControlUI />
        </FlowControlActions>
      </FlowControlProvider>
    </LogMonitorProvider>
  );
}
