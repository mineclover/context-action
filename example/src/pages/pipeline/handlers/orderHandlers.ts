import type { ActionRegister } from '@context-action/core';
import type { OrderActions, OrderResult } from '../scenarios/types';

export interface OrderHandlerDependencies {
  setExecutionPath: React.Dispatch<React.SetStateAction<string[]>>;
  setHandlerExecutions: React.Dispatch<React.SetStateAction<number>>;
  isBusinessHours: boolean;
}

export function setupOrderHandlers(
  register: ActionRegister<OrderActions>,
  deps: OrderHandlerDependencies
) {
  const { setExecutionPath, setHandlerExecutions, isBusinessHours } = deps;

  // Business rules handler (priority 100)
  const unregisterBusinessRules = register.register<'processOrder', void>('processOrder', async (payload, controller) => {
    console.log('📋 Processing business rules...');
    setExecutionPath(prev => [...prev, 'business-rules']);
    setHandlerExecutions(prev => prev + 1);
    
    // High-value order processing
    if (payload.amount > 10000) {
      controller.jumpToPriority(1000);
      setExecutionPath(prev => [...prev, 'route-to-high-value']);
      return;
    }
    
    // Expedited processing
    if (payload.expedited) {
      controller.jumpToPriority(800);
      setExecutionPath(prev => [...prev, 'route-to-expedited']);
      return;
    }
    
    // International processing
    if (payload.international) {
      controller.jumpToPriority(600);
      setExecutionPath(prev => [...prev, 'route-to-international']);
      return;
    }
    
    // Premium customer priority boost
    if (payload.customerTier === 'premium' && !isBusinessHours) {
      controller.jumpToPriority(700);
      setExecutionPath(prev => [...prev, 'route-to-premium-after-hours']);
      return;
    }
    
    setExecutionPath(prev => [...prev, 'continue-standard']);
  }, { priority: 100, id: 'business-rules' });

  // Standard processing (priority 200)
  const unregisterStandard = register.register<'processOrder', OrderResult>('processOrder', async (payload, controller) => {
    console.log('⚡ Standard processing...');
    setExecutionPath(prev => [...prev, 'standard-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { 
      type: 'standard', 
      processingTime: '1-2 business days',
      orderId: payload.orderId,
      timestamp: Date.now()
    };
  }, { priority: 200, id: 'standard' });

  // International processing (priority 600)
  const unregisterInternational = register.register<'processOrder', OrderResult>('processOrder', async (payload, controller) => {
    console.log('🌍 International processing...');
    setExecutionPath(prev => [...prev, 'international-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      type: 'international', 
      processingTime: '3-5 business days',
      orderId: payload.orderId,
      timestamp: Date.now()
    };
  }, { priority: 600, id: 'international' });

  // Premium after-hours processing (priority 700)
  const unregisterPremiumAfterHours = register.register<'processOrder', OrderResult>('processOrder', async (payload, controller) => {
    console.log('⭐ Premium after-hours processing...');
    setExecutionPath(prev => [...prev, 'premium-after-hours-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return { 
      type: 'premium-after-hours', 
      processingTime: 'next business day',
      orderId: payload.orderId,
      timestamp: Date.now()
    };
  }, { priority: 700, id: 'premium-after-hours' });

  // Expedited processing (priority 800)
  const unregisterExpedited = register.register<'processOrder', OrderResult>('processOrder', async (payload, controller) => {
    console.log('🚀 Expedited processing...');
    setExecutionPath(prev => [...prev, 'expedited-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { 
      type: 'expedited', 
      processingTime: 'same day',
      orderId: payload.orderId,
      timestamp: Date.now()
    };
  }, { priority: 800, id: 'expedited' });

  // High-value processing (priority 1000)
  const unregisterHighValue = register.register<'processOrder', OrderResult>('processOrder', async (payload, controller) => {
    console.log('💎 High-value processing...');
    setExecutionPath(prev => [...prev, 'high-value-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return { 
      type: 'high-value', 
      processingTime: '24 hours with verification',
      orderId: payload.orderId,
      timestamp: Date.now()
    };
  }, { priority: 1000, id: 'high-value' });

  // Cleanup function
  return () => {
    unregisterBusinessRules();
    unregisterStandard();
    unregisterInternational();
    unregisterPremiumAfterHours();
    unregisterExpedited();
    unregisterHighValue();
  };
}