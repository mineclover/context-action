import React, { useState, useCallback } from 'react';
import { 
  advancedScenarios, 
  AdvancedScenarioRunner, 
  realWorldUseCases, 
  patternCombinations,
  type AdvancedScenario 
} from '../scenarios/advancedScenarios';

export function AdvancedScenarios() {
  const [runner] = useState(() => new AdvancedScenarioRunner());
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'patterns' | 'usecases'>('scenarios');

  const runAdvancedScenario = useCallback(async (scenarioId: string) => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const result = await runner.runScenario(scenarioId, {});
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        learnings: []
      });
    } finally {
      setIsExecuting(false);
    }
  }, [runner]);

  const learningPath = runner.generateLearningPath();

  const complexityColors: Record<string, string> = {
    simple: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    complex: 'bg-red-100 text-red-800'
  };

  const patternColors: Record<string, string> = {
    environment: 'bg-blue-50 text-blue-700',
    feature: 'bg-green-50 text-green-700',
    permission: 'bg-yellow-50 text-yellow-700',
    business: 'bg-purple-50 text-purple-700',
    schedule: 'bg-pink-50 text-pink-700'
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-semibold mb-4">🚀 Advanced Integration Scenarios</h3>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-2 rounded-lg border ${
            activeTab === 'scenarios' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          🎯 Scenarios
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`px-4 py-2 rounded-lg border ${
            activeTab === 'patterns' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          🔗 Pattern Combinations
        </button>
        <button
          onClick={() => setActiveTab('usecases')}
          className={`px-4 py-2 rounded-lg border ${
            activeTab === 'usecases' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          🏭 Real-World Use Cases
        </button>
      </div>

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Learning Path */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">🌱 Beginner</h4>
              <p className="text-sm text-green-800 mb-2">Simple pattern combinations</p>
              <div className="text-sm text-green-700">
                {learningPath.beginner.length} scenarios available
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">📈 Intermediate</h4>
              <p className="text-sm text-yellow-800 mb-2">Multi-pattern integration</p>
              <div className="text-sm text-yellow-700">
                {learningPath.intermediate.length} scenarios available
              </div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">🔥 Advanced</h4>
              <p className="text-sm text-red-800 mb-2">Complex enterprise scenarios</p>
              <div className="text-sm text-red-700">
                {learningPath.advanced.length} scenarios available
              </div>
            </div>
          </div>

          {/* Scenario List */}
          <div className="space-y-4">
            <h4 className="font-semibold">📋 Available Scenarios</h4>
            
            {advancedScenarios.map((scenario) => (
              <div key={scenario.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium">{scenario.name}</h5>
                      <span className={`px-2 py-1 rounded text-xs ${complexityColors[scenario.complexity]}`}>
                        {scenario.complexity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                    
                    {/* Pattern Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {scenario.patterns.map(pattern => (
                        <span 
                          key={pattern} 
                          className={`px-2 py-1 rounded text-xs ${patternColors[pattern]}`}
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => runAdvancedScenario(scenario.id)}
                    disabled={isExecuting}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    {isExecuting && selectedScenario === scenario.id ? 'Running...' : 'Execute'}
                  </button>
                </div>

                {/* Learning Objectives */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-blue-600 text-sm">View Learning Objectives</summary>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {scenario.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </details>

                {/* Execution Result */}
                {executionResult && selectedScenario === scenario.id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        executionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {executionResult.success ? '✅ Success' : '❌ Failed'}
                      </span>
                      <span className="text-sm text-gray-600">
                        Execution time: {executionResult.executionTime?.toFixed(1)}ms
                      </span>
                    </div>
                    
                    {executionResult.error && (
                      <div className="text-red-600 text-sm mb-2">
                        <strong>Error:</strong> {executionResult.error}
                      </div>
                    )}
                    
                    {executionResult.learnings?.length > 0 && (
                      <div className="text-sm">
                        <strong className="text-green-700">Learning achieved:</strong>
                        <ul className="mt-1 space-y-1">
                          {executionResult.learnings.map((learning: string, index: number) => (
                            <li key={index} className="text-green-600">• {learning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Combinations Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <h4 className="font-semibold">🔗 Pattern Combination Guide</h4>
          
          {Object.entries(patternCombinations).map(([combo, details]) => (
            <div key={combo} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium capitalize">{combo.replace('+', ' + ')}</h5>
                <span className={`px-2 py-1 rounded text-xs ${complexityColors[details.complexity]}`}>
                  {details.complexity}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{details.description}</p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <strong className="text-blue-700">Example:</strong> 
                  <span className="text-gray-700 ml-1">{details.example}</span>
                </div>
                <div>
                  <strong className="text-green-700">Use Case:</strong> 
                  <span className="text-gray-700 ml-1">{details.useCase}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real-World Use Cases Tab */}
      {activeTab === 'usecases' && (
        <div className="space-y-4">
          <h4 className="font-semibold">🏭 Industry-Specific Use Cases</h4>
          
          {Object.entries(realWorldUseCases).map(([industry, details]) => (
            <div key={industry} className="border rounded-lg p-4">
              <h5 className="font-medium mb-2">{details.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{details.description}</p>
              
              <div className="mb-3">
                <strong className="text-sm text-gray-700">Key Patterns:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {details.patterns.map(pattern => (
                    <span 
                      key={pattern} 
                      className={`px-2 py-1 rounded text-xs ${patternColors[pattern]}`}
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <strong className="text-sm text-gray-700">Example Scenarios:</strong>
                <ul className="mt-1 space-y-1">
                  {details.scenarios.map((scenario, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{scenario}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Learning Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Learning Tips</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Start Simple:</strong> Begin with single-pattern scenarios before attempting complex integrations</div>
          <div><strong>Understand Each Pattern:</strong> Master individual patterns before combining them</div>
          <div><strong>Practice Real Scenarios:</strong> Use industry-specific examples to understand practical applications</div>
          <div><strong>Test Thoroughly:</strong> Always validate your conditional logic with comprehensive testing</div>
          <div><strong>Document Decisions:</strong> Keep track of why specific patterns were chosen for each scenario</div>
        </div>
      </div>
    </div>
  );
}