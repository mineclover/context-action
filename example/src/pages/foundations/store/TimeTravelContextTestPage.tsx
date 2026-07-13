import {
  createTimeTravelStoreContext,
  useStoreValue,
} from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CodeBlock, DemoCard } from '@/components/ui';

// Define store types
interface AppStores {
  counter: { count: number; lastAction: string };
  user: { name: string; email: string; loginCount: number };
  settings: { theme: 'light' | 'dark'; fontSize: number };
}

// ============================================================================
// Deep Structure Store for Structural Sharing Test
// ============================================================================
interface DeepAppState {
  user: {
    profile: {
      name: string;
      avatar: string;
      bio: string;
    };
    preferences: {
      theme: 'light' | 'dark';
      language: string;
      notifications: boolean;
    };
    stats: {
      loginCount: number;
      lastLogin: string;
      totalActions: number;
    };
  };
  ui: {
    sidebar: {
      isOpen: boolean;
      width: number;
    };
    modal: {
      isVisible: boolean;
      title: string;
    };
  };
}

interface DeepStores {
  app: DeepAppState;
}

const {
  Provider: DeepAppProvider,
  useStore: useDeepStore,
  useStorePath: useDeepStorePath,
  useTimeTravelControls: useDeepTimeTravelControls,
} = createTimeTravelStoreContext<DeepStores>('DeepApp', {
  app: {
    initialValue: {
      user: {
        profile: { name: 'John Doe', avatar: '👤', bio: 'Developer' },
        preferences: { theme: 'light', language: 'en', notifications: true },
        stats: { loginCount: 0, lastLogin: 'Never', totalActions: 0 },
      },
      ui: {
        sidebar: { isOpen: true, width: 240 },
        modal: { isVisible: false, title: '' },
      },
    },
    maxHistory: 50,
  },
});

// Create Time Travel Store Context
// Note: settings has timeTravel: false - no undo/redo for settings
const {
  Provider: AppTimeTravelProvider,
  useStore: useAppStore,
  useStorePath: useAppStorePath,
  useStoreSelector: useAppStoreSelector,
  useTimeTravelControls: useAppTimeTravelControls,
  useStoreInfo: useAppStoreInfo,
} = createTimeTravelStoreContext<AppStores>('AppTimeTravel', {
  counter: {
    initialValue: { count: 0, lastAction: 'initialized' },
    maxHistory: 30,
    // timeTravel: true (default)
  },
  user: {
    initialValue: { name: 'Guest', email: '', loginCount: 0 },
    maxHistory: 20,
    // timeTravel: true (default)
  },
  settings: {
    initialValue: { theme: 'light', fontSize: 14 },
    timeTravel: false, // No undo/redo for settings - regular Store
  },
});

function CounterSection() {
  const counterStore = useAppStore('counter');
  const { count, lastAction } = useStoreValue(counterStore);
  const { canUndo, canRedo, undo, redo, reset, position, historyLength } =
    useAppTimeTravelControls('counter');

  const increment = useCallback(() => {
    counterStore.setValue({ count: count + 1, lastAction: 'increment' });
  }, [counterStore, count]);

  const decrement = useCallback(() => {
    counterStore.setValue({ count: count - 1, lastAction: 'decrement' });
  }, [counterStore, count]);

  const double = useCallback(() => {
    counterStore.setValue({ count: count * 2, lastAction: 'double' });
  }, [counterStore, count]);

  return (
    <DemoCard title="Counter Store">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {count}
          </div>
          <div className="text-sm text-gray-500 mt-1">Last: {lastAction}</div>
          <div className="text-xs text-gray-400">
            Position: {position} / {historyLength - 1}
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button onClick={decrement} variant="secondary" size="sm">
            -1
          </Button>
          <Button onClick={increment} variant="primary" size="sm">
            +1
          </Button>
          <Button onClick={double} variant="secondary" size="sm">
            x2
          </Button>
        </div>

        <div className="flex justify-center gap-2 pt-3 border-t">
          <Button
            onClick={() => undo()}
            disabled={!canUndo}
            variant="outline"
            size="sm"
          >
            Undo
          </Button>
          <Button
            onClick={() => redo()}
            disabled={!canRedo}
            variant="outline"
            size="sm"
          >
            Redo
          </Button>
          <Button onClick={() => reset()} variant="danger" size="sm">
            Reset
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

function UserSection() {
  const userStore = useAppStore('user');
  const { name, email, loginCount } = useStoreValue(userStore);
  const { canUndo, canRedo, undo, redo, reset, position, historyLength } =
    useAppTimeTravelControls('user');
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');

  const updateProfile = useCallback(() => {
    userStore.setValue({
      name: inputName || name,
      email: inputEmail || email,
      loginCount,
    });
    setInputName('');
    setInputEmail('');
  }, [userStore, inputName, inputEmail, name, email, loginCount]);

  const simulateLogin = useCallback(() => {
    userStore.setValue({
      name,
      email,
      loginCount: loginCount + 1,
    });
  }, [userStore, name, email, loginCount]);

  return (
    <DemoCard title="User Store">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name:</span>
            <span className="font-medium">{name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email:</span>
            <span className="font-medium">{email || '(not set)'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Login Count:</span>
            <span className="font-medium">{loginCount}</span>
          </div>
          <div className="text-xs text-gray-400 text-center">
            Position: {position} / {historyLength - 1}
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="New name..."
            className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="New email..."
            className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
          />
          <div className="flex gap-2">
            <Button
              onClick={updateProfile}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Update
            </Button>
            <Button
              onClick={simulateLogin}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Login +1
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-3 border-t">
          <Button
            onClick={() => undo()}
            disabled={!canUndo}
            variant="outline"
            size="sm"
          >
            Undo
          </Button>
          <Button
            onClick={() => redo()}
            disabled={!canRedo}
            variant="outline"
            size="sm"
          >
            Redo
          </Button>
          <Button onClick={() => reset()} variant="danger" size="sm">
            Reset
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

function SettingsSection() {
  // Settings uses timeTravel: false - regular Store without undo/redo
  const settingsStore = useAppStore('settings');
  const { theme, fontSize } = useStoreValue(settingsStore);

  const toggleTheme = useCallback(() => {
    settingsStore.setValue({
      theme: theme === 'light' ? 'dark' : 'light',
      fontSize,
    });
  }, [settingsStore, theme, fontSize]);

  const changeFontSize = useCallback(
    (delta: number) => {
      settingsStore.setValue({
        theme,
        fontSize: Math.max(10, Math.min(24, fontSize + delta)),
      });
    },
    [settingsStore, theme, fontSize]
  );

  const resetSettings = useCallback(() => {
    settingsStore.setValue({ theme: 'light', fontSize: 14 });
  }, [settingsStore]);

  return (
    <DemoCard title="Settings Store (timeTravel: false)">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          This store has{' '}
          <code className="bg-amber-100 px-1 rounded">timeTravel: false</code> -
          no undo/redo available. Changes are immediate and permanent.
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Theme:</span>
            <Button onClick={toggleTheme} variant="secondary" size="sm">
              {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Font Size:</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => changeFontSize(-2)}
                variant="outline"
                size="sm"
              >
                A-
              </Button>
              <span className="font-mono text-sm w-8 text-center">
                {fontSize}
              </span>
              <Button
                onClick={() => changeFontSize(2)}
                variant="outline"
                size="sm"
              >
                A+
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg text-center ${
            theme === 'dark'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          Preview Text
        </div>

        <div className="flex justify-center gap-2 pt-3 border-t">
          <Button onClick={resetSettings} variant="secondary" size="sm">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

function StoreInfoPanel() {
  const info = useAppStoreInfo();

  return (
    <DemoCard title="Store Context Info">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Context Name:</span>
          <span className="font-mono">{info.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Active Stores:</span>
          <span className="font-mono">{info.storeCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Available Stores:</span>
          <span className="font-mono">{info.availableStores.join(', ')}</span>
        </div>
      </div>
    </DemoCard>
  );
}

function DeepReferenceTest() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { canUndo, undo, position, historyLength } =
    useAppTimeTravelControls('user');

  const updateNestedData = useCallback(() => {
    // Test deep reference update
    userStore.update((draft) => {
      draft.name = `User_${Date.now() % 1000}`;
      draft.loginCount += 1;
    });
  }, [userStore]);

  return (
    <DemoCard title="Deep Reference Test (update with draft)">
      <div className="space-y-3">
        <CodeBlock size="sm" className="max-h-48 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </CodeBlock>
        <div className="text-xs text-gray-400 text-center">
          Position: {position} / {historyLength - 1}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={updateNestedData}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            Update via Draft
          </Button>
          <Button
            onClick={() => undo()}
            disabled={!canUndo}
            variant="outline"
            size="sm"
          >
            Undo
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

// Path-based Optimization Demo
function PathOptimizationDemo() {
  const counterStore = useAppStore('counter');
  const userStore = useAppStore('user');

  return (
    <DemoCard title="Path-based Optimization Demo">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compare render counts: <code>useStorePath</code> only re-renders when
          the specific path changes.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Full subscription components */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">
              useStoreValue (Full)
            </div>
            <CountRendersFull />
            <NameRendersFull />
          </div>

          {/* Path-based subscription components */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">
              useStorePath (Optimized)
            </div>
            <CountRendersPath />
            <NameRendersPath />
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t">
          <Button
            onClick={() =>
              counterStore.setValue({
                count: counterStore.getValue().count + 1,
                lastAction: 'increment',
              })
            }
            variant="primary"
            size="sm"
          >
            Update Count
          </Button>
          <Button
            onClick={() =>
              userStore.setValue({
                ...userStore.getValue(),
                name: `User_${Date.now() % 1000}`,
              })
            }
            variant="secondary"
            size="sm"
          >
            Update Name
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

// Full subscription: re-renders on ANY counter change
function CountRendersFull() {
  const renderCount = useRef(0);
  const counterStore = useAppStore('counter');
  const { count } = useStoreValue(counterStore);

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
      Count: {count}
      <span className="text-xs text-red-500 ml-2">
        renders: {renderCount.current}
      </span>
    </div>
  );
}

// Path-based: only re-renders when count changes
function CountRendersPath() {
  const renderCount = useRef(0);
  const count = useAppStorePath('counter', ['count']) as number;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
      Count: {count}
      <span className="text-xs text-green-500 ml-2">
        renders: {renderCount.current}
      </span>
    </div>
  );
}

// Full subscription: re-renders on ANY user change
function NameRendersFull() {
  const renderCount = useRef(0);
  const userStore = useAppStore('user');
  const { name } = useStoreValue(userStore);

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
      Name: {name}
      <span className="text-xs text-red-500 ml-2">
        renders: {renderCount.current}
      </span>
    </div>
  );
}

// Path-based: only re-renders when name changes
function NameRendersPath() {
  const renderCount = useRef(0);
  const name = useAppStorePath('user', ['name']) as string;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
      Name: {name}
      <span className="text-xs text-green-500 ml-2">
        renders: {renderCount.current}
      </span>
    </div>
  );
}

// Selector with dependsOn demo
function SelectorDemo() {
  const renderCount = useRef(0);
  const userStore = useAppStore('user');

  // Only re-renders when name or email changes, not loginCount
  const displayInfo = useAppStoreSelector(
    'user',
    (user) => `${user.name} <${user.email || 'no email'}>`,
    { dependsOn: [['name'], ['email']] }
  );

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <DemoCard title="useStoreSelector with dependsOn">
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-sm">{displayInfo}</div>
          <div className="text-xs text-blue-500 mt-1">
            renders: {renderCount.current}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          This component only re-renders when <code>name</code> or{' '}
          <code>email</code> changes, not when <code>loginCount</code> changes.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              userStore.setValue({
                ...userStore.getValue(),
                loginCount: userStore.getValue().loginCount + 1,
              })
            }
            variant="outline"
            size="sm"
          >
            Update loginCount (no re-render)
          </Button>
        </div>
      </div>
    </DemoCard>
  );
}

// ============================================================================
// Deep Structure Structural Sharing Test
// ============================================================================

function DeepStructureDemo() {
  return (
    <DeepAppProvider>
      <DemoCard title="🔬 Deep Structure - Structural Sharing Test">
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-sm">
            <p className="font-medium text-indigo-800 dark:text-indigo-200">
              Structural Sharing Test
            </p>
            <p className="text-indigo-600 dark:text-indigo-300 text-xs mt-1">
              With <code>mutable=true</code>, unchanged paths keep the same
              reference. Path-based subscriptions skip re-renders for unaffected
              paths.
            </p>
          </div>

          <DeepStructureControls />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Path Subscribers
              </div>
              <ProfileNameSubscriber />
              <ProfileAvatarSubscriber />
              <PreferencesThemeSubscriber />
              <StatsLoginCountSubscriber />
              <SidebarSubscriber />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Full Subscriber
              </div>
              <FullStateSubscriber />
            </div>
          </div>

          <DeepUndoRedoControls />
        </div>
      </DemoCard>
    </DeepAppProvider>
  );
}

function DeepStructureControls() {
  const appStore = useDeepStore('app');

  const updateProfileName = useCallback(() => {
    appStore.update((draft) => {
      draft.user.profile.name = `User_${Date.now() % 10000}`;
    });
  }, [appStore]);

  const updateProfileAvatar = useCallback(() => {
    const avatars = ['👤', '🧑‍💻', '👨‍🎨', '👩‍🔬', '🧙‍♂️', '🦸‍♀️'];
    appStore.update((draft) => {
      const current = avatars.indexOf(draft.user.profile.avatar);
      draft.user.profile.avatar = avatars[(current + 1) % avatars.length]!;
    });
  }, [appStore]);

  const updateTheme = useCallback(() => {
    appStore.update((draft) => {
      draft.user.preferences.theme =
        draft.user.preferences.theme === 'light' ? 'dark' : 'light';
    });
  }, [appStore]);

  const updateLoginCount = useCallback(() => {
    appStore.update((draft) => {
      draft.user.stats.loginCount++;
      draft.user.stats.lastLogin = new Date().toLocaleTimeString();
    });
  }, [appStore]);

  const toggleSidebar = useCallback(() => {
    appStore.update((draft) => {
      draft.ui.sidebar.isOpen = !draft.ui.sidebar.isOpen;
    });
  }, [appStore]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={updateProfileName} variant="primary" size="sm">
        Update Name
      </Button>
      <Button onClick={updateProfileAvatar} variant="secondary" size="sm">
        Change Avatar
      </Button>
      <Button onClick={updateTheme} variant="secondary" size="sm">
        Toggle Theme
      </Button>
      <Button onClick={updateLoginCount} variant="secondary" size="sm">
        +Login Count
      </Button>
      <Button onClick={toggleSidebar} variant="outline" size="sm">
        Toggle Sidebar
      </Button>
    </div>
  );
}

function DeepUndoRedoControls() {
  const { canUndo, canRedo, undo, redo, reset, position, historyLength } =
    useDeepTimeTravelControls('app');

  return (
    <div className="flex items-center gap-2 pt-3 border-t">
      <Button
        onClick={() => undo()}
        disabled={!canUndo}
        variant="outline"
        size="sm"
      >
        Undo
      </Button>
      <Button
        onClick={() => redo()}
        disabled={!canRedo}
        variant="outline"
        size="sm"
      >
        Redo
      </Button>
      <Button onClick={() => reset()} variant="danger" size="sm">
        Reset
      </Button>
      <span className="text-xs text-gray-500 ml-auto">
        Position: {position} / {historyLength - 1}
      </span>
    </div>
  );
}

// Path-based subscribers - should only re-render when their specific path changes
function ProfileNameSubscriber() {
  const renderCount = useRef(0);
  const name = useDeepStorePath('app', ['user', 'profile', 'name']) as string;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
      <div className="font-mono">user.profile.name</div>
      <div className="font-semibold">{name}</div>
      <div className="text-green-600">renders: {renderCount.current}</div>
    </div>
  );
}

function ProfileAvatarSubscriber() {
  const renderCount = useRef(0);
  const avatar = useDeepStorePath('app', [
    'user',
    'profile',
    'avatar',
  ]) as string;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
      <div className="font-mono">user.profile.avatar</div>
      <div className="font-semibold text-2xl">{avatar}</div>
      <div className="text-green-600">renders: {renderCount.current}</div>
    </div>
  );
}

function PreferencesThemeSubscriber() {
  const renderCount = useRef(0);
  const theme = useDeepStorePath('app', [
    'user',
    'preferences',
    'theme',
  ]) as string;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
      <div className="font-mono">user.preferences.theme</div>
      <div className="font-semibold">
        {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
      </div>
      <div className="text-green-600">renders: {renderCount.current}</div>
    </div>
  );
}

function StatsLoginCountSubscriber() {
  const renderCount = useRef(0);
  const loginCount = useDeepStorePath('app', [
    'user',
    'stats',
    'loginCount',
  ]) as number;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
      <div className="font-mono">user.stats.loginCount</div>
      <div className="font-semibold">{loginCount}</div>
      <div className="text-green-600">renders: {renderCount.current}</div>
    </div>
  );
}

function SidebarSubscriber() {
  const renderCount = useRef(0);
  const isOpen = useDeepStorePath('app', [
    'ui',
    'sidebar',
    'isOpen',
  ]) as boolean;

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
      <div className="font-mono">ui.sidebar.isOpen</div>
      <div className="font-semibold">{isOpen ? '📂 Open' : '📁 Closed'}</div>
      <div className="text-green-600">renders: {renderCount.current}</div>
    </div>
  );
}

// Full state subscriber - should re-render on ANY change
function FullStateSubscriber() {
  const renderCount = useRef(0);
  const appStore = useDeepStore('app');
  const state = useStoreValue(appStore);

  useEffect(() => {
    renderCount.current++;
  });

  return (
    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs h-full">
      <div className="font-mono mb-2">Full State (useStoreValue)</div>
      <CodeBlock size="sm" className="max-h-64 overflow-auto">
        {JSON.stringify(state, null, 2)}
      </CodeBlock>
      <div className="text-red-600 mt-2">renders: {renderCount.current}</div>
    </div>
  );
}

function TimeTravelContextTestPage() {
  return (
    <AppTimeTravelProvider>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <h1>TimeTravelStoreContext Demo</h1>
            <p>
              Test <code>createTimeTravelStoreContext</code> - a context pattern
              with built-in undo/redo for multiple stores. Each store has
              independent history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CounterSection />
            <UserSection />
            <SettingsSection />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DeepReferenceTest />
            <StoreInfoPanel />
          </div>

          {/* Path-based Optimization Section */}
          <div className="prose dark:prose-invert max-w-none">
            <h2>Path-based Optimization (Patch-aware)</h2>
            <p>
              <code>useStorePath</code> and <code>useStoreSelector</code> with{' '}
              <code>dependsOn</code> use JSON patches to determine which paths
              changed, skipping unnecessary re-renders.
            </p>
          </div>

          <PathOptimizationDemo />
          <SelectorDemo />

          {/* Deep Structure Test Section */}
          <div className="prose dark:prose-invert max-w-none">
            <h2>Deep Structure - Structural Sharing</h2>
            <p>
              Test with deeply nested state. Each path subscriber (green) should
              only re-render when its specific path changes. The full subscriber
              (red) re-renders on every change.
            </p>
          </div>

          <DeepStructureDemo />

          <DemoCard title="createTimeTravelStoreContext API">
            <CodeBlock>
              {`// Create context with time travel stores
const {
  Provider,
  useStore,
  useStorePath,       // NEW: Path-based subscription
  useStoreSelector,   // NEW: Selector with dependsOn
  useTimeTravelControls,
  useStoreManager,
  useStoreInfo,
  useStoreClear,
  withProvider,
} = createTimeTravelStoreContext<AppStores>('App', {
  counter: { initialValue: { count: 0 }, maxHistory: 30 },
  user: { initialValue: { name: '' }, maxHistory: 20 },
  settings: 'simple-value', // Simple value without config
});

// Standard usage
const store = useStore('counter');
const value = useStoreValue(store);
const { canUndo, undo, redo } = useTimeTravelControls('counter');

// Path-based optimization (only re-renders when path changes)
const count = useStorePath('counter', ['count']);       // Only count changes
const userName = useStorePath('user', ['name']);        // Only name changes

// Selector with dependency hints
const displayName = useStoreSelector('user',
  (user) => \`\${user.firstName} \${user.lastName}\`,
  { dependsOn: [['firstName'], ['lastName']] }          // Skip loginCount changes
);`}
            </CodeBlock>
          </DemoCard>
        </div>
      </div>
    </AppTimeTravelProvider>
  );
}

export default TimeTravelContextTestPage;
