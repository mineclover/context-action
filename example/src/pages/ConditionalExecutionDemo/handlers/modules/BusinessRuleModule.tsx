import { useCallback, useEffect } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../../stores';
import { mockServices } from '../../mockServices';
import { addLog } from '../../utils';
import { handlerRegistry, type HandlerModule } from '../core/HandlerRegistry';

// Module Definition
const businessRuleModule: HandlerModule = {
  name: 'business-rules',
  description: 'Business rule handlers for order processing, credit checks, and pricing',
  category: 'business',
  isActive: true,
  handlers: new Map([
    ['credit-checker', {
      id: 'credit-checker',
      priority: 100,
      tags: ['financial', 'credit', 'business-rules'],
      description: 'Credit limit validation for orders based on customer tier',
      category: 'business'
    }],
    ['discount-calculator', {
      id: 'discount-calculator',
      priority: 90,
      tags: ['pricing', 'discount', 'business-rules'],
      description: 'Tier-based discount calculation with volume bonuses',
      category: 'business',
      dependencies: ['credit-checker']
    }],
    ['inventory-validator', {
      id: 'inventory-validator',
      priority: 85,
      tags: ['inventory', 'validation', 'business-rules'],
      description: 'Product availability and stock validation',
      category: 'business'
    }],
    ['order-finalizer', {
      id: 'order-finalizer',
      priority: 70,
      tags: ['order', 'finalization', 'business-rules'],
      description: 'Final order processing and confirmation',
      category: 'business',
      dependencies: ['credit-checker', 'discount-calculator', 'inventory-validator']
    }]
  ])
};

export function BusinessRuleModule() {
  const stores = useConditionalStoreManager();

  // Register module on mount
  useEffect(() => {
    handlerRegistry.registerModule('business-rules', businessRuleModule);
    return () => {
      handlerRegistry.deactivateModule('business-rules');
    };
  }, []);

  // Credit check handler
  useConditionalActionHandler('processOrder', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    const { order, customer } = payload;
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '💳 Starting credit check', {
        customerId: customer.id,
        orderAmount: order.amount,
        customerTier: customer.tier
      }));

      // Apply business rules based on customer tier and order amount
      const creditThreshold = getCreditThreshold(customer.tier);
      const creditCheckRequired = order.amount > creditThreshold;
      
      logsStore.update(logs => addLog(logs, 'info', `Credit check ${creditCheckRequired ? 'required' : 'not required'}`, {
        creditThreshold,
        orderAmount: order.amount
      }));

      if (creditCheckRequired) {
        const creditCheck = await mockServices.performCreditCheck(customer.id, order.amount);
        
        if (!creditCheck.approved) {
          logsStore.update(logs => addLog(logs, 'error', '❌ Credit check failed', {
            reason: creditCheck.reason,
            availableCredit: creditCheck.availableCredit
          }));
          
          const executionTime = performance.now() - startTime;
          handlerRegistry.recordExecution('credit-checker', false, executionTime);
          
          controller.abort(`Credit check failed: ${creditCheck.reason}`);
          return;
        }
        
        // Store credit check result for other handlers
        const creditStore = stores.getStore('creditCheckResult');
        creditStore.setValue({
          approved: true,
          creditLimit: customer.creditLimit,
          orderAmount: order.amount,
          availableCredit: creditCheck.availableCredit,
          timestamp: Date.now()
        });
        
        logsStore.update(logs => addLog(logs, 'info', '✅ Credit check passed', {
          availableCredit: creditCheck.availableCredit
        }));
      }

      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('credit-checker', true, executionTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Credit check error', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('credit-checker', false, executionTime);
      
      controller.abort(`Credit check error: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 100,
    id: 'credit-checker',
    tags: ['financial', 'credit', 'business-rules']
  });

  // Discount calculation handler
  useConditionalActionHandler('processOrder', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    const { order, customer } = payload;
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '💰 Calculating discounts', {
        customerId: customer.id,
        customerTier: customer.tier,
        orderAmount: order.amount
      }));

      let discountPercentage = 0;
      
      // Apply tier-based discounts
      switch (customer.tier) {
        case 'platinum':
          discountPercentage = 15;
          break;
        case 'gold':
          discountPercentage = 10;
          break;
        case 'silver':
          discountPercentage = 5;
          break;
        case 'bronze':
          discountPercentage = 0;
          break;
      }
      
      // Volume discount for large orders
      if (order.amount > 1000) {
        discountPercentage += 5;
        logsStore.update(logs => addLog(logs, 'info', '🎁 Volume discount applied (+5%)', {
          volumeThreshold: 1000,
          orderAmount: order.amount
        }));
      }
      
      const discountAmount = (order.amount * discountPercentage) / 100;
      const finalAmount = order.amount - discountAmount;
      
      const orderResult = {
        orderId: order.id,
        customerId: customer.id,
        originalAmount: order.amount,
        finalAmount,
        discountApplied: discountPercentage > 0,
        discountPercentage,
        discountAmount,
        customerTier: customer.tier,
        timestamp: Date.now()
      };
      
      const orderStore = stores.getStore('orderResults');
      orderStore.update(results => [...results, orderResult]);
      
      logsStore.update(logs => addLog(logs, 'info', '✅ Discount calculation completed', {
        originalAmount: order.amount,
        discountPercentage,
        discountAmount,
        finalAmount
      }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('discount-calculator', true, executionTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Discount calculation error', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('discount-calculator', false, executionTime);
      
      controller.abort(`Discount calculation error: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 90,
    id: 'discount-calculator',
    tags: ['pricing', 'discount', 'business-rules']
  });

  // Inventory validation handler
  useConditionalActionHandler('processOrder', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    const { order } = payload;
    const logsStore = stores.getStore('logs');
    
    try {
      logsStore.update(logs => addLog(logs, 'info', '📦 Validating inventory', {
        orderId: order.id,
        itemCount: order.items.length
      }));

      // Simulate inventory check
      for (const item of order.items) {
        const available = await mockServices.checkInventory(item.id, item.quantity);
        
        if (!available) {
          logsStore.update(logs => addLog(logs, 'error', '❌ Item out of stock', {
            itemId: item.id,
            requestedQuantity: item.quantity
          }));
          
          const executionTime = performance.now() - startTime;
          handlerRegistry.recordExecution('inventory-validator', false, executionTime);
          
          controller.abort(`Item ${item.id} is out of stock`);
          return;
        }
        
        logsStore.update(logs => addLog(logs, 'info', '✅ Item available', {
          itemId: item.id,
          quantity: item.quantity
        }));
      }
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('inventory-validator', true, executionTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logsStore.update(logs => addLog(logs, 'error', '❌ Inventory validation error', { error: errorMessage }));
      
      const executionTime = performance.now() - startTime;
      handlerRegistry.recordExecution('inventory-validator', false, executionTime);
      
      controller.abort(`Inventory validation error: ${errorMessage}`);
    }
  }, [stores]), {
    priority: 85,
    id: 'inventory-validator',
    tags: ['inventory', 'validation', 'business-rules']
  });

  return null;
}

// Helper functions
function getCreditThreshold(tier: string): number {
  const thresholds = {
    'bronze': 100,
    'silver': 500,
    'gold': 1000,
    'platinum': 2000
  };
  return thresholds[tier as keyof typeof thresholds] || 100;
}