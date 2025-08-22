import { useCallback } from 'react';
import { useConditionalActionHandler, useConditionalStoreManager } from '../stores';
import { mockServices } from '../mockServices';
import { addLog, getCreditThreshold } from '../utils';

export function BusinessRuleHandlers() {
  const stores = useConditionalStoreManager();
  
  // Credit check handler
  useConditionalActionHandler('processOrder', useCallback(async (payload, controller) => {
    const { order, customer } = payload;
    const logsStore = stores.getStore('logs');
    
    // Apply business rules based on customer tier and order amount
    const creditCheckRequired = order.amount > getCreditThreshold(customer.tier);
    
    logsStore.update(logs => addLog(logs, 'info', '💳 Credit check started', { 
      orderId: order.id, 
      amount: order.amount, 
      tier: customer.tier,
      required: creditCheckRequired 
    }));
    
    if (creditCheckRequired) {
      try {
        const creditCheck = await mockServices.performCreditCheck(customer.id, order.amount);
        
        if (!creditCheck.approved) {
          const errorMsg = `Credit check failed: ${creditCheck.reason}`;
          logsStore.update(logs => addLog(logs, 'error', errorMsg, creditCheck));
          controller.abort(errorMsg);
          return;
        }
        
        const result = {
          step: 'credit-check',
          approved: true,
          creditLimit: customer.creditLimit,
          orderAmount: order.amount,
          availableCredit: creditCheck.availableCredit,
          timestamp: Date.now()
        };
        
        // Store result for handler coordination
        logsStore.update(logs => addLog(logs, 'info', '✅ Credit check passed', result));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logsStore.update(logs => addLog(logs, 'error', '❌ Credit check failed', { error: errorMessage }));
        controller.abort(`Credit check failed: ${errorMessage}`);
        return;
      }
    }
    
    // Credit check completed - results stored in controller
  }, [stores]), {
    priority: 100,
    id: 'credit-checker',
    tags: ['financial', 'credit', 'business-rules']
  });

  // Discount calculation handler
  useConditionalActionHandler('processOrder', useCallback(async (payload, controller) => {
    const { order, customer } = payload;
    const logsStore = stores.getStore('logs');
    
    logsStore.update(logs => addLog(logs, 'info', '💰 Discount calculation started', { 
      orderId: order.id, 
      tier: customer.tier,
      amount: order.amount 
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
    }
    
    const discountAmount = (order.amount * discountPercentage) / 100;
    const finalAmount = order.amount - discountAmount;
    
    const result = {
      step: 'discount-calculation',
      originalAmount: order.amount,
      discountPercentage,
      discountAmount,
      finalAmount,
      customerTier: customer.tier,
      timestamp: Date.now()
    };
    
    // Store discount calculation result
    
    const orderStore = stores.getStore('orderResults');
    orderStore.update(results => [...results, {
      orderId: order.id,
      customerId: customer.id,
      originalAmount: order.amount,
      finalAmount,
      discountApplied: discountPercentage > 0,
      discountPercentage,
      timestamp: Date.now()
    }]);
    
    logsStore.update(logs => addLog(logs, 'info', '✅ Discount calculation completed', result));
  }, [stores]), {
    priority: 90,
    id: 'discount-calculator',
    tags: ['pricing', 'discount', 'business-rules']
  });

  return null;
}