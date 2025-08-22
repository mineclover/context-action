/**
 * @fileoverview Priority Management Demo Page (Modularized Version)
 * 
 * Comprehensive live demonstration of the LLMS Generator Priority Management System
 * using the new modular architecture with shared types and utilities.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/ui';

// Import from the new modular structure
import { 
  SAMPLE_DOCUMENTS, 
  DEFAULT_CRITERIA,
  usePriorityCalculation,
  useHealthMetrics,
  PriorityCalculationControls,
  PriorityHealthMonitor,
  MultilingualProcessingSimulator,
  PriorityAnalyticsDashboard,
  type Document,
  type PriorityCalculationCriteria 
} from '../../features/priority-management';

type TabType = 'overview' | 'calculation' | 'health' | 'analytics' | 'multilingual';

export function PriorityManagementDemoPageV2() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'ko'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  // Use modular hooks
  const {
    documents,
    criteria,
    applyCalculation,
    setCriteria,
    resetDocuments
  } = usePriorityCalculation(SAMPLE_DOCUMENTS);

  const { healthMetrics } = useHealthMetrics(documents, [], languageFilter, categoryFilter);

  // Initialize criteria if not set
  const currentCriteria = criteria || DEFAULT_CRITERIA;

  const handleCriteriaChange = (newCriteria: PriorityCalculationCriteria) => {
    setCriteria(newCriteria);
  };

  const handleApplyCalculation = (newCriteria: PriorityCalculationCriteria) => {
    applyCalculation(newCriteria);
  };

  const filteredDocuments = documents.filter(doc => {
    const languageMatch = languageFilter === 'all' || doc.language === languageFilter;
    const categoryMatch = categoryFilter === 'all' || doc.category === categoryFilter;
    return languageMatch && categoryMatch;
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* System Status */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📊 System Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                  <div className="text-sm text-blue-800">Total Documents</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{healthMetrics.overallScore}</div>
                  <div className="text-sm text-green-800">Health Score</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {documents.filter(d => d.language === 'en').length}/{documents.filter(d => d.language === 'ko').length}
                  </div>
                  <div className="text-sm text-purple-800">EN/KO Docs</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{healthMetrics.issues.length}</div>
                  <div className="text-sm text-orange-800">Active Issues</div>
                </div>
              </div>
            </Card>

            {/* Document List */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📋 Document Priorities</h2>
              <div className="space-y-3">
                {filteredDocuments
                  .sort((a, b) => b.priority - a.priority)
                  .slice(0, 6)
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-gray-600">
                          {doc.category} • {doc.language} • {doc.status} • 
                          Modified {Math.ceil((Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          doc.priority >= 90 ? 'bg-red-100 text-red-800' :
                          doc.priority >= 80 ? 'bg-orange-100 text-orange-800' :
                          doc.priority >= 60 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.priority}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        );

      case 'calculation':
        return (
          <PriorityCalculationControls
            criteria={currentCriteria}
            onCriteriaChange={handleCriteriaChange}
            documents={documents}
            onApplyCalculation={handleApplyCalculation}
          />
        );

      case 'health':
        return (
          <PriorityHealthMonitor
            documents={filteredDocuments}
            languageFilter={languageFilter}
            categoryFilter={categoryFilter}
          />
        );

      case 'analytics':
        return (
          <PriorityAnalyticsDashboard
            documents={filteredDocuments}
          />
        );

      case 'multilingual':
        return <MultilingualProcessingSimulator />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="page-header">
          <h1>📊 Priority Management System Demo (Modular)</h1>
          <p className="page-description">
            Modularized version using shared types, utilities, and hooks.
            Comprehensive demonstration with advanced priority calculation algorithms, 
            health monitoring, multilingual processing simulation, and analytics dashboard.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link
              to="/demos"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              📋 Back to Demos
            </Link>
            <Link
              to="/demos/priority-management"
              className="text-purple-600 hover:text-purple-800 underline text-sm"
            >
              🔄 View Original Version
            </Link>
          </div>
        </header>

        {/* Tab Navigation */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🎛️ Priority Management System</h2>
            
            {/* Global Filters */}
            <div className="flex gap-3">
              <select 
                value={languageFilter} 
                onChange={(e) => setLanguageFilter(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Languages</option>
                <option value="en">🇺🇸 English</option>
                <option value="ko">🇰🇷 Korean</option>
              </select>
              
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="guide">📖 Guide</option>
                <option value="concept">💡 Concept</option>
                <option value="examples">🛠️ Examples</option>
                <option value="reference">📚 Reference</option>
              </select>

              <Button
                onClick={() => resetDocuments(SAMPLE_DOCUMENTS)}
                variant="outline"
                size="sm"
              >
                🔄 Reset Data
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: '🏠 Overview', icon: '🏠' },
              { key: 'calculation', label: '⚙️ Priority Calculation', icon: '⚙️' },
              { key: 'health', label: '🏥 Health Monitor', icon: '🏥' },
              { key: 'analytics', label: '📈 Analytics Dashboard', icon: '📈' },
              { key: 'multilingual', label: '🌐 Multilingual Processing', icon: '🌐' }
            ].map(tab => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                variant={activeTab === tab.key ? 'primary' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
                <span className="sm:hidden">{tab.icon}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default PriorityManagementDemoPageV2;