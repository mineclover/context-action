import {
  createDeclarativeStorePattern,
  createStore,
  useStoreValue,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeBlock,
  CodeExample,
  DemoCard,
  Input,
  Section,
  Label,
} from '../../components/ui';

// Demo stores for useStoreValue patterns
const userStore = createStore('user', { 
  id: '1', 
  name: 'John Doe', 
  email: 'john@example.com',
  profile: {
    avatar: '/avatar.jpg',
    bio: 'Software Engineer',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  },
  lastLoginAt: Date.now()
});

const settingsStore = createStore('settings', {
  theme: 'light',
  language: 'en',
  notifications: { email: true, push: false }
});

const searchStore = createStore('search', {
  query: '',
  results: [] as Array<{ id: string; title: string }>,
  isLoading: false,
  error: null as string | null
});

// Create store pattern for page-level state
const {
  Provider: PageStoreProvider,
  useStore: usePageStore,
} = createDeclarativeStorePattern('UseStoreValuePatterns', {
  subscriptionEnabled: { initialValue: true },
  debugMode: { initialValue: false }
});

// Selective Subscription Demo
function SelectiveSubscriptionDemo() {
  const logger = useActionLoggerWithToast();
  
  // Only re-renders when name changes, ignores email/id/lastLoginAt changes
  const userName = useStoreValue(userStore, user => {
    logger.info('🔍 userName selector called', { name: user.name });
    return user.name;
  });
  
  // Multiple field selection
  const userBasicInfo = useStoreValue(userStore, user => {
    logger.info('🔍 userBasicInfo selector called', { 
      name: user.name, 
      email: user.email 
    });
    return {
      name: user.name,
      email: user.email
    };
  });
  
  // Deep property access
  const userTheme = useStoreValue(userStore, user => {
    logger.info('🔍 userTheme selector called', { theme: user.profile.preferences.theme });
    return user.profile.preferences.theme;
  });

  const updateName = () => {
    userStore.setValue(prev => ({
      ...prev,
      name: `${prev.name} Updated`
    }));
  };

  const updateEmail = () => {
    userStore.setValue(prev => ({
      ...prev,
      email: `updated-${Date.now()}@example.com`
    }));
  };

  const updateLastLogin = () => {
    userStore.setValue(prev => ({
      ...prev,
      lastLoginAt: Date.now()
    }));
  };

  return (
    <DemoCard title="Selective Subscription">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Selected Name: {userName}</Label>
          </div>
          <div>
            <Label>Basic Info: {userBasicInfo.name} ({userBasicInfo.email})</Label>
          </div>
          <div>
            <Label>Theme: {userTheme}</Label>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={updateName} variant="primary" size="sm">
            Update Name (triggers userName & userBasicInfo)
          </Button>
          <Button onClick={updateEmail} variant="secondary" size="sm">
            Update Email (triggers userBasicInfo only)
          </Button>
          <Button onClick={updateLastLogin} variant="outline" size="sm">
            Update LastLogin (triggers nothing)
          </Button>
        </div>

        <CodeExample>
{`// Only re-renders when name changes
const userName = useStoreValue(userStore, user => user.name);

// Multiple field selection
const userBasicInfo = useStoreValue(userStore, user => ({
  name: user.name,
  email: user.email
}));

// Deep property access  
const userTheme = useStoreValue(userStore, user => 
  user.profile.preferences.theme
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Conditional Subscription Demo
function ConditionalSubscriptionDemo() {
  const logger = useActionLoggerWithToast();
  const subscriptionStore = usePageStore('subscriptionEnabled');
  const subscriptionEnabled = useStoreValue(subscriptionStore);
  
  // Only subscribe when enabled
  const conditionalData = useStoreValue(
    subscriptionEnabled ? userStore : null,
    user => {
      if (user) {
        logger.info('🔍 Conditional subscription active', { name: user.name });
        return user.name;
      }
      return null;
    }
  );

  const toggleSubscription = () => {
    subscriptionStore.setValue(!subscriptionEnabled);
  };

  return (
    <DemoCard title="Conditional Subscription">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={toggleSubscription}
            variant={subscriptionEnabled ? "primary" : "outline"}
          >
            {subscriptionEnabled ? 'Disable' : 'Enable'} Subscription
          </Button>
          <Label>
            Status: {subscriptionEnabled ? 'Subscribed' : 'Not subscribed'}
          </Label>
        </div>

        <div>
          <Label>Conditional Data: {conditionalData || 'No data (not subscribed)'}</Label>
        </div>

        <CodeExample>
{`const [subscriptionEnabled, setSubscriptionEnabled] = useState(true);

// Only subscribe when enabled
const conditionalData = useStoreValue(
  subscriptionEnabled ? userStore : null,
  user => user?.name
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Comparison Strategies Demo
function ComparisonStrategiesDemo() {
  const logger = useActionLoggerWithToast();
  
  // Reference comparison (default)
  const settingsRef = useStoreValue(settingsStore, undefined, {
    comparison: 'reference'
  });
  
  // Shallow comparison
  const settingsShallow = useStoreValue(settingsStore, undefined, { 
    comparison: 'shallow' 
  });
  
  // Custom comparison
  const settingsCustom = useStoreValue(settingsStore, settings => settings.theme, {
    customComparator: (prev, next) => {
      const result = prev === next;
      logger.info('🔍 Custom comparator called', { prev, next, result });
      return result;
    }
  });

  const updateTheme = () => {
    settingsStore.update(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const updateNotificationEmail = () => {
    settingsStore.update(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: !prev.notifications.email
      }
    }));
  };

  const replaceSettings = () => {
    settingsStore.setValue({
      theme: 'light',
      language: 'ko',
      notifications: { email: false, push: true }
    });
  };

  return (
    <DemoCard title="Comparison Strategies">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Reference Comparison Theme: {settingsRef.theme}</Label>
          </div>
          <div>
            <Label>Shallow Comparison Theme: {settingsShallow.theme}</Label>
          </div>
          <div>
            <Label>Custom Comparison Theme: {settingsCustom}</Label>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={updateTheme} variant="primary" size="sm">
            Toggle Theme (all update)
          </Button>
          <Button onClick={updateNotificationEmail} variant="secondary" size="sm">
            Toggle Email (shallow updates)
          </Button>
          <Button onClick={replaceSettings} variant="outline" size="sm">
            Replace Settings (reference updates)
          </Button>
        </div>

        <CodeExample>
{`// Reference comparison (default)
const settingsRef = useStoreValue(settingsStore, undefined, {
  comparison: 'reference'
});

// Shallow comparison
const settingsShallow = useStoreValue(settingsStore, undefined, { 
  comparison: 'shallow' 
});

// Custom comparison
const settingsCustom = useStoreValue(settingsStore, s => s.theme, {
  customComparator: (prev, next) => prev === next
});`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Memoized Selectors Demo
function MemoizedSelectorsDemo() {
  const logger = useActionLoggerWithToast();
  
  // Non-memoized selector (creates new function on each render)
  const nonMemoized = useStoreValue(userStore, user => {
    logger.info('🔍 Non-memoized selector called');
    return `${user.name} (${user.email})`;
  });
  
  // Memoized selector (stable reference)
  const memoizedSelector = useCallback((user: typeof userStore.getValue()) => {
    logger.info('🔍 Memoized selector called');
    return `${user.name} (${user.email})`;
  }, []);
  
  const memoized = useStoreValue(userStore, memoizedSelector);

  const forceRerender = () => {
    // This will cause the component to re-render but only memoized selector should be stable
    settingsStore.update(prev => ({ ...prev })); // Trigger a re-render
  };

  return (
    <DemoCard title="Memoized Selectors">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Non-memoized: {nonMemoized}</Label>
          </div>
          <div>
            <Label>Memoized: {memoized}</Label>
          </div>
        </div>
        
        <Button onClick={forceRerender} variant="outline" size="sm">
          Force Re-render (check console)
        </Button>

        <CodeExample>
{`// ❌ Non-memoized - new function on each render
const data = useStoreValue(userStore, user => 
  \`\${user.name} (\${user.email})\`
);

// ✅ Memoized - stable reference
const memoizedSelector = useCallback(user => 
  \`\${user.name} (\${user.email})\`, []
);
const data = useStoreValue(userStore, memoizedSelector);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function UseStoreValuePatternsPage() {
  return (
    <PageWithLogMonitor>
      <PageStoreProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              useStoreValue Patterns
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Core useStoreValue patterns for subscribing to store changes with selective updates, 
              conditional subscriptions, and comparison strategies.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Selective Subscription">
              <SelectiveSubscriptionDemo />
            </Section>

            <Section title="Conditional Subscriptions">
              <ConditionalSubscriptionDemo />
            </Section>

            <Section title="Comparison Strategies">
              <ComparisonStrategiesDemo />
            </Section>

            <Section title="Performance Optimization">
              <MemoizedSelectorsDemo />
            </Section>

            <Section title="Key Takeaways">
              <DemoCard title="Best Practices">
                <div className="space-y-4">
                  <div className="prose">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Use specific selectors:</strong> Select only what you need to minimize re-renders</li>
                      <li><strong>Memoize complex selectors:</strong> Use useCallback for stable selector references</li>
                      <li><strong>Choose appropriate comparison:</strong> Reference (fast) → Shallow (balanced) → Deep (thorough)</li>
                      <li><strong>Conditional subscriptions:</strong> Only subscribe when data is needed</li>
                      <li><strong>Handle edge cases:</strong> Use safe property access and fallback values</li>
                    </ul>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </PageStoreProvider>
    </PageWithLogMonitor>
  );
}

export default UseStoreValuePatternsPage;