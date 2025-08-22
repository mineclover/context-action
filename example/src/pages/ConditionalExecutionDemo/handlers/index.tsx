import React from 'react';
import { DeploymentHandlers } from './DeploymentHandlers';
import { UserProcessingHandlers } from './UserProcessingHandlers';
import { PermissionHandlers } from './PermissionHandlers';
import { BusinessRuleHandlers } from './BusinessRuleHandlers';
import { ScheduleHandlers } from './ScheduleHandlers';

export function AllHandlers() {
  return (
    <>
      <DeploymentHandlers />
      <UserProcessingHandlers />
      <PermissionHandlers />
      <BusinessRuleHandlers />
      <ScheduleHandlers />
    </>
  );
}

export {
  DeploymentHandlers,
  UserProcessingHandlers,
  PermissionHandlers,
  BusinessRuleHandlers,
  ScheduleHandlers
};