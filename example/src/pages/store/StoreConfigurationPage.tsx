import {
  createDeclarativeStorePattern,
  useStoreValue,
} from '@context-action/react';
import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Section,
  Label,
  Input,
} from '../../components/ui';

interface DataItem {
  id: string;
  name: string;
  value: number;
  timestamp: number;
}

interface LargeDataItem {
  id: string;
  data: any[];
  metadata: Record<string, any>;
}

// Performance-Optimized Configuration Demo
const {
  Provider: AdvancedStoreProvider,
  useStore: useAdvancedStore,
  useStoreManager: useAdvancedStoreManager
} = createDeclarativeStorePattern('Advanced', {
  // Performance-optimized store
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',  // Reference equality for performance
    debug: true,           // Enable debug logging
    tags: ['performance', 'data'],
    version: '1.0.0',
    description: 'Large dataset with reference equality'
  },
  
  // Deep comparison store
  complexObject: {
    initialValue: { nested: { deep: { value: 0, timestamp: Date.now() } } },
    strategy: 'deep',      // Deep comparison for nested changes
    comparisonOptions: {
      ignoreKeys: ['timestamp'],  // Ignore specific keys
      maxDepth: 5                 // Limit comparison depth
    }
  },
  
  // Custom comparison
  customStore: {
    initialValue: new Map() as Map<string, any>,
    comparisonOptions: {
      customComparator: (oldValue, newValue) => {
        // Custom comparison logic
        return oldValue.size === newValue.size;
      }
    }
  }
});

// Different Comparison Strategies Demo
const {
  Provider: ComparisonStoreProvider,
  useStore: useComparisonStore,
} = createDeclarativeStorePattern('Comparison', {
  // Reference strategy
  referenceData: {
    initialValue: [] as LargeDataItem[],
    strategy: 'reference' // Only re-render if array reference changes
  },
  
  // Shallow strategy  
  shallowData: {
    initialValue: { id: '', name: '', email: '', lastLogin: 0 },
    strategy: 'shallow' // Re-render if any top-level property changes
  },
  
  // Deep strategy
  deepData: {
    initialValue: {
      ui: { theme: 'light', sidebar: { width: 200, collapsed: false } },
      api: { timeout: 5000, retries: 3 },
      features: { beta: false, analytics: true }
    },
    strategy: 'deep', // Detects changes at any nesting level
    comparisonOptions: {
      maxDepth: 10,  // Prevent infinite recursion
      ignoreKeys: ['timestamp', 'lastUpdated'] // Ignore timestamp fields
    }
  }
});

// Custom Comparator Demo
const {
  Provider: CustomStoreProvider,
  useStore: useCustomStore,
} = createDeclarativeStorePattern('Custom', {
  searchResults: {
    initialValue: [] as { id: string; title: string; score: number }[],
    comparisonOptions: {
      customComparator: (oldResults, newResults) => {
        // Only re-render if result count or first item changes
        return oldResults.length === newResults.length && 
               oldResults[0]?.id === newResults[0]?.id;
      }
    }
  },
  
  coordinates: {
    initialValue: { x: 0, y: 0 },
    comparisonOptions: {
      customComparator: (oldCoords, newCoords) => {
        // Only re-render if movement is significant (>5px)
        const distance = Math.sqrt(
          Math.pow(newCoords.x - oldCoords.x, 2) + 
          Math.pow(newCoords.y - oldCoords.y, 2)
        );
        return distance < 5;
      }
    }
  }
});

// Performance Configuration Demo
function PerformanceConfigurationDemo() {
  const logger = useActionLoggerWithToast();
  
  return (
    <AdvancedStoreProvider>
      <PerformanceContent />
    </AdvancedStoreProvider>
  );
  
  function PerformanceContent() {
    const largeDatasetStore = useAdvancedStore('largeDataset');
    const complexObjectStore = useAdvancedStore('complexObject');
    const customStore = useAdvancedStore('customStore');
    
    const largeDataset = useStoreValue(largeDatasetStore);
    const complexObject = useStoreValue(complexObjectStore);
    const customMap = useStoreValue(customStore);
    
    const addDataItem = () => {
      // Reference equality - creates new array reference
      const newItem: DataItem = {
        id: Date.now().toString(),
        name: `Item ${largeDataset.length + 1}`,
        value: Math.floor(Math.random() * 100),
        timestamp: Date.now()
      };
      
      largeDatasetStore.setValue([...largeDataset, newItem]);
      logger.info('📊 Added item to reference-tracked dataset', { 
        itemCount: largeDataset.length + 1,
        strategy: 'reference'
      });
    };
    
    const updateNestedValue = () => {
      // Deep comparison - will detect nested changes but ignore timestamp
      complexObjectStore.update(prev => ({
        ...prev,
        nested: {
          ...prev.nested,
          deep: {
            ...prev.nested.deep,
            value: prev.nested.deep.value + 1,
            timestamp: Date.now() // This will be ignored
          }
        }
      }));
      logger.info('🔍 Updated nested value (timestamp ignored)', { 
        value: complexObject.nested.deep.value + 1,
        strategy: 'deep with ignoreKeys' 
      });
    };
    
    const updateCustomMap = () => {
      // Custom comparator - only triggers if size changes
      const newMap = new Map(customMap);
      newMap.set(`key-${newMap.size}`, `value-${newMap.size}`);
      customStore.setValue(newMap);
      logger.info('🗂️ Updated custom map', { 
        size: newMap.size,
        strategy: 'custom comparator (size-based)'
      });
    };
    
    return (
      <DemoCard title="Performance-Optimized Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="font-semibold">Reference Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Items: {largeDataset.length}</div>
                <div>Strategy: reference</div>
                <div>Debug: enabled</div>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Label className="font-semibold">Deep Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Value: {complexObject.nested.deep.value}</div>
                <div>Strategy: deep</div>
                <div>Ignores: timestamp</div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Label className="font-semibold">Custom Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Map Size: {customMap.size}</div>
                <div>Strategy: custom</div>
                <div>Logic: size-based</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={addDataItem} variant="primary" size="sm">
              Add Data Item (Reference)
            </Button>
            <Button onClick={updateNestedValue} variant="secondary" size="sm">
              Update Nested (Deep)
            </Button>
            <Button onClick={updateCustomMap} variant="outline" size="sm">
              Update Map (Custom)
            </Button>
          </div>

          <CodeExample>
{`// Performance-optimized store configuration
const stores = createDeclarativeStorePattern('Advanced', {
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',  // Reference equality for performance
    debug: true,           // Enable debug logging
    tags: ['performance', 'data'],
    version: '1.0.0',
    description: 'Large dataset with reference equality'
  },
  
  complexObject: {
    initialValue: { nested: { deep: { value: 0 } } },
    strategy: 'deep',      // Deep comparison for nested changes
    comparisonOptions: {
      ignoreKeys: ['timestamp'],  // Ignore specific keys
      maxDepth: 5                 // Limit comparison depth
    }
  }
});`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Comparison Strategies Demo
function ComparisonStrategiesDemo() {
  const logger = useActionLoggerWithToast();
  const [renderCount, setRenderCount] = useState(0);
  
  return (
    <ComparisonStoreProvider>
      <ComparisonContent />
    </ComparisonStoreProvider>
  );
  
  function ComparisonContent() {
    const referenceStore = useComparisonStore('referenceData');
    const shallowStore = useComparisonStore('shallowData');
    const deepStore = useComparisonStore('deepData');
    
    const referenceData = useStoreValue(referenceStore);
    const shallowData = useStoreValue(shallowStore);
    const deepData = useStoreValue(deepStore);
    
    useEffect(() => {
      setRenderCount(prev => prev + 1);
      logger.info('🔄 Component re-rendered', { renderCount: renderCount + 1 });
    });
    
    const updateReference = () => {
      // Creates new array reference - will trigger re-render
      const newArray = [...referenceData, { 
        id: Date.now().toString(), 
        data: [], 
        metadata: {} 
      }];
      referenceStore.setValue(newArray);
      logger.info('📎 Reference strategy: new array created', { length: newArray.length });
    };
    
    const modifyReferenceInPlace = () => {
      // Modifies array in-place - will NOT trigger re-render
      referenceData.push({ 
        id: Date.now().toString(), 
        data: [], 
        metadata: {} 
      });
      referenceStore.setValue(referenceData);
      logger.warn('⚠️ Reference strategy: in-place modification (no re-render)', { 
        length: referenceData.length 
      });
    };
    
    const updateShallow = () => {
      // Updates top-level property - will trigger re-render
      shallowStore.update(prev => ({ 
        ...prev, 
        name: `User ${Math.floor(Math.random() * 1000)}`,
        lastLogin: Date.now() // This change will trigger re-render
      }));
      logger.info('🏄 Shallow strategy: top-level property updated');
    };
    
    const updateDeepNested = () => {
      // Updates nested property - will trigger re-render (deep strategy)
      deepStore.update(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          sidebar: {
            ...prev.ui.sidebar,
            width: prev.ui.sidebar.width + 10
          }
        },
        timestamp: Date.now() // This will be ignored
      }));
      logger.info('🌊 Deep strategy: nested property updated (timestamp ignored)');
    };
    
    return (
      <DemoCard title="Comparison Strategies">
        <div className="space-y-4">
          <div className="p-2 bg-yellow-50 border rounded-lg">
            <div className="text-sm font-medium">Component Renders: {renderCount}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Label className="font-semibold">Reference Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Items: {referenceData.length}</div>
                <div>Re-render: Only on new reference</div>
                <div>Best for: Large arrays, immutable data</div>
              </div>
              <div className="mt-2 space-x-1">
                <Button onClick={updateReference} variant="primary" size="xs">
                  New Ref ✅
                </Button>
                <Button onClick={modifyReferenceInPlace} variant="secondary" size="xs">
                  In-place ❌
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="font-semibold">Shallow Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Name: {shallowData.name || 'User'}</div>
                <div>Email: {shallowData.email || 'user@example.com'}</div>
                <div>Re-render: On top-level changes</div>
              </div>
              <div className="mt-2">
                <Button onClick={updateShallow} variant="primary" size="xs">
                  Update Top-Level
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <Label className="font-semibold">Deep Strategy</Label>
              <div className="text-sm space-y-1">
                <div>Theme: {deepData.ui.theme}</div>
                <div>Sidebar: {deepData.ui.sidebar.width}px</div>
                <div>Re-render: On any nested change</div>
              </div>
              <div className="mt-2">
                <Button onClick={updateDeepNested} variant="primary" size="xs">
                  Update Nested
                </Button>
              </div>
            </div>
          </div>

          <CodeExample>
{`// Different comparison strategies
const stores = createDeclarativeStorePattern('Comparison', {
  // Reference strategy - best for large arrays
  bigData: {
    initialValue: [] as LargeItem[],
    strategy: 'reference' // Only re-render if array reference changes
  },
  
  // Shallow strategy - good for simple objects
  userProfile: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow' // Re-render if any top-level property changes
  },
  
  // Deep strategy - for nested objects
  nestedConfig: {
    initialValue: { ui: { theme: 'light', sidebar: { width: 200 } } },
    strategy: 'deep', // Detects changes at any nesting level
    comparisonOptions: { ignoreKeys: ['timestamp'] }
  }
});`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Custom Comparator Demo
function CustomComparatorDemo() {
  const logger = useActionLoggerWithToast();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  return (
    <CustomStoreProvider>
      <CustomContent />
    </CustomStoreProvider>
  );
  
  function CustomContent() {
    const searchResultsStore = useCustomStore('searchResults');
    const coordinatesStore = useCustomStore('coordinates');
    
    const searchResults = useStoreValue(searchResultsStore);
    const coordinates = useStoreValue(coordinatesStore);
    
    const addSearchResult = () => {
      const newResults = [...searchResults, {
        id: Date.now().toString(),
        title: `Result ${searchResults.length + 1}`,
        score: Math.random()
      }];
      searchResultsStore.setValue(newResults);
      logger.info('🔍 Search results updated', { 
        count: newResults.length,
        willReRender: searchResults.length !== newResults.length || searchResults[0]?.id !== newResults[0]?.id
      });
    };
    
    const shuffleResults = () => {
      // Same count, different order - will NOT trigger re-render per custom logic
      const shuffled = [...searchResults].sort(() => Math.random() - 0.5);
      searchResultsStore.setValue(shuffled);
      logger.info('🔀 Search results shuffled', { 
        count: shuffled.length,
        willReRender: false,
        reason: 'Custom comparator only checks count and first item'
      });
    };
    
    const updateCoordinates = (x: number, y: number) => {
      coordinatesStore.setValue({ x, y });
      const distance = Math.sqrt(Math.pow(x - coordinates.x, 2) + Math.pow(y - coordinates.y, 2));
      logger.info('📍 Coordinates updated', { 
        x, y, 
        distance: distance.toFixed(2),
        willReRender: distance >= 5,
        threshold: '5px'
      });
    };
    
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      updateCoordinates(x, y);
    }, []);
    
    return (
      <DemoCard title="Custom Comparators">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Label className="font-semibold">Search Results (Smart Comparison)</Label>
              <div className="text-sm space-y-1">
                <div>Count: {searchResults.length}</div>
                <div>First: {searchResults[0]?.title || 'None'}</div>
                <div>Logic: Count + first item ID</div>
              </div>
              <div className="mt-2 space-x-1">
                <Button onClick={addSearchResult} variant="primary" size="xs">
                  Add Result (triggers)
                </Button>
                <Button onClick={shuffleResults} variant="secondary" size="xs">
                  Shuffle (silent)
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <Label className="font-semibold">Coordinates (Distance Threshold)</Label>
              <div className="text-sm space-y-1">
                <div>Store: ({coordinates.x.toFixed(0)}, {coordinates.y.toFixed(0)})</div>
                <div>Mouse: ({mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)})</div>
                <div>Threshold: 5px movement</div>
              </div>
            </div>
          </div>
          
          <div 
            className="h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-crosshair"
            onMouseMove={handleMouseMove}
          >
            <span className="text-gray-500 text-sm">Move mouse here to test coordinate threshold</span>
          </div>

          <CodeExample>
{`// Custom comparison logic
const stores = createDeclarativeStorePattern('Custom', {
  searchResults: {
    initialValue: [] as SearchResult[],
    comparisonOptions: {
      customComparator: (oldResults, newResults) => {
        // Only re-render if result count or first item changes
        return oldResults.length === newResults.length && 
               oldResults[0]?.id === newResults[0]?.id;
      }
    }
  },
  
  coordinates: {
    initialValue: { x: 0, y: 0 },
    comparisonOptions: {
      customComparator: (oldCoords, newCoords) => {
        // Only re-render if movement is significant (>5px)
        const distance = Math.sqrt(
          Math.pow(newCoords.x - oldCoords.x, 2) + 
          Math.pow(newCoords.y - oldCoords.y, 2)
        );
        return distance < 5;
      }
    }
  }
});`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Real-World Configuration Demo
function RealWorldConfigurationDemo() {
  const logger = useActionLoggerWithToast();
  
  // Real-world configuration examples
  const {
    Provider: RealWorldStoreProvider,
    useStore: useRealWorldStore,
  } = createDeclarativeStorePattern('RealWorld', {
    // User data - shallow comparison for profile updates
    userProfile: {
      initialValue: { id: '', name: '', email: '', avatar: '', lastUpdated: 0 },
      strategy: 'shallow'
    },
    
    // UI preferences - ignore timestamps
    uiPreferences: {
      initialValue: { theme: 'light', sidebar: true, lastUpdated: 0 },
      strategy: 'shallow',
      comparisonOptions: { ignoreKeys: ['lastUpdated'] }
    },
    
    // Large dataset - reference equality for performance  
    dataCache: {
      initialValue: new Map() as Map<string, any>,
      strategy: 'reference'
    },
    
    // Form state - deep comparison for nested validation
    formState: {
      initialValue: { 
        fields: { username: '', email: '' }, 
        validation: { username: true, email: true }, 
        errors: {} as Record<string, string>
      },
      strategy: 'deep',
      comparisonOptions: { maxDepth: 3 }
    }
  });
  
  return (
    <RealWorldStoreProvider>
      <RealWorldContent />
    </RealWorldStoreProvider>
  );
  
  function RealWorldContent() {
    const userProfileStore = useRealWorldStore('userProfile');
    const uiPreferencesStore = useRealWorldStore('uiPreferences');
    const dataCacheStore = useRealWorldStore('dataCache');
    const formStateStore = useRealWorldStore('formState');
    
    const userProfile = useStoreValue(userProfileStore);
    const uiPreferences = useStoreValue(uiPreferencesStore);
    const dataCache = useStoreValue(dataCacheStore);
    const formState = useStoreValue(formStateStore);
    
    const updateProfile = () => {
      userProfileStore.update(prev => ({
        ...prev,
        name: 'Updated User',
        lastUpdated: Date.now() // This WILL trigger re-render
      }));
      logger.info('👤 Profile updated with timestamp', { strategy: 'shallow' });
    };
    
    const updatePreferences = () => {
      uiPreferencesStore.update(prev => ({
        ...prev,
        theme: prev.theme === 'light' ? 'dark' : 'light',
        lastUpdated: Date.now() // This will be IGNORED
      }));
      logger.info('🎨 Preferences updated (timestamp ignored)', { strategy: 'shallow + ignoreKeys' });
    };
    
    const updateCache = () => {
      const newCache = new Map(dataCache);
      newCache.set(`item-${newCache.size}`, { data: Math.random() });
      dataCacheStore.setValue(newCache);
      logger.info('💾 Cache updated', { size: newCache.size, strategy: 'reference' });
    };
    
    const updateFormField = () => {
      formStateStore.update(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          username: `user${Math.floor(Math.random() * 1000)}`
        },
        validation: {
          ...prev.validation,
          username: Math.random() > 0.5
        }
      }));
      logger.info('📝 Form field updated', { strategy: 'deep (maxDepth: 3)' });
    };
    
    return (
      <DemoCard title="Real-World Configuration Examples">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="font-semibold">User Profile (Shallow)</Label>
              <div className="text-sm space-y-1">
                <div>Name: {userProfile.name || 'John Doe'}</div>
                <div>Email: {userProfile.email || 'john@example.com'}</div>
                <div>Updated: {userProfile.lastUpdated}</div>
              </div>
              <div className="mt-2">
                <Button onClick={updateProfile} variant="primary" size="xs">
                  Update Profile
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <Label className="font-semibold">UI Preferences (Ignore Keys)</Label>
              <div className="text-sm space-y-1">
                <div>Theme: {uiPreferences.theme}</div>
                <div>Sidebar: {uiPreferences.sidebar ? 'visible' : 'hidden'}</div>
                <div>Updated: {uiPreferences.lastUpdated} (ignored)</div>
              </div>
              <div className="mt-2">
                <Button onClick={updatePreferences} variant="primary" size="xs">
                  Toggle Theme
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <Label className="font-semibold">Data Cache (Reference)</Label>
              <div className="text-sm space-y-1">
                <div>Size: {dataCache.size}</div>
                <div>Strategy: Reference equality</div>
                <div>Performance: Optimized</div>
              </div>
              <div className="mt-2">
                <Button onClick={updateCache} variant="primary" size="xs">
                  Add to Cache
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Label className="font-semibold">Form State (Deep)</Label>
              <div className="text-sm space-y-1">
                <div>Username: {formState.fields.username || 'user123'}</div>
                <div>Valid: {formState.validation.username ? '✅' : '❌'}</div>
                <div>Max Depth: 3 levels</div>
              </div>
              <div className="mt-2">
                <Button onClick={updateFormField} variant="primary" size="xs">
                  Update Form
                </Button>
              </div>
            </div>
          </div>

          <CodeExample>
{`// Real-world configuration patterns
const stores = createDeclarativeStorePattern('RealWorld', {
  // User data - shallow comparison for profile updates
  userProfile: {
    initialValue: { id: '', name: '', email: '', lastUpdated: 0 },
    strategy: 'shallow'
  },
  
  // UI preferences - ignore timestamps
  uiPreferences: {
    initialValue: { theme: 'light', sidebar: true, lastUpdated: 0 },
    strategy: 'shallow',
    comparisonOptions: { ignoreKeys: ['lastUpdated'] }
  },
  
  // Large dataset - reference equality for performance  
  dataCache: {
    initialValue: new Map(),
    strategy: 'reference'
  },
  
  // Form state - deep comparison for nested validation
  formState: {
    initialValue: { fields: {}, validation: {}, errors: {} },
    strategy: 'deep',
    comparisonOptions: { maxDepth: 3 }
  }
});`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Main Component
function StoreConfigurationPage() {
  return (
    <PageWithLogMonitor>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Store Configuration
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Performance optimization and custom comparison strategies for complex store scenarios. 
            Fine-grained control over store behavior and rendering performance.
          </p>
        </div>

        <div className="space-y-8">
          <Section title="Performance-Optimized Configuration">
            <PerformanceConfigurationDemo />
          </Section>

          <Section title="Comparison Strategies">
            <ComparisonStrategiesDemo />
          </Section>

          <Section title="Custom Comparators">
            <CustomComparatorDemo />
          </Section>
          
          <Section title="Real-World Examples">
            <RealWorldConfigurationDemo />
          </Section>

          <Section title="Configuration Guidelines">
            <DemoCard title="Best Practices">
              <div className="space-y-4">
                <div className="prose">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Strategy Selection:</strong> Choose the most efficient comparison strategy for your data type</li>
                    <li><strong>Reference:</strong> For immutable data and large objects where reference changes indicate updates</li>
                    <li><strong>Shallow:</strong> For simple objects with top-level property changes</li>
                    <li><strong>Deep:</strong> Only when necessary for nested objects with deep property changes</li>
                    <li><strong>Ignore Irrelevant Keys:</strong> Use <code>ignoreKeys</code> for timestamp and metadata fields</li>
                    <li><strong>Custom Comparators:</strong> Implement domain-specific comparison logic for optimal performance</li>
                    <li><strong>Performance Monitoring:</strong> Use debug mode and timing measurements in development</li>
                    <li><strong>Memory Management:</strong> Set appropriate <code>maxDepth</code> for nested objects</li>
                    <li><strong>Production Optimization:</strong> Disable debug mode in production builds</li>
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

export default StoreConfigurationPage;