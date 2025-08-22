/**
 * @fileoverview Health analysis utilities
 */

import type { Document, HealthMetrics, HealthIssue, HealthSuggestion, HistoricalHealthData } from '../types';

export function analyzeHealthMetrics(
  documents: Document[],
  historicalData: HistoricalHealthData[] = []
): HealthMetrics {
  if (documents.length === 0) {
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

  const priorities = documents.map(doc => doc.priority);
  const mean = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
  const variance = priorities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / priorities.length;
  const standardDeviation = Math.sqrt(variance);

  // Category variance analysis
  const categoryGroups = documents.reduce((groups, doc) => {
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
  const languageGroups = documents.reduce((groups, doc) => {
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

  // Distribution balance
  const distribution = {
    critical: documents.filter(doc => doc.priority >= 90).length,
    high: documents.filter(doc => doc.priority >= 80 && doc.priority < 90).length,
    medium: documents.filter(doc => doc.priority >= 60 && doc.priority < 80).length,
    low: documents.filter(doc => doc.priority >= 40 && doc.priority < 60).length,
    minimal: documents.filter(doc => doc.priority < 40).length
  };

  const idealDistribution = [0.15, 0.25, 0.35, 0.20, 0.05];
  const actualDistribution = [
    distribution.critical / documents.length,
    distribution.high / documents.length,
    distribution.medium / documents.length,
    distribution.low / documents.length,
    distribution.minimal / documents.length
  ];

  const distributionBalance = 100 - (actualDistribution.reduce((sum, actual, i) => 
    sum + Math.abs(actual - idealDistribution[i]), 0) * 100);

  // Generate issues and suggestions based on metrics
  const issues = generateHealthIssues({
    standardDeviation,
    categoryVariance,
    languageVariance,
    distributionBalance,
    documents,
    mean
  });

  const suggestions = generateHealthSuggestions({
    standardDeviation,
    categoryVariance,
    languageVariance,
    distributionBalance
  });

  // Calculate overall score
  const componentScores = {
    variance: Math.max(0, 100 - (standardDeviation * 2.5)),
    categoryBalance: Math.max(0, 100 - (categoryVariance * 1.5)),
    languageConsistency: Math.max(0, 100 - (languageVariance * 2)),
    distributionBalance,
    workloadBalance: 80, // Simplified for now
    qualityScore: 75, // Simplified for now
    trendsScore: 50 // Simplified for now
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
    workloadBalance: componentScores.workloadBalance,
    qualityScore: componentScores.qualityScore,
    trendsScore: componentScores.trendsScore,
    issues,
    suggestions,
    tier,
    trendDirection: 'stable' // Simplified for now
  };
}

function generateHealthIssues(params: {
  standardDeviation: number;
  categoryVariance: number;
  languageVariance: number;
  distributionBalance: number;
  documents: Document[];
  mean: number;
}): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const { standardDeviation, categoryVariance, languageVariance, distributionBalance } = params;

  if (standardDeviation > 25) {
    issues.push({
      id: 'high-variance',
      severity: 'high',
      title: 'High Priority Variance',
      description: `Standard deviation of ${standardDeviation.toFixed(1)} exceeds recommended threshold of 25`,
    });
  }

  if (categoryVariance > 30) {
    issues.push({
      id: 'category-imbalance',
      severity: 'medium',
      title: 'Category Priority Imbalance',
      description: `Significant variance (${categoryVariance.toFixed(1)}) between category priorities`,
    });
  }

  if (languageVariance > 20) {
    issues.push({
      id: 'language-inconsistency',
      severity: 'medium',
      title: 'Language Version Inconsistency',
      description: `Priority difference between language versions: ${languageVariance.toFixed(1)} points`,
    });
  }

  if (distributionBalance < 60) {
    issues.push({
      id: 'poor-distribution',
      severity: 'high',
      title: 'Poor Priority Distribution',
      description: 'Priority distribution significantly deviates from recommended patterns',
    });
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

function generateHealthSuggestions(params: {
  standardDeviation: number;
  categoryVariance: number;
  languageVariance: number;
  distributionBalance: number;
}): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];
  const { standardDeviation, categoryVariance, languageVariance, distributionBalance } = params;

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

  return suggestions.sort((a, b) => {
    const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}