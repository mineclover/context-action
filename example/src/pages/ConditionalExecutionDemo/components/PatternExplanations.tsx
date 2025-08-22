import React, { useState } from 'react';

export function PatternExplanations() {
  const [activePattern, setActivePattern] = useState<string>('environment');

  const patterns: Record<string, any> = {
    environment: {
      title: '🌍 Environment-Based Execution',
      icon: '🌍',
      description: 'Different handlers execute based on deployment environment without conditional logic in handler code.',
      keyPrinciple: 'Each environment runs only its designated handlers through filtering, not conditional branches.',
      benefits: [
        'Clean separation of environment-specific logic',
        'No complex conditionals in business code',
        'Easy to test environment-specific behaviors',
        'Prevents accidental cross-environment code execution'
      ],
      implementation: `// Handler Registration with Environment Filter
useActionHandler('deployApplication', async (payload, controller) => {
  if (payload.environment !== 'production') return; // Early exit
  
  // Production-specific logic only
  const validations = await runProductionValidations(payload);
  const result = await blueGreenDeploy(payload.version);
  
  return { strategy: 'blue-green', validations, result };
}, {
  priority: 100,
  id: 'prod-deployer',
  environment: ['production'], // Declarative filtering
  tags: ['deployment', 'production']
});`,
      testScenarios: [
        'Development: Fast deployment with hot reload, skipping validations',
        'Staging: Integration testing with preview URL generation',
        'Production: Comprehensive validation with blue-green deployment'
      ]
    },

    feature: {
      title: '🎯 Feature Flag Integration',
      icon: '🎯',
      description: 'Handlers check feature state and skip execution when disabled, enabling safe gradual rollouts.',
      keyPrinciple: 'Runtime feature evaluation with graceful degradation when features are disabled.',
      benefits: [
        'Safe feature rollouts without code deployment',
        'A/B testing capabilities',
        'Quick feature rollback in production',
        'Progressive feature enablement'
      ],
      implementation: `// Feature-Gated Handler
useActionHandler('processUser', async (payload, controller) => {
  const featureEnabled = await getFeatureFlag('enhanced-user-processing');
  
  if (!featureEnabled) {
    console.log('Enhanced processing disabled, skipping...');
    return; // Graceful degradation
  }
  
  // Enhanced processing logic
  const enhancedData = await enhanceUserData(payload);
  return { enhanced: true, data: enhancedData };
}, {
  priority: 80,
  id: 'enhanced-processor',
  feature: 'enhanced-user-processing', // Feature flag dependency
  tags: ['user', 'enhanced']
});`,
      testScenarios: [
        'Feature Enabled: Enhanced user processing with advanced analytics',
        'Feature Disabled: Basic user processing only',
        'Runtime Toggle: Dynamic switching between processing modes'
      ]
    },

    permission: {
      title: '🔒 Permission-Based Execution',
      icon: '🔒',
      description: 'Permission validation occurs early in pipeline with automatic abort on failure.',
      keyPrinciple: 'Security checks happen first, business logic only executes for authorized users.',
      benefits: [
        'Early security validation prevents unauthorized operations',
        'Audit trail for access attempts',
        'Clean separation of security and business logic',
        'Fail-fast approach for unauthorized access'
      ],
      implementation: `// Permission Check Handler (High Priority)
useActionHandler('manageSystem', async (payload, controller) => {
  const userPermissions = await getUserPermissions(payload.userId);
  
  if (!userPermissions.includes('admin')) {
    // Automatic abort with audit logging
    controller.abort('Insufficient permissions for system management');
    return;
  }
  
  // Continue with system management logic
  return { authorized: true };
}, {
  priority: 100, // High priority for early validation
  id: 'permission-checker',
  tags: ['security', 'authorization']
});`,
      testScenarios: [
        'Admin User: Full system management access',
        'Regular User: Access denied with audit log',
        'Guest User: Immediate rejection with security alert'
      ]
    },

    business: {
      title: '💼 Business Rule Engine',
      icon: '💼',
      description: 'Business rules execute as separate handlers with cascading logic through pipeline results.',
      keyPrinciple: 'Each business rule runs independently, building context for subsequent handlers.',
      benefits: [
        'Modular business rule management',
        'Easy to modify individual rules',
        'Complex rule combinations through handler coordination',
        'Testable business logic isolation'
      ],
      implementation: `// Credit Check Handler
useActionHandler('processOrder', async (payload, controller) => {
  const { order, customer } = payload;
  const creditRequired = order.amount > getCreditThreshold(customer.tier);
  
  if (creditRequired) {
    const creditCheck = await performCreditCheck(customer.id, order.amount);
    if (!creditCheck.approved) {
      controller.abort(\`Credit check failed: \${creditCheck.reason}\`);
      return;
    }
  }
  
  return { creditCheckRequired, approved: true };
}, {
  priority: 100,
  id: 'credit-checker',
  tags: ['financial', 'business-rules']
});

// Discount Calculator Handler
useActionHandler('processOrder', async (payload, controller) => {
  const { customer, order } = payload;
  
  let discountPercentage = 0;
  switch (customer.tier) {
    case 'platinum': discountPercentage = 15; break;
    case 'gold': discountPercentage = 10; break;
    case 'silver': discountPercentage = 5; break;
  }
  
  // Volume discount
  if (order.amount > 1000) discountPercentage += 5;
  
  const finalAmount = order.amount * (1 - discountPercentage / 100);
  return { discountPercentage, finalAmount };
}, {
  priority: 90,
  id: 'discount-calculator',
  tags: ['pricing', 'business-rules']
});`,
      testScenarios: [
        'Platinum + Large Order: 20% discount (15% tier + 5% volume)',
        'Gold + Small Order: 10% discount (tier only)',
        'Bronze + Any Order: 0% discount',
        'Credit Limit Exceeded: Order rejection with explanation'
      ]
    },

    schedule: {
      title: '⏰ Time-Based Execution',
      icon: '⏰',
      description: 'Time-based handlers use priority ordering and early returns for schedule-aware processing.',
      keyPrinciple: 'Business hours handlers run first, off-hours handlers activate when business logic doesnt execute.',
      benefits: [
        'Automatic scheduling without complex logic',
        'Resource optimization for off-hours',
        'Business-hour prioritization',
        'Flexible time-based processing strategies'
      ],
      implementation: `// Business Hours Handler (High Priority)
useActionHandler('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  const isBusinessHours = isWithinBusinessHours(now);
  
  if (!isBusinessHours) {
    // Defer to off-hours handler
    controller.return({ 
      deferred: true, 
      reason: 'outside-business-hours',
      nextAvailableTime: getNextBusinessHour(now)
    });
    return;
  }
  
  // Immediate business hours processing
  const result = await processBusinessHoursTask(payload.taskType);
  return { processedDuringBusinessHours: true, result };
}, {
  priority: 100,
  id: 'business-hours-processor',
  tags: ['scheduled', 'business-hours']
});

// Off-Hours Handler (Lower Priority)
useActionHandler('processScheduledTask', async (payload, controller) => {
  const now = new Date();
  if (isWithinBusinessHours(now)) return; // Let business handler take over
  
  // Off-hours processing with different strategy
  const result = await processOffHoursTask(payload.taskType);
  return { processedDuringBusinessHours: false, result, offHoursProcessing: true };
}, {
  priority: 50,
  id: 'off-hours-processor',
  tags: ['scheduled', 'off-hours']
});`,
      testScenarios: [
        'Business Hours: Immediate task processing',
        'Off Hours: Deferred or alternative processing',
        'Weekend: Special off-hours handling',
        'Holiday: Custom scheduling logic'
      ]
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-semibold mb-4">📚 Conditional Execution Pattern Deep Dive</h3>
      
      {/* Pattern Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(patterns).map(([key, pattern]) => (
          <button
            key={key}
            onClick={() => setActivePattern(key)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              activePattern === key
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {pattern.icon} {pattern.title.split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>

      {/* Active Pattern Details */}
      {activePattern && (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">{patterns[activePattern].icon}</span>
              {patterns[activePattern].title}
            </h4>
            <p className="text-gray-700">{patterns[activePattern].description}</p>
          </div>

          {/* Key Principle */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">🎯 Key Principle</h5>
            <p className="text-blue-800">{patterns[activePattern].keyPrinciple}</p>
          </div>

          {/* Benefits */}
          <div>
            <h5 className="font-semibold mb-2">✨ Benefits</h5>
            <ul className="space-y-1">
              {patterns[activePattern].benefits.map((benefit: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Implementation Example */}
          <div>
            <h5 className="font-semibold mb-2">💻 Implementation Example</h5>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{patterns[activePattern].implementation}</code>
            </pre>
          </div>

          {/* Test Scenarios */}
          <div>
            <h5 className="font-semibold mb-2">🧪 Test Scenarios</h5>
            <div className="space-y-2">
              {patterns[activePattern].testScenarios.map((scenario: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 font-mono text-sm mt-1">{index + 1}.</span>
                  <span className="text-gray-700">{scenario}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Architecture Comparison */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="font-semibold mb-3">🏗️ Architecture Comparison</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h6 className="font-medium text-green-700 mb-2">✅ Context-Action Approach</h6>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Declarative handler registration</li>
              <li>• Automatic filtering by metadata</li>
              <li>• Clean separation of concerns</li>
              <li>• Pipeline-based execution</li>
              <li>• Testable in isolation</li>
            </ul>
          </div>
          <div>
            <h6 className="font-medium text-red-700 mb-2">❌ Traditional Approach</h6>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Imperative conditional logic</li>
              <li>• Mixed business and conditional code</li>
              <li>• Hard to test edge cases</li>
              <li>• Difficult to modify conditions</li>
              <li>• Complex nested if statements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related Concepts */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-semibold text-yellow-900 mb-2">🔗 Related Concepts</h5>
        <div className="text-sm text-yellow-800 space-y-1">
          <div><strong>Handler Priority:</strong> Controls execution order for conditional logic</div>
          <div><strong>Pipeline Results:</strong> Share data between conditional handlers</div>
          <div><strong>Controller Methods:</strong> abort(), return(), setResult() for flow control</div>
          <div><strong>Handler Metadata:</strong> Tags, environment, feature flags for filtering</div>
          <div><strong>Store Coordination:</strong> State management for handler communication</div>
        </div>
      </div>
    </div>
  );
}