import { useCallback } from 'react';
import { useSecurityActionHandler } from '../contexts/FlowControlContexts';

// import type { SecurityResult } from '../scenarios/types';

interface SecurityHandlerProps {
  onExecutionStep: (step: string) => void;
  onHandlerExecution: () => void;
  isBusinessHours: boolean;
}

export function SecurityHandlers({
  onExecutionStep,
  onHandlerExecution,
  isBusinessHours,
}: SecurityHandlerProps) {
  // Standard Security Handler (P:1000) - Highest priority, runs first
  const standardSecurityHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🛡️ Standard Security Handler (P:1000)');
      onHandlerExecution();

      console.log('🛡️ Standard Security Processing:', {
        userId: payload.userId,
        action: payload.action,
        role: payload.role,
        requiresElevation: payload.requiresElevation,
      });

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if elevation is required
      if (payload.requiresElevation) {
        console.log('⬆️ Elevation required, jumping to priority 50');
        onExecutionStep('⬆️ Jump to Priority 50 (Elevated Handler)');

        // Dynamic priority jump - route to elevated handler (don't terminate pipeline)
        controller.jumpToPriority(50);
        return; // Continue to elevated handler without terminating pipeline
      }

      // Normal processing without elevation - only if no elevation required
      console.log('✅ Standard processing completed');
      onExecutionStep('✅ Standard Processing Complete');

      controller.return({
        level: 'standard' as const,
        processed: true,
        authorized: true,
        timestamp: Date.now(),
      });
    },
    [onExecutionStep, onHandlerExecution]
  );

  // Elevated Security Handler (P:50) - Lower priority, runs after jump
  const elevatedSecurityHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🔐 Elevated Security Handler (P:50)');
      onHandlerExecution();

      console.log('🔐 Elevated Security Check:', {
        userId: payload.userId,
        role: payload.role,
        action: payload.action,
        businessHours: isBusinessHours,
      });

      // Simulate authorization check delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Authorization logic based on role
      const isAuthorized = payload.role === 'admin' || payload.role === 'super';

      if (isAuthorized) {
        console.log('✅ Elevated authorization successful');
        onExecutionStep('✅ Authorization Success - Security Token Generated');

        controller.return({
          level: 'elevated' as const,
          processed: true,
          authorized: true,
          securityToken: `token-${Date.now()}-${payload.userId}`,
          timestamp: Date.now(),
        });
      } else {
        console.log('❌ Elevated authorization failed');
        onExecutionStep('❌ Authorization Failed - Access Denied');

        // Abort pipeline execution
        controller.abort(`Insufficient privileges for ${payload.action}`);

        controller.return({
          level: 'elevated' as const,
          processed: true,
          authorized: false,
          timestamp: Date.now(),
        });
      }
    },
    [onExecutionStep, onHandlerExecution, isBusinessHours]
  );

  // Register handlers with appropriate priorities
  // Use blocking: true to enable proper pipeline flow control
  useSecurityActionHandler('processRequest', standardSecurityHandler, {
    priority: 1000,
    blocking: true,
  });
  useSecurityActionHandler('processRequest', elevatedSecurityHandler, {
    priority: 50,
    blocking: true,
  });

  return null;
}
