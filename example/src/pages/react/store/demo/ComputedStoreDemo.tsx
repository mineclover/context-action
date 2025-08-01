/**
 * Computed store demonstration component
 */

import type React from 'react';
import { useState } from 'react';
import { useStoreRegistry, Store, useStoreValue } from '@context-action/react';

interface CounterState {
  value: number;
  step: number;
  history: number[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

interface StatisticsData {
  totalActions: number;
  cartItemCount: number;
  cartValue: number;
  lastActivity: number;
}

class ComputedStore extends Store<StatisticsData> {
  constructor(name: string) {
    super(name, {
      totalActions: 0,
      cartItemCount: 0,
      cartValue: 0,
      lastActivity: Date.now()
    });
  }

  updateStatistics(counter: CounterState | null, cart: Cart | null) {
    const stats: StatisticsData = {
      totalActions: counter?.history?.length || 0,
      cartItemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      cartValue: cart?.total || 0,
      lastActivity: Date.now()
    };
    this.setValue(stats);
  }
}

const ComputedStoreDemo: React.FC = () => {
  const registry = useStoreRegistry();
  
  // Get stores from registry
  const counterStore = registry.getStore('counter');
  const cartStore = registry.getStore('cart');
  
  // Create computed store
  const [computedStore] = useState(() => {
    let store = registry.getStore('computed-stats') as ComputedStore;
    if (!store) {
      store = new ComputedStore('computed-stats');
      registry.register('computed-stats', store);
    }
    return store;
  });
  
  const counterValue = useStoreValue(counterStore) as CounterState | null;
  const cartValue = useStoreValue(cartStore) as Cart | null;
  const statisticsValue = useStoreValue(computedStore);

  // Update computed statistics whenever dependent stores change
  useState(() => {
    const updateStats = () => {
      computedStore.updateStatistics(counterValue, cartValue);
    };
    
    updateStats(); // Initial update
    
    // Subscribe to changes
    const unsubCounter = counterStore?.subscribe(updateStats);
    const unsubCart = cartStore?.subscribe(updateStats);
    
    return () => {
      unsubCounter?.();
      unsubCart?.();
    };
  });

  if (!computedStore) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>📊 Computed Store Demo</h3>
        <p style={descriptionStyle}>
          Waiting for dependent stores to be registered...
        </p>
        <div style={loadingStyle}>
          <div>Counter Store: {counterStore ? '✅' : '❌'}</div>
          <div>Cart Store: {cartStore ? '✅' : '❌'}</div>
          <div>Statistics Store: {computedStore ? '✅' : '❌'}</div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getActivityLevel = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 5000) return { level: 'High', color: '#10b981', icon: '🔥' };
    if (diff < 30000) return { level: 'Medium', color: '#f59e0b', icon: '⚡' };
    return { level: 'Low', color: '#64748b', icon: '😴' };
  };

  if (!statisticsValue) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>📊 Computed Store Demo</h3>
        <p style={descriptionStyle}>Loading statistics...</p>
      </div>
    );
  }

  const activity = getActivityLevel(statisticsValue.lastActivity);

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>📊 Computed Store Demo</h3>
      <p style={descriptionStyle}>
        This store automatically computes values from Counter and Cart stores.
        Values update in real-time as dependencies change.
      </p>

      <div style={computedValueStyle}>
        <h4 style={computedTitleStyle}>Computed Statistics</h4>
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statIconStyle}>🔢</div>
            <div style={statContentStyle}>
              <div style={statValueStyle}>{statisticsValue.totalActions}</div>
              <div style={statLabelStyle}>Total Counter Actions</div>
              <div style={statDescStyle}>
                Steps in counter history
              </div>
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle}>🛒</div>
            <div style={statContentStyle}>
              <div style={statValueStyle}>{statisticsValue.cartItemCount}</div>
              <div style={statLabelStyle}>Cart Items</div>
              <div style={statDescStyle}>
                Total quantity of items
              </div>
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle}>💰</div>
            <div style={statContentStyle}>
              <div style={statValueStyle}>{formatPrice(statisticsValue.cartValue)}</div>
              <div style={statLabelStyle}>Cart Value</div>
              <div style={statDescStyle}>
                Total cart worth
              </div>
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle}>{activity.icon}</div>
            <div style={statContentStyle}>
              <div style={{ ...statValueStyle, color: activity.color }}>
                {activity.level}
              </div>
              <div style={statLabelStyle}>Activity Level</div>
              <div style={statDescStyle}>
                Based on last update time
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={dependenciesStyle}>
        <h4 style={dependenciesTitleStyle}>Dependencies</h4>
        <div style={dependencyListStyle}>
          <div style={dependencyItemStyle}>
            <div style={dependencyHeaderStyle}>
              <span style={dependencyNameStyle}>Counter Store</span>
              <span style={dependencyStatusStyle}>Connected</span>
            </div>
            <div style={dependencyInfoStyle}>
              Current Value: <code>{counterValue?.value || 'N/A'}</code> | 
              History Length: <code>{counterValue?.history?.length || 0}</code>
            </div>
          </div>

          <div style={dependencyItemStyle}>
            <div style={dependencyHeaderStyle}>
              <span style={dependencyNameStyle}>Cart Store</span>
              <span style={dependencyStatusStyle}>Connected</span>
            </div>
            <div style={dependencyInfoStyle}>
              Items: <code>{cartValue?.items?.length || 0}</code> | 
              Total: <code>{formatPrice(cartValue?.total || 0)}</code>
            </div>
          </div>
        </div>
      </div>

      <div style={computationLogicStyle}>
        <h4 style={logicTitleStyle}>Computation Logic</h4>
        <div style={logicContentStyle}>
          <div style={logicItemStyle}>
            <strong>Total Actions:</strong> Counter history length
          </div>
          <div style={logicItemStyle}>
            <strong>Cart Item Count:</strong> Sum of all item quantities
          </div>
          <div style={logicItemStyle}>
            <strong>Cart Value:</strong> Sum of (price × quantity) for all items
          </div>
          <div style={logicItemStyle}>
            <strong>Last Activity:</strong> Most recent update timestamp from any dependency
          </div>
        </div>
      </div>

      <div style={realTimeStyle}>
        <div style={realTimeHeaderStyle}>
          <span style={realTimeIconStyle}>⚡</span>
          <span>Real-time Updates</span>
        </div>
        <div style={realTimeInfoStyle}>
          <div>Last Updated: {new Date(statisticsValue.lastActivity).toLocaleTimeString()}</div>
          <div style={realtimeTipStyle}>
            Try modifying the counter or cart to see instant updates!
          </div>
        </div>
      </div>

      <div style={infoStyle}>
        <small>
          💡 Computed stores are read-only and automatically update when their 
          dependencies change. They're perfect for derived values like totals, 
          averages, or complex calculations based on multiple stores.
        </small>
      </div>
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

const loadingStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  fontSize: '0.9rem'
};

const computedValueStyle: React.CSSProperties = {
  marginBottom: '24px'
};

const computedTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px'
};

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const statIconStyle: React.CSSProperties = {
  fontSize: '2rem',
  flexShrink: 0
};

const statContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#1e293b',
  lineHeight: '1.2'
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#64748b',
  fontWeight: '500',
  marginTop: '2px'
};

const statDescStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  marginTop: '2px'
};

const dependenciesStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const dependenciesTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const dependencyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const dependencyItemStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#f1f5f9',
  borderRadius: '6px',
  border: '1px solid #e2e8f0'
};

const dependencyHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px'
};

const dependencyNameStyle: React.CSSProperties = {
  fontWeight: '500',
  color: '#1e293b',
  fontSize: '0.9rem'
};

const dependencyStatusStyle: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  borderRadius: '3px',
  fontSize: '0.7rem',
  fontWeight: '500'
};

const dependencyInfoStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#64748b',
  fontFamily: 'monospace'
};

const computationLogicStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const logicTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#374151',
  fontSize: '1rem',
  fontWeight: '500'
};

const logicContentStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#fef7ff',
  borderRadius: '6px',
  border: '1px solid #e879f9'
};

const logicItemStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#374151',
  marginBottom: '6px',
  lineHeight: '1.4'
};

const realTimeStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#ecfdf5',
  borderRadius: '6px',
  border: '1px solid #10b981',
  marginBottom: '16px'
};

const realTimeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontWeight: '500',
  color: '#065f46',
  fontSize: '0.9rem',
  marginBottom: '4px'
};

const realTimeIconStyle: React.CSSProperties = {
  fontSize: '1rem'
};

const realTimeInfoStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#064e3b'
};

const realtimeTipStyle: React.CSSProperties = {
  marginTop: '4px',
  fontStyle: 'italic',
  color: '#047857'
};

const infoStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
  color: '#64748b'
};

export default ComputedStoreDemo;