import { useState } from 'react';
import { Store, NumericStore } from '@context-action/react';

export function StoreBasicsPage() {
  const [simpleStore] = useState(() => new Store('simple', { count: 0, message: 'Hello' }));
  const [numericStore] = useState(() => new NumericStore('numeric', 0));
  
  const [simpleValue, setSimpleValue] = useState(simpleStore.getValue());
  const [numericValue, setNumericValue] = useState(numericStore.getValue());

  // Subscribe to stores
  useState(() => {
    const unsubSimple = simpleStore.subscribe(() => {
      setSimpleValue(simpleStore.getValue());
    });
    
    const unsubNumeric = numericStore.subscribe(() => {
      setNumericValue(numericStore.getValue());
    });
    
    return () => {
      unsubSimple();
      unsubNumeric();
    };
  });

  return (
    <div className="page-content">
      <h3>Store Basics</h3>
      <p className="text-gray-600 mb-6">
        Learn the fundamentals of the Store system with basic examples.
      </p>

      <div className="example-section">
        <h4>Basic Store</h4>
        <div className="example-card">
          <pre className="code-block">
{`const store = new Store('myStore', { count: 0, message: 'Hello' });

// Subscribe to changes
const unsubscribe = store.subscribe(() => {
  console.log('Store updated:', store.getValue());
});

// Update value
store.setValue({ count: 1, message: 'Updated' });

// Update with function
store.update(current => ({
  ...current,
  count: current.count + 1
}));`}
          </pre>
          
          <div className="demo-section">
            <div className="demo-value">
              <strong>Current Value:</strong>
              <pre>{JSON.stringify(simpleValue, null, 2)}</pre>
            </div>
            
            <div className="demo-controls">
              <button
                onClick={() => simpleStore.setValue({ count: simpleValue.count + 1, message: simpleValue.message })}
                className="btn btn-primary"
              >
                Increment Count
              </button>
              
              <button
                onClick={() => simpleStore.update(v => ({ ...v, message: `Updated at ${new Date().toLocaleTimeString()}` }))}
                className="btn btn-secondary"
              >
                Update Message
              </button>
              
              <button
                onClick={() => simpleStore.setValue({ count: 0, message: 'Hello' })}
                className="btn btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="example-section">
        <h4>Numeric Store</h4>
        <div className="example-card">
          <pre className="code-block">
{`const numericStore = new NumericStore('counter', 0);

// Numeric-specific methods
numericStore.increment();      // +1
numericStore.increment(5);     // +5
numericStore.decrement(2);     // -2
numericStore.multiply(3);      // *3
numericStore.divide(2);        // /2
numericStore.reset();          // Back to initial value`}
          </pre>
          
          <div className="demo-section">
            <div className="demo-value">
              <strong>Current Value:</strong> {numericValue}
            </div>
            
            <div className="demo-controls">
              <button onClick={() => numericStore.increment()} className="btn btn-primary">
                +1
              </button>
              <button onClick={() => numericStore.increment(5)} className="btn btn-primary">
                +5
              </button>
              <button onClick={() => numericStore.decrement()} className="btn btn-secondary">
                -1
              </button>
              <button onClick={() => numericStore.multiply(2)} className="btn btn-secondary">
                ×2
              </button>
              <button onClick={() => numericStore.divide(2)} className="btn btn-secondary">
                ÷2
              </button>
              <button onClick={() => numericStore.reset()} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="example-section">
        <h4>Store Snapshot</h4>
        <div className="example-card">
          <pre className="code-block">
{`// Get store snapshot
const snapshot = store.getSnapshot();

// Snapshot contains:
{
  value: T,              // Current value
  name: string,          // Store name
  lastUpdate: number     // Timestamp of last update
}`}
          </pre>
          
          <div className="demo-section">
            <div className="demo-value">
              <strong>Simple Store Snapshot:</strong>
              <pre>{JSON.stringify(simpleStore.getSnapshot(), null, 2)}</pre>
            </div>
            
            <div className="demo-value">
              <strong>Numeric Store Snapshot:</strong>
              <pre>{JSON.stringify(numericStore.getSnapshot(), null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>

      <div className="example-section">
        <h4>Key Concepts</h4>
        <div className="concept-grid">
          <div className="concept-card">
            <h5>🔄 Subscriptions</h5>
            <p>Subscribe to store changes and get notified when values update.</p>
          </div>
          
          <div className="concept-card">
            <h5>📸 Snapshots</h5>
            <p>Get immutable snapshots of store state including metadata.</p>
          </div>
          
          <div className="concept-card">
            <h5>🎯 Type Safety</h5>
            <p>Full TypeScript support with generics for type-safe stores.</p>
          </div>
          
          <div className="concept-card">
            <h5>🚀 Performance</h5>
            <p>Optimized for React with useSyncExternalStore integration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}