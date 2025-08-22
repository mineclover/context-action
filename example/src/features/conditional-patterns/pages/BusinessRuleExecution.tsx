import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider,
  useConditionalAction,
  useConditionalStore
} from '../stores';
import { useStoreValue } from '@context-action/react';

function BusinessRuleExecutionContent() {
  const dispatch = useConditionalAction();
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  return (
    <div className="min-h-screen bg-gray-50 pr-80">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
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
          
          <h1 className="text-3xl font-bold mb-4">💼 Business Rule Engine</h1>
          <p className="text-lg text-gray-600 mb-4">
            Complex business logic with cascading rules, tier-based pricing, and credit validation
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Business Logic:</strong> Multiple handlers execute in priority order, implementing credit checks, 
              tier-based discounts, inventory validation, premium access control, and risk assessment.
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold mb-4">Business Rule Engine Demo</h2>
          <p className="text-gray-600 mb-6">
            This advanced demo is under construction. It will feature:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700 mb-8">
            <li>• Credit limit validation with real-time checks</li>
            <li>• Tier-based pricing with dynamic discounts</li>
            <li>• Inventory management with stock validation</li>
            <li>• Premium access control by customer tier</li>
            <li>• Risk assessment with fraud detection</li>
          </ul>
          <p className="text-sm text-gray-500">
            Check back soon for the complete interactive demo!
          </p>
        </div>

        {/* Architecture Preview */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">Business Rule Architecture Preview</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-purple-800 mb-2">Rule Execution Flow</h3>
              <ol className="text-sm text-purple-700 space-y-1">
                <li>1. <strong>Credit Validation (P100):</strong> Check credit limits first</li>
                <li>2. <strong>Premium Access (P95):</strong> Validate tier requirements</li>
                <li>3. <strong>Inventory Check (P90):</strong> Ensure product availability</li>
                <li>4. <strong>Tier Pricing (P80):</strong> Apply customer discounts</li>
                <li>5. <strong>Risk Assessment (P70):</strong> Flag high-risk transactions</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium text-purple-800 mb-2">Business Benefits</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Cascading Logic:</strong> Rules execute in business priority order</li>
                <li>• <strong>Early Termination:</strong> Failed rules abort processing</li>
                <li>• <strong>Flexible Configuration:</strong> Easy to add/modify rules</li>
                <li>• <strong>Audit Trail:</strong> Complete rule execution logging</li>
                <li>• <strong>Performance:</strong> Optimized execution with early exits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusinessRuleExecution() {
  return (
    <ConditionalStoreProvider>
      <ConditionalActionProvider>
        <BusinessRuleExecutionContent />
      </ConditionalActionProvider>
    </ConditionalStoreProvider>
  );
}