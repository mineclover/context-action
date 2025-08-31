import { useCallback } from 'react';
import { useOrderActionHandler } from '../contexts/FlowControlContexts';
import type { OrderResult } from '../scenarios/types';

interface OrderHandlerProps {
  onExecutionStep: (step: string) => void;
  onHandlerExecution: () => void;
  isBusinessHours: boolean;
}

export function OrderHandlers({ 
  onExecutionStep, 
  onHandlerExecution, 
  isBusinessHours 
}: OrderHandlerProps) {
  
  // Business Rules Handler (P:100) - Route based on business logic
  const businessRulesHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('📋 Business Rules Handler (P:100)');
    onHandlerExecution();
    
    console.log('📋 Evaluating business rules:', {
      orderId: payload.orderId,
      amount: payload.amount,
      expedited: payload.expedited,
      international: payload.international,
      customerTier: payload.customerTier,
      businessHours: isBusinessHours
    });
    
    // Simulate business rule evaluation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Routing logic based on business rules
    if (payload.expedited && payload.amount > 1000) {
      console.log('🚀 Expedited high-value order - Jump to priority 800');
      onExecutionStep('🚀 Route to Expedited Handler (P:800)');
      controller.jumpToPriority(800);
      return;
    }
    
    if (payload.international) {
      console.log('🌍 International order - Jump to priority 750');
      onExecutionStep('🌍 Route to International Handler (P:750)');
      controller.jumpToPriority(750);
      return;
    }
    
    if (payload.customerTier === 'premium' && !isBusinessHours) {
      console.log('⭐ Premium after-hours - Jump to priority 700');
      onExecutionStep('⭐ Route to Premium After-Hours Handler (P:700)');
      controller.jumpToPriority(700);
      return;
    }
    
    if (payload.amount > 10000) {
      console.log('💰 High-value order - Jump to priority 600');
      onExecutionStep('💰 Route to High-Value Handler (P:600)');
      controller.jumpToPriority(600);
      return;
    }
    
    // Standard processing - continue to next handler
    console.log('📝 Standard order processing');
    onExecutionStep('📝 Continue to Standard Processing');
    return;
  }, [onExecutionStep, onHandlerExecution, isBusinessHours]);
  
  // Expedited Handler (P:800)
  const expeditedHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('🚀 Expedited Processing (P:800)');
    onHandlerExecution();
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Fast processing
    
    console.log('🚀 Expedited order processed');
    controller.return({
      type: 'expedited' as const,
      processingTime: '30 seconds',
      orderId: payload.orderId,
      timestamp: Date.now()
    });
  }, [onExecutionStep, onHandlerExecution]);
  
  // International Handler (P:750) 
  const internationalHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('🌍 International Processing (P:750)');
    onHandlerExecution();
    
    await new Promise(resolve => setTimeout(resolve, 250)); // Additional validation time
    
    console.log('🌍 International order processed');
    controller.return({
      type: 'international' as const,
      processingTime: '2 minutes',
      orderId: payload.orderId,
      timestamp: Date.now()
    });
  }, [onExecutionStep, onHandlerExecution]);
  
  // Premium After-Hours Handler (P:700)
  const premiumAfterHoursHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('⭐ Premium After-Hours Processing (P:700)');
    onHandlerExecution();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('⭐ Premium after-hours order processed');
    controller.return({
      type: 'premium-after-hours' as const,
      processingTime: '1 minute',
      orderId: payload.orderId,
      timestamp: Date.now()
    });
  }, [onExecutionStep, onHandlerExecution]);
  
  // High-Value Handler (P:600)
  const highValueHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('💰 High-Value Processing (P:600)');
    onHandlerExecution();
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Extra validation
    
    console.log('💰 High-value order processed');
    controller.return({
      type: 'high-value' as const,
      processingTime: '3 minutes',
      orderId: payload.orderId,
      timestamp: Date.now()
    });
  }, [onExecutionStep, onHandlerExecution]);
  
  // Standard Handler (P:50) - Default processing
  const standardHandler = useCallback(async (payload: any, controller: any): Promise<void> => {
    onExecutionStep('📝 Standard Processing (P:50)');
    onHandlerExecution();
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('📝 Standard order processed');
    controller.return({
      type: 'standard' as const,
      processingTime: '5 minutes',
      orderId: payload.orderId,
      timestamp: Date.now()
    });
  }, [onExecutionStep, onHandlerExecution]);
  
  // Register all handlers with their priorities
  // Use blocking: true to enable proper pipeline flow control
  useOrderActionHandler('processOrder', businessRulesHandler, { priority: 100, blocking: true });
  useOrderActionHandler('processOrder', expeditedHandler, { priority: 800, blocking: true });
  useOrderActionHandler('processOrder', internationalHandler, { priority: 750, blocking: true });
  useOrderActionHandler('processOrder', premiumAfterHoursHandler, { priority: 700, blocking: true });
  useOrderActionHandler('processOrder', highValueHandler, { priority: 600, blocking: true });
  useOrderActionHandler('processOrder', standardHandler, { priority: 50, blocking: true });
  
  return null;
}