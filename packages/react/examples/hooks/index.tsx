/**
 * React Hooks Examples Index
 * 
 * A comprehensive showcase of all Context-Action React hooks with interactive examples
 */

import React, { useState } from 'react';

// Import all hook examples
import UseStoreValueExamples from './essential/useStoreValue-example';
import UseLocalStoreExamples from './essential/useLocalStore-example';
import UseStoreSelectorExamples from './utility/useStoreSelector-example';
import UseComputedStoreExamples from './utility/useComputedStore-example';

// Hook categories for navigation
const hookCategories = {
  essential: {
    title: 'Essential Hooks',
    description: 'Core hooks that most applications will need',
    hooks: [
      {
        name: 'useStoreValue',
        description: 'Subscribe to store values with reactive updates',
        component: UseStoreValueExamples,
        frequency: 'High (>80%)',
        complexity: 'Simple'
      },
      {
        name: 'useLocalStore',
        description: 'Create component-local stores for complex state',
        component: UseLocalStoreExamples,
        frequency: 'Medium (20-80%)',
        complexity: 'Simple'
      }
    ]
  },
  utility: {
    title: 'Utility Hooks',
    description: 'Performance optimization and convenience features',
    hooks: [
      {
        name: 'useStoreSelector',
        description: 'Performance optimization through selective subscriptions',
        component: UseStoreSelectorExamples,
        frequency: 'Medium (20-80%)',
        complexity: 'Intermediate'
      },
      {
        name: 'useStoreActions',
        description: 'Memoized store action methods',
        component: () => <div>Coming soon...</div>,
        frequency: 'Low (<20%)',
        complexity: 'Simple'
      },
      {
        name: 'useComputedStore',
        description: 'Derived state from store values',
        component: UseComputedStoreExamples,
        frequency: 'Low (<20%)',
        complexity: 'Intermediate'
      },
      {
        name: 'usePersistedStore',
        description: 'Browser storage synchronization',
        component: () => <div>Coming soon...</div>,
        frequency: 'Low (<20%)',
        complexity: 'Intermediate'
      }
    ]
  },
  patterns: {
    title: 'Pattern Hooks',
    description: 'Factory functions that create multiple hooks',
    hooks: [
      {
        name: 'createDeclarativeStorePattern',
        description: 'Type-safe store pattern factory',
        component: () => <div>Coming soon...</div>,
        frequency: 'High (>80%)',
        complexity: 'Simple'
      },
      {
        name: 'createActionContext',
        description: 'Action context factory for business logic',
        component: () => <div>Coming soon...</div>,
        frequency: 'High (>80%)',
        complexity: 'Intermediate'
      }
    ]
  }
};

// Navigation component
function HookNavigation({ 
  selectedCategory, 
  selectedHook, 
  onCategoryChange, 
  onHookChange 
}: {
  selectedCategory: string;
  selectedHook: string;
  onCategoryChange: (category: string) => void;
  onHookChange: (hook: string) => void;
}) {
  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h2>Hook Examples Navigation</h2>
      
      {Object.entries(hookCategories).map(([categoryKey, category]) => (
        <div key={categoryKey} style={{ marginBottom: '20px' }}>
          <h3 
            style={{ 
              cursor: 'pointer', 
              color: selectedCategory === categoryKey ? '#007bff' : '#333',
              borderBottom: selectedCategory === categoryKey ? '2px solid #007bff' : 'none',
              display: 'inline-block',
              marginBottom: '10px'
            }}
            onClick={() => onCategoryChange(categoryKey)}
          >
            {category.title}
          </h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>
            {category.description}
          </p>
          
          {selectedCategory === categoryKey && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
              {category.hooks.map(hook => (
                <div 
                  key={hook.name}
                  style={{
                    padding: '15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: selectedHook === hook.name ? '#e7f3ff' : 'white',
                    borderColor: selectedHook === hook.name ? '#007bff' : '#dee2e6'
                  }}
                  onClick={() => onHookChange(hook.name)}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>
                    {hook.name}
                  </h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                    {hook.description}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                    <span style={{ 
                      backgroundColor: hook.frequency.includes('High') ? '#28a745' : 
                                     hook.frequency.includes('Medium') ? '#ffc107' : '#6c757d',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}>
                      {hook.frequency}
                    </span>
                    <span style={{ 
                      backgroundColor: hook.complexity === 'Simple' ? '#28a745' : 
                                     hook.complexity === 'Intermediate' ? '#ffc107' : '#dc3545',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}>
                      {hook.complexity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Overview component
function HooksOverview() {
  const totalHooks = Object.values(hookCategories)
    .reduce((sum, category) => sum + category.hooks.length, 0);
  
  const hooksByFrequency = Object.values(hookCategories)
    .flatMap(category => category.hooks)
    .reduce((acc, hook) => {
      const frequency = hook.frequency.includes('High') ? 'high' : 
                       hook.frequency.includes('Medium') ? 'medium' : 'low';
      acc[frequency] = (acc[frequency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div style={{ 
      backgroundColor: '#fff', 
      padding: '30px', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h1>Context-Action React Hooks</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Interactive examples and documentation for all React hooks in the Context-Action framework.
        Learn through practical examples with live code demonstrations.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '36px', margin: '0', color: '#007bff' }}>{totalHooks}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Hooks</p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '36px', margin: '0', color: '#28a745' }}>{hooksByFrequency.high || 0}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Essential Hooks</p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '36px', margin: '0', color: '#ffc107' }}>{hooksByFrequency.medium || 0}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Utility Hooks</p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '36px', margin: '0', color: '#6c757d' }}>{hooksByFrequency.low || 0}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Specialized Hooks</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h3>🎯 Learning Path</h3>
          <ol>
            <li><strong>Essential Hooks:</strong> Start with useStoreValue and useLocalStore</li>
            <li><strong>Utility Hooks:</strong> Add performance optimization with useStoreSelector</li>
            <li><strong>Pattern Hooks:</strong> Use factory functions for larger applications</li>
            <li><strong>Specialized Hooks:</strong> Add advanced features as needed</li>
          </ol>
        </div>
        
        <div>
          <h3>📊 Usage Guidelines</h3>
          <ul>
            <li><span style={{ color: '#28a745' }}>■</span> <strong>High Frequency:</strong> Used in >80% of components</li>
            <li><span style={{ color: '#ffc107' }}>■</span> <strong>Medium Frequency:</strong> Used in 20-80% of components</li>
            <li><span style={{ color: '#6c757d' }}>■</span> <strong>Low Frequency:</strong> Used in <20% of components</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Main component
export function HookExamplesIndex() {
  const [selectedCategory, setSelectedCategory] = useState('essential');
  const [selectedHook, setSelectedHook] = useState('useStoreValue');
  
  // Find the selected hook component
  const selectedHookData = Object.values(hookCategories)
    .flatMap(category => category.hooks)
    .find(hook => hook.name === selectedHook);
  
  const SelectedComponent = selectedHookData?.component || (() => <div>Hook not found</div>);
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <HooksOverview />
        
        <HookNavigation
          selectedCategory={selectedCategory}
          selectedHook={selectedHook}
          onCategoryChange={setSelectedCategory}
          onHookChange={setSelectedHook}
        />
        
        {selectedHook && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '20px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h2 style={{ margin: 0 }}>
                {selectedHook} Examples
              </h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                {selectedHookData?.description}
              </p>
            </div>
            
            <div style={{ backgroundColor: 'white' }}>
              <SelectedComponent />
            </div>
          </div>
        )}
        
        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <h3>Need Help?</h3>
          <p>
            Check out the <strong>HOOKS_REFERENCE.md</strong> for complete documentation, 
            or visit the <strong>PATTERN_GUIDE.md</strong> for architectural guidance.
          </p>
          <p>
            All examples are interactive and include TypeScript types for better understanding.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HookExamplesIndex;