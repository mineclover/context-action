# Store Only Pattern Example

This example demonstrates the **Store Only Pattern** for pure state management without action dispatching, ideal for data layers, application state, and reactive data flows.

## Use Cases

- Application state management
- Form state and UI state
- Data caching and persistence
- Derived state and computed values
- Component-level state management

## Complete Example

### 1. Define Store Configuration

```typescript
// stores/UserStoreConfig.ts
export const userStoreConfig = {
  // Direct value configuration (type inferred automatically)
  profile: {
    id: '',
    name: '',
    email: '',
    avatar: '',
    bio: '',
    createdAt: null as Date | null,
    lastLogin: null as Date | null
  },
  
  // Configuration object with validation
  preferences: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      language: 'en' as 'en' | 'es' | 'fr' | 'de',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      privacy: {
        profileVisibility: 'public' as 'public' | 'friends' | 'private',
        showEmail: false,
        showLastLogin: false
      }
    },
    validator: (value) => {
      if (typeof value !== 'object' || value === null) return false;
      if (!['light', 'dark'].includes(value.theme)) return false;
      if (!['en', 'es', 'fr', 'de'].includes(value.language)) return false;
      return true;
    }
  },
  
  // Derived state configuration
  analytics: {
    initialValue: {
      sessions: [] as Array<{ id: string; startTime: number; endTime?: number }>,
      pageViews: [] as Array<{ page: string; timestamp: number; duration?: number }>,
      events: [] as Array<{ type: string; data: any; timestamp: number }>
    },
    derived: {
      // Computed properties that update automatically
      totalSessions: (analytics) => analytics.sessions.length,
      activeSessions: (analytics) => analytics.sessions.filter(s => !s.endTime).length,
      avgSessionDuration: (analytics) => {
        const completedSessions = analytics.sessions.filter(s => s.endTime);
        if (completedSessions.length === 0) return 0;
        
        const totalDuration = completedSessions.reduce((acc, session) => 
          acc + (session.endTime! - session.startTime), 0
        );
        return totalDuration / completedSessions.length;
      },
      recentEvents: (analytics) => 
        analytics.events.filter(e => Date.now() - e.timestamp < 300000), // Last 5 minutes
      eventsByType: (analytics) => 
        analytics.events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    }
  },
  
  // Form state configuration
  forms: {
    initialValue: {
      profileEdit: {
        isEditing: false,
        hasChanges: false,
        errors: {} as Record<string, string>,
        originalValues: null as any
      },
      contactForm: {
        isSubmitting: false,
        submitted: false,
        values: { name: '', email: '', message: '' },
        errors: {} as Record<string, string>
      }
    }
  }
} as const;
```

### 2. Create Store Pattern

```typescript
// stores/UserStores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';
import { userStoreConfig } from './UserStoreConfig';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', userStoreConfig);

export type UserStores = typeof userStoreConfig;
```

### 3. Profile Management Component

```typescript
// components/UserProfile.tsx
import React, { useState } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function UserProfile() {
  const profileStore = useUserStore('profile');
  const formsStore = useUserStore('forms');
  const preferencesStore = useUserStore('preferences');
  
  // Reactive subscriptions
  const profile = useStoreValue(profileStore);
  const forms = useStoreValue(formsStore);
  const preferences = useStoreValue(preferencesStore);
  
  // Local component state for form inputs
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    bio: profile.bio
  });
  
  const startEditing = () => {
    // Store original values for cancel functionality
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        isEditing: true,
        originalValues: { ...profile }
      }
    }));
    
    // Initialize form data with current profile
    setFormData({
      name: profile.name,
      email: profile.email,
      bio: profile.bio
    });
  };
  
  const cancelEditing = () => {
    // Restore form data to original values
    const originalValues = forms.profileEdit.originalValues;
    if (originalValues) {
      setFormData({
        name: originalValues.name,
        email: originalValues.email,
        bio: originalValues.bio
      });
    }
    
    // Clear editing state
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        isEditing: false,
        hasChanges: false,
        errors: {},
        originalValues: null
      }
    }));
  };
  
  const saveChanges = () => {
    // Validate form data
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Update form errors
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        errors
      }
    }));
    
    if (Object.keys(errors).length === 0) {
      // Save to profile store
      profileStore.update(current => ({
        ...current,
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        lastLogin: new Date()
      }));
      
      // Clear editing state
      formsStore.update(current => ({
        ...current,
        profileEdit: {
          isEditing: false,
          hasChanges: false,
          errors: {},
          originalValues: null
        }
      }));
    }
  };
  
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(current => ({ ...current, [field]: value }));
    
    // Mark as having changes
    formsStore.update(current => ({
      ...current,
      profileEdit: {
        ...current.profileEdit,
        hasChanges: true,
        errors: {
          ...current.profileEdit.errors,
          [field]: '' // Clear field error on change
        }
      }
    }));
  };
  
  return (
    <div className={`profile-component theme-${preferences.theme}`}>
      <div className="profile-header">
        <h2>User Profile</h2>
        {!forms.profileEdit.isEditing && (
          <button onClick={startEditing} className="edit-button">
            Edit Profile
          </button>
        )}
      </div>
      
      {forms.profileEdit.isEditing ? (
        // Edit mode
        <div className="profile-edit-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={forms.profileEdit.errors.name ? 'error' : ''}
            />
            {forms.profileEdit.errors.name && (
              <span className="error-message">{forms.profileEdit.errors.name}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={forms.profileEdit.errors.email ? 'error' : ''}
            />
            {forms.profileEdit.errors.email && (
              <span className="error-message">{forms.profileEdit.errors.email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio:</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="form-actions">
            <button 
              onClick={saveChanges}
              className="save-button"
              disabled={!forms.profileEdit.hasChanges}
            >
              Save Changes
            </button>
            <button onClick={cancelEditing} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <div className="profile-view">
          <div className="profile-info">
            <p><strong>ID:</strong> {profile.id || 'Not set'}</p>
            <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
            <p><strong>Email:</strong> {profile.email || 'Not set'}</p>
            <p><strong>Bio:</strong> {profile.bio || 'No bio provided'}</p>
            {profile.lastLogin && (
              <p><strong>Last Login:</strong> {profile.lastLogin.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Preferences Component

```typescript
// components/UserPreferences.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function UserPreferences() {
  const preferencesStore = useUserStore('preferences');
  const preferences = useStoreValue(preferencesStore);
  
  const updateTheme = (theme: 'light' | 'dark') => {
    preferencesStore.update(current => ({
      ...current,
      theme
    }));
  };
  
  const updateLanguage = (language: 'en' | 'es' | 'fr' | 'de') => {
    preferencesStore.update(current => ({
      ...current,
      language
    }));
  };
  
  const updateNotificationSettings = (
    type: keyof typeof preferences.notifications,
    enabled: boolean
  ) => {
    preferencesStore.update(current => ({
      ...current,
      notifications: {
        ...current.notifications,
        [type]: enabled
      }
    }));
  };
  
  const updatePrivacySetting = (
    setting: keyof typeof preferences.privacy,
    value: any
  ) => {
    preferencesStore.update(current => ({
      ...current,
      privacy: {
        ...current.privacy,
        [setting]: value
      }
    }));
  };
  
  return (
    <div className={`preferences-component theme-${preferences.theme}`}>
      <h2>User Preferences</h2>
      
      {/* Theme Selection */}
      <div className="preference-group">
        <h3>Theme</h3>
        <div className="theme-options">
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={preferences.theme === 'light'}
              onChange={() => updateTheme('light')}
            />
            Light Theme
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={preferences.theme === 'dark'}
              onChange={() => updateTheme('dark')}
            />
            Dark Theme
          </label>
        </div>
      </div>
      
      {/* Language Selection */}
      <div className="preference-group">
        <h3>Language</h3>
        <select
          value={preferences.language}
          onChange={(e) => updateLanguage(e.target.value as any)}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      
      {/* Notification Settings */}
      <div className="preference-group">
        <h3>Notifications</h3>
        <div className="notification-options">
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) => updateNotificationSettings('email', e.target.checked)}
            />
            Email Notifications
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.push}
              onChange={(e) => updateNotificationSettings('push', e.target.checked)}
            />
            Push Notifications
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.notifications.sms}
              onChange={(e) => updateNotificationSettings('sms', e.target.checked)}
            />
            SMS Notifications
          </label>
        </div>
      </div>
      
      {/* Privacy Settings */}
      <div className="preference-group">
        <h3>Privacy</h3>
        <div className="privacy-options">
          <div>
            <label htmlFor="profile-visibility">Profile Visibility:</label>
            <select
              id="profile-visibility"
              value={preferences.privacy.profileVisibility}
              onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.showEmail}
              onChange={(e) => updatePrivacySetting('showEmail', e.target.checked)}
            />
            Show Email Publicly
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={preferences.privacy.showLastLogin}
              onChange={(e) => updatePrivacySetting('showLastLogin', e.target.checked)}
            />
            Show Last Login
          </label>
        </div>
      </div>
    </div>
  );
}
```

### 3. Analytics Dashboard

```typescript
// components/AnalyticsDashboard.tsx
import React, { useEffect } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function AnalyticsDashboard() {
  const analyticsStore = useUserStore('analytics');
  const analytics = useStoreValue(analyticsStore);
  
  // Simulate adding analytics data
  useEffect(() => {
    const startSession = () => {
      analyticsStore.update(current => ({
        ...current,
        sessions: [
          ...current.sessions,
          {
            id: generateSessionId(),
            startTime: Date.now()
          }
        ]
      }));
    };
    
    const addPageView = () => {
      analyticsStore.update(current => ({
        ...current,
        pageViews: [
          ...current.pageViews,
          {
            page: window.location.pathname,
            timestamp: Date.now()
          }
        ]
      }));
    };
    
    // Start session on mount
    startSession();
    addPageView();
    
    // Add random events for demo
    const eventInterval = setInterval(() => {
      const eventTypes = ['click', 'scroll', 'hover', 'focus'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      analyticsStore.update(current => ({
        ...current,
        events: [
          ...current.events,
          {
            type: randomEvent,
            data: { element: `element-${Math.floor(Math.random() * 100)}` },
            timestamp: Date.now()
          }
        ]
      }));
    }, 3000);
    
    return () => {
      clearInterval(eventInterval);
      
      // End session on unmount
      analyticsStore.update(current => ({
        ...current,
        sessions: current.sessions.map(session => 
          session.endTime ? session : { ...session, endTime: Date.now() }
        )
      }));
    };
  }, [analyticsStore]);
  
  const clearAnalytics = () => {
    analyticsStore.update(current => ({
      ...current,
      sessions: [],
      pageViews: [],
      events: []
    }));
  };
  
  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <button onClick={clearAnalytics} className="clear-button">
          Clear Data
        </button>
      </div>
      
      {/* Session Statistics */}
      <div className="analytics-section">
        <h3>Sessions</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{analytics.totalSessions}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.activeSessions}</div>
            <div className="stat-label">Active Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Math.round(analytics.avgSessionDuration / 1000)}s
            </div>
            <div className="stat-label">Avg Duration</div>
          </div>
        </div>
      </div>
      
      {/* Recent Events */}
      <div className="analytics-section">
        <h3>Recent Events ({analytics.recentEvents.length})</h3>
        <div className="events-list">
          {analytics.recentEvents.slice(-10).reverse().map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-type">{event.type}</div>
              <div className="event-data">{JSON.stringify(event.data)}</div>
              <div className="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Events by Type */}
      <div className="analytics-section">
        <h3>Events by Type</h3>
        <div className="event-types">
          {Object.entries(analytics.eventsByType).map(([type, count]) => (
            <div key={type} className="event-type-stat">
              <span className="type-name">{type}</span>
              <span className="type-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 4. Contact Form Component

```typescript
// components/ContactForm.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function ContactForm() {
  const formsStore = useUserStore('forms');
  const forms = useStoreValue(formsStore);
  
  const contactForm = forms.contactForm;
  
  const updateField = (field: keyof typeof contactForm.values, value: string) => {
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        values: {
          ...current.contactForm.values,
          [field]: value
        },
        errors: {
          ...current.contactForm.errors,
          [field]: '' // Clear field error
        }
      }
    }));
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    const { name, email, message } = contactForm.values;
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!message.trim()) errors.message = 'Message is required';
    if (message.length < 10) errors.message = 'Message must be at least 10 characters';
    
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        errors
      }
    }));
    
    return Object.keys(errors).length === 0;
  };
  
  const submitForm = async () => {
    if (!validateForm()) return;
    
    // Set submitting state
    formsStore.update(current => ({
      ...current,
      contactForm: {
        ...current.contactForm,
        isSubmitting: true
      }
    }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      formsStore.update(current => ({
        ...current,
        contactForm: {
          ...current.contactForm,
          isSubmitting: false,
          submitted: true,
          values: { name: '', email: '', message: '' } // Clear form
        }
      }));
      
    } catch (error) {
      // Error
      formsStore.update(current => ({
        ...current,
        contactForm: {
          ...current.contactForm,
          isSubmitting: false,
          errors: {
            submit: 'Failed to send message. Please try again.'
          }
        }
      }));
    }
  };
  
  const resetForm = () => {
    formsStore.update(current => ({
      ...current,
      contactForm: {
        isSubmitting: false,
        submitted: false,
        values: { name: '', email: '', message: '' },
        errors: {}
      }
    }));
  };
  
  if (contactForm.submitted) {
    return (
      <div className="contact-form success">
        <h2>Message Sent!</h2>
        <p>Thank you for your message. We'll get back to you soon.</p>
        <button onClick={resetForm}>Send Another Message</button>
      </div>
    );
  }
  
  return (
    <div className="contact-form">
      <h2>Contact Us</h2>
      
      <div className="form-group">
        <label htmlFor="contact-name">Name:</label>
        <input
          id="contact-name"
          type="text"
          value={contactForm.values.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={contactForm.errors.name ? 'error' : ''}
          disabled={contactForm.isSubmitting}
        />
        {contactForm.errors.name && (
          <span className="error-message">{contactForm.errors.name}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="contact-email">Email:</label>
        <input
          id="contact-email"
          type="email"
          value={contactForm.values.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={contactForm.errors.email ? 'error' : ''}
          disabled={contactForm.isSubmitting}
        />
        {contactForm.errors.email && (
          <span className="error-message">{contactForm.errors.email}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="contact-message">Message:</label>
        <textarea
          id="contact-message"
          value={contactForm.values.message}
          onChange={(e) => updateField('message', e.target.value)}
          className={contactForm.errors.message ? 'error' : ''}
          disabled={contactForm.isSubmitting}
          rows={5}
        />
        {contactForm.errors.message && (
          <span className="error-message">{contactForm.errors.message}</span>
        )}
      </div>
      
      {contactForm.errors.submit && (
        <div className="error-message submit-error">
          {contactForm.errors.submit}
        </div>
      )}
      
      <div className="form-actions">
        <button
          onClick={submitForm}
          disabled={contactForm.isSubmitting}
          className="submit-button"
        >
          {contactForm.isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
        <button onClick={resetForm} className="reset-button">
          Reset Form
        </button>
      </div>
    </div>
  );
}
```

### 5. Store Manager Utilities

```typescript
// components/StoreManager.tsx
import React, { useState } from 'react';
import { useUserStoreManager } from '../stores/UserStores';

export function StoreManagerPanel() {
  const storeManager = useUserStoreManager();
  const [exportData, setExportData] = useState<string>('');
  
  const exportState = () => {
    const allValues = storeManager.getAllValues();
    const dataStr = JSON.stringify(allValues, null, 2);
    setExportData(dataStr);
  };
  
  const importState = () => {
    try {
      const data = JSON.parse(exportData);
      storeManager.setAllValues(data);
      alert('State imported successfully!');
    } catch (error) {
      alert('Invalid JSON data');
    }
  };
  
  const resetAllStores = () => {
    if (confirm('Are you sure you want to reset all stores to their initial values?')) {
      storeManager.resetAll();
    }
  };
  
  const resetSpecificStore = (storeName: string) => {
    if (confirm(`Reset ${storeName} store to initial value?`)) {
      storeManager.reset(storeName as any);
    }
  };
  
  const logStoreInfo = () => {
    console.log('Store Names:', storeManager.getStoreNames());
    console.log('Store Count:', storeManager.getStoreCount());
    console.log('All Values:', storeManager.getAllValues());
  };
  
  return (
    <div className="store-manager-panel">
      <h2>Store Manager</h2>
      
      {/* Store Information */}
      <div className="manager-section">
        <h3>Store Information</h3>
        <p>Total Stores: {storeManager.getStoreCount()}</p>
        <p>Available Stores: {storeManager.getStoreNames().join(', ')}</p>
        <button onClick={logStoreInfo}>Log Store Info to Console</button>
      </div>
      
      {/* Reset Operations */}
      <div className="manager-section">
        <h3>Reset Operations</h3>
        <div className="reset-buttons">
          {storeManager.getStoreNames().map(storeName => (
            <button
              key={String(storeName)}
              onClick={() => resetSpecificStore(String(storeName))}
              className="reset-store-button"
            >
              Reset {String(storeName)}
            </button>
          ))}
        </div>
        <button onClick={resetAllStores} className="reset-all-button">
          Reset All Stores
        </button>
      </div>
      
      {/* State Export/Import */}
      <div className="manager-section">
        <h3>State Management</h3>
        <div className="export-import">
          <button onClick={exportState} className="export-button">
            Export Current State
          </button>
          
          {exportData && (
            <div className="export-data">
              <h4>Exported Data:</h4>
              <textarea
                value={exportData}
                onChange={(e) => setExportData(e.target.value)}
                rows={10}
                cols={80}
                className="export-textarea"
              />
              <div className="import-actions">
                <button onClick={importState} className="import-button">
                  Import State
                </button>
                <button onClick={() => setExportData('')} className="clear-button">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6. Main Application with HOC Pattern

```typescript
// App.tsx
import React from 'react';
import { withUserStoreProvider } from './stores/UserStores';
import { UserProfile } from './components/UserProfile';
import { UserPreferences } from './components/UserPreferences';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ContactForm } from './components/ContactForm';
import { StoreManagerPanel } from './components/StoreManager';
import './App.css';

// Use HOC pattern to automatically wrap with store provider
const App = withUserStoreProvider(() => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Store Only Pattern Demo</h1>
        <p>Demonstrates pure state management without action dispatching</p>
      </header>
      
      <main className="app-main">
        <div className="left-column">
          <UserProfile />
          <ContactForm />
        </div>
        
        <div className="right-column">
          <UserPreferences />
          <AnalyticsDashboard />
        </div>
      </main>
      
      <footer className="app-footer">
        <StoreManagerPanel />
      </footer>
    </div>
  );
});

export default App;
```

## Advanced Store Patterns

### State Persistence

```typescript
// hooks/usePersistence.ts
import { useEffect } from 'react';
import { useUserStoreManager } from '../stores/UserStores';

export function usePersistence() {
  const storeManager = useUserStoreManager();
  
  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const state = storeManager.getAllValues();
      localStorage.setItem('user-app-state', JSON.stringify(state));
    }, 5000); // Save every 5 seconds
    
    return () => clearInterval(saveInterval);
  }, [storeManager]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('user-app-state');
    if (savedState) {
      try {
        const data = JSON.parse(savedState);
        
        // Validate and restore state
        if (data.profile) {
          storeManager.getStore('profile').setValue({
            ...data.profile,
            lastLogin: data.profile.lastLogin ? new Date(data.profile.lastLogin) : null
          });
        }
        
        if (data.preferences) {
          storeManager.getStore('preferences').setValue(data.preferences);
        }
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
  }, [storeManager]);
}
```

### Computed State Component

```typescript
// components/ComputedState.tsx
import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore } from '../stores/UserStores';

export function ComputedStateDemo() {
  const analyticsStore = useUserStore('analytics');
  const preferencesStore = useUserStore('preferences');
  
  const analytics = useStoreValue(analyticsStore);
  const preferences = useStoreValue(preferencesStore);
  
  // Computed values are automatically updated when base state changes
  return (
    <div className="computed-state">
      <h2>Computed State Examples</h2>
      
      <div className="computed-values">
        <div className="computed-item">
          <strong>Total Sessions:</strong> {analytics.totalSessions}
        </div>
        <div className="computed-item">
          <strong>Active Sessions:</strong> {analytics.activeSessions}
        </div>
        <div className="computed-item">
          <strong>Average Session Duration:</strong> {Math.round(analytics.avgSessionDuration / 1000)}s
        </div>
        <div className="computed-item">
          <strong>Recent Events Count:</strong> {analytics.recentEvents.length}
        </div>
      </div>
      
      <div className="event-types-breakdown">
        <h3>Event Types Breakdown</h3>
        {Object.entries(analytics.eventsByType).map(([type, count]) => (
          <div key={type} className="event-type-row">
            <span>{type}:</span>
            <span>{count} events</span>
            <div 
              className="event-bar" 
              style={{ 
                width: `${(count / Math.max(...Object.values(analytics.eventsByType))) * 100}%` 
              }}
            />
          </div>
        ))}
      </div>
      
      <div className="preferences-summary">
        <h3>User Preferences Summary</h3>
        <p>Theme: {preferences.theme}</p>
        <p>Language: {preferences.language}</p>
        <p>Notifications Enabled: {
          Object.values(preferences.notifications).filter(Boolean).length
        } / {Object.keys(preferences.notifications).length}</p>
        <p>Privacy Level: {preferences.privacy.profileVisibility}</p>
      </div>
    </div>
  );
}
```

## Real-World Integration

### Form Validation Patterns

```typescript
// utils/formValidation.ts
export class FormValidator {
  static validateProfile(values: any) {
    const errors: Record<string, string> = {};
    
    if (!values.name?.trim()) {
      errors.name = 'Name is required';
    } else if (values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!values.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Invalid email format';
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }
  
  static validateContactForm(values: any) {
    const errors: Record<string, string> = {};
    
    if (!values.name?.trim()) errors.name = 'Name is required';
    if (!values.email?.trim()) errors.email = 'Email is required';
    if (!values.message?.trim()) errors.message = 'Message is required';
    if (values.message?.length < 10) errors.message = 'Message too short';
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }
}
```

### State Synchronization

```typescript
// hooks/useServerSync.ts
import { useEffect } from 'react';
import { useUserStoreManager } from '../stores/UserStores';

export function useServerSync() {
  const storeManager = useUserStoreManager();
  
  // Sync with server every 30 seconds
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const currentState = storeManager.getAllValues();
        
        // Send current state to server
        const response = await fetch('/api/sync-user-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentState)
        });
        
        if (response.ok) {
          const serverState = await response.json();
          
          // Update with server state if different
          if (JSON.stringify(currentState) !== JSON.stringify(serverState)) {
            storeManager.setAllValues(serverState);
          }
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }, 30000);
    
    return () => clearInterval(syncInterval);
  }, [storeManager]);
}
```

## Styling

```css
/* App.css */
.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.app-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.theme-light {
  background: #ffffff;
  color: #333333;
}

.theme-dark {
  background: #2d3748;
  color: #e2e8f0;
}

/* Component specific styles */
.profile-component, .preferences-component, 
.analytics-dashboard, .contact-form {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.theme-dark .profile-component, 
.theme-dark .preferences-component,
.theme-dark .analytics-dashboard, 
.theme-dark .contact-form {
  background: #4a5568;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, 
.form-group textarea, 
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input.error,
.form-group textarea.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.events-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}

.event-item {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 12px;
}

.event-type {
  font-weight: 500;
  color: #3b82f6;
}

.event-data {
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-time {
  color: #9ca3af;
  text-align: right;
}
```

## Key Benefits

✅ **Type Safety**: Automatic type inference without manual type annotations  
✅ **Reactive Updates**: Components automatically re-render on state changes  
✅ **Derived State**: Computed properties update automatically when base state changes  
✅ **Validation**: Built-in validation support with custom validator functions  
✅ **HOC Pattern**: Clean provider integration with `withProvider()`  
✅ **Store Manager**: Centralized management for reset, export, and bulk operations

## Best Practices

1. **Direct Values**: Use direct value configuration for simple types
2. **Configuration Objects**: Use for complex validation and derived state
3. **HOC Pattern**: Prefer `withProvider()` for automatic provider wrapping
4. **Reactive Subscriptions**: Always use `useStoreValue()` for component updates
5. **Bulk Operations**: Use Store Manager for reset and bulk operations
6. **State Structure**: Keep related state together in logical groupings

## Related

- **[Store Pattern API](../api/react/store-pattern)** - Store Pattern API reference
- **[Store Manager API](../api/react/store-manager)** - Store Manager documentation  
- **[Main Patterns Guide](../guide/patterns)** - Pattern comparison and selection
- **[Pattern Composition Example](./pattern-composition)** - Combining with Action Pattern