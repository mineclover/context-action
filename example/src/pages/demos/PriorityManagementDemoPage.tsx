/**
 * @fileoverview Priority Management System Live Demo
 * 
 * Live demonstration of the Priority Management System showcasing:
 * - Automated priority calculation with multiple algorithms
 * - Health monitoring with 0-100 scoring system  
 * - Multilingual document processing simulation
 * - Priority statistics and analytics
 * - Data-driven suggestion system
 * - Real-time priority optimization
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge } from '../../components/ui';
import { 
  PriorityCalculationControls,
  PriorityHealthMonitor,
  MultilingualProcessingSimulator,
  PriorityAnalyticsDashboard,
  type PriorityCalculationCriteria
} from '../../features/priority-management';

// Types for priority management system
interface Document {
  id: string;
  title: string;
  category: 'guide' | 'concept' | 'examples' | 'reference';
  language: 'en' | 'ko';
  size: number; // character count
  priority: number; // 0-100
  lastModified: Date;
  keywordDensity: number; // 0-1
  crossReferences: number;
  status: 'draft' | 'review' | 'completed';
  assignee?: string;
}


interface HealthMetrics {
  overallScore: number; // 0-100
  standardDeviation: number;
  categoryVariance: number;
  languageConsistency: number;
  issues: string[];
  suggestions: string[];
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}

interface PriorityStats {
  total: number;
  averageScore: number;
  distribution: {
    critical: number; // 90-100
    high: number; // 80-89
    medium: number; // 60-79
    low: number; // 40-59
    minimal: number; // 0-39
  };
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
}

export function PriorityManagementDemoPage() {
  // Sample documents for demonstration
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'getting-started-en',
      title: 'Getting Started Guide',
      category: 'guide',
      language: 'en',
      size: 2500,
      priority: 95,
      lastModified: new Date('2024-01-15'),
      keywordDensity: 0.8,
      crossReferences: 12,
      status: 'completed'
    },
    {
      id: 'getting-started-ko',
      title: '시작하기 가이드',
      category: 'guide',
      language: 'ko',
      size: 2300,
      priority: 93,
      lastModified: new Date('2024-01-14'),
      keywordDensity: 0.7,
      crossReferences: 11,
      status: 'completed'
    },
    {
      id: 'action-pipeline-en',
      title: 'Action Pipeline System',
      category: 'concept',
      language: 'en',
      size: 3200,
      priority: 88,
      lastModified: new Date('2024-01-10'),
      keywordDensity: 0.9,
      crossReferences: 15,
      status: 'review',
      assignee: 'Alice'
    },
    {
      id: 'store-patterns-ko',
      title: '스토어 패턴',
      category: 'concept',
      language: 'ko',
      size: 2800,
      priority: 85,
      lastModified: new Date('2024-01-08'),
      keywordDensity: 0.6,
      crossReferences: 8,
      status: 'draft'
    },
    {
      id: 'todo-example-en',
      title: 'Todo List Example',
      category: 'examples',
      language: 'en',
      size: 1500,
      priority: 65,
      lastModified: new Date('2024-01-05'),
      keywordDensity: 0.4,
      crossReferences: 3,
      status: 'completed'
    },
    {
      id: 'api-reference-en',
      title: 'API Reference',
      category: 'reference',
      language: 'en',
      size: 4500,
      priority: 72,
      lastModified: new Date('2024-01-12'),
      keywordDensity: 0.3,
      crossReferences: 25,
      status: 'review'
    },
    {
      id: 'hooks-reference-en',
      title: 'Hooks Reference',
      category: 'reference',
      language: 'en',
      size: 3800,
      priority: 78,
      lastModified: new Date('2024-01-09'),
      keywordDensity: 0.5,
      crossReferences: 18,
      status: 'completed',
      assignee: 'Bob'
    },
    {
      id: 'architecture-guide-ko',
      title: '아키텍처 가이드',
      category: 'concept',
      language: 'ko',
      size: 4200,
      priority: 89,
      lastModified: new Date('2024-01-11'),
      keywordDensity: 0.7,
      crossReferences: 22,
      status: 'review',
      assignee: 'Carol'
    },
    {
      id: 'form-builder-example-en',
      title: 'Form Builder Example',
      category: 'examples',
      language: 'en',
      size: 2200,
      priority: 68,
      lastModified: new Date('2024-01-07'),
      keywordDensity: 0.6,
      crossReferences: 7,
      status: 'draft',
      assignee: 'Alice'
    },
    {
      id: 'performance-guide-ko',
      title: '성능 최적화 가이드',
      category: 'guide',
      language: 'ko',
      size: 3500,
      priority: 91,
      lastModified: new Date('2024-01-13'),
      keywordDensity: 0.8,
      crossReferences: 16,
      status: 'review',
      assignee: 'Bob'
    }
  ]);

  const [selectedCriteria, setSelectedCriteria] = useState<PriorityCalculationCriteria>({
    documentSize: { weight: 0.4, method: 'linear' },
    category: {
      weight: 0.3,
      values: { guide: 95, concept: 85, examples: 70, reference: 75 }
    },
    keywordDensity: { weight: 0.2, method: 'logarithmic' },
    crossReferences: { weight: 0.1, boost: 5 },
    recentModification: { weight: 0.05, dayThreshold: 7 },
    teamWorkload: { weight: 0.05, assigneePenalty: 10 }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'calculation' | 'health' | 'analytics' | 'multilingual'>('overview');
  const [activeLanguageFilter, setActiveLanguageFilter] = useState<'all' | 'en' | 'ko'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | string>('all');

  // Apply auto-calculation
  const applyAutoCalculation = useCallback((criteria: PriorityCalculationCriteria) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => ({
        ...doc,
        priority: calculatePriorityForDoc(doc, criteria)
      }))
    );
  }, []);

  // Calculate priority for a document using the calculation controls logic
  const calculatePriorityForDoc = useCallback((doc: Document, criteria: PriorityCalculationCriteria): number => {
    let score = 0;

    // Document size component
    const maxSize = Math.max(...documents.map(d => d.size));
    let sizeScore = 0;
    switch (criteria.documentSize.method) {
      case 'linear':
        sizeScore = (doc.size / maxSize) * 100;
        break;
      case 'logarithmic':
        sizeScore = Math.log(doc.size / 100 + 1) * 30;
        break;
      case 'exponential':
        sizeScore = Math.pow(doc.size / maxSize, 0.5) * 100;
        break;
    }
    score += sizeScore * criteria.documentSize.weight;

    // Category component
    const categoryScore = criteria.category.values[doc.category] || 50;
    score += categoryScore * criteria.category.weight;

    // Keyword density component
    let keywordScore = 0;
    switch (criteria.keywordDensity.method) {
      case 'linear':
        keywordScore = doc.keywordDensity * 100;
        break;
      case 'logarithmic':
        keywordScore = Math.log(doc.keywordDensity * 10 + 1) * 25;
        break;
      case 'polynomial':
        const exponent = criteria.keywordDensity.exponent || 2;
        keywordScore = Math.pow(doc.keywordDensity, exponent) * 100;
        break;
    }
    score += keywordScore * criteria.keywordDensity.weight;

    // Cross references component
    let refScore = doc.crossReferences * criteria.crossReferences.boost;
    if (criteria.crossReferences.diminishingReturns) {
      refScore = Math.sqrt(refScore) * 10;
    }
    score += Math.min(refScore, 50) * criteria.crossReferences.weight;

    // Recent modification component
    const daysSinceModified = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified <= criteria.recentModification.dayThreshold) {
      let recentBonus = 15;
      if (criteria.recentModification.decayRate) {
        recentBonus *= Math.exp(-daysSinceModified * criteria.recentModification.decayRate);
      }
      score += recentBonus * criteria.recentModification.weight;
    }

    // Team workload component
    if (doc.assignee && criteria.teamWorkload.assigneePenalty) {
      score -= criteria.teamWorkload.assigneePenalty * criteria.teamWorkload.weight;
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const languageMatch = activeLanguageFilter === 'all' || doc.language === activeLanguageFilter;
      const categoryMatch = activeCategoryFilter === 'all' || doc.category === activeCategoryFilter;
      return languageMatch && categoryMatch;
    });
  }, [documents, activeLanguageFilter, activeCategoryFilter]);

  const handleCriteriaChange = useCallback((newCriteria: PriorityCalculationCriteria) => {
    setSelectedCriteria(newCriteria);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calculation':
        return (
          <PriorityCalculationControls
            criteria={selectedCriteria}
            onCriteriaChange={handleCriteriaChange}
            documents={filteredDocuments}
            onApplyCalculation={applyAutoCalculation}
          />
        );
        
      case 'health':
        return (
          <PriorityHealthMonitor
            documents={filteredDocuments}
            languageFilter={activeLanguageFilter}
            categoryFilter={activeCategoryFilter}
          />
        );
        
      case 'analytics':
        return (
          <PriorityAnalyticsDashboard
            documents={filteredDocuments}
            timeRange="1m"
          />
        );
        
      case 'multilingual':
        return <MultilingualProcessingSimulator />;
        
      default:
        return (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(documents.reduce((sum, doc) => sum + doc.priority, 0) / documents.length)}
                </div>
                <div className="text-sm text-gray-600">Average Priority</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {documents.filter(doc => doc.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(documents.map(doc => doc.assignee).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-600">Team Members</div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">🚀 Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setActiveTab('calculation')}
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-2xl">⚙️</span>
                  <span>Priority Calculation</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('health')}
                  variant="secondary"
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-2xl">🏥</span>
                  <span>Health Monitoring</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('analytics')}
                  variant="secondary"
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-2xl">📊</span>
                  <span>Analytics Dashboard</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('multilingual')}
                  variant="secondary"
                  className="h-20 flex flex-col gap-2"
                >
                  <span className="text-2xl">🌐</span>
                  <span>Multilingual Processing</span>
                </Button>
              </div>
            </Card>

            {/* Recent Documents */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">📄 Recent Documents</h3>
              <div className="space-y-2">
                {documents
                  .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
                  .slice(0, 5)
                  .map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-gray-500">
                          {doc.language === 'en' ? '🇺🇸' : '🇰🇷'} {doc.category} • 
                          Modified {Math.ceil((Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                      <Badge variant={doc.priority >= 90 ? 'danger' : doc.priority >= 80 ? 'default' : 'warning'}>
                        {doc.priority}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="page-header">
          <h1>📊 Priority Management System Demo</h1>
          <p className="page-description">
            Comprehensive live demonstration of the LLMS Generator Priority Management System featuring 
            advanced priority calculation algorithms, health monitoring with 0-100 scoring, multilingual 
            document processing simulation, analytics dashboard, and data-driven recommendations.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Link
              to="/demos"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              📋 Back to Demos
            </Link>
            <Link
              to="/actionguard/priority-performance"
              className="text-purple-600 hover:text-purple-800 underline text-sm"
            >
              ⚡ View Action Priority Performance Demo
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
                value={activeLanguageFilter} 
                onChange={(e) => setActiveLanguageFilter(e.target.value as any)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Languages</option>
                <option value="en">🇺🇸 English</option>
                <option value="ko">🇰🇷 Korean</option>
              </select>
              
              <select 
                value={activeCategoryFilter} 
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="guide">Guides</option>
                <option value="concept">Concepts</option>
                <option value="examples">Examples</option>
                <option value="reference">Reference</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: '📊 Overview', icon: '📊' },
              { key: 'calculation', label: '⚙️ Priority Calculation', icon: '⚙️' },
              { key: 'health', label: '🏥 Health Monitoring', icon: '🏥' },
              { key: 'analytics', label: '📈 Analytics Dashboard', icon: '📈' },
              { key: 'multilingual', label: '🌐 Multilingual Processing', icon: '🌐' }
            ].map(tab => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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

        {/* System Integration Info */}
        <Card className="p-6">
          <h3 className="font-semibold text-green-900 mb-3">🎯 Priority Management System Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">✅ Implemented Features</h4>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• <strong>Advanced Priority Calculation</strong> - Multiple algorithms with live preview</li>
                <li>• <strong>Health Monitoring System</strong> - 0-100 scoring with comprehensive analytics</li>
                <li>• <strong>Multilingual Processing</strong> - English/Korean with real-time simulation</li>
                <li>• <strong>Analytics Dashboard</strong> - Trend analysis and team workload monitoring</li>
                <li>• <strong>Data-driven Recommendations</strong> - AI-powered improvement suggestions</li>
                <li>• <strong>Real-time Visualization</strong> - Interactive charts and progress tracking</li>
                <li>• <strong>Team Coordination</strong> - Workload balancing and assignment tracking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">💻 CLI Integration</h4>
              <div className="text-sm text-green-800 space-y-3">
                <div>
                  <strong>Priority Management:</strong>
                  <div className="font-mono text-xs bg-green-50 p-2 rounded mt-1">
                    pnpm llms:priority-stats<br/>
                    pnpm llms:priority-health<br/>
                    pnpm llms:priority-suggest<br/>
                    pnpm llms:priority-auto --force
                  </div>
                </div>
                <div>
                  <strong>Multilingual Processing:</strong>
                  <div className="font-mono text-xs bg-green-50 p-2 rounded mt-1">
                    pnpm llms:sync-docs:ko<br/>
                    pnpm llms:sync-docs:en<br/>
                    pnpm llms:work-next --language ko
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PriorityManagementDemoPage;