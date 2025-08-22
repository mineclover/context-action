import React from 'react';
import { DeploymentModule } from './DeploymentModule';
import { BusinessRuleModule } from './BusinessRuleModule';

// Simplified module imports for handlers that don't need full rewrite
import { PermissionHandlers } from '../PermissionHandlers';
import { UserProcessingHandlers } from '../UserProcessingHandlers';
import { ScheduleHandlers } from '../ScheduleHandlers';

// Module management component that loads all handler modules
export function ModularHandlers() {
  return (
    <>
      {/* Modularized handlers */}
      <DeploymentModule />
      <BusinessRuleModule />
      
      {/* Existing handlers (to be modularized later) */}
      <PermissionHandlers />
      <UserProcessingHandlers />
      <ScheduleHandlers />
    </>
  );
}

// Re-export individual modules for selective loading
export {
  DeploymentModule,
  BusinessRuleModule,
  PermissionHandlers,
  UserProcessingHandlers,
  ScheduleHandlers
};

// Module configuration for dynamic loading
export const availableModules = {
  deployment: {
    name: 'Deployment Module',
    description: 'Environment-based deployment handlers',
    component: DeploymentModule,
    category: 'environment',
    priority: 'high'
  },
  businessRules: {
    name: 'Business Rules Module',
    description: 'Order processing and pricing handlers',
    component: BusinessRuleModule,
    category: 'business',
    priority: 'high'
  },
  permissions: {
    name: 'Permission Module',
    description: 'Role-based access control handlers',
    component: PermissionHandlers,
    category: 'permission',
    priority: 'critical'
  },
  userProcessing: {
    name: 'User Processing Module',
    description: 'Feature-gated user processing handlers',
    component: UserProcessingHandlers,
    category: 'feature',
    priority: 'medium'
  },
  scheduling: {
    name: 'Schedule Module',
    description: 'Time-based processing handlers',
    component: ScheduleHandlers,
    category: 'schedule',
    priority: 'medium'
  }
};