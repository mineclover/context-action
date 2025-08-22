import React, { useState, useEffect } from 'react';
import { handlerRegistry } from '../handlers/core/HandlerRegistry';
import { availableModules } from '../handlers/modules';

export function HandlerManagementPanel() {
  const [moduleOverview, setModuleOverview] = useState<any[]>([]);
  const [handlerMetrics, setHandlerMetrics] = useState<any>({});
  const [executionStats, setExecutionStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'modules' | 'handlers' | 'stats'>('modules');

  // Update data periodically
  useEffect(() => {
    const updateData = () => {
      setModuleOverview(handlerRegistry.getModuleOverview());
      setHandlerMetrics(handlerRegistry.getHandlerMetrics());
      setExecutionStats(handlerRegistry.getExecutionStats());
    };

    updateData();
    const interval = setInterval(updateData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleModuleToggle = (moduleName: string, isActive: boolean) => {
    if (isActive) {
      handlerRegistry.activateModule(moduleName);
    } else {
      handlerRegistry.deactivateModule(moduleName);
    }
    setModuleOverview(handlerRegistry.getModuleOverview());
    setHandlerMetrics(handlerRegistry.getHandlerMetrics());
  };

  const getModuleConfig = (moduleName: string) => {
    return Object.entries(availableModules).find(([key]) => 
      key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase() === moduleName
    )?.[1];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environment': return 'bg-blue-50 text-blue-700';
      case 'business': return 'bg-purple-50 text-purple-700';
      case 'permission': return 'bg-yellow-50 text-yellow-700';
      case 'feature': return 'bg-green-50 text-green-700';
      case 'schedule': return 'bg-pink-50 text-pink-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">🔧 Handler Management System</h3>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-3 py-2 rounded text-sm ${
            activeTab === 'modules' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Modules
        </button>
        <button
          onClick={() => setActiveTab('handlers')}
          className={`px-3 py-2 rounded text-sm ${
            activeTab === 'handlers' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ⚡ Handlers
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-2 rounded text-sm ${
            activeTab === 'stats' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Statistics
        </button>
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {/* System Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded border">
              <div className="text-sm text-blue-600">Total Modules</div>
              <div className="text-lg font-semibold text-blue-800">{handlerMetrics.totalModules || 0}</div>
            </div>
            <div className="bg-green-50 p-3 rounded border">
              <div className="text-sm text-green-600">Active Modules</div>
              <div className="text-lg font-semibold text-green-800">{handlerMetrics.activeModules || 0}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded border">
              <div className="text-sm text-purple-600">Active Handlers</div>
              <div className="text-lg font-semibold text-purple-800">{handlerMetrics.totalActiveHandlers || 0}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded border">
              <div className="text-sm text-yellow-600">Dependencies</div>
              <div className="text-lg font-semibold text-yellow-800">
                {handlerMetrics.dependencyErrors?.length || 0} errors
              </div>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-3">
            {moduleOverview.map((module) => {
              const config = getModuleConfig(module.name);
              return (
                <div key={module.name} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{config?.name || module.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(config?.category || 'default')}`}>
                        {config?.category || module.category}
                      </span>
                      {config?.priority && (
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(config.priority)}`}>
                          {config.priority}
                        </span>
                      )}
                    </div>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={module.isActive}
                        onChange={(e) => handleModuleToggle(module.name, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{module.isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {config?.description || module.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Handlers: {module.activeHandlerCount}/{module.handlerCount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dependency Errors */}
          {handlerMetrics.dependencyErrors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Dependency Issues</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {handlerMetrics.dependencyErrors.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Handlers Tab */}
      {activeTab === 'handlers' && (
        <div className="space-y-4">
          {/* Category Distribution */}
          <div>
            <h4 className="font-medium mb-2">Handlers by Category</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(handlerMetrics.categoriesDistribution || {}).map(([category, count]) => (
                <span 
                  key={category}
                  className={`px-3 py-1 rounded text-sm ${getCategoryColor(category)}`}
                >
                  {category}: {count as number}
                </span>
              ))}
            </div>
          </div>

          {/* Tag Distribution */}
          <div>
            <h4 className="font-medium mb-2">Handler Tags</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(handlerMetrics.tagsDistribution || {}).map(([tag, count]) => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {tag} ({count as number})
                </span>
              ))}
            </div>
          </div>

          {/* Active Handlers by Category */}
          {Object.entries(handlerMetrics.categoriesDistribution || {}).map(([category, count]) => (
            <div key={category} className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(category)}`}>
                  {category}
                </span>
                <span className="text-sm text-gray-600">({count as number} handlers)</span>
              </div>
              
              <div className="space-y-1">
                {handlerRegistry.getActiveHandlersByCategory(category).map((handler) => (
                  <div key={handler.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{handler.id}</span>
                      <span className="text-gray-500 ml-2">Priority: {handler.priority}</span>
                    </div>
                    <div className="flex gap-1">
                      {handler.tags.map(tag => (
                        <span key={tag} className="px-1 py-0.5 bg-white text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Execution Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded border">
              <div className="text-sm text-blue-600">Total Executions</div>
              <div className="text-lg font-semibold text-blue-800">{executionStats.totalExecutions || 0}</div>
            </div>
            <div className="bg-green-50 p-3 rounded border">
              <div className="text-sm text-green-600">Success Rate</div>
              <div className="text-lg font-semibold text-green-800">
                {executionStats.successRate?.toFixed(1) || 0}%
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded border">
              <div className="text-sm text-purple-600">Avg Execution Time</div>
              <div className="text-lg font-semibold text-purple-800">
                {executionStats.averageExecutionTime?.toFixed(1) || 0}ms
              </div>
            </div>
          </div>

          {/* Recent Executions */}
          <div>
            <h4 className="font-medium mb-2">Recent Executions</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {executionStats.recentExecutions?.map((execution: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between text-sm p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      execution.success ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">{execution.handlerId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>{execution.executionTime.toFixed(1)}ms</span>
                    <span>{new Date(execution.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}