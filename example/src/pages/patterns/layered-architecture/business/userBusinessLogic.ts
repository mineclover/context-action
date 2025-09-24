/**
 * Pure Business Logic Functions Layer
 *
 * This layer contains:
 * - Pure functions with no side effects
 * - Domain logic and business rules
 * - Data validation and transformation
 * - No dependencies on React hooks or external services
 */

import type { User, UserValidationResult, UserOperationResult } from '../contexts/UserManagementContexts';

// 🎯 User Validation Logic (Pure Function)
export function validateUserData(data: {
  name: string;
  email: string;
}): UserValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (data.name && data.name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 🎯 User Creation Logic (Pure Function)
export function createUserEntity(data: {
  name: string;
  email: string;
  role: User['role'];
}, existingUsers: User[]): UserOperationResult {
  // Check if email already exists
  const emailExists = existingUsers.some(user => user.email === data.email);
  if (emailExists) {
    return {
      success: false,
      message: 'User with this email already exists',
    };
  }

  // Validate input data
  const validation = validateUserData(data);
  if (!validation.isValid) {
    return {
      success: false,
      message: `Validation failed: ${validation.errors.join(', ')}`,
    };
  }

  // Create new user entity
  const newUser: User = {
    id: generateUserId(existingUsers),
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    role: data.role,
    createdAt: new Date(),
  };

  return {
    success: true,
    message: 'User created successfully',
    user: newUser,
  };
}

// 🎯 User Update Logic (Pure Function)
export function updateUserEntity(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'role'>>,
  existingUsers: User[]
): UserOperationResult {
  const userIndex = existingUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  const currentUser = existingUsers[userIndex];

  // If email is being updated, check for duplicates
  if (updates.email && updates.email !== currentUser?.email) {
    const emailExists = existingUsers.some(
      user => user.id !== userId && user.email === updates.email
    );
    if (emailExists) {
      return {
        success: false,
        message: 'Another user with this email already exists',
      };
    }
  }

  // Validate updated data
  if (updates.name !== undefined || updates.email !== undefined) {
    const validationData = {
      name: updates.name ?? currentUser?.name ?? '',
      email: updates.email ?? currentUser?.email ?? '',
    };

    const validation = validateUserData(validationData);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }
  }

  // Create updated user
  const updatedUser: User = {
    ...currentUser!,
    ...updates,
    email: updates.email ? updates.email.toLowerCase().trim() : currentUser!.email,
    name: updates.name ? updates.name.trim() : currentUser!.name,
  };

  return {
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  };
}

// 🎯 User Deletion Logic (Pure Function)
export function deleteUserEntity(
  userId: string,
  existingUsers: User[]
): UserOperationResult {
  const userIndex = existingUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  const user = existingUsers[userIndex];

  // Business rule: Cannot delete admin users if they're the last admin
  if (user?.role === 'admin') {
    const adminCount = existingUsers.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return {
        success: false,
        message: 'Cannot delete the last admin user',
      };
    }
  }

  return {
    success: true,
    message: 'User deleted successfully',
    user,
  };
}

// 🎯 User List Operations (Pure Functions)
export function filterUsersByRole(users: User[], role: User['role']): User[] {
  return users.filter(user => user.role === role);
}

export function sortUsersByName(users: User[]): User[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortUsersByCreatedDate(users: User[]): User[] {
  return [...users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 🎯 Utility Functions (Pure Functions)
function generateUserId(existingUsers: User[]): string {
  const maxId = existingUsers.reduce((max, user) => {
    const idNum = parseInt(user.id.replace('user-', ''));
    return Number.isNaN(idNum) ? max : Math.max(max, idNum);
  }, 0);

  return `user-${maxId + 1}`;
}

// 🎯 User Statistics (Pure Functions)
export function calculateUserStatistics(users: User[]) {
  const totalUsers = users.length;
  const roleDistribution = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, { admin: 0, user: 0, guest: 0 } as Record<User['role'], number>);

  const newestUser = users.length > 0
    ? users.reduce((newest, user) =>
        user.createdAt > newest.createdAt ? user : newest
      )
    : null;

  return {
    totalUsers,
    roleDistribution,
    newestUser,
  };
}