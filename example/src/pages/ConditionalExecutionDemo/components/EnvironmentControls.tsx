import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore, useConditionalAction } from '../stores';

export function EnvironmentControls() {
  const environmentStore = useConditionalStore('environment');
  const environment = useStoreValue(environmentStore);
  const dispatch = useConditionalAction();

  const handleDeploy = () => {
    dispatch('deployApplication', {
      version: `v${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      environment,
      features: ['new-ui', 'enhanced-security', 'performance-boost']
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">🌍 Environment-Based Deployment</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Target Environment:</label>
        <select 
          value={environment} 
          onChange={(e) => environmentStore.setValue(e.target.value as any)}
          className="border rounded px-3 py-1"
        >
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>
      
      <button 
        onClick={handleDeploy}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Deploy to {environment}
      </button>
      
      <p className="text-sm text-gray-600 mt-2">
        Each environment uses different deployment strategies and validation rules.
      </p>
    </div>
  );
}