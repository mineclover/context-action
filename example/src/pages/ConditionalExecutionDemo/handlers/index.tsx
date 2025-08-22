import React from 'react';
import { ModularHandlers } from './modules';

// Import legacy handlers for re-export
import { DeploymentHandlers } from './DeploymentHandlers';
import { UserProcessingHandlers } from './UserProcessingHandlers';
import { PermissionHandlers } from './PermissionHandlers';
import { BusinessRuleHandlers } from './BusinessRuleHandlers';
import { ScheduleHandlers } from './ScheduleHandlers';

export function AllHandlers() {
  return <ModularHandlers />;
}

// Legacy exports for backward compatibility
export {
  DeploymentHandlers,
  UserProcessingHandlers,
  PermissionHandlers,
  BusinessRuleHandlers,
  ScheduleHandlers
};