export interface PermissionEvaluation {
  userLevel: number;
  requiredLevel: number;
  granted: boolean;
  reason: string;
}

const ROLE_LEVELS: Record<string, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

const ACTION_LEVELS: Record<string, number> = {
  read: 0,
  create: 1,
  update: 1,
  delete: 2,
  moderate: 2,
  admin: 3,
  'manage-users': 3,
  'system-config': 4,
};

export function evaluatePermission(
  userRole: string,
  action: string
): PermissionEvaluation {
  const userLevel = ROLE_LEVELS[userRole] ?? 0;
  const requiredLevel = ACTION_LEVELS[action] ?? 0;
  const granted = userLevel >= requiredLevel;

  return {
    userLevel,
    requiredLevel,
    granted,
    reason: granted
      ? `Permission granted: ${userRole} has sufficient privileges`
      : `Access denied: ${userRole} (level ${userLevel}) insufficient for ${action} (requires level ${requiredLevel})`,
  };
}
