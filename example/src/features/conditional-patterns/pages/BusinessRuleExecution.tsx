import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ConditionalStoreProvider, 
  ConditionalActionProvider,
  useConditionalAction,
  useConditionalStore,
  useConditionalActionHandler
} from '../stores';
import { useStoreValue } from '@context-action/react';
import { mockServices } from '../mockServices';

// Business Rules State Interface
interface BusinessRuleState {
  customerId: string;
  customerTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  amount: number;
  productId: string;
  executionResults: BusinessRuleResult[];
  finalResult: {
    approved: boolean;
    finalAmount: number;
    discount: number;
    riskScore: number;
    reason?: string;
  } | null;
}

interface BusinessRuleResult {
  ruleName: string;
  priority: number;
  passed: boolean;
  result: any;
  executionTime: number;
  timestamp: Date;
}

// Mock product inventory
const productInventory: Record<string, { stock: number; price: number; name: string; premiumRequired: boolean }> = {
  'prod-001': { stock: 15, price: 299.99, name: 'Standard Widget', premiumRequired: false },
  'prod-002': { stock: 5, price: 899.99, name: 'Premium Gadget', premiumRequired: true },
  'prod-003': { stock: 0, price: 199.99, name: 'Basic Tool', premiumRequired: false },
  'prod-004': { stock: 3, price: 1599.99, name: 'Enterprise Solution', premiumRequired: true }
};

function BusinessRuleExecutionContent() {
  const dispatch = useConditionalAction();
  const logsStore = useConditionalStore('logs');
  const logs = useStoreValue(logsStore);

  // Business Rule State
  const [businessState, setBusinessState] = useState<BusinessRuleState>({
    customerId: 'customer-002',
    customerTier: 'silver',
    amount: 500,
    productId: 'prod-001',
    executionResults: [],
    finalResult: null
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Rule Chain Coordination Pattern: Priority-based rule execution
  useConditionalActionHandler('processPurchase', useCallback(async (payload: any, controller) => {
    setIsProcessing(true);
    setBusinessState(prev => ({ ...prev, executionResults: [], finalResult: null }));
    
    const startTime = Date.now();
    const results: BusinessRuleResult[] = [];
    let finalAmount = payload.amount;
    let discount = 0;
    let riskScore = 0;
    let approved = true;
    let reason = '';

    try {
      // Rule 1: Credit Validation (P100) - Highest Priority
      const creditStart = Date.now();
      const creditResult = await mockServices.validateCreditLimit(payload.customerId, payload.amount);
      const creditTime = Date.now() - creditStart;
      
      results.push({
        ruleName: 'Credit Validation',
        priority: 100,
        passed: creditResult.valid,
        result: creditResult,
        executionTime: creditTime,
        timestamp: new Date()
      });

      if (!creditResult.valid) {
        // Early termination - Rule Chain Coordination pattern
        approved = false;
        reason = `Credit limit exceeded. Available: $${creditResult.remainingCredit}`;
        controller.abort(`Credit validation failed: ${reason}`);
        setBusinessState(prev => ({ 
          ...prev, 
          executionResults: results,
          finalResult: { approved, finalAmount: payload.amount, discount, riskScore, reason }
        }));
        return;
      }

      // Rule 2: Premium Access Check (P95)
      const product = productInventory[payload.productId];
      if (product?.premiumRequired) {
        const premiumStart = Date.now();
        const isPremium = ['gold', 'platinum'].includes(payload.customerTier);
        const premiumTime = Date.now() - premiumStart;
        
        results.push({
          ruleName: 'Premium Access',
          priority: 95,
          passed: isPremium,
          result: { required: true, customerTier: payload.customerTier, allowed: isPremium },
          executionTime: premiumTime,
          timestamp: new Date()
        });

        if (!isPremium) {
          approved = false;
          reason = `Premium product requires Gold or Platinum tier. Current tier: ${payload.customerTier}`;
          controller.abort(`Premium access denied: ${reason}`);
          setBusinessState(prev => ({ 
            ...prev, 
            executionResults: results,
            finalResult: { approved, finalAmount: payload.amount, discount, riskScore, reason }
          }));
          return;
        }
      } else {
        results.push({
          ruleName: 'Premium Access',
          priority: 95,
          passed: true,
          result: { required: false, customerTier: payload.customerTier, allowed: true },
          executionTime: 5,
          timestamp: new Date()
        });
      }

      // Rule 3: Inventory Check (P90)
      const inventoryStart = Date.now();
      const inventoryTime = Date.now() - inventoryStart;
      
      results.push({
        ruleName: 'Inventory Check',
        priority: 90,
        passed: product.stock > 0,
        result: { productId: payload.productId, stock: product.stock, available: product.stock > 0 },
        executionTime: inventoryTime,
        timestamp: new Date()
      });

      if (product.stock === 0) {
        approved = false;
        reason = `Product ${product.name} is out of stock`;
        controller.abort(`Inventory validation failed: ${reason}`);
        setBusinessState(prev => ({ 
          ...prev, 
          executionResults: results,
          finalResult: { approved, finalAmount: payload.amount, discount, riskScore, reason }
        }));
        return;
      }

      // Rule 4: Tier-Based Pricing (P80)
      const pricingStart = Date.now();
      const pricingResult = await mockServices.calculateDiscount(payload.customerTier, payload.amount);
      const pricingTime = Date.now() - pricingStart;
      
      results.push({
        ruleName: 'Tier Pricing',
        priority: 80,
        passed: true,
        result: pricingResult,
        executionTime: pricingTime,
        timestamp: new Date()
      });

      finalAmount = pricingResult.finalAmount;
      discount = pricingResult.discount;

      // Rule 5: Risk Assessment (P70)
      const riskStart = Date.now();
      // Simple risk calculation based on amount and tier
      const baseRisk = payload.amount > 1000 ? 0.3 : 0.1;
      const tierRisk = { bronze: 0.2, silver: 0.1, gold: 0.05, platinum: 0.02 }[payload.customerTier];
      riskScore = Math.min(baseRisk + tierRisk, 1.0);
      const highRisk = riskScore > 0.5;
      const riskTime = Date.now() - riskStart;
      
      results.push({
        ruleName: 'Risk Assessment',
        priority: 70,
        passed: !highRisk,
        result: { riskScore, threshold: 0.5, highRisk, factors: { amount: payload.amount, tier: payload.customerTier } },
        executionTime: riskTime,
        timestamp: new Date()
      });

      if (highRisk) {
        approved = false;
        reason = `High risk transaction detected (score: ${riskScore.toFixed(2)})`;
        controller.abort(`Risk assessment failed: ${reason}`);
        setBusinessState(prev => ({ 
          ...prev, 
          executionResults: results,
          finalResult: { approved, finalAmount, discount, riskScore, reason }
        }));
        return;
      }

      // All rules passed - Rule Chain Coordination success
      reason = 'All business rules passed successfully';
      setBusinessState(prev => ({ 
        ...prev, 
        executionResults: results,
        finalResult: { approved: true, finalAmount, discount, riskScore, reason }
      }));

      logsStore.setValue(prev => [...prev, {
        timestamp: new Date(),
        action: 'processPurchase',
        level: 'success' as const,
        details: `Purchase processed: $${finalAmount.toFixed(2)} (${results.length} rules executed in ${Date.now() - startTime}ms)`
      }]);

    } catch (error) {
      approved = false;
      reason = error instanceof Error ? error.message : 'Unknown error occurred';
      setBusinessState(prev => ({ 
        ...prev, 
        executionResults: results,
        finalResult: { approved: false, finalAmount: payload.amount, discount, riskScore, reason }
      }));
    } finally {
      setIsProcessing(false);
    }
  }, []));

  const handleTestPurchase = () => {
    dispatch('processPurchase', {
      customerId: businessState.customerId,
      customerTier: businessState.customerTier,
      amount: businessState.amount,
      productId: businessState.productId
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
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
            Rule Chain Coordination: Priority-based business rules with cascading validation
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Rule Chain Coordination:</strong> Multiple business rules execute in priority order. 
              Failed rules abort processing with early termination. Context is passed between rules for complex decisions.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Purchase Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <select 
                  value={businessState.customerId}
                  onChange={(e) => setBusinessState(prev => ({ 
                    ...prev, 
                    customerId: e.target.value,
                    customerTier: e.target.value === 'customer-001' ? 'bronze' : 
                                e.target.value === 'customer-002' ? 'silver' : 
                                e.target.value === 'customer-003' ? 'gold' : 'platinum'
                  }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="customer-001">Customer 001 (Bronze, $1000 limit)</option>
                  <option value="customer-002">Customer 002 (Silver, $5000 limit)</option>
                  <option value="customer-003">Customer 003 (Gold, $500 limit)</option>
                  <option value="customer-vip">Customer VIP (Platinum, $10000 limit)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select 
                  value={businessState.productId}
                  onChange={(e) => setBusinessState(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {Object.entries(productInventory).map(([id, product]) => (
                    <option key={id} value={id}>
                      {product.name} - ${product.price} {product.premiumRequired ? '(Premium)' : ''} 
                      {product.stock === 0 ? ' - OUT OF STOCK' : ` (${product.stock} in stock)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount: ${businessState.amount}
                </label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={businessState.amount}
                  onChange={(e) => setBusinessState(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$50</span>
                  <span>$2000</span>
                </div>
              </div>

              <button
                onClick={handleTestPurchase}
                disabled={isProcessing}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing Rules...' : 'Process Purchase'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Rule Chain Status</h2>
            
            {businessState.executionResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Configure purchase and click "Process Purchase" to see rule chain execution
              </div>
            ) : (
              <div className="space-y-3">
                {businessState.executionResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {result.passed ? '✅' : '❌'} {result.ruleName}
                      </span>
                      <span className="text-xs text-gray-500">
                        P{result.priority} | {result.executionTime}ms
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {JSON.stringify(result.result, null, 0).substring(0, 100)}
                      {JSON.stringify(result.result).length > 100 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Final Result */}
        {businessState.finalResult && (
          <div className={`rounded-lg shadow-sm border p-6 mb-8 ${
            businessState.finalResult.approved 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {businessState.finalResult.approved ? '✅ Purchase Approved' : '❌ Purchase Denied'}
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Final Amount</div>
                <div className="font-semibold">${businessState.finalResult.finalAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Discount</div>
                <div className="font-semibold">${businessState.finalResult.discount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Risk Score</div>
                <div className="font-semibold">{(businessState.finalResult.riskScore * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-semibold">{businessState.finalResult.reason}</div>
              </div>
            </div>
          </div>
        )}

        {/* Architecture Explanation */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">Rule Chain Coordination Pattern</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-purple-800 mb-2">Implementation Benefits</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Priority Execution:</strong> Rules execute by business importance</li>
                <li>• <strong>Early Termination:</strong> Failed rules immediately abort chain</li>
                <li>• <strong>Context Passing:</strong> Rules can build on previous results</li>
                <li>• <strong>Audit Trail:</strong> Complete execution history with timing</li>
                <li>• <strong>Performance:</strong> Only necessary rules execute</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-purple-800 mb-2">Business Rules Order</h3>
              <ol className="text-sm text-purple-700 space-y-1">
                <li>1. <strong>Credit Validation (P100):</strong> Financial capability first</li>
                <li>2. <strong>Premium Access (P95):</strong> Tier requirements check</li>
                <li>3. <strong>Inventory Check (P90):</strong> Product availability</li>
                <li>4. <strong>Tier Pricing (P80):</strong> Apply customer discounts</li>
                <li>5. <strong>Risk Assessment (P70):</strong> Fraud detection last</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Logs Display */}
        {logs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Execution Logs</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={`ml-2 ${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      log.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {log.action}
                    </span>
                    <span className="ml-2 text-gray-700">{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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