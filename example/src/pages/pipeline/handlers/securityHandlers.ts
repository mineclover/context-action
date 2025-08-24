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

  // Standard security handler (priority 1000 - executes first)
  const unregisterStandard = register.register<'processRequest', SecurityResult>('processRequest', async (payload, controller) => {
    console.log('🔍 Initial security check...');
    setExecutionPath(prev => [...prev, 'standard-security-check']);
    setHandlerExecutions(prev => prev + 1);
    
    if (payload.requiresElevation) {
      console.log('⚡ Jumping to elevated security pipeline');
      setExecutionPath(prev => [...prev, 'priority-jump-to-elevated']);
      controller.jumpToPriority(50); // Jump to lower priority number
      return; // jumpToPriority 후에는 즉시 종료
    }
    
    controller.setResult({ level: 'standard', processed: true, timestamp: Date.now() });
  }, { priority: 1000, id: 'standard-security' });

  // Elevated security handler (priority 50 - lower priority, jumped to)
  const unregisterElevated = register.register<'processRequest', SecurityResult>('processRequest', async (payload, controller) => {
    console.log('🛡️ Elevated security processing...');
    setExecutionPath(prev => [...prev, 'elevated-security-processing']);
    setHandlerExecutions(prev => prev + 1);
    
    // Simulate security check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (payload.role === 'standard') {
      console.log('❌ Insufficient permissions for elevated action');
      setExecutionPath(prev => [...prev, 'authorization-failed']);
      controller.abort('Insufficient permissions for elevated action');
      return; // abort 후에는 즉시 종료
    }
    
    console.log('✅ Elevated security check passed');
    setExecutionPath(prev => [...prev, 'authorization-success']);
    controller.setResult({ 
      level: 'elevated', 
      authorized: true, 
      securityToken: `elevated-token-${Date.now()}`,
      timestamp: Date.now()
    });
  }, { priority: 50, id: 'elevated-security' });

  // Cleanup function
  return () => {
    unregisterStandard();
    unregisterElevated();
  };
}