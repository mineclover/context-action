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
    <div className="space-y-6">
      {/* Enhanced Overview Stats */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <h3 className="text-lg font-semibold text-gray-800">Statistics Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Users"
            value={totalUsers}
            color="blue"
            icon="👥"
          />
          <StatCard
            title="Admins"
            value={roleDistribution.admin || 0}
            color="red"
            icon="🛡️"
          />
          <StatCard
            title="Users"
            value={roleDistribution.user || 0}
            color="green"
            icon="👤"
          />
          <StatCard
            title="Guests"
            value={roleDistribution.guest || 0}
            color="gray"
            icon="👋"
          />
        </div>
      </div>

      {/* Enhanced Role Distribution Chart */}
      <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📈</span>
          <h3 className="text-lg font-semibold text-gray-800">Role Distribution</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(roleDistribution).map(([role, count]) => (
            <div key={role} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium capitalize text-gray-700">{role}</span>
                <span className="text-gray-600">
                  {count} ({totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80 ${getRoleBarColor(role as User['role'])}`}
                    style={{
                      width: totalUsers > 0 ? `${(count / totalUsers) * 100}%` : '0%',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Recent Users */}
      <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⏰</span>
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        {recentUsers.length > 0 ? (
          <div className="space-y-3">
            {recentUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {user.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-500">No users created yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first user to see activity</p>
          </div>
        )}
      </div>

      {/* Enhanced Newest User Highlight */}
      {newestUser && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎉</span>
            <h4 className="font-semibold text-blue-900">Newest Member</h4>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {newestUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="text-lg animate-bounce">✨</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-900">{newestUser.name}</div>
              <div className="text-sm text-blue-700">{newestUser.email}</div>
              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <span>🗓️</span>
                Joined {newestUser.createdAt.toLocaleDateString()}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(newestUser.role)}`}>
              {newestUser.role}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

UserStatsView.displayName = 'UserStatsView';

// 🎯 Stat Card Component
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