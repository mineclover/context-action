/**
 * @fileoverview Priority Health Monitoring Component
 * 
 * Comprehensive health monitoring system with 0-100 scoring,
 * real-time issue detection, and improvement recommendations.
 */

import React, { useMemo } from 'react';
import { Card, Badge } from '../ui';

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

interface HealthMetrics {
  overallScore: number;
  standardDeviation: number;
  categoryVariance: number;
  languageConsistency: number;
  distributionBalance: number;
  workloadBalance: number;
  qualityScore: number;
  trendsScore: number;
  issues: Array<{
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    affectedDocuments?: string[];
  }>;
  suggestions: Array<{
    id: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: number; // 0-100
    actionType: 'recalculate' | 'manual_review' | 'process_improvement' | 'team_coordination';
  }>;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  trendDirection: 'improving' | 'stable' | 'declining';
}

interface PriorityHealthMonitorProps {
  documents: Document[];
  historicalData?: Array<{
    timestamp: Date;
    healthScore: number;
    documentCount: number;
  }>;
  languageFilter?: 'all' | 'en' | 'ko';
  categoryFilter?: 'all' | string;
}

export function PriorityHealthMonitor({ 
  documents, 
  historicalData = [],
  languageFilter = 'all',
  categoryFilter = 'all'
}: PriorityHealthMonitorProps) {
  
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const languageMatch = languageFilter === 'all' || doc.language === languageFilter;
      const categoryMatch = categoryFilter === 'all' || doc.category === categoryFilter;
      return languageMatch && categoryMatch;
    });
  }, [documents, languageFilter, categoryFilter]);

  const healthMetrics = useMemo((): HealthMetrics => {
    if (filteredDocuments.length === 0) {
      return {
        overallScore: 0,
        standardDeviation: 0,
        categoryVariance: 0,
        languageConsistency: 0,
        distributionBalance: 0,
        workloadBalance: 0,
        qualityScore: 0,
        trendsScore: 0,
        issues: [],
        suggestions: [],
        tier: 'poor',
        trendDirection: 'stable'
      };
    }

    const priorities = filteredDocuments.map(doc => doc.priority);
    const mean = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
    const variance = priorities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priorities.length;
    const standardDeviation = Math.sqrt(variance);

    // Category variance analysis
    const categoryGroups = filteredDocuments.reduce((groups, doc) => {
      groups[doc.category] = groups[doc.category] || [];
      groups[doc.category].push(doc.priority);
      return groups;
    }, {} as Record<string, number[]>);

    const categoryMeans = Object.entries(categoryGroups).map(([category, priorities]) => ({
      category,
      mean: priorities.reduce((sum, p) => sum + p, 0) / priorities.length,
      count: priorities.length
    }));

    const categoryVariance = categoryMeans.length > 1 
      ? Math.sqrt(categoryMeans.reduce((sum, { mean: catMean }) => 
          sum + Math.pow(catMean - mean, 2), 0) / categoryMeans.length)
      : 0;

    // Language consistency analysis
    const languageGroups = filteredDocuments.reduce((groups, doc) => {
      groups[doc.language] = groups[doc.language] || [];
      groups[doc.language].push(doc.priority);
      return groups;
    }, {} as Record<string, number[]>);

    const languageMeans = Object.entries(languageGroups).map(([lang, priorities]) => ({
      language: lang,
      mean: priorities.reduce((sum, p) => sum + p, 0) / priorities.length
    }));

    const languageVariance = languageMeans.length > 1
      ? Math.abs(languageMeans[0].mean - languageMeans[1].mean)
      : 0;

    // Distribution balance (ideal: even spread across priority ranges)
    const distribution = {
      critical: filteredDocuments.filter(doc => doc.priority >= 90).length,
      high: filteredDocuments.filter(doc => doc.priority >= 80 && doc.priority < 90).length,
      medium: filteredDocuments.filter(doc => doc.priority >= 60 && doc.priority < 80).length,
      low: filteredDocuments.filter(doc => doc.priority >= 40 && doc.priority < 60).length,
      minimal: filteredDocuments.filter(doc => doc.priority < 40).length
    };

    const idealDistribution = [0.15, 0.25, 0.35, 0.20, 0.05]; // Ideal percentages
    const actualDistribution = [
      distribution.critical / filteredDocuments.length,
      distribution.high / filteredDocuments.length,
      distribution.medium / filteredDocuments.length,
      distribution.low / filteredDocuments.length,
      distribution.minimal / filteredDocuments.length
    ];

    const distributionBalance = 100 - (actualDistribution.reduce((sum, actual, i) => 
      sum + Math.abs(actual - idealDistribution[i]), 0) * 100);

    // Workload balance analysis
    const assigneeGroups = filteredDocuments.reduce((groups, doc) => {
      const assignee = doc.assignee || 'unassigned';
      groups[assignee] = groups[assignee] || [];
      groups[assignee].push(doc);
      return groups;
    }, {} as Record<string, Document[]>);

    const assigneeCounts = Object.values(assigneeGroups).map(docs => docs.length);
    const workloadVariance = assigneeCounts.length > 1 
      ? Math.sqrt(assigneeCounts.reduce((sum, count) => {
          const avgCount = assigneeCounts.reduce((s, c) => s + c, 0) / assigneeCounts.length;
          return sum + Math.pow(count - avgCount, 2);
        }, 0) / assigneeCounts.length)
      : 0;

    const workloadBalance = Math.max(0, 100 - (workloadVariance * 10));

    // Quality score (based on completion status and recent updates)
    const qualityFactors = {
      completionRate: filteredDocuments.filter(doc => doc.status === 'completed').length / filteredDocuments.length,
      reviewRate: filteredDocuments.filter(doc => doc.status === 'review').length / filteredDocuments.length,
      recentUpdateRate: filteredDocuments.filter(doc => {
        const daysSince = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      }).length / filteredDocuments.length
    };

    const qualityScore = (qualityFactors.completionRate * 50) + 
                        (qualityFactors.reviewRate * 30) + 
                        (qualityFactors.recentUpdateRate * 20);

    // Trends analysis
    let trendsScore = 50; // Default neutral
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (historicalData.length >= 2) {
      const recent = historicalData.slice(-3);
      const trend = recent.length > 1 
        ? (recent[recent.length - 1].healthScore - recent[0].healthScore) / recent.length
        : 0;
      
      trendsScore = 50 + (trend * 5); // Convert trend to score
      trendDirection = trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable';
    }

    // Issue detection
    const issues: HealthMetrics['issues'] = [];
    
    if (standardDeviation > 25) {
      issues.push({
        id: 'high-variance',
        severity: 'high',
        title: 'High Priority Variance',
        description: `Standard deviation of ${standardDeviation.toFixed(1)} exceeds recommended threshold of 25`,
        affectedDocuments: filteredDocuments.filter(doc => 
          Math.abs(doc.priority - mean) > standardDeviation * 1.5
        ).map(doc => doc.id)
      });
    }

    if (categoryVariance > 30) {
      issues.push({
        id: 'category-imbalance',
        severity: 'medium',
        title: 'Category Priority Imbalance',
        description: `Significant variance (${categoryVariance.toFixed(1)}) between category priorities`,
        affectedDocuments: categoryMeans.filter(cat => 
          Math.abs(cat.mean - mean) > 15
        ).map(cat => `${cat.category} category`)
      });
    }

    if (languageVariance > 20) {
      issues.push({
        id: 'language-inconsistency',
        severity: 'medium',
        title: 'Language Version Inconsistency',
        description: `Priority difference between language versions: ${languageVariance.toFixed(1)} points`,
        affectedDocuments: languageMeans.map(lang => `${lang.language} documents`)
      });
    }

    if (distributionBalance < 60) {
      issues.push({
        id: 'poor-distribution',
        severity: 'high',
        title: 'Poor Priority Distribution',
        description: 'Priority distribution significantly deviates from recommended patterns',
        affectedDocuments: ['All documents - review priority calculation criteria']
      });
    }

    if (workloadBalance < 50) {
      issues.push({
        id: 'workload-imbalance',
        severity: 'medium',
        title: 'Uneven Team Workload',
        description: 'Significant imbalance in document assignments across team members',
        affectedDocuments: Object.entries(assigneeGroups)
          .filter(([, docs]) => docs.length > filteredDocuments.length * 0.4)
          .map(([assignee]) => `${assignee} assignments`)
      });
    }

    if (qualityScore < 40) {
      issues.push({
        id: 'quality-concerns',
        severity: 'high',
        title: 'Quality Metrics Below Target',
        description: 'Low completion rates or insufficient recent updates detected',
        affectedDocuments: filteredDocuments.filter(doc => 
          doc.status === 'draft' && 
          (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24) > 30
        ).map(doc => doc.id)
      });
    }

    // Suggestion generation
    const suggestions: HealthMetrics['suggestions'] = [];

    if (standardDeviation > 20) {
      suggestions.push({
        id: 'normalize-priorities',
        priority: 'high',
        title: 'Normalize Priority Scores',
        description: 'Run auto-calculation to standardize priorities based on consistent criteria',
        estimatedImpact: Math.min((standardDeviation - 20) * 3, 30),
        actionType: 'recalculate'
      });
    }

    if (categoryVariance > 25) {
      suggestions.push({
        id: 'review-category-weights',
        priority: 'medium',
        title: 'Review Category Weights',
        description: 'Adjust category priority weights in calculation criteria to balance importance',
        estimatedImpact: Math.min((categoryVariance - 25) * 2, 25),
        actionType: 'manual_review'
      });
    }

    if (languageVariance > 15) {
      suggestions.push({
        id: 'sync-language-versions',
        priority: 'medium',
        title: 'Synchronize Language Versions',
        description: 'Align priorities between English and Korean versions of same content',
        estimatedImpact: Math.min(languageVariance * 1.5, 20),
        actionType: 'manual_review'
      });
    }

    if (distributionBalance < 70) {
      suggestions.push({
        id: 'rebalance-distribution',
        priority: 'high',
        title: 'Rebalance Priority Distribution',
        description: 'Adjust calculation criteria to achieve more balanced priority distribution',
        estimatedImpact: (70 - distributionBalance) * 0.8,
        actionType: 'recalculate'
      });
    }

    if (workloadBalance < 60) {
      suggestions.push({
        id: 'redistribute-workload',
        priority: 'medium',
        title: 'Redistribute Team Workload',
        description: 'Balance document assignments across team members',
        estimatedImpact: (60 - workloadBalance) * 0.5,
        actionType: 'team_coordination'
      });
    }

    if (qualityScore < 50) {
      suggestions.push({
        id: 'improve-quality-process',
        priority: 'high',
        title: 'Improve Quality Process',
        description: 'Focus on completing draft documents and maintaining regular updates',
        estimatedImpact: (50 - qualityScore) * 0.8,
        actionType: 'process_improvement'
      });
    }

    // Calculate overall health score
    const componentScores = {
      variance: Math.max(0, 100 - (standardDeviation * 2.5)),
      categoryBalance: Math.max(0, 100 - (categoryVariance * 1.5)),
      languageConsistency: Math.max(0, 100 - (languageVariance * 2)),
      distributionBalance,
      workloadBalance,
      qualityScore,
      trendsScore
    };

    const weights = {
      variance: 0.25,
      categoryBalance: 0.15,
      languageConsistency: 0.15,
      distributionBalance: 0.15,
      workloadBalance: 0.1,
      qualityScore: 0.15,
      trendsScore: 0.05
    };

    const overallScore = Math.round(
      Object.entries(componentScores).reduce((sum, [key, score]) => 
        sum + (score * weights[key as keyof typeof weights]), 0)
    );

    const tier = overallScore >= 85 ? 'excellent' : 
                 overallScore >= 70 ? 'good' :
                 overallScore >= 50 ? 'fair' : 'poor';

    return {
      overallScore,
      standardDeviation,
      categoryVariance,
      languageConsistency: 100 - languageVariance,
      distributionBalance,
      workloadBalance,
      qualityScore,
      trendsScore,
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      tier,
      trendDirection
    };
  }, [filteredDocuments, historicalData]);

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'default';
      case 'medium': return 'warning';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'danger';
      case 'high': return 'default';
      case 'medium': return 'warning';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🏥 Priority Health Monitor</h2>
          <div className="flex items-center gap-2">
            <Badge variant={
              healthMetrics.tier === 'excellent' ? 'success' :
              healthMetrics.tier === 'good' ? 'primary' :
              healthMetrics.tier === 'fair' ? 'outline' : 'danger'
            }>
              {healthMetrics.tier.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500">
              {getTrendIcon(healthMetrics.trendDirection)} {healthMetrics.trendDirection}
            </span>
          </div>
        </div>

        {/* Health Score Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getHealthColor(healthMetrics.overallScore)} rounded-lg p-4 inline-block`}>
            {healthMetrics.overallScore}
          </div>
          <div className="text-sm text-gray-600 mt-2">Overall Health Score (0-100)</div>
        </div>

        {/* Component Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(100 - (healthMetrics.standardDeviation * 2.5))}
            </div>
            <div className="text-xs text-gray-600">Variance Control</div>
            <div className="text-xs text-gray-500">σ = {healthMetrics.standardDeviation.toFixed(1)}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(healthMetrics.distributionBalance)}
            </div>
            <div className="text-xs text-gray-600">Distribution</div>
            <div className="text-xs text-gray-500">Balance Score</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(healthMetrics.languageConsistency)}
            </div>
            <div className="text-xs text-gray-600">Language Sync</div>
            <div className="text-xs text-gray-500">Consistency %</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(healthMetrics.qualityScore)}
            </div>
            <div className="text-xs text-gray-600">Quality</div>
            <div className="text-xs text-gray-500">Process Score</div>
          </div>
        </div>
      </Card>

      {/* Issues and Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        <Card className="p-6">
          <h3 className="font-semibold text-red-900 mb-4">⚠️ Issues Detected ({healthMetrics.issues.length})</h3>
          {healthMetrics.issues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <div>No issues detected!</div>
              <div className="text-sm">Priority system is healthy</div>
            </div>
          ) : (
            <div className="space-y-3">
              {healthMetrics.issues.map(issue => (
                <div key={issue.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{issue.title}</h4>
                    <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{issue.description}</p>
                  {issue.affectedDocuments && issue.affectedDocuments.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <strong>Affected:</strong> {issue.affectedDocuments.slice(0, 3).join(', ')}
                      {issue.affectedDocuments.length > 3 && ` +${issue.affectedDocuments.length - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Suggestions */}
        <Card className="p-6">
          <h3 className="font-semibold text-blue-900 mb-4">💡 Improvement Suggestions ({healthMetrics.suggestions.length})</h3>
          {healthMetrics.suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <div>System optimized!</div>
              <div className="text-sm">No immediate improvements needed</div>
            </div>
          ) : (
            <div className="space-y-3">
              {healthMetrics.suggestions.map(suggestion => (
                <div key={suggestion.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    <div className="flex gap-1">
                      <Badge variant={getPriorityColor(suggestion.priority)} className="text-xs">
                        {suggestion.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        +{Math.round(suggestion.estimatedImpact)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="text-xs text-gray-500">
                    <strong>Action:</strong> {suggestion.actionType.replace('_', ' ')} • 
                    <strong> Impact:</strong> +{Math.round(suggestion.estimatedImpact)} points
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Health Metrics Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">📊 Detailed Health Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Standard Deviation</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${healthMetrics.standardDeviation < 15 ? 'bg-green-500' : 
                  healthMetrics.standardDeviation < 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(healthMetrics.standardDeviation * 4, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {healthMetrics.standardDeviation.toFixed(1)} (target: &lt;15)
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Category Balance</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${healthMetrics.categoryVariance < 20 ? 'bg-green-500' : 
                  healthMetrics.categoryVariance < 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${100 - Math.min(healthMetrics.categoryVariance * 2, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              variance: {healthMetrics.categoryVariance.toFixed(1)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Workload Balance</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${healthMetrics.workloadBalance > 80 ? 'bg-green-500' : 
                  healthMetrics.workloadBalance > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${healthMetrics.workloadBalance}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(healthMetrics.workloadBalance)}% balanced
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Trends</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${healthMetrics.trendDirection === 'improving' ? 'bg-green-500' : 
                  healthMetrics.trendDirection === 'stable' ? 'bg-blue-500' : 'bg-red-500'}`}
                style={{ width: `${healthMetrics.trendsScore}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {getTrendIcon(healthMetrics.trendDirection)} {healthMetrics.trendDirection}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PriorityHealthMonitor;