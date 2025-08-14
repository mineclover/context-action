/**
 * useStoreValue Hook Examples
 * 
 * Demonstrates the most important store hook for subscribing to store values
 */

import React, { useState } from 'react';
import { createStore } from '../../../src/stores/core/Store';
import { useStoreValue, useStoreValues } from '../../../src/stores/hooks/useStoreValue';
import { shallowEqual } from '../../../src/stores/hooks/useStoreSelector';

// Create example stores
const counterStore = createStore('counter', 0);
const userStore = createStore('user', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  profile: {
    avatar: '👨',
    theme: 'dark',
    notifications: true
  },
  stats: {
    posts: 42,
    followers: 128,
    following: 56
  }
});

const settingsStore = createStore('settings', {
  language: 'en',
  timezone: 'UTC',
  privacy: {
    showEmail: false,
    showProfile: true
  }
});

// Example 1: Basic useStoreValue usage
function BasicCounter() {
  const count = useStoreValue(counterStore);
  
  return (
    <div className="example-section">
      <h3>Basic useStoreValue</h3>
      <p>Count: {count}</p>
      <button onClick={() => counterStore.setValue(count + 1)}>
        Increment
      </button>
      <button onClick={() => counterStore.setValue(count - 1)}>
        Decrement
      </button>
      <button onClick={() => counterStore.setValue(0)}>
        Reset
      </button>
    </div>
  );
}

// Example 2: useStoreValue with selector
function UserProfile() {
  const userName = useStoreValue(userStore, user => user.name);
  const userEmail = useStoreValue(userStore, user => user.email);
  const userAvatar = useStoreValue(userStore, user => user.profile.avatar);
  
  return (
    <div className="example-section">
      <h3>useStoreValue with Selectors</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '2em' }}>{userAvatar}</span>
        <div>
          <div><strong>{userName}</strong></div>
          <div style={{ color: '#666' }}>{userEmail}</div>
        </div>
      </div>
      <button 
        onClick={() => userStore.update(user => ({
          ...user,
          name: user.name === 'John Doe' ? 'Jane Smith' : 'John Doe',
          email: user.email === 'john@example.com' ? 'jane@example.com' : 'john@example.com',
          profile: { ...user.profile, avatar: user.profile.avatar === '👨' ? '👩' : '👨' }
        }))}
      >
        Toggle User
      </button>
    </div>
  );
}

// Example 3: Performance optimization with selective rendering
function UserStatsOptimized() {
  const [selectedStat, setSelectedStat] = useState<'posts' | 'followers' | 'following'>('posts');
  
  // Only subscribes to the selected stat
  const statValue = useStoreValue(userStore, user => user.stats[selectedStat]);
  
  return (
    <div className="example-section">
      <h3>Performance Optimized Selector</h3>
      <p>This component only re-renders when the selected stat changes</p>
      
      <div style={{ marginBottom: '10px' }}>
        {(['posts', 'followers', 'following'] as const).map(stat => (
          <button 
            key={stat}
            onClick={() => setSelectedStat(stat)}
            style={{ 
              margin: '0 5px',
              backgroundColor: selectedStat === stat ? '#007bff' : '#f8f9fa',
              color: selectedStat === stat ? 'white' : 'black'
            }}
          >
            {stat}
          </button>
        ))}
      </div>
      
      <p>
        <strong>{selectedStat}:</strong> {statValue}
      </p>
      
      <button 
        onClick={() => userStore.update(user => ({
          ...user,
          stats: {
            ...user.stats,
            [selectedStat]: user.stats[selectedStat] + 1
          }
        }))}
      >
        Increment {selectedStat}
      </button>
    </div>
  );
}

// Example 4: useStoreValues for multiple selections
function UserDashboard() {
  const userInfo = useStoreValues(userStore, {
    name: user => user.name,
    email: user => user.email,
    postsCount: user => user.stats.posts,
    followersCount: user => user.stats.followers
  });
  
  const settings = useStoreValues(settingsStore, {
    language: s => s.language,
    timezone: s => s.timezone,
    showEmail: s => s.privacy.showEmail
  });
  
  return (
    <div className="example-section">
      <h3>useStoreValues - Multiple Selections</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>User Info</h4>
          <ul>
            <li>Name: {userInfo.name}</li>
            <li>Email: {settings.showEmail ? userInfo.email : '***@***.***'}</li>
            <li>Posts: {userInfo.postsCount}</li>
            <li>Followers: {userInfo.followersCount}</li>
          </ul>
        </div>
        <div>
          <h4>Settings</h4>
          <ul>
            <li>Language: {settings.language}</li>
            <li>Timezone: {settings.timezone}</li>
            <li>Show Email: {settings.showEmail ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>
      
      <button 
        onClick={() => settingsStore.update(s => ({
          ...s,
          privacy: { ...s.privacy, showEmail: !s.privacy.showEmail }
        }))}
      >
        Toggle Email Visibility
      </button>
    </div>
  );
}

// Example 5: Custom equality function
function UserProfileShallow() {
  const [renderCount, setRenderCount] = useState(0);
  
  // Using shallow equality for object comparison
  const profile = useStoreValue(
    userStore, 
    user => ({ theme: user.profile.theme, notifications: user.profile.notifications }),
    { equalityFn: shallowEqual }
  );
  
  // Count renders
  React.useEffect(() => {
    setRenderCount(count => count + 1);
  });
  
  return (
    <div className="example-section">
      <h3>Custom Equality Function</h3>
      <p>Render count: {renderCount}</p>
      <p>Theme: {profile.theme}</p>
      <p>Notifications: {profile.notifications ? 'On' : 'Off'}</p>
      
      <div>
        <button 
          onClick={() => userStore.update(user => ({
            ...user,
            profile: { ...user.profile, theme: user.profile.theme === 'dark' ? 'light' : 'dark' }
          }))}
        >
          Toggle Theme
        </button>
        
        <button 
          onClick={() => userStore.update(user => ({
            ...user,
            name: user.name + '!' // This won't trigger re-render
          }))}
        >
          Change Name (No re-render)
        </button>
      </div>
    </div>
  );
}

// Example 6: Null/undefined store handling
function SafeStoreAccess() {
  const [store, setStore] = useState<typeof counterStore | null>(counterStore);
  
  const value = useStoreValue(store);
  
  return (
    <div className="example-section">
      <h3>Safe Store Access</h3>
      <p>Store exists: {store ? 'Yes' : 'No'}</p>
      <p>Value: {value ?? 'undefined'}</p>
      
      <button onClick={() => setStore(store ? null : counterStore)}>
        Toggle Store
      </button>
      
      {store && (
        <button onClick={() => store.setValue((store.getValue() || 0) + 1)}>
          Increment
        </button>
      )}
    </div>
  );
}

// Main component showcasing all examples
export function UseStoreValueExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>useStoreValue Hook Examples</h1>
      <p>
        The <code>useStoreValue</code> hook is the most essential hook for subscribing to store values.
        It provides reactive updates and supports selectors for performance optimization.
      </p>
      
      <BasicCounter />
      <UserProfile />
      <UserStatsOptimized />
      <UserDashboard />
      <UserProfileShallow />
      <SafeStoreAccess />
      
      <div className="example-section">
        <h3>Key Features</h3>
        <ul>
          <li>✅ Reactive updates when store values change</li>
          <li>✅ Selector functions for performance optimization</li>
          <li>✅ Custom equality functions for complex comparisons</li>
          <li>✅ Safe handling of null/undefined stores</li>
          <li>✅ Multiple value selection with useStoreValues</li>
          <li>✅ TypeScript support with automatic type inference</li>
        </ul>
      </div>
    </div>
  );
}

export default UseStoreValueExamples;