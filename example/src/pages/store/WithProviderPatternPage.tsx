import {
  createDeclarativeStorePattern,
  useStoreValue,
} from '@context-action/react';
import { useEffect, lazy, Suspense, useCallback } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
} from '../../components/ui';
import { Section } from '../../domains/shared/components';

// Demo store patterns for HOC examples
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider,
} = createDeclarativeStorePattern('UserHOC', {
  profile: { initialValue: { id: 'user123', name: 'John Doe', email: 'john@example.com' } },
  preferences: { initialValue: { theme: 'light', notifications: true } }
});

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider,
} = createDeclarativeStorePattern('AppHOC', {
  navigation: { initialValue: { currentPage: 'home', breadcrumbs: ['Home'] } },
  modal: { initialValue: { isOpen: false, content: null } }
});

// App Content Component (moved outside to avoid nested definition)
function AppContent() {
  const logger = useActionLoggerWithToast();
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  // Log in useEffect to avoid side effects during render
  useEffect(() => {
    logger.logSystem('🎯 AppContent rendered with HOC-provided stores');
  }, [logger, profile.name, preferences.theme]);
  
  const updateProfile = () => {
    profileStore.update(prev => ({
      ...prev,
      name: prev.name === 'John Doe' ? 'Jane Smith' : 'John Doe'
    }));
  };
  
  const toggleTheme = () => {
    preferencesStore.update(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="font-semibold">User Profile</div>
          <div className="text-sm space-y-1">
            <div>Name: {profile.name}</div>
            <div>Email: {profile.email}</div>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="font-semibold">Preferences</div>
          <div className="text-sm space-y-1">
            <div>Theme: {preferences.theme}</div>
            <div>Notifications: {preferences.notifications ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={updateProfile} variant="primary" size="sm">
          Toggle Name
        </Button>
        <Button onClick={toggleTheme} variant="secondary" size="sm">
          Toggle Theme
        </Button>
      </div>
    </div>
  );
}

// Basic HOC Usage Demo
function BasicHOCDemo() {
  // Wrap with HOC - no manual Provider needed!
  const AppWithStores = withUserStoreProvider(AppContent);
  
  return (
    <DemoCard title="Basic HOC Usage">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          The component below is automatically wrapped with Provider using HOC pattern.
          No manual Provider composition required!
        </p>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <AppWithStores />
        </div>

        <CodeExample>
{`// Get withProvider from the store pattern
const { withProvider: withUserStoreProvider } = createDeclarativeStorePattern('User', {
  profile: { initialValue: { id: '', name: '', email: '' } },
  preferences: { initialValue: { theme: 'light', notifications: true } }
});

// Automatic Provider wrapping with HOC
const AppWithStores = withUserStoreProvider(AppContent);

// Use anywhere without manual Provider wrapping
function Root() {
  return <AppWithStores />;
}`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Multi Store Component (moved outside to avoid nested definition)
function MultiStoreComponent() {
  const logger = useActionLoggerWithToast();
  const profileStore = useUserStore('profile');
  const navigationStore = useAppStore('navigation');
  const profile = useStoreValue(profileStore);
  const navigation = useStoreValue(navigationStore);
  
  // Log in useEffect to avoid side effects during render
  useEffect(() => {
    logger.logSystem('🔧 MultiStoreComponent rendered');
  }, [logger, profile.name, navigation.currentPage]);
  
  const navigateToPage = () => {
    const pages = ['home', 'profile', 'settings'];
    const currentIndex = pages.indexOf(navigation.currentPage);
    const nextPage = pages[(currentIndex + 1) % pages.length];
    
    navigationStore.update(prev => ({
      ...prev,
      currentPage: nextPage,
      breadcrumbs: [...prev.breadcrumbs, nextPage]
    }));
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="font-semibold">User Context</div>
          <div className="text-sm">
            <div>User: {profile.name}</div>
          </div>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="font-semibold">App Context</div>
          <div className="text-sm">
            <div>Page: {navigation.currentPage}</div>
            <div>Breadcrumbs: {navigation.breadcrumbs.join(' > ')}</div>
          </div>
        </div>
      </div>
      
      <Button onClick={navigateToPage} variant="primary" size="sm">
        Navigate to Next Page
      </Button>
    </div>
  );
}

// Multiple HOC Composition Demo
function MultipleHOCCompositionDemo() {
  
  // Compose multiple HOCs
  const AppWithAllStores = withUserStoreProvider(
    withAppStoreProvider(MultiStoreComponent)
  );
  
  // Composition helper function
  function composeProviders(...withProviders: any[]) {
    return (Component: React.ComponentType) => {
      return withProviders.reduce((WrappedComponent, withProvider) => {
        return withProvider(WrappedComponent);
      }, Component);
    };
  }
  
  const AppWithComposedStores = composeProviders(
    withUserStoreProvider,
    withAppStoreProvider
  )(MultiStoreComponent);
  
  return (
    <DemoCard title="Multiple HOC Composition">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Multiple store contexts composed using HOC pattern for clean component trees.
        </p>
        
        <div className="space-y-4">
          <div>
            <div className="font-semibold">Manual Composition</div>
            <div className="border rounded-lg p-4 bg-gray-50 mt-2">
              <AppWithAllStores />
            </div>
          </div>
          
          <div>
            <div className="font-semibold">Helper Function Composition</div>
            <div className="border rounded-lg p-4 bg-gray-50 mt-2">
              <AppWithComposedStores />
            </div>
          </div>
        </div>

        <CodeExample>
{`// Compose multiple HOCs manually
const AppWithAllStores = withUserStoreProvider(
  withAppStoreProvider(MultiStoreComponent)
);

// Or use a composition helper
function composeProviders(...withProviders: any[]) {
  return (Component: React.ComponentType) => {
    return withProviders.reduce((WrappedComponent, withProvider) => {
      return withProvider(WrappedComponent);
    }, Component);
  };
}

const AppWithComposedStores = composeProviders(
  withUserStoreProvider,
  withAppStoreProvider
)(MultiStoreComponent);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Conditional Component (moved outside to avoid nested definition)
function ConditionalComponent() {
  // This will work if stores are enabled, fail gracefully if not
  try {
    const profileStore = useUserStore('profile');
    const profile = useStoreValue(profileStore);
    return (
      <div className="p-3 bg-green-50 rounded-lg">
        <div>✅ Stores enabled: {profile.name}</div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-3 bg-yellow-50 rounded-lg">
        <div>⚠️ Stores disabled: Running without store context</div>
      </div>
    );
  }
}

// Conditional and Lazy HOC Demo
function ConditionalLazyHOCDemo() {
  const logger = useActionLoggerWithToast();
  
  // Conditional HOC based on feature flag
  function createConditionalHOC(condition: boolean) {
    return condition 
      ? withUserStoreProvider
      : (Component: React.ComponentType) => {
          logger.logSystem('🚫 Conditional HOC: stores disabled, using pass-through');
          return Component;
        };
  }
  
  // ConditionalComponent now defined outside the function
  
  // Create conditional HOCs
  const featureEnabled = true;
  const featureDisabled = false;
  
  const ConditionalAppEnabled = createConditionalHOC(featureEnabled)(ConditionalComponent);
  const ConditionalAppDisabled = createConditionalHOC(featureDisabled)(ConditionalComponent);
  
  // Lazy HOC example (simulated)
  const LazyStoreComponent = lazy(async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const LazyContent = () => {
      const profileStore = useUserStore('profile');
      const profile = useStoreValue(profileStore);
      
      return (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div>🚀 Lazy loaded with stores: {profile.name}</div>
        </div>
      );
    };
    
    return { default: withUserStoreProvider(LazyContent) };
  });
  
  return (
    <DemoCard title="Conditional & Lazy HOC Patterns">
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="font-semibold">Conditional HOC (Enabled)</div>
            <div className="mt-2">
              <ConditionalAppEnabled />
            </div>
          </div>
          
          <div>
            <div className="font-semibold">Conditional HOC (Disabled)</div>
            <div className="mt-2">
              <ConditionalAppDisabled />
            </div>
          </div>
          
          <div>
            <div className="font-semibold">Lazy HOC</div>
            <div className="mt-2">
              <Suspense fallback={<div className="p-3 bg-gray-100 rounded-lg">Loading stores...</div>}>
                <LazyStoreComponent />
              </Suspense>
            </div>
          </div>
        </div>

        <CodeExample>
{`// Conditional Provider wrapping based on feature flags
function createConditionalHOC(condition: boolean) {
  return condition 
    ? withAppStoreProvider
    : (Component: React.ComponentType) => Component; // Pass-through
}

// Lazy load store providers for code splitting
const LazyStoreProvider = lazy(() => 
  import('./stores/AppStores').then(module => ({
    default: module.withAppStoreProvider(App)
  }))
);

function LazyApp() {
  return (
    <Suspense fallback={<div>Loading stores...</div>}>
      <LazyStoreProvider />
    </Suspense>
  );
}`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Props-Based HOC Demo
function PropsBasedHOCDemo() {
  const logger = useActionLoggerWithToast();
  
  // HOC that initializes stores based on props
  interface AppProps {
    userId: string;
    theme: 'light' | 'dark';
  }
  
  function createPropsInitializedHOC<T extends Record<string, any>>(
    withProvider: (component: React.ComponentType<T>) => React.ComponentType<T>
  ) {
    return (Component: React.ComponentType<T>) => {
      return withProvider((props: T) => {
        const userManager = useUserStoreManager();
        
        useEffect(() => {
          logger.logSystem('🔧 Initializing stores from props', props);
          
          // Initialize stores based on props
          if ('userId' in props) {
            const profileStore = userManager.getStore('profile');
            profileStore.update(prev => ({ ...prev, id: props.userId as string }));
          }
          if ('theme' in props) {
            const preferencesStore = userManager.getStore('preferences');
            preferencesStore.update(prev => ({ ...prev, theme: props.theme as string }));
          }
        }, [props, userManager]);
        
        return <Component {...props} />;
      });
    };
  }
  
  function PropsInitializedComponent(props: AppProps) {
    const profileStore = useUserStore('profile');
    const preferencesStore = useUserStore('preferences');
    const profile = useStoreValue(profileStore);
    const preferences = useStoreValue(preferencesStore);
    
    return (
      <div className="space-y-2">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <div className="text-sm space-y-1">
            <div><strong>Props:</strong> userId={props.userId}, theme={props.theme}</div>
            <div><strong>Store:</strong> id={profile.id}, theme={preferences.theme}</div>
            <div><strong>Name:</strong> {profile.name}</div>
          </div>
        </div>
      </div>
    );
  }
  
  const AppWithPropsInit = createPropsInitializedHOC(withUserStoreProvider)(PropsInitializedComponent);
  
  return (
    <DemoCard title="Props-Based HOC Initialization">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          HOC that initializes stores based on component props for dynamic store setup.
        </p>
        
        <div className="space-y-3">
          <div>
            <div className="font-semibold">Light Theme User</div>
            <div className="mt-2">
              <AppWithPropsInit userId="user-light-123" theme="light" />
            </div>
          </div>
          
          <div>
            <div className="font-semibold">Dark Theme User</div>
            <div className="mt-2">
              <AppWithPropsInit userId="user-dark-456" theme="dark" />
            </div>
          </div>
        </div>

        <CodeExample>
{`// HOC that initializes stores based on props
function createPropsInitializedHOC<T extends Record<string, any>>(
  withProvider: (component: React.ComponentType<T>) => React.ComponentType<T>
) {
  return (Component: React.ComponentType<T>) => {
    return withProvider((props: T) => {
      const { updateStore } = useAppStoreManager();
      
      useEffect(() => {
        // Initialize stores based on props
        if ('userId' in props) {
          updateStore('user', { id: props.userId });
        }
        if ('theme' in props) {
          updateStore('settings', prev => ({ ...prev, theme: props.theme }));
        }
      }, [props, updateStore]);
      
      return <Component {...props} />;
    });
  };
}`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function WithProviderPatternPage() {
  return (
    <PageWithLogMonitor pageId="withProviderPattern">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            withProvider Pattern
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Higher-Order Component (HOC) pattern for automatic Provider wrapping, eliminating 
            manual Provider composition and creating cleaner component trees.
          </p>
        </div>

        <div className="space-y-8">
          <Section title="Basic HOC Usage">
            <BasicHOCDemo />
          </Section>

          <Section title="Multiple HOC Composition">
            <MultipleHOCCompositionDemo />
          </Section>

          <Section title="Advanced HOC Patterns">
            <ConditionalLazyHOCDemo />
          </Section>
          
          <Section title="Props-Based Initialization">
            <PropsBasedHOCDemo />
          </Section>

          <Section title="Best Practices">
            <DemoCard title="HOC Pattern Guidelines">
              <div className="space-y-4">
                <div className="prose">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Single Responsibility:</strong> Each HOC should handle one concern (Provider wrapping, initialization, etc.)</li>
                    <li><strong>Props Preservation:</strong> Ensure props are properly passed through to wrapped components</li>
                    <li><strong>Type Safety:</strong> Maintain TypeScript type safety through HOC composition</li>
                    <li><strong>Performance:</strong> Use HOCs to avoid Provider hell and improve rendering performance</li>
                    <li><strong>Composition:</strong> Compose multiple HOCs for complex scenarios using helper functions</li>
                    <li><strong>Lazy Loading:</strong> Use with React.lazy() for code splitting in large applications</li>
                    <li><strong>Configuration:</strong> Use configuration objects for complex initialization scenarios</li>
                  </ul>
                </div>
              </div>
            </DemoCard>
          </Section>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default WithProviderPatternPage;