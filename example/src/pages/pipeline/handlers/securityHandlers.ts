import type { ActionRegister } from '@context-action/core';
import type { SecurityActions, SecurityResult } from '../scenarios/types';

export interface SecurityHandlerDependencies {
  setExecutionPath: React.Dispatch<React.SetStateAction<string[]>>;
  setHandlerExecutions: React.Dispatch<React.SetStateAction<number>>;
}

export function setupSecurityHandlers(
  register: ActionRegister<SecurityActions>,
  deps: SecurityHandlerDependencies
) {
  const { setExecutionPath, setHandlerExecutions } = deps;

  // Standard security handler (priority 50)
  const unregisterStandard = register.register<'processRequest', SecurityResult>('processRequest', async (payload, controller) => {
    console.log('🔍 Initial security check...');
    setExecutionPath(prev => [...prev, 'standard-security-check']);
    setHandlerExecutions(prev => prev + 1);
    
    if (payload.requiresElevation) {
      controller.jumpToPriority(1000);
      console.log('⚡ Jumping to elevated security pipeline');
      setExecutionPath(prev => [...prev, 'priority-jump-to-elevated']);
      return { level: 'standard', processed: false, timestamp: Date.now() };
    }
    
    return { level: 'standard', processed: true, timestamp: Date.now() };
  }, { priority: 50, id: 'standard-security' });

  // Elevated security handler (priority 1000)
  const unregisterElevated = register.register<'processRequest', SecurityResult>('processRequest', async (payload, controller) => {
    console.log('🛡️ Elevated security processing...');
    setExecutionPath(prev => [...prev, 'elevated-security-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    // Simulate security check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (payload.role === 'standard') {
      controller.abort('Insufficient permissions for elevated action');
      return { level: 'elevated', authorized: false, timestamp: Date.now() };
    }
    
    return { 
      level: 'elevated', 
      authorized: true, 
      securityToken: `elevated-token-${Date.now()}`,
      timestamp: Date.now()
    };
  }, { priority: 1000, id: 'elevated-security' });

  // Cleanup function
  return () => {
    unregisterStandard();
    unregisterElevated();
  };
}