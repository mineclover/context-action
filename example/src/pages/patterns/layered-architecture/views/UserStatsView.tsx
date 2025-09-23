/**
 * Pure UI Components Layer - User Statistics View
 *
 * This layer:
 * - Displays computed statistics and metrics
 * - Renders data visualizations
 * - Pure presentation component
 */

import React, { memo } from 'react';
import type { User } from '../contexts/UserManagementContexts';

interface UserStatsViewProps {
  statistics: {
    totalUsers: number;
    roleDistribution: Record<User['role'], number>;
    newestUser: User | null;
  };
  recentUsers: User[];
}

export const UserStatsView = memo<UserStatsViewProps>(({
  statistics,
  recentUsers,
}) => {
  const { totalUsers, roleDistribution, newestUser } = statistics;

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-lg font-semibold text-gray-800">Statistics Overview</h3>
        </div>
        {newestUser && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <span>🎉</span>
            <span>Latest: {newestUser.name}</span>
          </div>
        )}
      </div>

      {/* Compact Stats in a Single Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <CompactStatCard
          title="Total"
          value={totalUsers}
          color="blue"
          icon="👥"
        />
        <CompactStatCard
          title="Admins"
          value={roleDistribution.admin || 0}
          color="red"
          icon="🛡️"
        />
        <CompactStatCard
          title="Users"
          value={roleDistribution.user || 0}
          color="green"
          icon="👤"
        />
        <CompactStatCard
          title="Guests"
          value={roleDistribution.guest || 0}
          color="gray"
          icon="👋"
        />
      </div>

      {/* Compact Role Distribution Bar */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Role Distribution</div>
        <div className="flex rounded-lg overflow-hidden h-3 bg-gray-200">
          {Object.entries(roleDistribution).map(([role, count]) => {
            const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
            return (
              <div
                key={role}
                className={`h-full ${getRoleBarColor(role as User['role'])}`}
                style={{ width: `${percentage}%` }}
                title={`${role}: ${count} (${Math.round(percentage)}%)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {Object.entries(roleDistribution).map(([role, count]) => (
            <span key={role} className="capitalize">
              {role}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Activity Summary */}
      {recentUsers.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <span>⏰</span>
            Recent Activity ({recentUsers.length})
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {recentUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-lg p-2 min-w-0"
                title={`${user.name} (${user.email}) - ${user.role}`}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate max-w-20">
                    {user.name}
                  </div>
                  <div className={`text-xs px-1 py-0.5 rounded text-center ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

UserStatsView.displayName = 'UserStatsView';

// 🎯 Compact Stat Card Component
interface CompactStatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'red' | 'green' | 'gray';
  icon: string;
}

const CompactStatCard = memo<CompactStatCardProps>(({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  return (
    <div className={`
      p-3 rounded-lg border text-center transition-all duration-200 hover:shadow-md
      ${colorClasses[color]}
    `}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-2xl font-bold leading-none mb-1">{value}</div>
      <div className="text-xs font-medium opacity-75">{title}</div>
    </div>
  );
});

CompactStatCard.displayName = 'CompactStatCard';

// 🎯 Stat Card Component (keeping for backward compatibility)
interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'red' | 'green' | 'gray';
  icon: string;
}

const StatCard = memo<StatCardProps>(({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900 hover:from-blue-100 hover:to-blue-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-900 hover:from-red-100 hover:to-red-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-900 hover:from-green-100 hover:to-green-200',
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-900 hover:from-gray-100 hover:to-gray-200',
  };

  return (
    <div className={`
      p-4 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg
      ${colorClasses[color]}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-1">{title}</p>
          <p className="text-3xl font-bold leading-none transition-all duration-300 hover:scale-110">
            {value}
          </p>
        </div>
        <div className="text-3xl ml-3 transition-transform duration-300 hover:scale-125 hover:rotate-12">
          {icon}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

// 🎯 Helper functions
function getRoleBarColor(role: User['role']): string {
  switch (role) {
    case 'admin':
      return 'bg-red-500';
    case 'user':
      return 'bg-green-500';
    case 'guest':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

function getRoleBadgeColor(role: User['role']): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'user':
      return 'bg-green-100 text-green-800';
    case 'guest':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}