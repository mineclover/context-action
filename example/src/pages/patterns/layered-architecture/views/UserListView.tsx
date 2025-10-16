/**
 * Pure UI Components Layer - User List View
 *
 * This layer:
 * - Renders pure UI components
 * - Handles user interactions
 * - Uses actions and hooks for data/behavior
 * - No direct business logic or side effects
 */

import { memo } from 'react';
import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import type { User } from '../contexts/UserManagementContexts';

interface UserListViewProps {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onViewDetails: (userId: string) => void;
}

export const UserListView = memo<UserListViewProps>(
  ({ users, isLoading, onEditUser, onDeleteUser, onViewDetails }) => {
    // views 레이어 등록
    useRegisterSourceFile(
      'pages/patterns/layered-architecture/views/UserListView.tsx',
      {
        name: 'UserListView',
        description: 'Pure UI component for displaying user list',
        tags: ['views', 'ui', 'list'],
        priority: 25,
      }
    );

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No users found.</p>
          <p className="text-sm">Create your first user to get started.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Users ({users.length})</h3>
        <div className="grid gap-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => onEditUser(user)}
              onDelete={() => onDeleteUser(user.id)}
              onViewDetails={() => onViewDetails(user.id)}
            />
          ))}
        </div>
      </div>
    );
  }
);

UserListView.displayName = 'UserListView';

// 🎯 User Card Component
interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}

const UserCard = memo<UserCardProps>(
  ({ user, onEdit, onDelete, onViewDetails }) => {
    const getRoleColor = (role: User['role']) => {
      switch (role) {
        case 'admin':
          return 'bg-red-100 text-red-800';
        case 'user':
          return 'bg-blue-100 text-blue-800';
        case 'guest':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-lg">{user.name}</h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <p className="text-sm text-gray-500">
              Created: {user.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              View
            </button>
            <button
              onClick={onEdit}
              className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
);

UserCard.displayName = 'UserCard';
