/**
 * @fileoverview Analytics-related type definitions for Priority Management System
 */

export interface PriorityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  minimal: number;
}

export interface CategoryAnalysis {
  [category: string]: {
    count: number;
    averagePriority: number;
    priorityRange: { min: number; max: number };
    completion: { draft: number; review: number; completed: number };
  };
}

export interface LanguageAnalysis {
  [language: string]: {
    count: number;
    averagePriority: number;
    categoryDistribution: { [category: string]: number };
    completionRate: number;
  };
}

export interface AssigneeAnalysis {
  [assignee: string]: {
    count: number;
    averagePriority: number;
    workload: 'light' | 'normal' | 'heavy' | 'overloaded';
    categoryFocus: string[];
  };
}

export interface TrendsAnalysis {
  priorityTrend: 'improving' | 'stable' | 'declining';
  distributionBalance: number;
  qualityScore: number;
  teamEfficiency: number;
}

export interface Recommendation {
  id: string;
  type: 'priority' | 'workload' | 'quality' | 'process';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
}

export interface AnalyticsData {
  distribution: PriorityDistribution;
  categoryAnalysis: CategoryAnalysis;
  languageAnalysis: LanguageAnalysis;
  assigneeAnalysis: AssigneeAnalysis;
  trends: TrendsAnalysis;
  recommendations: Recommendation[];
}