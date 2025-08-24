import { useCallback, useState, useRef, useEffect } from 'react';
import { createDeclarativeStorePattern, createActionContext } from '@context-action/react';
import { LogMonitorProvider, useLogMonitor } from '../../components/LogMonitor';

// Define action types for real-time state demonstrations
interface RealtimeActions {
  problematicClosure: { userId: string; data: any };
  correctRealtime: { userId: string; data: any };
  multiStoreCoordination: { operation: string };
  stateValidationUpdate: { updates: any; expectedVersion: number };
  raceConditionDemo: { delay: number };
}

// Store patterns for demonstrating real-time state access
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: { 
    initialValue: { 
      id: '', 
      name: 'Anonymous', 
      email: '', 
      isLoggedIn: false,
      lastActivity: Date.now() 
    } 
  },
  preferences: { 
    initialValue: { 
      theme: 'light', 
      notifications: true,
      language: 'en' 
    } 
  }
});

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  isProcessing: { initialValue: false },
  operationCount: { initialValue: 0 },
  lastOperation: { initialValue: '' },
  data: { 
    initialValue: { 
      version: 1, 
      content: 'Initial data', 
      timestamp: Date.now() 
    } 
  },
  concurrentOperations: { initialValue: [] as string[] }
});

const {
  Provider: SettingsStoreProvider,
  useStore: useSettingsStore,
  useStoreManager: useSettingsStoreManager
} = createDeclarativeStorePattern('Settings', {
  api: { 
    initialValue: { 
      endpoint: 'https://api.example.com', 
      apiEnabled: true, 
      timeout: 5000 
    } 
  },
  ui: { 
    initialValue: { 
      isLoading: false, 
      showAdvanced: false,
      layout: 'grid' 
    } 
  }
});

// Action context
const {
  Provider: RealtimeActionProvider,
  useActionDispatch: useRealtimeAction,
  useActionHandler: useRealtimeActionHandler
} = createActionContext<RealtimeActions>('RealtimeActions');

function AsyncRealtimeStatePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Real-time State Access Pattern</h1>
      <p className="text-lg text-gray-600 mb-8">
        Demonstrates avoiding closure traps by accessing current state in real-time using store.getValue().
        This pattern is crucial for preventing stale closures in async operations.
      </p>
      
      <LogMonitorProvider>
        <UserStoreProvider>
          <AppStoreProvider>
            <SettingsStoreProvider>
              <RealtimeActionProvider>
                <div className="space-y-8">
                  <ClosureTrapDemo />
                  <RealTimeAccessDemo />
                  <MultiStoreCoordinationDemo />
                  <StateValidationDemo />
                  <RaceConditionPreventionDemo />
                  <BestPracticesSection />
                </div>
              </RealtimeActionProvider>
            </SettingsStoreProvider>
          </AppStoreProvider>
        </UserStoreProvider>
      </LogMonitorProvider>
    </div>
  );
}

function ClosureTrapDemo() {
  const { log } = useLogMonitor();
  const dispatch = useRealtimeAction();
  const [staleState, setStaleState] = useState({ counter: 0, isActive: false });
  const isProcessingStore = useAppStore('isProcessing');
  const operationCountStore = useAppStore('operationCount');
  
  // ❌ Problematic handler with closure trap
  useRealtimeActionHandler('problematicClosure', useCallback(async (payload, controller) => {
    log('❌ Starting problematic closure operation...');
    
    // This uses stale closure values!
    if (staleState.isActive) {
      log('⚠️ Operation blocked by stale closure state');
      return;
    }
    
    // This dependency will make the handler re-create frequently
    log(`⚠️ Using stale counter value: ${staleState.counter}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('❌ Problematic operation completed with potentially stale state');
    
  }, [staleState, log])); // Bad: depending on reactive state
  
  // ✅ Correct handler with real-time access
  useRealtimeActionHandler('correctRealtime', useCallback(async (payload, controller) => {
    log('✅ Starting correct real-time operation...');
    
    // Always get current state
    const currentProcessing = isProcessingStore.getValue();
    const currentCount = operationCountStore.getValue();
    
    if (currentProcessing) {
      log('✅ Operation blocked by current processing state');
      return;
    }
    
    isProcessingStore.setValue(true);
    
    log(`✅ Using current operation count: ${currentCount}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Access real-time state again
    const finalCount = operationCountStore.getValue();
    operationCountStore.setValue(finalCount + 1);
    
    isProcessingStore.setValue(false);
    log('✅ Real-time operation completed successfully');
    
  }, [isProcessingStore, operationCountStore, log])); // Good: only stable dependencies
  
  // Simulate state changes to demonstrate closure trap
  useEffect(() => {
    const interval = setInterval(() => {
      setStaleState(prev => ({
        counter: prev.counter + 1,
        isActive: Math.random() > 0.5
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-red-600">❌ The Problem: Closure Traps</h2>
      <p className="text-gray-600 mb-4">
        This demonstrates how closure traps can lead to stale state access in async operations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-700 mb-2">❌ Problematic Approach</h3>
          <div className="space-y-2 text-sm mb-4">
            <div>Stale Counter: <span className="font-mono bg-white px-1 rounded">{staleState.counter}</span></div>
            <div>Is Active: <span className={`font-mono px-1 rounded ${staleState.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
              {staleState.isActive ? 'true' : 'false'}
            </span></div>
          </div>
          
          <button
            onClick={() => dispatch('problematicClosure', { userId: '123', data: {} })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
          >
            Execute with Closure Trap
          </button>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-700 mb-2">✅ Real-time Approach</h3>
          <div className="space-y-2 text-sm mb-4">
            <div>Current Processing: <ProcessingIndicator /></div>
            <div>Operation Count: <OperationCounter /></div>
          </div>
          
          <button
            onClick={() => dispatch('correctRealtime', { userId: '123', data: {} })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
          >
            Execute with Real-time Access
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Code Comparison:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <pre className="bg-red-50 p-3 rounded border border-red-200 overflow-x-auto">
{`// ❌ Problematic - stale closure
const [isActive, setIsActive] = useState(false);

const handler = useCallback(async () => {
  // This value might be stale!
  if (!isActive) {
    await doSomething();
  }
}, [isActive]); // Bad dependency`}
          </pre>
          
          <pre className="bg-green-50 p-3 rounded border border-green-200 overflow-x-auto">
{`// ✅ Correct - real-time access
const isActiveStore = useAppStore('isActive');

const handler = useCallback(async () => {
  // Always current state
  const currentActive = isActiveStore.getValue();
  if (!currentActive) {
    await doSomething();
  }
}, [isActiveStore]); // Good dependency`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function RealTimeAccessDemo() {
  const { log } = useLogMonitor();
  const userStoreManager = useUserStoreManager();
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const updateProfile = useCallback(() => {
    const currentProfile = profileStore.getValue();
    const newProfile = {
      ...currentProfile,
      name: `User_${Math.random().toString(36).substr(2, 5)}`,
      email: `user${Date.now()}@example.com`,
      isLoggedIn: !currentProfile.isLoggedIn,
      lastActivity: Date.now()
    };
    
    profileStore.setValue(newProfile);
    log(`✅ Profile updated: ${newProfile.name} (${newProfile.isLoggedIn ? 'logged in' : 'logged out'})`);
  }, [profileStore, log]);
  
  const togglePreferences = useCallback(() => {
    const currentPrefs = preferencesStore.getValue();
    const newPrefs = {
      ...currentPrefs,
      theme: currentPrefs.theme === 'light' ? 'dark' : 'light',
      notifications: !currentPrefs.notifications
    };
    
    preferencesStore.setValue(newPrefs);
    log(`✅ Preferences updated: ${newPrefs.theme} theme, notifications ${newPrefs.notifications ? 'on' : 'off'}`);
  }, [preferencesStore, log]);
  
  const getCompleteUserState = useCallback(() => {
    // Real-time access to multiple stores
    const profile = profileStore.getValue();
    const preferences = preferencesStore.getValue();
    
    const completeState = {
      user: profile,
      settings: preferences,
      snapshot: Date.now()
    };
    
    log('📊 Complete user state snapshot captured');
    console.log('Complete User State:', completeState);
    
    return completeState;
  }, [profileStore, preferencesStore, log]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Real-time State Access</h2>
      <p className="text-gray-600 mb-4">
        Demonstrates proper real-time state access using store.getValue() for always-current values.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={updateProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update Profile
        </button>
        
        <button
          onClick={togglePreferences}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Toggle Preferences
        </button>
        
        <button
          onClick={getCompleteUserState}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Get Current State
        </button>
      </div>
      
      <UserStateDisplay />
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Real-time Access Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Always get the current state
const actionHandler = useCallback(async () => {
  const currentState = stateStore.getValue();
  
  if (!currentState.isMounted) {
    await waitForRefs('element');
  }
  
  // Continue with operation
}, [stateStore, waitForRefs]);`}
        </pre>
      </div>
    </section>
  );
}

function MultiStoreCoordinationDemo() {
  const { log } = useLogMonitor();
  const dispatch = useRealtimeAction();
  const userStoreManager = useUserStoreManager();
  const settingsStoreManager = useSettingsStoreManager();
  const appStoreManager = useAppStoreManager();
  
  // Multi-store coordination handler
  useRealtimeActionHandler('multiStoreCoordination', useCallback(async (payload, controller) => {
    log(`🔄 Starting multi-store coordination: ${payload.operation}`);
    
    // Get current state from each store manager
    const userState = userStoreManager.getStore('profile').getValue();
    const settingsState = settingsStoreManager.getStore('api').getValue();
    const uiState = settingsStoreManager.getStore('ui').getValue();
    const appState = appStoreManager.getStore('isProcessing').getValue();
    
    log(`📊 Current states - User: ${userState.isLoggedIn ? 'logged in' : 'logged out'}, API: ${settingsState.apiEnabled ? 'enabled' : 'disabled'}, UI Loading: ${uiState.isLoading}`);
    
    // Complex decision making based on all current states
    if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading && !appState) {
      log('✅ All conditions met, executing complex logic');
      
      // Update multiple stores based on operation
      const operationCountStore = appStoreManager.getStore('operationCount');
      const currentCount = operationCountStore.getValue();
      
      // Set processing state
      appStoreManager.getStore('isProcessing').setValue(true);
      uiState && settingsStoreManager.getStore('ui').setValue({ ...uiState, isLoading: true });
      
      // Simulate complex operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update states based on current values (not closures)
      const finalCount = operationCountStore.getValue();
      operationCountStore.setValue(finalCount + 1);
      
      const finalUIState = settingsStoreManager.getStore('ui').getValue();
      settingsStoreManager.getStore('ui').setValue({ ...finalUIState, isLoading: false });
      appStoreManager.getStore('isProcessing').setValue(false);
      appStoreManager.getStore('lastOperation').setValue(`${payload.operation} - ${new Date().toLocaleTimeString()}`);
      
      log(`✅ Multi-store coordination completed for ${payload.operation}`);
      
    } else {
      const reasons = [];
      if (!userState.isLoggedIn) reasons.push('user not logged in');
      if (!settingsState.apiEnabled) reasons.push('API disabled');
      if (uiState.isLoading) reasons.push('UI loading');
      if (appState) reasons.push('app processing');
      
      log(`⚠️ Coordination blocked: ${reasons.join(', ')}`);
    }
    
  }, [userStoreManager, settingsStoreManager, appStoreManager, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">Multi-Store Coordination</h2>
      <p className="text-gray-600 mb-4">
        Demonstrates coordinating multiple store managers with real-time state access.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => dispatch('multiStoreCoordination', { operation: 'Data Sync' })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Coordinate Data Sync
        </button>
        
        <button
          onClick={() => dispatch('multiStoreCoordination', { operation: 'Settings Update' })}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Coordinate Settings Update
        </button>
      </div>
      
      <MultiStoreStateDisplay />
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Multi-Store Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`function MultiStoreComponent() {
  const userStoreManager = useUserStoreManager();
  const settingsStoreManager = useSettingsStoreManager();
  const uiStoreManager = useUIStoreManager();
  
  useActionHandler('complexAction', useCallback(async (payload) => {
    // Get current state from each store manager
    const userState = userStoreManager.getStore('profile').getValue();
    const settingsState = settingsStoreManager.getStore('api').getValue();
    const uiState = uiStoreManager.getStore('loading').getValue();
    
    // Use all current states for decision making
    if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
      // Execute complex logic
    }
  }, [userStoreManager, settingsStoreManager, uiStoreManager]));
}`}
        </pre>
      </div>
    </section>
  );
}

function StateValidationDemo() {
  const { log } = useLogMonitor();
  const dispatch = useRealtimeAction();
  const dataStore = useAppStore('data');
  
  // State validation and update handler
  useRealtimeActionHandler('stateValidationUpdate', useCallback(async (payload, controller) => {
    log('🔍 Starting state validation and update...');
    
    const current = dataStore.getValue();
    
    // Validate current state
    if (current.version !== payload.expectedVersion) {
      const error = `Version mismatch: expected ${payload.expectedVersion}, got ${current.version}`;
      log(`❌ ${error}`);
      throw new Error(error);
    }
    
    log(`✅ Version validation passed: ${current.version}`);
    
    // Update with current state as base
    const updatedData = {
      ...current,
      ...payload.updates,
      version: current.version + 1,
      timestamp: Date.now()
    };
    
    dataStore.setValue(updatedData);
    log(`✅ Data updated to version ${updatedData.version}: ${updatedData.content}`);
    
  }, [dataStore, log]));
  
  const currentData = useAppStore('data').getValue();
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-purple-600">State Validation & Updates</h2>
      <p className="text-gray-600 mb-4">
        Demonstrates validating current state before updates using real-time access.
      </p>
      
      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
        <h3 className="font-semibold mb-2">Current Data State:</h3>
        <div className="space-y-1 text-sm">
          <div>Version: <span className="font-mono bg-white px-1 rounded">{currentData.version}</span></div>
          <div>Content: <span className="font-mono bg-white px-1 rounded">{currentData.content}</span></div>
          <div>Timestamp: <span className="font-mono bg-white px-1 rounded text-xs">
            {new Date(currentData.timestamp).toLocaleTimeString()}
          </span></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => dispatch('stateValidationUpdate', {
            expectedVersion: currentData.version,
            updates: { content: `Updated content ${Math.random().toString(36).substr(2, 5)}` }
          })}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Valid Update (Current Version)
        </button>
        
        <button
          onClick={() => dispatch('stateValidationUpdate', {
            expectedVersion: currentData.version - 1, // Wrong version
            updates: { content: `This will fail` }
          })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Invalid Update (Wrong Version)
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Validation Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`function DataManagementComponent() {
  const dataStore = useAppStore('data');
  
  useActionHandler('validateAndUpdate', useCallback(async (payload) => {
    const current = dataStore.getValue();
    
    // Validate current state
    if (current.version !== payload.expectedVersion) {
      throw new Error('Version mismatch');
    }
    
    // Update with current state as base
    dataStore.setValue({
      ...current,
      ...payload.updates,
      version: current.version + 1
    });
  }, [dataStore]));
}`}
        </pre>
      </div>
    </section>
  );
}

function RaceConditionPreventionDemo() {
  const { log } = useLogMonitor();
  const dispatch = useRealtimeAction();
  const concurrentOpsStore = useAppStore('concurrentOperations');
  const isProcessingStore = useAppStore('isProcessing');
  
  // Race condition prevention handler
  useRealtimeActionHandler('raceConditionDemo', useCallback(async (payload, controller) => {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    log(`🚀 Starting operation ${operationId} with ${payload.delay}ms delay`);
    
    // Real-time check for current processing state
    const currentlyProcessing = isProcessingStore.getValue();
    if (currentlyProcessing) {
      log(`⚠️ Operation ${operationId} blocked: another operation in progress`);
      return;
    }
    
    // Add to concurrent operations list
    const currentOps = concurrentOpsStore.getValue();
    concurrentOpsStore.setValue([...currentOps, operationId]);
    isProcessingStore.setValue(true);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, payload.delay));
      
      // Check if we should still proceed (real-time check)
      const stillInProgress = concurrentOpsStore.getValue().includes(operationId);
      
      if (stillInProgress) {
        log(`✅ Operation ${operationId} completed successfully`);
      } else {
        log(`⚠️ Operation ${operationId} was cancelled during execution`);
      }
      
    } finally {
      // Clean up using real-time state
      const finalOps = concurrentOpsStore.getValue();
      concurrentOpsStore.setValue(finalOps.filter(id => id !== operationId));
      
      // Only set processing to false if no other operations
      const remainingOps = concurrentOpsStore.getValue();
      if (remainingOps.length === 0) {
        isProcessingStore.setValue(false);
      }
    }
  }, [concurrentOpsStore, isProcessingStore, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-orange-600">Race Condition Prevention</h2>
      <p className="text-gray-600 mb-4">
        Demonstrates preventing race conditions using real-time state access and proper cleanup.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => dispatch('raceConditionDemo', { delay: 1000 })}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Fast Operation (1s)
        </button>
        
        <button
          onClick={() => dispatch('raceConditionDemo', { delay: 3000 })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Slow Operation (3s)
        </button>
        
        <button
          onClick={() => dispatch('raceConditionDemo', { delay: 500 })}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Quick Operation (0.5s)
        </button>
      </div>
      
      <ConcurrentOperationsDisplay />
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Race Condition Prevention:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const handler = useCallback(async (payload) => {
  // Real-time check for current state
  const currentlyProcessing = isProcessingStore.getValue();
  if (currentlyProcessing) {
    log('Operation blocked: another operation in progress');
    return;
  }
  
  isProcessingStore.setValue(true);
  
  try {
    await performOperation();
  } finally {
    // Clean up using real-time state
    isProcessingStore.setValue(false);
  }
}, [isProcessingStore]);`}
        </pre>
      </div>
    </section>
  );
}

// Helper components
function ProcessingIndicator() {
  const isProcessing = useAppStore('isProcessing').getValue();
  return (
    <span className={`font-mono px-1 rounded ${isProcessing ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
      {isProcessing ? '🔄 Processing' : '✅ Idle'}
    </span>
  );
}

function OperationCounter() {
  const count = useAppStore('operationCount').getValue();
  return <span className="font-mono bg-white px-1 rounded">{count}</span>;
}

function UserStateDisplay() {
  const profile = useUserStore('profile').getValue();
  const preferences = useUserStore('preferences').getValue();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-700 mb-2">Profile State</h4>
        <div className="space-y-1 text-sm">
          <div>Name: <span className="font-mono bg-white px-1 rounded">{profile.name}</span></div>
          <div>Email: <span className="font-mono bg-white px-1 rounded text-xs">{profile.email}</span></div>
          <div>Status: <span className={`font-mono px-1 rounded ${profile.isLoggedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            {profile.isLoggedIn ? 'Logged In' : 'Logged Out'}
          </span></div>
        </div>
      </div>
      
      <div className="p-4 bg-purple-50 border border-purple-200 rounded">
        <h4 className="font-semibold text-purple-700 mb-2">Preferences State</h4>
        <div className="space-y-1 text-sm">
          <div>Theme: <span className="font-mono bg-white px-1 rounded">{preferences.theme}</span></div>
          <div>Notifications: <span className={`font-mono px-1 rounded ${preferences.notifications ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            {preferences.notifications ? 'On' : 'Off'}
          </span></div>
          <div>Language: <span className="font-mono bg-white px-1 rounded">{preferences.language}</span></div>
        </div>
      </div>
    </div>
  );
}

function MultiStoreStateDisplay() {
  const profile = useUserStore('profile').getValue();
  const apiSettings = useSettingsStore('api').getValue();
  const uiSettings = useSettingsStore('ui').getValue();
  const isProcessing = useAppStore('isProcessing').getValue();
  const lastOperation = useAppStore('lastOperation').getValue();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="font-medium text-blue-700 mb-1">User Store</div>
          <div>Logged In: <span className={profile.isLoggedIn ? 'text-green-600' : 'text-gray-600'}>
            {profile.isLoggedIn ? '✅' : '❌'}
          </span></div>
        </div>
        
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
          <div className="font-medium text-green-700 mb-1">Settings Store</div>
          <div>API Enabled: <span className={apiSettings.apiEnabled ? 'text-green-600' : 'text-gray-600'}>
            {apiSettings.apiEnabled ? '✅' : '❌'}
          </span></div>
          <div>UI Loading: <span className={uiSettings.isLoading ? 'text-orange-600' : 'text-green-600'}>
            {uiSettings.isLoading ? '🔄' : '✅'}
          </span></div>
        </div>
      </div>
      
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm">
        <div className="font-medium text-indigo-700 mb-1">App Store</div>
        <div>Processing: <span className={isProcessing ? 'text-orange-600' : 'text-green-600'}>
          {isProcessing ? '🔄 Active' : '✅ Idle'}
        </span></div>
        <div>Last Operation: <span className="font-mono bg-white px-1 rounded text-xs">
          {lastOperation || 'None'}
        </span></div>
      </div>
    </div>
  );
}

function ConcurrentOperationsDisplay() {
  const operations = useAppStore('concurrentOperations').getValue();
  const isProcessing = useAppStore('isProcessing').getValue();
  
  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded">
      <h4 className="font-semibold text-orange-700 mb-2">Concurrent Operations</h4>
      <div className="space-y-2 text-sm">
        <div>
          Status: <span className={`font-mono px-1 rounded ${isProcessing ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {isProcessing ? '🔄 Processing' : '✅ Idle'}
          </span>
        </div>
        <div>Active Operations: <span className="font-mono bg-white px-1 rounded">{operations.length}</span></div>
        {operations.length > 0 && (
          <div className="space-y-1">
            <div className="font-medium">Operation IDs:</div>
            {operations.map(op => (
              <div key={op} className="font-mono text-xs bg-white px-2 py-1 rounded border">
                {op}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BestPracticesSection() {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Key Benefits of Real-time State Access</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">✅ Benefits</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>No Stale Closures:</strong> Always access current state values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Race Condition Prevention:</strong> Real-time checks prevent conflicts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Performance:</strong> Avoid unnecessary re-renders from dependencies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Reliability:</strong> Guaranteed fresh state values in async operations</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-blue-600 mb-3">🎯 Best Practices</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Use <code className="bg-white px-1 rounded">store.getValue()</code> in async handlers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Keep handler dependencies stable (stores, not reactive values)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Validate state before performing operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Clean up using current state, not captured closures</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AsyncRealtimeStatePage;