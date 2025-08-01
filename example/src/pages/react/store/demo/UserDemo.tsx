/**
 * User profile component demonstrating MVVM pattern and user store usage
 * @implements mvvm-pattern
 * @memberof architecture-terms
 * @example
 * ```typescript
 * // View (React Component) + ViewModel (UserStore) separation
 * function UserDemo() {
 *   const userStore = new UserStore('user'); // ViewModel
 *   const user = useStoreValue(userStore);   // Data binding
 *   return <div>{user.name}</div>;           // View
 * }
 * ```
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, Store, useStoreValue } from '@context-action/react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

/**
 * User ViewModel implementing business logic for user management
 * @implements business-logic
 * @memberof core-concepts
 * @implements type-safety
 * @memberof architecture-terms
 */
class UserStore extends Store<User | null> {
  constructor(name: string) {
    super(name, null);
  }

  login(user: User) {
    this.setValue(user);
  }

  logout() {
    this.setValue(null);
  }

  updateProfile(updates: Partial<User>) {
    this.update(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updates };
    });
  }

  updatePreferences(preferences: Partial<User['preferences']>) {
    this.update(currentUser => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        preferences: { ...currentUser.preferences, ...preferences }
      };
    });
  }
}

const UserDemo: React.FC = () => {
  const registry = useStoreRegistry();
  
  // Get or create the user store
  const [userStore] = useState(() => {
    let store = registry.getStore('user') as UserStore;
    if (!store) {
      store = new UserStore('user');
      registry.register('user', store);
    }
    return store;
  });

  const user = useStoreValue(userStore);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  if (!userStore) {
    return (
      <div style={cardStyle}>
        <h3>User Demo</h3>
        <p>User store not found</p>
      </div>
    );
  }

  const handleLogin = () => {
    const sampleUser: User = {
      id: Math.random().toString(36).substring(7),
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://via.placeholder.com/100x100?text=JS',
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en'
      }
    };
    userStore.login(sampleUser);
  };

  const handleLogout = () => {
    userStore.logout();
    setIsEditing(false);
  };

  const startEditing = () => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        avatar: user.avatar
      });
      setIsEditing(true);
    }
  };

  const saveChanges = () => {
    if (editForm && Object.keys(editForm).length > 0) {
      userStore.updateProfile(editForm);
      setIsEditing(false);
      setEditForm({});
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  if (!user) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>👤 User Demo</h3>
        <p style={descriptionStyle}>
          Demonstrates user authentication and profile management.
        </p>

        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>👤</div>
          <h4 style={emptyTitleStyle}>No user logged in</h4>
          <p style={emptyDescStyle}>
            Click the button below to log in with a sample user account.
          </p>
          <button style={primaryButtonStyle} onClick={handleLogin}>
            Log In
          </button>
        </div>

        <div style={infoStyle}>
          <small>
            This demonstrates user state management with login/logout functionality
            and profile updates.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>👤 User Demo</h3>
      <p style={descriptionStyle}>
        Demonstrates user authentication and profile management.
      </p>

      <div style={profileStyle}>
        <div style={avatarStyle}>
          <img 
            src={user.avatar || 'https://via.placeholder.com/80x80?text=U'} 
            alt={user.name}
            style={avatarImageStyle}
          />
          <div style={statusDotStyle} title="Online" />
        </div>

        <div style={profileInfoStyle}>
          {isEditing ? (
            <div style={editFormStyle}>
              <input
                style={inputStyle}
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Name"
              />
              <input
                style={inputStyle}
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email"
                type="email"
              />
              <input
                style={inputStyle}
                value={editForm.avatar || ''}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                placeholder="Avatar URL"
              />
              <div style={editButtonsStyle}>
                <button style={saveButtonStyle} onClick={saveChanges}>
                  Save
                </button>
                <button style={cancelButtonStyle} onClick={cancelEditing}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 style={nameStyle}>{user.name}</h4>
              <p style={emailStyle}>{user.email}</p>
              <p style={idStyle}>ID: {user.id}</p>
            </>
          )}
        </div>
      </div>

      <div style={preferencesStyle}>
        <h5 style={preferencesTitleStyle}>Preferences</h5>
        <div style={preferenceItemStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={user.preferences.notifications}
              onChange={() => userStore.updatePreferences({ notifications: !user.preferences.notifications })}
              style={checkboxStyle}
            />
            <span>Email notifications</span>
          </label>
        </div>
        <div style={preferenceItemStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={user.preferences.theme === 'dark'}
              onChange={() => userStore.updatePreferences({ theme: user.preferences.theme === 'dark' ? 'light' : 'dark' })}
              style={checkboxStyle}
            />
            <span>Dark mode</span>
          </label>
        </div>
      </div>

      <div style={actionsStyle}>
        {!isEditing ? (
          <>
            <button style={editButtonStyle} onClick={startEditing}>
              Edit Profile
            </button>
            <button style={logoutButtonStyle} onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : null}
      </div>

      <div style={metaInfoStyle}>
        <small>
          Notifications: {user.preferences.notifications ? '✅' : '❌'} |
          Theme: {user.preferences.theme === 'dark' ? '🌙' : '☀️'}
        </small>
      </div>
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#1e293b',
  fontSize: '1.25rem',
  fontWeight: '600'
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#64748b'
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '16px'
};

const emptyTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#374151',
  fontSize: '1.1rem'
};

const emptyDescStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const profileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px'
};

const avatarStyle: React.CSSProperties = {
  position: 'relative',
  flexShrink: 0
};

const avatarImageStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const statusDotStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '5px',
  right: '5px',
  width: '16px',
  height: '16px',
  backgroundColor: '#10b981',
  borderRadius: '50%',
  border: '2px solid white'
};

const profileInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const nameStyle: React.CSSProperties = {
  margin: '0 0 4px 0',
  color: '#1e293b',
  fontSize: '1.2rem',
  fontWeight: '600'
};

const emailStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#3b82f6',
  fontSize: '0.9rem'
};

const idStyle: React.CSSProperties = {
  margin: '0',
  color: '#6b7280',
  fontSize: '0.8rem',
  fontFamily: 'monospace'
};

const editFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.9rem'
};

const editButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
};

const preferencesStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const preferencesTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const preferenceItemStyle: React.CSSProperties = {
  marginBottom: '8px'
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#374151'
};

const checkboxStyle: React.CSSProperties = {
  width: '16px',
  height: '16px'
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '16px'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const editButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  backgroundColor: '#8b5cf6'
};

const logoutButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  backgroundColor: '#ef4444'
};

const saveButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  backgroundColor: '#10b981'
};

const cancelButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  backgroundColor: '#6b7280'
};

const infoStyle: React.CSSProperties = {
  marginTop: '16px',
  padding: '12px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
  color: '#64748b'
};

const metaInfoStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  color: '#64748b',
  fontSize: '0.8rem'
};

export default UserDemo;