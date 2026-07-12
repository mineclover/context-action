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
  useStorePath,
  type StorePath,
} from '@context-action/react';
import { CodeBlock } from '@/components/ui';
import {
  storeSubscriberVariants,
  subscriberHeaderVariants,
  subscriberLabelVariants,
  renderCountBadgeVariants,
  subscriberValueVariants,
  subscriberPathVariants,
  mutableStoreButtonVariants,
  controlPanelVariants,
  controlPanelHeaderVariants,
  controlPanelTitleVariants,
  controlPanelHintVariants,
  controlPanelButtonGroupVariants,
  patternCardVariants,
  patternCardHeaderVariants,
  patternIconVariants,
  patternTitleVariants,
  patternButtonGroupVariants,
  pageContainerVariants,
  mutableStorePageHeaderVariants,
  mutableStorePageTitleVariants,
  pageDescriptionVariants,
  pageGridVariants,
  performanceSectionVariants,
  performanceHeaderVariants,
  performanceIconVariants,
  performanceTitleVariants,
  performanceHintVariants,
  performanceGridVariants,
  keyFeaturesCardVariants,
  keyFeaturesTitleVariants,
  keyFeaturesItemTitleVariants,
  keyFeaturesItemTextVariants,
} from '@/components/ui/variants';


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
    <div className={storeSubscriberVariants()}>
      <div className={subscriberHeaderVariants()}>
        <span className={subscriberLabelVariants()}>{label}</span>
        <span className={renderCountBadgeVariants({ isRendered: renderCount.current > 1 })}>
          {renderCount.current}
        </span>
      </div>
      <div className={subscriberValueVariants()}>{renderValue(value)}</div>
      <div className={subscriberPathVariants()}>{path.join('.')}</div>
    </div>
  );
});

// Full state subscriber - NOT RECOMMENDED for MutableStore
const FullStateSubscriber = memo(function FullStateSubscriber() {
  const renderCount = useRef(0);
  renderCount.current++;

  const snapshot = appStore.getSnapshot();

  return (
    <div className={storeSubscriberVariants({ type: 'fullState' })}>
      <div className={subscriberHeaderVariants()}>
        <span className={subscriberLabelVariants({ type: 'fullState' })}>Full State</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">
          {renderCount.current}
        </span>
      </div>
      <div className="text-[10px] font-mono text-red-600 dark:text-red-400 mt-1">
        useStoreValue 비호환 → useStorePath 사용
      </div>
      <div className="text-[9px] text-red-500 mt-0.5">
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

  return (
    <div className={controlPanelVariants()}>
      <div className={controlPanelHeaderVariants()}>
        <h3 className={controlPanelTitleVariants()}>Control Panel</h3>
        <span className={controlPanelHintVariants()}>각 버튼 클릭 시 해당 경로만 업데이트</span>
      </div>
      <div className={controlPanelButtonGroupVariants()}>
        <button onClick={incrementCounter} className={mutableStoreButtonVariants({ color: 'blue' })}>
          Counter++
        </button>
        <button onClick={toggleTheme} className={mutableStoreButtonVariants({ color: 'violet' })}>
          Theme
        </button>
        <button onClick={updateName} className={mutableStoreButtonVariants({ color: 'green' })}>
          Name
        </button>
        <button onClick={toggleSidebar} className={mutableStoreButtonVariants({ color: 'teal' })}>
          Sidebar
        </button>
        <button onClick={updateLoginStats} className={mutableStoreButtonVariants({ color: 'orange' })}>
          Login Stats
        </button>
        <button onClick={cycleAvatar} className={mutableStoreButtonVariants({ color: 'pink' })}>
          Avatar
        </button>
        <button onClick={resetState} className={mutableStoreButtonVariants({ color: 'gray' })}>
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

  return (
    <div className={controlPanelVariants({ theme: 'dark' })}>
      <h3 className={controlPanelTitleVariants({ theme: 'dark' })}>
        Update Patterns Comparison
      </h3>

      {/* 2-column layout */}
      <div className={pageGridVariants({ cols: 2 })}>
        {/* Left: Recommended */}
        <div className={patternCardVariants({ type: 'good' })}>
          <div className={patternCardHeaderVariants()}>
            <span className={patternIconVariants({ type: 'good' })}>✓</span>
            <span className={patternTitleVariants({ type: 'good' })}>권장 패턴</span>
          </div>
          <div className={patternButtonGroupVariants()}>
            <button onClick={batchedProfileUpdate} className={mutableStoreButtonVariants({ color: 'green' })}>
              Batched
            </button>
            <button onClick={computedUpdate} className={mutableStoreButtonVariants({ color: 'teal' })}>
              Read-Compute-Write
            </button>
            <button onClick={conditionalUpdate} className={mutableStoreButtonVariants({ color: 'violet' })}>
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
        <div className={patternCardVariants({ type: 'bad' })}>
          <div className={patternCardHeaderVariants()}>
            <span className={patternIconVariants({ type: 'bad' })}>⚠</span>
            <span className={patternTitleVariants({ type: 'bad' })}>안티패턴</span>
          </div>
          <div className={patternButtonGroupVariants()}>
            <button onClick={separateUpdates} className="px-2 py-1 text-xs font-medium rounded cursor-pointer border-none bg-amber-500 text-black hover:bg-amber-600">
              Separate Updates
            </button>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 align-self-center ml-1">
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
          <ul className="mt-2 text-[10px] text-amber-700 dark:text-amber-300 space-y-0.5 pl-3">
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
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-3">
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Last Patches</h4>
      {patches && patches.length > 0 ? (
        <CodeBlock size="xs">{JSON.stringify(patches, null, 2)}</CodeBlock>
      ) : (
        <p className="text-xs text-gray-500">No patches yet</p>
      )}
    </div>
  );
}

// ============================================================================
// Main Demo Page
// ============================================================================

function MutableStoreDemoPage() {
  return (
    <div className={pageContainerVariants()}>
      {/* Header */}
      <div className={mutableStorePageHeaderVariants()}>
        <h1 className={mutableStorePageTitleVariants()}>MutableStore Demo</h1>
        <p className={pageDescriptionVariants()}>
          Structural sharing via{' '}
          <a href="https://github.com/unadlib/mutative" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            mutative
          </a>
          {' '}— unchanged parts keep same reference
        </p>
      </div>

      {/* Controls Row */}
      <div className={pageGridVariants({ cols: 2 })}>
        <ControlPanel />
        <ComplexOperationsPanel />
      </div>

      {/* Subscribers Grid */}
      <div className={pageGridVariants({ cols: 3 })}>
        {/* Path-based Subscribers */}
        <div className={performanceSectionVariants({ span: true })}>
          <div className={performanceHeaderVariants()}>
            <span className={performanceIconVariants({ type: 'good' })}>✓</span>
            <h3 className={performanceTitleVariants({ type: 'good' })}>
              Path-based Subscribers
            </h3>
            <span className={performanceHintVariants()}>(green = 1 render)</span>
          </div>
          <div className={performanceGridVariants({ cols: 'auto' })}>
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
          <div className={performanceHeaderVariants()}>
            <span className={performanceIconVariants({ type: 'bad' })}>✗</span>
            <h3 className={performanceTitleVariants({ type: 'bad' })}>
              Full State (비호환)
            </h3>
          </div>
          <FullStateSubscriber />
          <PatchesDisplay />
        </div>
      </div>

      {/* Key Features - Compact */}
      <div className={keyFeaturesCardVariants()}>
        <h3 className={keyFeaturesTitleVariants()}>Key Features</h3>
        <div className={keyFeaturesGridVariants()}>
          <div>
            <span className={keyFeaturesItemTitleVariants()}>Structural Sharing</span>
            <p className={keyFeaturesItemTextVariants()}>unchanged parts keep same reference</p>
          </div>
          <div>
            <span className={keyFeaturesItemTitleVariants()}>RAF Batching</span>
            <p className={keyFeaturesItemTextVariants()}>multiple updates → single notification</p>
          </div>
          <div>
            <span className={keyFeaturesItemTitleVariants()}>Concurrency Safe</span>
            <p className={keyFeaturesItemTextVariants()}>update queue prevents race conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MutableStoreDemoPage;
