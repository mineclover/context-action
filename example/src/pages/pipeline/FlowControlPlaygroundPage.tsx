import React from 'react';
import { Container, Grid } from '../../components/ui';
import { LogMonitor, LogMonitorProvider } from '../../components/LogMonitor';

// Import modularized components and hooks
import { scenarios } from './scenarios';
import { 
  ScenarioSelector,
  SystemControls, 
  ScenarioDetails,
  ExecutionMetrics,
  ExecutionPath,
  ResultsDisplay 
} from './components';
import { useFlowControlDemo, useScenarioExecution } from './hooks';

export function FlowControlPlaygroundPage() {
  // Main demo state and logic
  const {
    selectedScenario,
    executionResults,
    executionPath,
    isExecuting,
    handlerExecutions,
    systemLoad,
    isBusinessHours,
    setSelectedScenario,
    executeScenario,
    clearCache,
    toggleBusinessHours,
    adjustSystemLoad
  } = useFlowControlDemo();

  // Scenario execution logic
  const { handleExecuteScenario, currentScenario } = useScenarioExecution({
    scenarios,
    selectedScenario,
    isExecuting,
    executeScenario
  });

  return (
    <LogMonitorProvider
      pageId="flow-control-playground"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🔀 Pipeline Flow Control Playground</h1>
          <p className="text-gray-600 mb-6">
            Interactive demonstration of Context-Action pipeline flow control patterns featuring 
            <strong> priority-based execution</strong> (higher numbers execute first), 
            <strong>dynamic priority jumping</strong>, <strong>early returns</strong>, and 
            <strong>conditional branching</strong> with real-time visualization.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Key Concept:</strong> Priority system where <code>P:1000</code> executes before <code>P:50</code>. 
              Use <code>jumpToPriority()</code> to dynamically route execution flow based on business logic.
            </p>
          </div>
        </div>

        <Grid cols={2} gap="md">
          {/* Left Column - Controls and Configuration */}
          <div className="space-y-6">
            {/* Scenario Selection */}
            <ScenarioSelector
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onScenarioSelect={setSelectedScenario}
            />

            {/* System Controls */}
            <SystemControls
              systemLoad={systemLoad}
              isBusinessHours={isBusinessHours}
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
              handlerExecutions={handlerExecutions}
              executionSteps={executionPath.length}
              isExecuting={isExecuting}
              onExecute={handleExecuteScenario}
            />

            {/* Execution Path */}
            <ExecutionPath executionPath={executionPath} />

            {/* Results */}
            <ResultsDisplay executionResults={executionResults} />
          </div>
        </Grid>

        {/* Console Log Monitor */}
        <div className="mt-8">
          <LogMonitor />
        </div>
      </Container>
    </LogMonitorProvider>
  );
}