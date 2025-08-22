/**
 * @fileoverview Priority Analytics Dashboard
 * 
 * Comprehensive analytics dashboard for priority management system
 * with advanced metrics, trend analysis, and data visualization.
 */

import React, { useMemo, useState } from 'react';
import { Card, Badge, Button } from '../ui';

interface Document {
  id: string;
  title: string;
  category: 'guide' | 'concept' | 'examples' | 'reference';
  language: 'en' | 'ko';
  size: number;
  priority: number;
  lastModified: Date;
  keywordDensity: number;
  crossReferences: number;
  status: 'draft' | 'review' | 'completed';
  assignee?: string;
}

interface AnalyticsData {
  distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    minimal: number;
  };
  categoryAnalysis: {
    [category: string]: {
      count: number;
      averagePriority: number;
      priorityRange: { min: number; max: number };
      completion: { draft: number; review: number; completed: number };
    };
  };
  languageAnalysis: {
    [language: string]: {
      count: number;
      averagePriority: number;
      categoryDistribution: { [category: string]: number };
      completionRate: number;
    };
  };
  assigneeAnalysis: {
    [assignee: string]: {
      count: number;
      averagePriority: number;
      workload: 'light' | 'normal' | 'heavy' | 'overloaded';
      categoryFocus: string[];
    };
  };
  trends: {
    priorityTrend: 'improving' | 'stable' | 'declining';
    distributionBalance: number;
    qualityScore: number;
    teamEfficiency: number;
  };
  recommendations: Array<{
    id: string;
    type: 'priority' | 'workload' | 'quality' | 'process';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }>;
}

interface PriorityAnalyticsDashboardProps {
  documents: Document[];
  timeRange?: '1w' | '1m' | '3m' | '1y';
  onTimeRangeChange?: (range: '1w' | '1m' | '3m' | '1y') => void;
}

export function PriorityAnalyticsDashboard({ 
  documents, 
  timeRange = '1m',
  onTimeRangeChange 
}: PriorityAnalyticsDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'languages' | 'team' | 'trends'>('overview');
  const [showDetails, setShowDetails] = useState(false);

  const analytics = useMemo((): AnalyticsData => {
    // Distribution Analysis
    const distribution = {
      critical: documents.filter(doc => doc.priority >= 90).length,
      high: documents.filter(doc => doc.priority >= 80 && doc.priority < 90).length,
      medium: documents.filter(doc => doc.priority >= 60 && doc.priority < 80).length,
      low: documents.filter(doc => doc.priority >= 40 && doc.priority < 60).length,
      minimal: documents.filter(doc => doc.priority < 40).length
    };

    // Category Analysis
    const categoryAnalysis = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = {
          count: 0,
          averagePriority: 0,
          priorityRange: { min: 100, max: 0 },
          completion: { draft: 0, review: 0, completed: 0 }
        };
      }
      
      acc[doc.category].count++;
      acc[doc.category].completion[doc.status]++;
      acc[doc.category].priorityRange.min = Math.min(acc[doc.category].priorityRange.min, doc.priority);
      acc[doc.category].priorityRange.max = Math.max(acc[doc.category].priorityRange.max, doc.priority);
      
      return acc;
    }, {} as AnalyticsData['categoryAnalysis']);

    // Calculate average priorities for categories
    Object.keys(categoryAnalysis).forEach(category => {
      const categoryDocs = documents.filter(doc => doc.category === category);
      categoryAnalysis[category].averagePriority = 
        categoryDocs.reduce((sum, doc) => sum + doc.priority, 0) / categoryDocs.length;
    });

    // Language Analysis
    const languageAnalysis = documents.reduce((acc, doc) => {
      if (!acc[doc.language]) {
        acc[doc.language] = {
          count: 0,
          averagePriority: 0,
          categoryDistribution: {},
          completionRate: 0
        };
      }
      
      acc[doc.language].count++;
      acc[doc.language].categoryDistribution[doc.category] = 
        (acc[doc.language].categoryDistribution[doc.category] || 0) + 1;
      
      return acc;
    }, {} as AnalyticsData['languageAnalysis']);

    // Calculate language averages and completion rates
    Object.keys(languageAnalysis).forEach(language => {
      const langDocs = documents.filter(doc => doc.language === language);
      languageAnalysis[language].averagePriority = 
        langDocs.reduce((sum, doc) => sum + doc.priority, 0) / langDocs.length;
      languageAnalysis[language].completionRate = 
        langDocs.filter(doc => doc.status === 'completed').length / langDocs.length * 100;
    });

    // Assignee Analysis
    const assigneeAnalysis = documents.reduce((acc, doc) => {
      const assignee = doc.assignee || 'Unassigned';
      
      if (!acc[assignee]) {
        acc[assignee] = {
          count: 0,
          averagePriority: 0,
          workload: 'normal' as const,
          categoryFocus: []
        };
      }
      
      acc[assignee].count++;
      return acc;
    }, {} as AnalyticsData['assigneeAnalysis']);

    // Calculate assignee metrics
    const avgWorkload = Object.values(assigneeAnalysis).reduce((sum, a) => sum + a.count, 0) / 
                       Object.keys(assigneeAnalysis).length;

    Object.keys(assigneeAnalysis).forEach(assignee => {
      const assigneeDocs = documents.filter(doc => (doc.assignee || 'Unassigned') === assignee);
      assigneeAnalysis[assignee].averagePriority = 
        assigneeDocs.reduce((sum, doc) => sum + doc.priority, 0) / assigneeDocs.length;
      
      // Determine workload
      const count = assigneeAnalysis[assignee].count;
      if (count === 0) assigneeAnalysis[assignee].workload = 'light';
      else if (count <= avgWorkload * 0.7) assigneeAnalysis[assignee].workload = 'light';
      else if (count <= avgWorkload * 1.3) assigneeAnalysis[assignee].workload = 'normal';
      else if (count <= avgWorkload * 1.8) assigneeAnalysis[assignee].workload = 'heavy';
      else assigneeAnalysis[assignee].workload = 'overloaded';

      // Find category focus
      const categoryCount = assigneeDocs.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      assigneeAnalysis[assignee].categoryFocus = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([category]) => category);
    });

    // Trends Analysis
    const priorities = documents.map(doc => doc.priority);
    const avgPriority = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
    const stdDev = Math.sqrt(priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length);
    
    const idealDistribution = [0.15, 0.25, 0.35, 0.20, 0.05]; // Critical, High, Medium, Low, Minimal
    const actualDistribution = [
      distribution.critical / documents.length,
      distribution.high / documents.length,
      distribution.medium / documents.length,
      distribution.low / documents.length,
      distribution.minimal / documents.length
    ];
    
    const distributionBalance = 100 - (actualDistribution.reduce((sum, actual, i) => 
      sum + Math.abs(actual - idealDistribution[i]), 0) * 100);

    const completionRate = documents.filter(doc => doc.status === 'completed').length / documents.length;
    const qualityScore = (completionRate * 70) + (Math.max(0, 100 - stdDev * 2) * 0.3);
    
    const workloadVariance = Object.values(assigneeAnalysis).map(a => a.count);
    const avgWorkloadCount = workloadVariance.reduce((sum, c) => sum + c, 0) / workloadVariance.length;
    const workloadBalance = 100 - Math.sqrt(workloadVariance.reduce((sum, count) => 
      sum + Math.pow(count - avgWorkloadCount, 2), 0) / workloadVariance.length) * 10;

    const teamEfficiency = (distributionBalance * 0.4) + (qualityScore * 0.3) + (workloadBalance * 0.3);

    // Generate Recommendations
    const recommendations: AnalyticsData['recommendations'] = [];

    if (stdDev > 20) {
      recommendations.push({
        id: 'high-variance',
        type: 'priority',
        priority: 'high',
        title: 'Normalize Priority Distribution',
        description: `High variance (σ=${stdDev.toFixed(1)}) indicates inconsistent prioritization`,
        impact: Math.min((stdDev - 20) * 3, 50),
        effort: 'medium'
      });
    }

    if (distributionBalance < 70) {
      recommendations.push({
        id: 'poor-distribution',
        type: 'priority',
        priority: 'high',
        title: 'Rebalance Priority Distribution',
        description: 'Current distribution deviates significantly from optimal patterns',
        impact: (70 - distributionBalance) * 0.8,
        effort: 'medium'
      });
    }

    if (completionRate < 0.6) {
      recommendations.push({
        id: 'low-completion',
        type: 'quality',
        priority: 'critical',
        title: 'Improve Document Completion',
        description: `Only ${Math.round(completionRate * 100)}% of documents are completed`,
        impact: (60 - completionRate * 100) * 0.7,
        effort: 'high'
      });
    }

    const overloadedAssignees = Object.entries(assigneeAnalysis)
      .filter(([, data]) => data.workload === 'overloaded').length;
    
    if (overloadedAssignees > 0) {
      recommendations.push({
        id: 'workload-imbalance',
        type: 'workload',
        priority: 'medium',
        title: 'Redistribute Team Workload',
        description: `${overloadedAssignees} team member(s) are overloaded`,
        impact: overloadedAssignees * 15,
        effort: 'low'
      });
    }

    const languageImbalance = Math.abs(
      (languageAnalysis.en?.count || 0) - (languageAnalysis.ko?.count || 0)
    ) / documents.length;
    
    if (languageImbalance > 0.3) {
      recommendations.push({
        id: 'language-imbalance',
        type: 'process',
        priority: 'medium',
        title: 'Balance Language Coverage',
        description: 'Significant imbalance between English and Korean documentation',
        impact: languageImbalance * 30,
        effort: 'medium'
      });
    }

    // Sort recommendations by impact
    recommendations.sort((a, b) => b.impact - a.impact);

    return {
      distribution,
      categoryAnalysis,
      languageAnalysis,
      assigneeAnalysis,
      trends: {
        priorityTrend: stdDev < 15 ? 'improving' : stdDev > 25 ? 'declining' : 'stable',
        distributionBalance,
        qualityScore,
        teamEfficiency
      },
      recommendations
    };
  }, [documents]);

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'light': return 'text-green-600 bg-green-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'heavy': return 'text-yellow-600 bg-yellow-50';
      case 'overloaded': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'default';
      case 'medium': return 'warning';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Priority Distribution Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">📊 Priority Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analytics.distribution).map(([tier, count]) => {
            const percentage = (count / documents.length) * 100;
            const colorClass = tier === 'critical' ? 'bg-red-500' :
                              tier === 'high' ? 'bg-orange-500' :
                              tier === 'medium' ? 'bg-blue-500' :
                              tier === 'low' ? 'bg-green-500' : 'bg-gray-500';
            
            return (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="capitalize text-sm font-medium w-16">{tier}:</span>
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Key Metrics */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">🎯 Key Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(analytics.trends.distributionBalance)}
            </div>
            <div className="text-sm text-blue-800">Distribution Balance</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(analytics.trends.qualityScore)}
            </div>
            <div className="text-sm text-green-800">Quality Score</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(analytics.trends.teamEfficiency)}
            </div>
            <div className="text-sm text-purple-800">Team Efficiency</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.recommendations.length}
            </div>
            <div className="text-sm text-orange-800">Recommendations</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-4">
      {Object.entries(analytics.categoryAnalysis).map(([category, data]) => (
        <Card key={category} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold capitalize">{category}</h3>
            <Badge variant="outline">{data.count} documents</Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{Math.round(data.averagePriority)}</div>
              <div className="text-xs text-gray-600">Avg Priority</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">
                {data.priorityRange.min}-{data.priorityRange.max}
              </div>
              <div className="text-xs text-gray-600">Priority Range</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{data.completion.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">
                {Math.round((data.completion.completed / data.count) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Completion Rate</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4">
      {Object.entries(analytics.assigneeAnalysis).map(([assignee, data]) => (
        <Card key={assignee} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{assignee}</h3>
            <div className="flex gap-2">
              <Badge variant="outline">{data.count} docs</Badge>
              <Badge className={getWorkloadColor(data.workload)}>
                {data.workload}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{Math.round(data.averagePriority)}</div>
              <div className="text-xs text-gray-600">Avg Priority</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">{data.count}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-bold">
                {data.categoryFocus.slice(0, 2).join(', ')}
              </div>
              <div className="text-xs text-gray-600">Focus Areas</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📈 Priority Analytics Dashboard</h2>
          <div className="flex gap-2">
            {onTimeRangeChange && (
              <select 
                value={timeRange} 
                onChange={(e) => onTimeRangeChange(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="1w">Last Week</option>
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="1y">Last Year</option>
              </select>
            )}
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? '📊 Summary' : '🔍 Details'}
            </Button>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'categories', label: '📂 Categories', icon: '📂' },
            { key: 'languages', label: '🌐 Languages', icon: '🌐' },
            { key: 'team', label: '👥 Team', icon: '👥' },
            { key: 'trends', label: '📈 Trends', icon: '📈' }
          ].map(view => (
            <Button
              key={view.key}
              onClick={() => setSelectedView(view.key as any)}
              variant={selectedView === view.key ? 'primary' : 'outline'}
              size="sm"
            >
              {view.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* View Content */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'categories' && renderCategories()}
      {selectedView === 'team' && renderTeam()}

      {selectedView === 'languages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analytics.languageAnalysis).map(([language, data]) => (
            <Card key={language} className="p-6">
              <h3 className="font-semibold mb-4">
                {language === 'en' ? '🇺🇸 English' : '🇰🇷 Korean'} ({data.count} docs)
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">{Math.round(data.averagePriority)}</div>
                    <div className="text-xs text-gray-600">Avg Priority</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">{Math.round(data.completionRate)}%</div>
                    <div className="text-xs text-gray-600">Completion</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Category Distribution</h4>
                  <div className="space-y-1">
                    {Object.entries(data.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="capitalize">{category}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">📈 Trend Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">
                  {analytics.trends.priorityTrend === 'improving' ? '📈' :
                   analytics.trends.priorityTrend === 'declining' ? '📉' : '➡️'}
                </div>
                <div className="font-semibold">{analytics.trends.priorityTrend}</div>
                <div className="text-sm text-gray-600">Priority Trend</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(analytics.trends.distributionBalance)}
                </div>
                <div className="font-semibold">Distribution Balance</div>
                <div className="text-sm text-gray-600">0-100 scale</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(analytics.trends.teamEfficiency)}
                </div>
                <div className="font-semibold">Team Efficiency</div>
                <div className="text-sm text-gray-600">Composite score</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">💡 Recommendations ({analytics.recommendations.length})</h3>
        
        {analytics.recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div>No recommendations at this time</div>
            <div className="text-sm">System is well optimized</div>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.recommendations.slice(0, showDetails ? undefined : 3).map(rec => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{rec.title}</h4>
                  <div className="flex gap-2">
                    <Badge variant={getRecommendationColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">
                      +{Math.round(rec.impact)} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.effort} effort
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="text-xs text-gray-500">
                  Type: {rec.type.replace('_', ' ')} • 
                  Impact: +{Math.round(rec.impact)} points • 
                  Effort: {rec.effort}
                </div>
              </div>
            ))}
            
            {!showDetails && analytics.recommendations.length > 3 && (
              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Show {analytics.recommendations.length - 3} more recommendations
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default PriorityAnalyticsDashboard;