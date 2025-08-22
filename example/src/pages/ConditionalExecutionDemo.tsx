import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider 
} from './ConditionalExecutionDemo/stores';
import { AllHandlers } from './ConditionalExecutionDemo/handlers';
import {
  EnvironmentControls,
  FeatureFlagControls,
  PermissionControls,
  BusinessRuleControls,
  ScheduleControls,
  ResultsDisplay,
  TestingSuite,
  PatternExplanations,
  AdvancedScenarios,
  StickyExecutionPanel,
  HandlerManagementPanel,
  CombinedVisualFeedback
} from './ConditionalExecutionDemo/components';

function ConditionalExecutionDemo() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <AllHandlers />
        
        {/* Visual Feedback Overlays */}
        <CombinedVisualFeedback />
        
        {/* Sticky Execution Panel */}
        <StickyExecutionPanel />
        
        <div className="max-w-6xl mx-auto p-6" style={{ paddingRight: '25rem' }}> {/* Add right padding for sticky panel */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                to="/actionguard" 
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                ← Back to ActionGuard Demos
              </Link>
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-800 underline text-sm"
              >
                🏠 Home
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-2">🔄 Conditional & Dynamic Execution Demo</h1>
            <p className="text-gray-600">
              Advanced conditional execution patterns with environment-based filtering, feature flags, 
              permission checks, business rules, and time-based execution.
            </p>
          </div>
          
          {/* Pattern Deep Dive */}
          <PatternExplanations />
          
          {/* Interactive Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
            <EnvironmentControls />
            <FeatureFlagControls />
            <PermissionControls />
            <BusinessRuleControls />
            <ScheduleControls />
            <div></div> {/* Empty cell for layout */}
          </div>
          
          {/* Testing Suite */}
          <TestingSuite />
          
          {/* Handler Management Panel */}
          <HandlerManagementPanel />
          
          {/* Advanced Integration Scenarios */}
          <AdvancedScenarios />
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">💡 Key Features Demonstrated</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🌍 <strong>Environment-based execution</strong>: Different deployment strategies per environment</li>
              <li>🎯 <strong>Feature flag integration</strong>: Dynamic feature control with real-time toggling</li>
              <li>🔒 <strong>Permission-based execution</strong>: Role-based access control with audit logging</li>
              <li>💼 <strong>Business rule engine</strong>: Tier-based discounts and credit checks</li>
              <li>⏰ <strong>Time-based execution</strong>: Business hours vs off-hours processing</li>
              <li>📊 <strong>Result aggregation</strong>: Comprehensive logging and result tracking</li>
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📚 Related Documentation</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                📖 <strong>Pipeline Documentation</strong>: 
                <a href="/docs/en/guide/pipeline/conditional-execution" className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Conditional & Dynamic Execution Guide
                </a>
              </div>
              <div>
                🔧 <strong>Core Concepts</strong>: 
                <a href="/docs/en/guide/pipeline/flow-control" className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Pipeline Flow Control
                </a>
              </div>
              <div>
                ⚡ <strong>Advanced Features</strong>: 
                <a href="/docs/en/guide/pipeline/advanced-features" className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Advanced Pipeline Features
                </a>
              </div>
              <div>
                🎯 <strong>Action Patterns</strong>: 
                <a href="/docs/en/guide/patterns/action/" className="text-blue-600 hover:text-blue-800 underline ml-1">
                  Action Implementation Patterns
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">🧪 How to Use This Demo</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <div><strong>1. Environment Testing:</strong> Change environments and watch different deployment strategies</div>
              <div><strong>2. Feature Flags:</strong> Toggle feature flags to see conditional handler execution</div>
              <div><strong>3. Permissions:</strong> Switch user roles to test permission-based access control</div>
              <div><strong>4. Business Rules:</strong> Adjust customer tiers and order amounts to see dynamic pricing</div>
              <div><strong>5. Time-based:</strong> Schedule tasks to see business hours vs off-hours processing</div>
              <div><strong>6. Results Tracking:</strong> Monitor the results panel and activity log for detailed insights</div>
            </div>
          </div>
        </div>
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}

export default ConditionalExecutionDemo;