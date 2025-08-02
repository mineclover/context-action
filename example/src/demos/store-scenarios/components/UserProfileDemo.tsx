import React, { useState, useEffect, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionLogger } from '../../../components/LogMonitor';
import { userStore } from '../stores';
import { storeActionRegister } from '../actions';
import type { User } from '../types';

export function UserProfileDemo() {
  const user = useStoreValue(userStore);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const logger = useActionLogger();

  useEffect(() => {
    setEditForm(user);
  }, [user]);

  const handleSave = useCallback(() => {
    if (editForm) {
      logger.logAction('saveUserProfile', { 
        oldUser: user,
        newUser: editForm,
        changes: Object.keys(editForm).filter(key => user?.[key as keyof User] !== editForm[key as keyof User])
      });
      storeActionRegister.dispatch('updateUser', { user: editForm });
      logger.logSystem('프로필 업데이트 성공', { userId: editForm.id });
    }
    setIsEditing(false);
  }, [editForm, user, logger]);

  const handleCancel = useCallback(() => {
    logger.logAction('cancelProfileEdit', { discardedChanges: editForm });
    setEditForm(user);
    setIsEditing(false);
  }, [user, editForm, logger]);

  const toggleTheme = useCallback(() => {
    if (user?.preferences) {
      const newTheme = user.preferences.theme === 'light' ? 'dark' : 'light';
      logger.logAction('toggleTheme', { 
        fromTheme: user.preferences.theme, 
        toTheme: newTheme 
      });
      storeActionRegister.dispatch('updateUserTheme', { theme: newTheme });
    }
  }, [user, logger]);

  const updateLastLogin = useCallback(() => {
    if (user) {
      const now = new Date();
      logger.logAction('updateLastLogin', { previousLogin: user.lastLogin, newLogin: now });
      storeActionRegister.dispatch('updateUser', { 
        user: { ...user, lastLogin: now }
      });
    }
  }, [user, logger]);

  const toggleNotifications = useCallback(() => {
    if (user?.preferences) {
      const newValue = !user.preferences.notifications;
      logger.logAction('toggleNotifications', { 
        enabled: newValue,
        userId: user.id 
      });
      storeActionRegister.dispatch('toggleNotifications', { enabled: newValue });
    }
  }, [user, logger]);

  return (
    <div className="demo-card">
      <h3>👤 User Profile Management</h3>
      <p className="demo-description">복잡한 객체 업데이트와 중첩된 속성 관리를 보여주는 사용자 프로필 데모</p>
      
      {!isEditing ? (
        <div className="user-profile-view">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
          </div>
          
          <div className="profile-info">
            <div className="profile-field">
              <strong>Name:</strong> {user?.name ?? 'Unknown User'}
            </div>
            <div className="profile-field">
              <strong>Email:</strong> {user?.email ?? 'user@example.com'}
            </div>
            <div className="profile-field">
              <strong>User ID:</strong> 
              <code>{user?.id ?? 'N/A'}</code>
            </div>
            <div className="profile-field">
              <strong>Theme:</strong> 
              <span className={`theme-badge ${user?.preferences?.theme ?? 'light'}`}>
                {user?.preferences?.theme === 'dark' ? '🌙' : '☀️'} {user?.preferences?.theme ?? 'light'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Language:</strong> 
              <span className="language-badge">
                {user?.preferences?.language === 'ko' ? '🇰🇷 한국어' : '🇺🇸 English'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Notifications:</strong> 
              <span className={`status-badge ${user?.preferences?.notifications ? 'enabled' : 'disabled'}`}>
                {user?.preferences?.notifications ? '🔔 ON' : '🔕 OFF'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Last Login:</strong> 
              <span className="timestamp">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('ko-KR') : 'Never'}
              </span>
            </div>
          </div>
          
          <div className="button-group">
            <button 
              onClick={() => {
                logger.logAction('startProfileEdit', { userId: user?.id });
                setIsEditing(true);
              }} 
              className="btn btn-primary"
            >
              ✏️ Edit Profile
            </button>
            <button onClick={toggleTheme} className="btn btn-secondary">
              {user?.preferences?.theme === 'dark' ? '☀️' : '🌙'} Toggle Theme
            </button>
            <button onClick={updateLastLogin} className="btn btn-secondary">
              🕒 Update Login Time
            </button>
            <button onClick={toggleNotifications} className="btn btn-secondary">
              {user?.preferences?.notifications ? '🔕' : '🔔'} Toggle Notifications
            </button>
          </div>
        </div>
      ) : (
        <div className="user-profile-edit">
          <h4>Edit Profile Information</h4>
          
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={editForm?.name ?? ''}
              onChange={(e) => {
                const newValue = e.target.value;
                logger.logAction('updateProfileField', { field: 'name', value: newValue });
                editForm && setEditForm({ ...editForm, name: newValue });
              }}
              className="text-input"
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={editForm?.email ?? ''}
              onChange={(e) => {
                const newValue = e.target.value;
                logger.logAction('updateProfileField', { field: 'email', value: newValue });
                editForm && setEditForm({ ...editForm, email: newValue });
              }}
              className="text-input"
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label>Language:</label>
            <select 
              value={editForm?.preferences?.language ?? 'ko'} 
              onChange={(e) => {
                const newValue = e.target.value as 'ko' | 'en';
                logger.logAction('updateProfileField', { field: 'language', value: newValue });
                editForm && setEditForm({ 
                  ...editForm, 
                  preferences: { ...editForm.preferences, language: newValue } 
                });
              }}
              className="text-input"
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
          
          <div className="button-group">
            <button onClick={handleSave} className="btn btn-success">
              💾 Save Changes
            </button>
            <button onClick={handleCancel} className="btn btn-secondary">
              ❌ Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-label">Profile Completeness:</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${user ? Math.min(100, (
                  (user.name ? 25 : 0) + 
                  (user.email ? 25 : 0) + 
                  (user.preferences ? 25 : 0) + 
                  (user.lastLogin ? 25 : 0)
                )) : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}