// @ts-nocheck
/**
 * MutableStore Demo Page
 *
 * Demonstrates MutableStore's structural sharing feature:
 * - Unchanged parts of state keep the same reference
 * - Path-based subscriptions only re-render when specific path changes
 * - Performance comparison with regular updates
 *
 * NOTE: This demo is disabled pending implementation of createMutableStore
 */

import { useCallback, useRef, memo } from 'react';
import {
  createMutableStore,
  useStoreValue,
  useStorePath,
  type StorePath,
} from '@context-action/react';
import { CodeBlock } from '@/components/ui';
import { css } from '../../../../styled-system/css';

// ============================================================================
// Deep State Structure for Structural Sharing Demo
// ============================================================================

interface DeepAppState {
  user: {
    profile: {
      name: string;
      email: string;
      avatar: string;
    };
    preferences: {
      theme: 'light' | 'dark';
      language: string;
      notifications: boolean;
    };
    stats: {
      loginCount: number;
      lastLogin: string;
    };
  };
  ui: {
    sidebar: {
      isOpen: boolean;
      width: number;
    };
    modal: {
      isVisible: boolean;
      content: string;
    };
  };
  counter: number;
}

const initialState: DeepAppState = {
  user: {
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '👤',
    },
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
    },
    stats: {
      loginCount: 0,
      lastLogin: 'Never',
    },
  },
  ui: {
    sidebar: {
      isOpen: true,
      width: 250,
    },
    modal: {
      isVisible: false,
      content: '',
    },
  },
  counter: 0,
};

// Create MutableStore instance
const appStore = createMutableStore<DeepAppState>('mutable-demo', initialState);

// ============================================================================
// Path-based Subscriber Components (Memoized)
// ============================================================================

interface PathSubscriberProps {
  label: string;
  path: StorePath;
  renderValue: (value: any) => string;
}

const PathSubscriber = memo(function PathSubscriber({
  label,
  path,
  renderValue,
}: PathSubscriberProps) {
  const renderCount = useRef(0);
  renderCount.current++;

  const value = useStorePath(appStore, path);

  return (
    <div className={css({ p: '2', bg: 'gray.50', _dark: { bg: 'gray.800' }, rounded: 'base', borderWidth: '1px', borderColor: 'gray.200' })}>
      <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
        <span className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'gray.700', _dark: { color: 'gray.300' } })}>{label}</span>
        <span className={css({
          fontSize: '10px',
          px: '1.5',
          py: '0.5',
          rounded: 'full',
          bg: renderCount.current > 1 ? 'amber.400' : 'green.500',
          color: renderCount.current > 1 ? 'black' : 'white'
        })}>
          {renderCount.current}
        </span>
      </div>
      <div className={css({ fontSize: 'lg', fontWeight: 'medium', color: 'gray.900', _dark: { color: 'white' }, mt: '1' })}>{renderValue(value)}</div>
      <div className={css({ fontSize: '9px', fontFamily: 'mono', color: 'gray.400', mt: '0.5' })}>{path.join('.')}</div>
    </div>
  );
});

// Full state subscriber - NOT RECOMMENDED for MutableStore
const FullStateSubscriber = memo(function FullStateSubscriber() {
  const renderCount = useRef(0);
  renderCount.current++;

  const snapshot = appStore.getSnapshot();

  return (
    <div className={css({ p: '2', bg: 'red.50', _dark: { bg: 'red.900/20' }, rounded: 'base', borderWidth: '1px', borderColor: 'red.200' })}>
      <div className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
        <span className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'red.700', _dark: { color: 'red.400' } })}>Full State</span>
        <span className={css({ fontSize: '10px', px: '1.5', py: '0.5', rounded: 'full', bg: 'red.500', color: 'white' })}>
          {renderCount.current}
        </span>
      </div>
      <div className={css({ fontSize: '10px', fontFamily: 'mono', color: 'red.600', _dark: { color: 'red.400' }, mt: '1' })}>
        useStoreValue 비호환 → useStorePath 사용
      </div>
      <div className={css({ fontSize: '9px', color: 'red.500', mt: '0.5' })}>
        {new Date(snapshot.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
});

// ============================================================================
// Control Panel Component
// ============================================================================

function ControlPanel() {
  const incrementCounter = useCallback(() => {
    appStore.update((draft) => {
      draft.counter++;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    appStore.update((draft) => {
      draft.user.preferences.theme = draft.user.preferences.theme === 'light' ? 'dark' : 'light';
    });
  }, []);

  const updateName = useCallback(() => {
    const names = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown'];
    appStore.update((draft) => {
      const currentIndex = names.indexOf(draft.user.profile.name);
      draft.user.profile.name = names[(currentIndex + 1) % names.length] ?? 'John Doe';
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    appStore.update((draft) => {
      draft.ui.sidebar.isOpen = !draft.ui.sidebar.isOpen;
    });
  }, []);

  const updateLoginStats = useCallback(() => {
    appStore.update((draft) => {
      draft.user.stats.loginCount++;
      draft.user.stats.lastLogin = new Date().toLocaleTimeString();
    });
  }, []);

  const cycleAvatar = useCallback(() => {
    const avatars = ['👤', '🧑‍💻', '👨‍🎨', '👩‍🔬', '🧙‍♂️', '🦸‍♀️'];
    appStore.update((draft) => {
      const currentIndex = avatars.indexOf(draft.user.profile.avatar);
      draft.user.profile.avatar = avatars[(currentIndex + 1) % avatars.length] ?? '👤';
    });
  }, []);

  const resetState = useCallback(() => {
    appStore.setValue(initialState);
  }, []);

  const btn = css({ px: '2', py: '1', fontSize: 'xs', fontWeight: 'medium', rounded: 'base', cursor: 'pointer', borderStyle: 'none', color: 'white' });

  return (
    <div className={css({ bg: 'gray.100', _dark: { bg: 'gray.800' }, rounded: 'lg', p: '3' })}>
      <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '2' })}>
        <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'gray.700', _dark: { color: 'gray.200' } })}>Control Panel</h3>
        <span className={css({ fontSize: '10px', color: 'gray.500' })}>각 버튼 클릭 시 해당 경로만 업데이트</span>
      </div>
      <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '1' })}>
        <button onClick={incrementCounter} className={`${btn} ${css({ bg: 'blue.600', _hover: { bg: 'blue.700' } })}`}>
          Counter++
        </button>
        <button onClick={toggleTheme} className={`${btn} ${css({ bg: 'violet.600', _hover: { bg: 'violet.700' } })}`}>
          Theme
        </button>
        <button onClick={updateName} className={`${btn} ${css({ bg: 'green.600', _hover: { bg: 'green.700' } })}`}>
          Name
        </button>
        <button onClick={toggleSidebar} className={`${btn} ${css({ bg: 'teal.600', _hover: { bg: 'teal.700' } })}`}>
          Sidebar
        </button>
        <button onClick={updateLoginStats} className={`${btn} ${css({ bg: 'orange.500', _hover: { bg: 'orange.600' } })}`}>
          Login Stats
        </button>
        <button onClick={cycleAvatar} className={`${btn} ${css({ bg: 'pink.600', _hover: { bg: 'pink.700' } })}`}>
          Avatar
        </button>
        <button onClick={resetState} className={`${btn} ${css({ bg: 'gray.500', _hover: { bg: 'gray.600' } })}`}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Complex Operations Panel - Demonstrates batching patterns
// ============================================================================

// Track update counts for demonstration
let updateCallCount = 0;
let notificationCount = 0;

// Subscribe to track notifications
appStore.subscribe(() => {
  notificationCount++;
});

function ComplexOperationsPanel() {
  // Pattern 1: Multiple related updates in single update() call
  const batchedProfileUpdate = useCallback(() => {
    updateCallCount = 0;
    notificationCount = 0;
    updateCallCount++;
    appStore.update((draft) => {
      // All these changes happen in ONE update, ONE notification
      draft.user.profile.name = 'Updated User';
      draft.user.profile.email = 'updated@example.com';
      draft.user.profile.avatar = '🚀';
      draft.user.stats.loginCount++;
      draft.user.stats.lastLogin = new Date().toLocaleTimeString();
    });
    // Log after RAF completes
    requestAnimationFrame(() => {
      console.log(`[Batched] update() calls: ${updateCallCount}, notifications: ${notificationCount}`);
    });
  }, []);

  // Pattern 2: Read-Compute-Write for dependent values
  const computedUpdate = useCallback(() => {
    updateCallCount = 0;
    notificationCount = 0;
    // Step 1: Read current state ONCE
    const current = appStore.getValue();

    // Step 2: Compute all new values based on current state
    const newLoginCount = current.user.stats.loginCount + 5;
    const newTheme = current.user.preferences.theme === 'light' ? 'dark' : 'light';
    const newWidth = current.ui.sidebar.width + 50;

    // Step 3: Apply all changes in single update
    updateCallCount++;
    appStore.update((draft) => {
      draft.user.stats.loginCount = newLoginCount;
      draft.user.preferences.theme = newTheme;
      draft.ui.sidebar.width = Math.min(newWidth, 500); // cap at 500
    });
    requestAnimationFrame(() => {
      console.log(`[Read-Compute-Write] update() calls: ${updateCallCount}, notifications: ${notificationCount}`);
    });
  }, []);

  // Anti-pattern: Multiple separate updates
  // With RAF batching (default): 3 update() calls -> 1 notification (batched)
  // Still inefficient: 3 separate patches, 3 structural sharing operations
  const separateUpdates = useCallback(() => {
    updateCallCount = 0;
    notificationCount = 0;
    updateCallCount++;
    appStore.update((draft) => { draft.counter++; });
    updateCallCount++;
    appStore.update((draft) => { draft.user.stats.loginCount++; });
    updateCallCount++;
    appStore.update((draft) => { draft.ui.sidebar.isOpen = !draft.ui.sidebar.isOpen; });
    requestAnimationFrame(() => {
      console.log(`[Anti-pattern] update() calls: ${updateCallCount}, notifications: ${notificationCount}`);
      console.log('  -> 3 separate patches generated, 3 structural sharing operations');
    });
  }, []);

  // Pattern 3: Conditional updates with validation
  const conditionalUpdate = useCallback(() => {
    appStore.update((draft) => {
      // Read and validate within the same update
      if (draft.counter < 10) {
        draft.counter += 1;
        draft.user.stats.lastLogin = `Counter under 10: ${new Date().toLocaleTimeString()}`;
      } else {
        // Different logic when counter >= 10
        draft.counter = 0;
        draft.user.stats.lastLogin = 'Counter reset!';
        draft.user.preferences.notifications = !draft.user.preferences.notifications;
      }
    });
  }, []);

  const btnBase = css({ px: '2', py: '1', fontSize: 'xs', fontWeight: 'medium', rounded: 'base', cursor: 'pointer', borderStyle: 'none' });

  return (
    <div className={css({ bg: 'slate.50', _dark: { bg: 'slate.800' }, rounded: 'lg', p: '3' })}>
      <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'slate.700', _dark: { color: 'slate.200' }, mb: '3' })}>
        Update Patterns Comparison
      </h3>

      {/* 2-column layout */}
      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', lg: 'repeat(2, 1fr)' }, gap: '4' })}>
        {/* Left: Recommended */}
        <div className={css({ bg: 'green.50', _dark: { bg: 'green.900/20' }, rounded: 'lg', p: '3' })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
            <span className={css({ color: 'green.600', _dark: { color: 'green.400' } })}>✓</span>
            <span className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'green.700', _dark: { color: 'green.300' } })}>권장 패턴</span>
          </div>
          <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '1', mb: '3' })}>
            <button onClick={batchedProfileUpdate} className={`${btnBase} ${css({ bg: 'green.600', color: 'white', _hover: { bg: 'green.700' } })}`}>
              Batched
            </button>
            <button onClick={computedUpdate} className={`${btnBase} ${css({ bg: 'teal.600', color: 'white', _hover: { bg: 'teal.700' } })}`}>
              Read-Compute-Write
            </button>
            <button onClick={conditionalUpdate} className={`${btnBase} ${css({ bg: 'violet.600', color: 'white', _hover: { bg: 'violet.700' } })}`}>
              Conditional
            </button>
          </div>
          <CodeBlock size="xs">
{`// 1번의 update()로 모든 변경 처리
store.update((draft) => {
  draft.counter++;
  draft.user.stats.loginCount++;
  draft.ui.sidebar.isOpen = !draft.ui.sidebar.isOpen;
});`}
          </CodeBlock>
        </div>

        {/* Right: Anti-pattern */}
        <div className={css({ bg: 'amber.50', _dark: { bg: 'amber.900/20' }, rounded: 'lg', p: '3' })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
            <span className={css({ color: 'amber.600', _dark: { color: 'amber.400' } })}>⚠</span>
            <span className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'amber.700', _dark: { color: 'amber.300' } })}>안티패턴</span>
          </div>
          <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '1', mb: '3' })}>
            <button onClick={separateUpdates} className={`${btnBase} ${css({ bg: 'amber.500', color: 'black', _hover: { bg: 'amber.600' } })}`}>
              Separate Updates
            </button>
            <span className={css({ fontSize: '10px', color: 'amber.600', _dark: { color: 'amber.400' }, alignSelf: 'center', ml: '1' })}>
              (console 확인)
            </span>
          </div>
          <CodeBlock size="xs">
{`// 3번의 update() - 비효율적
store.update((d) => { d.counter++; });
store.update((d) => { d.user.stats.loginCount++; });
store.update((d) => { d.ui.sidebar.isOpen = !d.ui.sidebar.isOpen; });
// → 3개 패치, 3번 structural sharing 연산`}
          </CodeBlock>
          <ul className={css({ mt: '2', fontSize: '10px', color: 'amber.700', _dark: { color: 'amber.300' }, spaceY: '0.5', pl: '3' })}>
            <li>• RAF 배칭으로 알림은 1번이지만 3번 연산</li>
            <li>• immediate 모드에서는 3번 알림</li>
            <li>• getLastPatches()는 3개 패치 모두 반환 (누적)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Patches Display Component
// ============================================================================

function PatchesDisplay() {
  const patches = appStore.getLastPatches();

  return (
    <div className={css({ bg: 'gray.100', _dark: { bg: 'gray.800' }, rounded: 'lg', p: '3', mt: '3' })}>
      <h4 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'gray.600', _dark: { color: 'gray.300' }, mb: '2' })}>Last Patches</h4>
      {patches && patches.length > 0 ? (
        <CodeBlock size="xs">{JSON.stringify(patches, null, 2)}</CodeBlock>
      ) : (
        <p className={css({ fontSize: 'xs', color: 'gray.500' })}>No patches yet</p>
      )}
    </div>
  );
}

// ============================================================================
// Main Demo Page
// ============================================================================

function MutableStoreDemoPage() {
  return (
    <div className={css({ p: '4', maxW: '6xl', mx: 'auto' })}>
      {/* Header */}
      <div className={css({ mb: '4' })}>
        <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'gray.900', _dark: { color: 'white' } })}>MutableStore Demo</h1>
        <p className={css({ fontSize: 'sm', color: 'gray.600', _dark: { color: 'gray.400' } })}>
          Structural sharing via{' '}
          <a href="https://github.com/unadlib/mutative" target="_blank" rel="noopener noreferrer" className={css({ color: 'blue.600', _hover: { textDecoration: 'underline' } })}>
            mutative
          </a>
          {' '}— unchanged parts keep same reference
        </p>
      </div>

      {/* Controls Row */}
      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', lg: 'repeat(2, 1fr)' }, gap: '4', mb: '4' })}>
        <ControlPanel />
        <ComplexOperationsPanel />
      </div>

      {/* Subscribers Grid */}
      <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', lg: 'repeat(3, 1fr)' }, gap: '4', mb: '4' })}>
        {/* Path-based Subscribers */}
        <div className={css({ gridColumn: { lg: 'span 2' } })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
            <span className={css({ color: 'green.600' })}>✓</span>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'green.700', _dark: { color: 'green.400' } })}>
              Path-based Subscribers
            </h3>
            <span className={css({ fontSize: '10px', color: 'gray.500' })}>(green = 1 render)</span>
          </div>
          <div className={css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: '2' })}>
            <PathSubscriber label="Counter" path={['counter']} renderValue={(v: number) => `${v}`} />
            <PathSubscriber label="Name" path={['user', 'profile', 'name']} renderValue={(v: string) => v} />
            <PathSubscriber label="Avatar" path={['user', 'profile', 'avatar']} renderValue={(v: string) => v} />
            <PathSubscriber label="Theme" path={['user', 'preferences', 'theme']} renderValue={(v: string) => v} />
            <PathSubscriber label="Sidebar" path={['ui', 'sidebar', 'isOpen']} renderValue={(v: boolean) => (v ? 'Open' : 'Closed')} />
            <PathSubscriber label="Logins" path={['user', 'stats', 'loginCount']} renderValue={(v: number) => `${v}`} />
          </div>
        </div>

        {/* Full State + Patches */}
        <div>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
            <span className={css({ color: 'red.600' })}>✗</span>
            <h3 className={css({ fontSize: 'sm', fontWeight: 'semibold', color: 'red.700', _dark: { color: 'red.400' } })}>
              Full State (비호환)
            </h3>
          </div>
          <FullStateSubscriber />
          <PatchesDisplay />
        </div>
      </div>

      {/* Key Features - Compact */}
      <div className={css({ bg: 'blue.50', _dark: { bg: 'blue.900/20' }, rounded: 'lg', p: '3' })}>
        <h3 className={css({ fontSize: 'xs', fontWeight: 'semibold', color: 'blue.800', _dark: { color: 'blue.300' }, mb: '2' })}>Key Features</h3>
        <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3', fontSize: '11px' })}>
          <div>
            <span className={css({ fontWeight: 'medium', color: 'blue.700', _dark: { color: 'blue.400' } })}>Structural Sharing</span>
            <p className={css({ color: 'blue.600', _dark: { color: 'blue.300' } })}>unchanged parts keep same reference</p>
          </div>
          <div>
            <span className={css({ fontWeight: 'medium', color: 'blue.700', _dark: { color: 'blue.400' } })}>RAF Batching</span>
            <p className={css({ color: 'blue.600', _dark: { color: 'blue.300' } })}>multiple updates → single notification</p>
          </div>
          <div>
            <span className={css({ fontWeight: 'medium', color: 'blue.700', _dark: { color: 'blue.400' } })}>Concurrency Safe</span>
            <p className={css({ color: 'blue.600', _dark: { color: 'blue.300' } })}>update queue prevents race conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MutableStoreDemoPage;
