import React from 'react';
import { useStoreValue } from '@context-action/react';
import { useConditionalStore, useConditionalStoreManager } from '../stores';
import { getLogIcon } from '../utils';

export function ResultsDisplay() {
  const deploymentResults = useStoreValue(useConditionalStore('deploymentResults'));
  const userResults = useStoreValue(useConditionalStore('userProcessingResults'));
  const systemResults = useStoreValue(useConditionalStore('systemResults'));
  const orderResults = useStoreValue(useConditionalStore('orderResults'));
  const scheduleResults = useStoreValue(useConditionalStore('scheduleResults'));
  const logs = useStoreValue(useConditionalStore('logs'));
  const logsStore = useConditionalStore('logs');

  const clearResults = () => {
    const stores = useConditionalStoreManager();
    stores.getStore('deploymentResults').setValue([]);
    stores.getStore('userProcessingResults').setValue([]);
    stores.getStore('systemResults').setValue([]);
    stores.getStore('orderResults').setValue([]);
    stores.getStore('scheduleResults').setValue([]);
    stores.getStore('basicUserData').setValue(null);
    stores.getStore('permissionCheckResult').setValue(null);
    stores.getStore('creditCheckResult').setValue(null);
    logsStore.setValue([]);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">📊 Execution Results</h3>
        <button 
          onClick={clearResults}
          className="text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Deployment Results */}
        {deploymentResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-600">🚀 Deployments</h4>
            {deploymentResults.map((result, index) => (
              <div key={index} className="bg-blue-50 p-2 rounded mt-1">
                <div className="text-sm">
                  <strong>{result.environment}</strong> - {result.version}
                  {result.previewUrl && (
                    <span className="text-blue-600 ml-2">({result.previewUrl})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Processing Results */}
        {userResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-600">👤 User Processing</h4>
            {userResults.map((result, index) => (
              <div key={index} className="bg-green-50 p-2 rounded mt-1">
                <div className="text-sm">
                  User: <strong>{result.userId}</strong> - 
                  Basic: {result.processed ? '✅' : '❌'} - 
                  Enhanced: {result.enhanced ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Results */}
        {systemResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-purple-600">🛠️ System Operations</h4>
            {systemResults.map((result, index) => (
              <div key={index} className="bg-purple-50 p-2 rounded mt-1">
                <div className="text-sm">
                  Operation: <strong>{result.operation}</strong> - 
                  Status: {result.success ? '✅' : '❌'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Results */}
        {orderResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-indigo-600">💰 Order Processing</h4>
            {orderResults.map((result, index) => (
              <div key={index} className="bg-indigo-50 p-2 rounded mt-1">
                <div className="text-sm">
                  Order: <strong>{result.orderId}</strong> - 
                  ${result.originalAmount} → ${result.finalAmount} 
                  {result.discountApplied && (
                    <span className="text-green-600"> ({result.discountPercentage}% off)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Results */}
        {scheduleResults.length > 0 && (
          <div>
            <h4 className="font-semibold text-yellow-600">⏰ Scheduled Tasks</h4>
            {scheduleResults.map((result, index) => (
              <div key={index} className="bg-yellow-50 p-2 rounded mt-1">
                <div className="text-sm">
                  Task: <strong>{result.result?.type}</strong> - 
                  {result.processedDuringBusinessHours ? '🏢 Business Hours' : '🌙 Off Hours'}
                  {result.deferred && ' (Deferred)'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity Logs */}
        {logs.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-600">📋 Activity Log</h4>
            <div className="bg-gray-50 p-2 rounded mt-1 max-h-40 overflow-y-auto">
              {logs.slice(-10).map((log, index) => (
                <div key={index} className="text-xs mb-1">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="ml-2">
                    {getLogIcon(log.level)} {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}