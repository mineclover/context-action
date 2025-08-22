/**
 * @fileoverview Health monitoring type definitions for Priority Management System
 */

export interface HealthIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedDocuments?: string[];
}

export interface HealthSuggestion {
  id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedImpact: number; // 0-100
  actionType: 'recalculate' | 'manual_review' | 'process_improvement' | 'team_coordination';
}

export interface HealthMetrics {
  overallScore: number;
  standardDeviation: number;
  categoryVariance: number;
  languageConsistency: number;
  distributionBalance: number;
  workloadBalance: number;
  qualityScore: number;
  trendsScore: number;
  issues: HealthIssue[];
  suggestions: HealthSuggestion[];
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface HistoricalHealthData {
  timestamp: Date;
  healthScore: number;
  documentCount: number;
}