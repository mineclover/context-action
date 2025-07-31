/**
 * Counter component demonstrating numeric store usage
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, NumericStore } from '@context-action/react';

interface CounterState {
  value: number;
  step: number;
  history: number[];
}

const CounterDemo: React.FC = () => {
  const registry = useStoreRegistry();
  
  // Get or create the counter store
  const [counterStore] = useState(() => {
    let store = registry.getStore('counter') as NumericStore;
    if (!store) {
      store = new NumericStore('counter', 0);
      registry.register('counter', store);
    }
    return store;
  });

  const [counterValue, setCounterValue] = useState(() => counterStore.getValue());
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState<number[]>([counterStore.getValue()]);
  
  // Subscribe to store changes
  useState(() => {
    const unsubscribe = counterStore.subscribe(() => {
      const newValue = counterStore.getValue();
      setCounterValue(newValue);
      setHistory(prev => [...prev.slice(-9), newValue]); // Keep last 10 entries
    });
    return unsubscribe;
  });

  const counterState: CounterState = {
    value: counterValue,
    step,
    history
  };
  
  if (!counterStore) {
    return (
      <div style={cardStyle}>
        <h3>🔢 Counter Demo</h3>
        <p>Counter store loading...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>🔢 Counter Demo</h3>
      <p style={descriptionStyle}>
        Demonstrates a numeric store with history tracking and step control.
      </p>

      <div style={valueDisplayStyle}>
        <div style={mainValueStyle}>{counterState.value}</div>
        <div style={metaStyle}>
          Step: {counterState.step} | History: {counterState.history.length} entries
        </div>
      </div>

      <div style={buttonGroupStyle}>
        <button
          style={buttonStyle}
          onClick={() => counterStore.decrement(step)}
        >
          -{step}
        </button>
        <button
          style={buttonStyle}
          onClick={() => counterStore.increment(step)}
        >
          +{step}
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#f59e0b' }}
          onClick={() => counterStore.reset()}
        >
          Reset
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#8b5cf6' }}
          onClick={() => {
            if (history.length > 1) {
              const previousValue = history[history.length - 2];
              counterStore.setValue(previousValue);
            }
          }}
          disabled={counterState.history.length <= 1}
        >
          Undo
        </button>
      </div>

      <div style={controlsStyle}>
        <label style={labelStyle}>
          Step size:
          <select
            style={selectStyle}
            value={counterState.step}
            onChange={(e) => setStep(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {counterState.history.length > 1 && (
        <div style={historyStyle}>
          <strong>Recent history:</strong>
          <div style={historyListStyle}>
            {counterState.history.slice(-5).map((value, index) => (
              <span
                key={index}
                style={{
                  ...historyItemStyle,
                  backgroundColor: index === counterState.history.slice(-5).length - 1 ? '#dbeafe' : '#f3f4f6'
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#1e293b',
  fontSize: '1.25rem',
  fontWeight: '600'
};

const descriptionStyle: React.CSSProperties = {
  margin: '0 0 20px 0',
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.4'
};

const valueDisplayStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px'
};

const mainValueStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 'bold',
  color: '#3b82f6',
  margin: '0 0 8px 0'
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#64748b'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '20px',
  flexWrap: 'wrap'
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  minWidth: '60px',
  transition: 'all 0.2s'
};

const controlsStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: '#374151'
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '0.9rem'
};

const historyStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#374151'
};

const historyListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginTop: '8px',
  flexWrap: 'wrap'
};

const historyItemStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '500'
};

export default CounterDemo;