import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore, useConditionalAction, useConditionalStoreManager } from '../stores';

export function FeatureFlagControls() {
  const featureFlagsStore = useConditionalStore('featureFlags');
  const featureFlags = useStoreValue(featureFlagsStore);
  const dispatch = useConditionalAction();

  const toggleFeature = (featureName: string) => {
    featureFlagsStore.update(flags => ({
      ...flags,
      [featureName]: !flags[featureName]
    }));
  };

  const handleProcessUser = () => {
    // Clear previous user data before processing
    const stores = useConditionalStoreManager();
    stores.getStore('basicUserData').setValue(null);
    
    dispatch('processUser', {
      userId: 'user-123',
      operation: 'profile-enhancement'
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">🎯 Feature Flag Controls</h3>
      
      <div className="space-y-2 mb-4">
        {Object.entries(featureFlags).map(([feature, enabled]) => (
          <label key={feature} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => toggleFeature(feature)}
            />
            <span className="text-sm">{feature}</span>
          </label>
        ))}
      </div>
      
      <button 
        onClick={handleProcessUser}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Process User
      </button>
      
      <p className="text-sm text-gray-600 mt-2">
        Enhanced processing only runs when feature flag is enabled.
      </p>
    </div>
  );
}