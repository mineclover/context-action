/**
 * useStoreSelector Hook Examples
 * 
 * Demonstrates performance optimization through selective subscriptions
 */

import React, { useState, useRef } from 'react';
import { createStore } from '../../../src/stores/core/Store';
import { 
  useStoreSelector, 
  useMultiStoreSelector,
  useStorePathSelector,
  shallowEqual, 
  deepEqual 
} from '../../../src/stores/hooks/useStoreSelector';

// Create example stores with complex data
const appStore = createStore('app', {
  user: {
    id: 1,
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '👨‍💻',
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: true
        }
      }
    },
    stats: {
      posts: 42,
      followers: 128,
      following: 56,
      karma: 1337
    }
  },
  ui: {
    sidebar: { collapsed: false, width: 250 },
    modal: { isOpen: false, type: null },
    theme: 'dark',
    loading: false
  },
  data: {
    posts: [
      { id: 1, title: 'First Post', likes: 10, comments: 3 },
      { id: 2, title: 'Second Post', likes: 25, comments: 7 }
    ],
    comments: [],
    cache: new Map()
  }
});

const settingsStore = createStore('settings', {
  api: { endpoint: 'https://api.example.com', timeout: 5000 },
  features: { beta: false, analytics: true, debug: false },
  limits: { maxPosts: 100, maxComments: 1000 }
});

// Performance tracking component
function RenderCounter({ label }: { label: string }) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  return (
    <span style={{ 
      fontSize: '12px', 
      backgroundColor: '#e9ecef', 
      padding: '2px 6px', 
      borderRadius: '3px',
      marginLeft: '10px'
    }}>
      {label}: {renderCount.current} renders
    </span>
  );
}

// Example 1: Basic selective subscription
function BasicSelector() {
  // Only subscribes to user name - won't re-render when other user data changes
  const userName = useStoreSelector(appStore, state => state.user.profile.name);
  
  return (
    <div className="example-section">
      <h3>Basic Selector - User Name Only</h3>
      <p>User: {userName}</p>
      <RenderCounter label="Name Component" />
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => appStore.update(state => ({
            ...state,
            user: {
              ...state.user,
              profile: {
                ...state.user.profile,
                name: state.user.profile.name === 'John Doe' ? 'Jane Smith' : 'John Doe'
              }
            }
          }))}
        >
          Change Name (Will Re-render)
        </button>
        
        <button 
          onClick={() => appStore.update(state => ({
            ...state,
            user: {
              ...state.user,
              stats: { ...state.user.stats, posts: state.user.stats.posts + 1 }
            }
          }))}
          style={{ marginLeft: '10px' }}
        >
          Increment Posts (Won't Re-render)
        </button>
      </div>
    </div>
  );
}

// Example 2: Multiple selectors comparison
function MultipleSelectors() {
  const userStats = useStoreSelector(appStore, state => state.user.stats);
  const uiState = useStoreSelector(appStore, state => state.ui);
  
  return (
    <div className="example-section">
      <h3>Multiple Selectors</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>User Stats <RenderCounter label="Stats" /></h4>
          <ul>
            <li>Posts: {userStats.posts}</li>
            <li>Followers: {userStats.followers}</li>
            <li>Following: {userStats.following}</li>
            <li>Karma: {userStats.karma}</li>
          </ul>
          
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                stats: { ...state.user.stats, karma: state.user.stats.karma + 10 }
              }
            }))}
          >
            +10 Karma
          </button>
        </div>
        
        <div>
          <h4>UI State <RenderCounter label="UI" /></h4>
          <ul>
            <li>Sidebar: {uiState.sidebar.collapsed ? 'Collapsed' : 'Expanded'}</li>
            <li>Theme: {uiState.theme}</li>
            <li>Loading: {uiState.loading ? 'Yes' : 'No'}</li>
          </ul>
          
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              ui: {
                ...state.ui,
                sidebar: { ...state.ui.sidebar, collapsed: !state.ui.sidebar.collapsed }
              }
            }))}
          >
            Toggle Sidebar
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 3: Custom equality functions
function EqualityFunctionExample() {
  const [equalityType, setEqualityType] = useState<'reference' | 'shallow' | 'deep'>('reference');
  
  // Different equality strategies
  const getEqualityFn = () => {
    switch (equalityType) {
      case 'shallow': return shallowEqual;
      case 'deep': return deepEqual;
      default: return undefined; // Reference equality (default)
    }
  };
  
  const userPreferences = useStoreSelector(
    appStore,
    state => ({
      theme: state.user.profile.preferences.theme,
      language: state.user.profile.preferences.language,
      notifications: state.user.profile.preferences.notifications
    }),
    getEqualityFn()
  );
  
  return (
    <div className="example-section">
      <h3>Custom Equality Functions</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>Equality Strategy: </label>
        {(['reference', 'shallow', 'deep'] as const).map(type => (
          <label key={type} style={{ marginLeft: '10px' }}>
            <input
              type="radio"
              value={type}
              checked={equalityType === type}
              onChange={(e) => setEqualityType(e.target.value as any)}
            />
            {type}
          </label>
        ))}
      </div>
      
      <div>
        <h4>User Preferences <RenderCounter label="Preferences" /></h4>
        <ul>
          <li>Theme: {userPreferences.theme}</li>
          <li>Language: {userPreferences.language}</li>
          <li>Email Notifications: {userPreferences.notifications.email ? 'On' : 'Off'}</li>
          <li>Push Notifications: {userPreferences.notifications.push ? 'On' : 'Off'}</li>
        </ul>
        
        <div>
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                profile: {
                  ...state.user.profile,
                  preferences: {
                    ...state.user.profile.preferences,
                    theme: state.user.profile.preferences.theme === 'dark' ? 'light' : 'dark'
                  }
                }
              }
            }))}
          >
            Toggle Theme
          </button>
          
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                profile: {
                  ...state.user.profile,
                  preferences: {
                    // Create new object with same values (tests equality functions)
                    theme: state.user.profile.preferences.theme,
                    language: state.user.profile.preferences.language,
                    notifications: {
                      email: state.user.profile.preferences.notifications.email,
                      push: state.user.profile.preferences.notifications.push,
                      sms: state.user.profile.preferences.notifications.sms
                    }
                  }
                }
              }
            }))}
            style={{ marginLeft: '10px' }}
          >
            Update with Same Values
          </button>
        </div>
        
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          <strong>Reference:</strong> Re-renders on any object recreation<br />
          <strong>Shallow:</strong> Re-renders only if first-level properties change<br />
          <strong>Deep:</strong> Re-renders only if deeply nested values change
        </p>
      </div>
    </div>
  );
}

// Example 4: useMultiStoreSelector
function MultiStoreSelector() {
  const combinedData = useMultiStoreSelector(
    [appStore, settingsStore],
    ([app, settings]) => ({
      userName: app.user.profile.name,
      userPosts: app.user.stats.posts,
      maxPosts: settings.limits.maxPosts,
      betaFeatures: settings.features.beta,
      apiEndpoint: settings.api.endpoint,
      remainingPosts: settings.limits.maxPosts - app.user.stats.posts
    }),
    shallowEqual
  );
  
  return (
    <div className="example-section">
      <h3>Multi-Store Selector</h3>
      <div>
        <h4>Combined Data <RenderCounter label="Combined" /></h4>
        <ul>
          <li>User: {combinedData.userName}</li>
          <li>Posts: {combinedData.userPosts} / {combinedData.maxPosts}</li>
          <li>Remaining: {combinedData.remainingPosts}</li>
          <li>Beta Features: {combinedData.betaFeatures ? 'Enabled' : 'Disabled'}</li>
          <li>API: {combinedData.apiEndpoint}</li>
        </ul>
        
        <div>
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                stats: { ...state.user.stats, posts: state.user.stats.posts + 1 }
              }
            }))}
          >
            Add Post (App Store)
          </button>
          
          <button 
            onClick={() => settingsStore.update(state => ({
              ...state,
              features: { ...state.features, beta: !state.features.beta }
            }))}
            style={{ marginLeft: '10px' }}
          >
            Toggle Beta (Settings Store)
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 5: useStorePathSelector
function PathSelector() {
  const userName = useStorePathSelector(appStore, ['user', 'profile', 'name']);
  const emailNotifications = useStorePathSelector(appStore, ['user', 'profile', 'preferences', 'notifications', 'email']);
  const sidebarWidth = useStorePathSelector(appStore, ['ui', 'sidebar', 'width']);
  const nonExistentPath = useStorePathSelector(appStore, ['user', 'nonexistent', 'path']);
  
  return (
    <div className="example-section">
      <h3>Path-Based Selector</h3>
      <div>
        <h4>Path Selections <RenderCounter label="Paths" /></h4>
        <ul>
          <li>User Name (user.profile.name): {userName}</li>
          <li>Email Notifications (user.profile.preferences.notifications.email): {emailNotifications ? 'On' : 'Off'}</li>
          <li>Sidebar Width (ui.sidebar.width): {sidebarWidth}px</li>
          <li>Non-existent Path: {nonExistentPath ?? 'undefined'}</li>
        </ul>
        
        <div>
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              ui: {
                ...state.ui,
                sidebar: {
                  ...state.ui.sidebar,
                  width: state.ui.sidebar.width === 250 ? 300 : 250
                }
              }
            }))}
          >
            Toggle Sidebar Width
          </button>
          
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                profile: {
                  ...state.user.profile,
                  preferences: {
                    ...state.user.profile.preferences,
                    notifications: {
                      ...state.user.profile.preferences.notifications,
                      email: !state.user.profile.preferences.notifications.email
                    }
                  }
                }
              }
            }))}
            style={{ marginLeft: '10px' }}
          >
            Toggle Email Notifications
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 6: Performance comparison
function PerformanceComparison() {
  const [useOptimized, setUseOptimized] = useState(true);
  
  // Optimized: Only subscribes to specific data
  const optimizedData = useStoreSelector(
    appStore,
    state => ({
      posts: state.user.stats.posts,
      theme: state.ui.theme
    }),
    shallowEqual
  );
  
  // Unoptimized: Subscribes to entire store
  const unoptimizedData = useStoreSelector(appStore, state => state);
  
  const displayData = useOptimized ? 
    { posts: optimizedData.posts, theme: optimizedData.theme } :
    { posts: unoptimizedData.user.stats.posts, theme: unoptimizedData.ui.theme };
  
  return (
    <div className="example-section">
      <h3>Performance Comparison</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={useOptimized}
            onChange={(e) => setUseOptimized(e.target.checked)}
          />
          Use Optimized Selector
        </label>
      </div>
      
      <div>
        <h4>
          {useOptimized ? 'Optimized' : 'Unoptimized'} Component
          <RenderCounter label={useOptimized ? 'Optimized' : 'Unoptimized'} />
        </h4>
        <ul>
          <li>Posts: {displayData.posts}</li>
          <li>Theme: {displayData.theme}</li>
        </ul>
        
        <div>
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                stats: { ...state.user.stats, posts: state.user.stats.posts + 1 }
              }
            }))}
          >
            Increment Posts (Should Re-render Both)
          </button>
          
          <button 
            onClick={() => appStore.update(state => ({
              ...state,
              user: {
                ...state.user,
                stats: { ...state.user.stats, karma: state.user.stats.karma + 1 }
              }
            }))}
            style={{ marginLeft: '10px' }}
          >
            Increment Karma (Only Unoptimized Re-renders)
          </button>
        </div>
        
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          The optimized version only re-renders when posts or theme change.
          The unoptimized version re-renders on any store change.
        </p>
      </div>
    </div>
  );
}

// Main component showcasing all examples
export function UseStoreSelectorExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>useStoreSelector Hook Examples</h1>
      <p>
        The <code>useStoreSelector</code> hook family provides powerful performance optimization
        through selective subscriptions. Only re-render when the selected data actually changes.
      </p>
      
      <BasicSelector />
      <MultipleSelectors />
      <EqualityFunctionExample />
      <MultiStoreSelector />
      <PathSelector />
      <PerformanceComparison />
      
      <div className="example-section">
        <h3>Key Features</h3>
        <ul>
          <li>✅ Selective subscriptions prevent unnecessary re-renders</li>
          <li>✅ Custom equality functions for complex comparisons</li>
          <li>✅ Multi-store selection with useMultiStoreSelector</li>
          <li>✅ Path-based selection with useStorePathSelector</li>
          <li>✅ Built-in equality functions (shallow, deep)</li>
          <li>✅ TypeScript support with type inference</li>
          <li>✅ Performance monitoring and optimization</li>
        </ul>
      </div>
      
      <div className="example-section">
        <h3>When to Use</h3>
        <ul>
          <li>🎯 Large stores where you only need specific data</li>
          <li>🎯 Performance optimization for frequently updating stores</li>
          <li>🎯 Complex data structures with nested properties</li>
          <li>🎯 Combining data from multiple stores</li>
        </ul>
      </div>
    </div>
  );
}

export default UseStoreSelectorExamples;