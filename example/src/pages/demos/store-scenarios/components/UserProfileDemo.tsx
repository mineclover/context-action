import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useState } from 'react';
import { useActionLoggerWithToast } from '../../../../components/LogMonitor/';
import { storeActionRegister } from '../actions';
import { StoreScenarios } from '../stores';
import type { User } from '../types';
import { profileComputations } from '../modules/computations';

/**
 * 사용자 프로필 관리 데모 컴포넌트
 * 복잡한 객체 업데이트와 중첩된 속성 관리를 보여주는 Declarative Store 패턴 예제
 *
 * @implements store-integration-pattern
 * @implements action-handler
 * @memberof core-concepts
 * @example
 * // Declarative Store 패턴을 사용한 사용자 프로필 관리
 * <StoreScenarios.Provider registryId="user-profile-demo">
 *   <UserProfileDemo />
 * </StoreScenarios.Provider>
 * @since 2.0.0
 */
export function UserProfileDemo() {
  const userStore = StoreScenarios.useStore('user'); // 자동 타입 추론: Store<User>
  const user = useStoreValue(userStore);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(user);
  const logger = useActionLoggerWithToast();

  // 액션 핸들러들을 useCallback으로 메모이제이션
  const updateUserHandler = useCallback(
    ({ user }: { user: User }) => {
      userStore.setValue(user);
    },
    [userStore]
  );

  const updateUserThemeHandler = useCallback(
    ({ theme }: { theme: User['preferences']['theme'] }) => {
      userStore.update((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, theme },
      }));
    },
    [userStore]
  );

  const toggleNotificationsHandler = useCallback(
    ({ enabled }: { enabled: boolean }) => {
      userStore.update((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, notifications: enabled },
      }));
    },
    [userStore]
  );

  // 필요한 액션 핸들러들을 등록
  useEffect(() => {
    const unsubscribers = [
      storeActionRegister.register('updateUser', updateUserHandler),
      storeActionRegister.register('updateUserTheme', updateUserThemeHandler),
      storeActionRegister.register('toggleNotifications', toggleNotificationsHandler),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [updateUserHandler, updateUserThemeHandler, toggleNotificationsHandler]); // 메모이제이션된 핸들러들을 의존성에 추가

  useEffect(() => {
    setEditForm(user);
  }, [user]);

  const handleSave = useCallback(() => {
    if (editForm) {
      logger.logAction('updateUser', {
        oldUser: user,
        newUser: editForm,
        changes: Object.keys(editForm).filter(
          (key) => user?.[key as keyof User] !== editForm[key as keyof User]
        ),
      });
      storeActionRegister.dispatch('updateUser', { user: editForm });
      logger.logSystem('프로필 업데이트 성공', {
        context: `userId: ${editForm.id}`,
      });
    }
    setIsEditing(false);
  }, [editForm, user, logger]);

  const handleCancel = useCallback(() => {
    logger.logAction(
      'cancelProfileEdit',
      { discardedChanges: editForm },
      {
        toast: {
          type: 'info',
          title: '편집 취소',
          message: '변경사항이 취소되었습니다',
        },
      }
    );
    setEditForm(user);
    setIsEditing(false);
  }, [user, editForm, logger]);

  const toggleTheme = useCallback(() => {
    if (user?.preferences) {
      const newTheme = user.preferences.theme === 'light' ? 'dark' : 'light';
      logger.logAction('updateUserTheme', {
        fromTheme: user.preferences.theme,
        toTheme: newTheme,
      });
      storeActionRegister.dispatch('updateUserTheme', { theme: newTheme });
    }
  }, [user, logger]);

  const updateLastLogin = useCallback(() => {
    if (user) {
      const now = new Date();
      logger.logAction(
        'updateLastLogin',
        { previousLogin: user.lastLogin, newLogin: now },
        {
          toast: {
            type: 'info',
            title: '로그인 시간 업데이트',
            message: '마지막 로그인 시간이 현재 시간으로 업데이트되었습니다',
          },
        }
      );
      storeActionRegister.dispatch('updateUser', {
        user: { ...user, lastLogin: now },
      });
    }
  }, [user, logger]);

  const toggleNotifications = useCallback(() => {
    if (user?.preferences) {
      const newValue = !user.preferences.notifications;
      logger.logAction('toggleNotifications', {
        enabled: newValue,
        userId: user.id,
      });
      storeActionRegister.dispatch('toggleNotifications', {
        enabled: newValue,
      });
    }
  }, [user, logger]);

  return (
    <div className="demo-card">
      <h3>👤 User Profile Management</h3>
      <p className="demo-description">
        복잡한 객체 업데이트와 중첩된 속성 관리를 보여주는 사용자 프로필 데모
      </p>

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
              <span
                className={`theme-badge ${user?.preferences?.theme ?? 'light'}`}
              >
                {user?.preferences?.theme === 'dark' ? '🌙' : '☀️'}{' '}
                {user?.preferences?.theme ?? 'light'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Language:</strong>
              <span className="language-badge">
                {user?.preferences?.language === 'ko'
                  ? '🇰🇷 한국어'
                  : '🇺🇸 English'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Notifications:</strong>
              <span
                className={`status-badge ${user?.preferences?.notifications ? 'enabled' : 'disabled'}`}
              >
                {user?.preferences?.notifications ? '🔔 ON' : '🔕 OFF'}
              </span>
            </div>
            <div className="profile-field">
              <strong>Last Login:</strong>
              <span className="timestamp">
                {user?.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('ko-KR')
                  : 'Never'}
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
              {user?.preferences?.notifications ? '🔕' : '🔔'} Toggle
              Notifications
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
                logger.logAction('updateProfileField', {
                  field: 'name',
                  value: newValue,
                });
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
                logger.logAction('updateProfileField', {
                  field: 'email',
                  value: newValue,
                });
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
                logger.logAction('updateProfileField', {
                  field: 'language',
                  value: newValue,
                });
                editForm &&
                  setEditForm({
                    ...editForm,
                    preferences: {
                      ...editForm.preferences,
                      language: newValue,
                    },
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
                width: `${profileComputations.calculateCompleteness(user)}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
