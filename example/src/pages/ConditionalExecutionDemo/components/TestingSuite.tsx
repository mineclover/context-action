import React, { useState, useCallback, useEffect } from 'react';
import { useConditionalStoreManager, useConditionalAction } from '../stores';
import { 
  ConditionalExecutionTester, 
  createTestScenarios, 
  MockTimeProvider, 
  TestResult 
} from '../testUtils';

export function TestingSuite() {
  const stores = useConditionalStoreManager();
  const dispatch = useConditionalAction();
  const [tester] = useState(() => new ConditionalExecutionTester());
  const [mockTime] = useState(() => new MockTimeProvider());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize test scenarios
  useEffect(() => {
    const scenarios = createTestScenarios(stores, dispatch, mockTime);
    scenarios.forEach(scenario => tester.addScenario(scenario));
  }, [stores, dispatch, tester, mockTime]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    try {
      const results = await tester.runAllScenarios();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [tester]);

  const runCategoryTests = useCallback(async (category: string) => {
    setIsRunning(true);
    try {
      const scenarios = createTestScenarios(stores, dispatch, mockTime);
      const categoryScenarios = scenarios.filter(s => s.category === category);
      
      const results: TestResult[] = [];
      for (const scenario of categoryScenarios) {
        const result = await tester.runScenario(scenario.id);
        results.push(result);
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Category test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [stores, dispatch, tester, mockTime]);

  const runSingleTest = useCallback(async (scenarioId: string) => {
    setIsRunning(true);
    try {
      const result = await tester.runScenario(scenarioId);
      setTestResults(prev => [...prev.filter(r => r.scenarioId !== scenarioId), result]);
    } catch (error) {
      console.error('Single test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [tester]);

  const clearResults = useCallback(() => {
    tester.clearResults();
    setTestResults([]);
  }, [tester]);

  const report = tester.getTestReport();
  const scenarios = createTestScenarios(stores, dispatch, mockTime);
  const categories = Array.from(new Set(scenarios.map(s => s.category)));

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-xl font-semibold mb-4">🧪 Comprehensive Testing Suite</h3>
      
      {/* Test Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear Results
          </button>
        </div>

        {/* Category Tests */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => runCategoryTests(category)}
              disabled={isRunning}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Test {category}
            </button>
          ))}
        </div>
      </div>

      {/* Test Report Summary */}
      {testResults.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded border">
          <h4 className="font-semibold mb-2">📊 Test Report Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Tests</div>
              <div className="text-lg font-semibold">{report.totalScenarios}</div>
            </div>
            <div>
              <div className="text-gray-600">Passed</div>
              <div className="text-lg font-semibold text-green-600">{report.passedScenarios}</div>
            </div>
            <div>
              <div className="text-gray-600">Failed</div>
              <div className="text-lg font-semibold text-red-600">{report.failedScenarios}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Time</div>
              <div className="text-lg font-semibold">{report.averageExecutionTime.toFixed(1)}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Test Scenarios */}
      <div className="space-y-4">
        <h4 className="font-semibold">🎯 Individual Test Scenarios</h4>
        
        {scenarios.map(scenario => {
          const result = testResults.find(r => r.scenarioId === scenario.id);
          const categoryColors = {
            environment: 'bg-blue-100 text-blue-800',
            feature: 'bg-green-100 text-green-800',
            permission: 'bg-yellow-100 text-yellow-800',
            business: 'bg-purple-100 text-purple-800',
            schedule: 'bg-pink-100 text-pink-800'
          };

          return (
            <div key={scenario.id} className="border rounded p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium">{scenario.name}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${categoryColors[scenario.category]}`}>
                      {scenario.category}
                    </span>
                    {result && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? '✅ Pass' : '❌ Fail'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    <strong>Expected:</strong> {scenario.expectedBehavior}
                  </p>
                </div>
                
                <button
                  onClick={() => runSingleTest(scenario.id)}
                  disabled={isRunning}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Run Test
                </button>
              </div>

              {/* Test Result Details */}
              {result && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <div>
                      <span className="text-gray-600">Status:</span> 
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span> {result.executionTime.toFixed(1)}ms
                    </div>
                    <div>
                      <span className="text-gray-600">Executed:</span> {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.actualResult && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">View Result Details</summary>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                        {JSON.stringify(result.actualResult, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Testing Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-900 mb-2">🔬 Testing Instructions</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div><strong>1. Run All Tests:</strong> Execute complete test suite to validate all conditional execution patterns</div>
          <div><strong>2. Category Tests:</strong> Run specific category tests to focus on particular conditional patterns</div>
          <div><strong>3. Individual Tests:</strong> Run single tests to debug specific conditional scenarios</div>
          <div><strong>4. Results Analysis:</strong> Review test results to understand conditional execution behavior</div>
          <div><strong>5. Error Investigation:</strong> Use result details to troubleshoot failed test scenarios</div>
        </div>
      </div>

      {/* Pattern Explanations */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-900 mb-2">📚 What Each Pattern Tests</h4>
        <div className="text-sm text-yellow-800 space-y-2">
          <div><strong>🌍 Environment:</strong> Handler filtering based on deployment environment (dev/staging/prod)</div>
          <div><strong>🎯 Feature:</strong> Dynamic feature toggling with runtime flag evaluation</div>
          <div><strong>🔒 Permission:</strong> Role-based access control with early abort for unauthorized users</div>
          <div><strong>💼 Business:</strong> Complex business rule evaluation with tier-based processing</div>
          <div><strong>⏰ Schedule:</strong> Time-based conditional execution with business hours logic</div>
        </div>
      </div>
    </div>
  );
}