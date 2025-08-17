/**
 * Enhanced Work Status Manager - Advanced work status tracking and analysis
 */

import { WorkStatusManager, WorkStatusInfo, WorkListFilters } from './WorkStatusManager.js';
import type { LLMSConfig } from '../types/index.js';
import { globalPerformanceMonitor } from '../infrastructure/monitoring/PerformanceMonitor.js';

export interface EnhancedWorkStatusReport {
  summary: {
    totalDocuments: number;
    documentsNeedingWork: number;
    workCompletionRate: number;
    qualityScore: number;
    urgentItems: number;
  };
  breakdown: {
    byUpdateReason: Record<string, number>;
    byCharacterLimit: Record<number, {
      total: number;
      completed: number;
      needsWork: number;
      averageQuality: number;
    }>;
    byQualityTier: {
      excellent: number; // 90-100
      good: number;      // 70-89
      fair: number;      // 50-69
      poor: number;      // 0-49
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'missing' | 'quality' | 'template' | 'outdated';
    description: string;
    affectedCount: number;
    action: string;
  }>;
  insights: Array<{
    type: 'pattern' | 'anomaly' | 'trend';
    description: string;
    impact: 'high' | 'medium' | 'low';
    suggestion?: string;
  }>;
}

export interface WorkStatusTrend {
  language: string;
  period: string;
  metrics: {
    completionRate: number;
    qualityScore: number;
    updateFrequency: number;
    manualEditRate: number;
  };
  changes: {
    completionRateChange: number;
    qualityScoreChange: number;
    newIssues: number;
    resolvedIssues: number;
  };
}

export class EnhancedWorkStatusManager extends WorkStatusManager {
  private performanceMonitor = globalPerformanceMonitor;

  constructor(config: LLMSConfig) {
    super(config);
  }

  /**
   * Generate comprehensive work status report with advanced analytics
   */
  async generateEnhancedReport(language: string): Promise<EnhancedWorkStatusReport> {
    const stopTiming = this.performanceMonitor.startTiming('enhanced-work-status-report');
    
    try {
      // Get basic work summary
      const workSummary = await this.getWorkSummary(language);
      
      // Get all work status info for detailed analysis
      const allWorkStatus = await this.listWorkNeeded(language, {});
      
      // Calculate enhanced metrics
      const summary = {
        totalDocuments: workSummary.totalDocuments,
        documentsNeedingWork: workSummary.documentsNeedingWork,
        workCompletionRate: ((workSummary.totalDocuments - workSummary.documentsNeedingWork) / workSummary.totalDocuments) * 100,
        qualityScore: this.calculateOverallQualityScore(allWorkStatus),
        urgentItems: this.countUrgentItems(allWorkStatus)
      };

      // Breakdown analysis
      const breakdown = {
        byUpdateReason: this.analyzeUpdateReasons(allWorkStatus),
        byCharacterLimit: this.analyzeByCharacterLimit(allWorkStatus),
        byQualityTier: this.analyzeQualityTiers(allWorkStatus)
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(workSummary, allWorkStatus);
      
      // Generate insights
      const insights = this.generateInsights(allWorkStatus, workSummary);

      return {
        summary,
        breakdown,
        recommendations,
        insights
      };

    } finally {
      stopTiming();
    }
  }

  /**
   * Analyze work status trends over time
   */
  async analyzeWorkStatusTrends(language: string, periods: string[] = ['daily', 'weekly']): Promise<WorkStatusTrend[]> {
    const trends: WorkStatusTrend[] = [];
    
    for (const period of periods) {
      const currentMetrics = await this.calculateCurrentMetrics(language);
      // For a full implementation, we'd compare with historical data
      // For now, we'll provide current state analysis
      
      trends.push({
        language,
        period,
        metrics: currentMetrics,
        changes: {
          completionRateChange: 0, // Would be calculated from historical data
          qualityScoreChange: 0,
          newIssues: 0,
          resolvedIssues: 0
        }
      });
    }
    
    return trends;
  }

  /**
   * Get prioritized work queue with smart sorting
   */
  async getPrioritizedWorkQueue(language: string, maxItems: number = 20): Promise<Array<{
    workStatus: WorkStatusInfo;
    priorityScore: number;
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
    category: string;
  }>> {
    const allWork = await this.listWorkNeeded(language, { needsUpdate: true });
    
    const prioritizedWork = allWork.map(workStatus => {
      const priorityScore = this.calculatePriorityScore(workStatus);
      const urgencyLevel = this.determineUrgencyLevel(workStatus);
      const category = this.categorizeWork(workStatus);
      
      return {
        workStatus,
        priorityScore,
        urgencyLevel,
        category
      };
    });

    // Sort by priority score (higher first)
    prioritizedWork.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return prioritizedWork.slice(0, maxItems);
  }

  /**
   * Perform automated quality assessment
   */
  async performQualityAssessment(language: string): Promise<{
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    issues: Array<{
      severity: 'critical' | 'major' | 'minor';
      type: string;
      count: number;
      description: string;
      recommendation: string;
    }>;
    strengths: string[];
    improvementAreas: string[];
  }> {
    const workSummary = await this.getWorkSummary(language);
    const allWork = await this.listWorkNeeded(language, {});
    
    const score = this.calculateOverallQualityScore(allWork);
    const grade = this.scoreToGrade(score);
    
    const issues = this.identifyQualityIssues(workSummary, allWork);
    const strengths = this.identifyStrengths(workSummary, allWork);
    const improvementAreas = this.identifyImprovementAreas(workSummary, allWork);
    
    return {
      overallGrade: grade,
      score,
      issues,
      strengths,
      improvementAreas
    };
  }

  // Private helper methods

  private calculateOverallQualityScore(allWorkStatus: WorkStatusInfo[]): number {
    let totalScore = 0;
    let totalFiles = 0;
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (file.exists && file.qualityScore !== undefined) {
          totalScore += file.qualityScore;
          totalFiles++;
        }
      }
    }
    
    return totalFiles > 0 ? totalScore / totalFiles : 0;
  }

  private countUrgentItems(allWorkStatus: WorkStatusInfo[]): number {
    let urgentCount = 0;
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (file.updateReason === 'missing' || 
            file.updateReason === 'template_detected' ||
            (file.qualityScore && file.qualityScore < 30)) {
          urgentCount++;
        }
      }
    }
    
    return urgentCount;
  }

  private analyzeUpdateReasons(allWorkStatus: WorkStatusInfo[]): Record<string, number> {
    const reasons: Record<string, number> = {};
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (file.updateReason) {
          reasons[file.updateReason] = (reasons[file.updateReason] || 0) + 1;
        }
      }
    }
    
    return reasons;
  }

  private analyzeByCharacterLimit(allWorkStatus: WorkStatusInfo[]): Record<number, any> {
    const analysis: Record<number, any> = {};
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (!analysis[file.charLimit]) {
          analysis[file.charLimit] = {
            total: 0,
            completed: 0,
            needsWork: 0,
            qualityScores: []
          };
        }
        
        analysis[file.charLimit].total++;
        
        if (file.exists && !file.needsUpdate) {
          analysis[file.charLimit].completed++;
        } else {
          analysis[file.charLimit].needsWork++;
        }
        
        if (file.qualityScore !== undefined) {
          analysis[file.charLimit].qualityScores.push(file.qualityScore);
        }
      }
    }
    
    // Calculate average quality for each limit
    for (const limit in analysis) {
      const scores = analysis[limit].qualityScores;
      analysis[limit].averageQuality = scores.length > 0 
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
        : 0;
      delete analysis[limit].qualityScores;
    }
    
    return analysis;
  }

  private analyzeQualityTiers(allWorkStatus: WorkStatusInfo[]): any {
    const tiers = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (file.qualityScore !== undefined) {
          if (file.qualityScore >= 90) tiers.excellent++;
          else if (file.qualityScore >= 70) tiers.good++;
          else if (file.qualityScore >= 50) tiers.fair++;
          else tiers.poor++;
        }
      }
    }
    
    return tiers;
  }

  private generateRecommendations(workSummary: any, allWorkStatus: WorkStatusInfo[]): any[] {
    const recommendations = [];
    
    // Missing files recommendation
    if (workSummary.missingFiles > 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'missing' as const,
        description: `${workSummary.missingFiles}개의 파일이 누락되어 있습니다`,
        affectedCount: workSummary.missingFiles,
        action: 'extract-all 명령으로 누락된 파일들을 생성하세요'
      });
    }
    
    // Template files recommendation
    if (workSummary.templateFiles > 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'template' as const,
        description: `${workSummary.templateFiles}개의 파일에서 템플릿 표현이 감지되었습니다`,
        affectedCount: workSummary.templateFiles,
        action: '템플릿 표현을 구체적인 내용으로 수정하세요'
      });
    }
    
    // Low quality recommendation
    if (workSummary.lowQualityFiles > 0) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'quality' as const,
        description: `${workSummary.lowQualityFiles}개의 파일이 품질 기준을 만족하지 않습니다`,
        affectedCount: workSummary.lowQualityFiles,
        action: '내용을 확장하고 품질을 개선하세요'
      });
    }
    
    return recommendations;
  }

  private generateInsights(allWorkStatus: WorkStatusInfo[], workSummary: any): any[] {
    const insights = [];
    
    // Completion rate insight
    const completionRate = ((workSummary.totalDocuments - workSummary.documentsNeedingWork) / workSummary.totalDocuments) * 100;
    if (completionRate < 80) {
      insights.push({
        type: 'pattern' as const,
        description: `완성률이 ${completionRate.toFixed(1)}%로 낮습니다`,
        impact: 'high' as const,
        suggestion: '누락된 파일들을 우선적으로 생성하여 완성률을 높이세요'
      });
    }
    
    // Quality pattern insight
    const avgQuality = this.calculateOverallQualityScore(allWorkStatus);
    if (avgQuality < 60) {
      insights.push({
        type: 'anomaly' as const,
        description: `전체 품질 점수가 ${avgQuality.toFixed(1)}점으로 낮습니다`,
        impact: 'medium' as const,
        suggestion: '템플릿 표현을 제거하고 구체적인 내용으로 개선하세요'
      });
    }
    
    return insights;
  }

  private calculatePriorityScore(workStatus: WorkStatusInfo): number {
    let score = 0;
    
    // Base score from number of issues
    score += workStatus.updateReasons.length * 10;
    score += workStatus.qualityIssues.length * 5;
    
    // Character limit priority (shorter limits are more important)
    for (const file of workStatus.generatedFiles) {
      if (file.needsUpdate) {
        if (file.charLimit <= 200) score += 20;
        else if (file.charLimit <= 500) score += 10;
        else score += 5;
      }
    }
    
    return score;
  }

  private estimateWorkTime(workStatus: WorkStatusInfo): number {
    let totalMinutes = 0;
    
    for (const file of workStatus.generatedFiles) {
      if (file.needsUpdate) {
        if (file.updateReason === 'missing') totalMinutes += 10;
        else if (file.updateReason === 'template_detected') totalMinutes += 8;
        else if (file.updateReason === 'quality_low') totalMinutes += 15;
        else totalMinutes += 5;
      }
    }
    
    return totalMinutes;
  }

  private determineUrgencyLevel(workStatus: WorkStatusInfo): 'critical' | 'high' | 'medium' | 'low' {
    const hasCritical = workStatus.generatedFiles.some(f => 
      f.updateReason === 'missing' && f.charLimit <= 200
    );
    const hasHigh = workStatus.generatedFiles.some(f => 
      f.updateReason === 'template_detected'
    );
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (workStatus.updateReasons.length > 2) return 'medium';
    return 'low';
  }

  private categorizeWork(workStatus: WorkStatusInfo): string {
    const reasons = workStatus.updateReasons;
    if (reasons.some(r => r.includes('누락'))) return '파일 생성';
    if (reasons.some(r => r.includes('템플릿'))) return '템플릿 수정';
    if (reasons.some(r => r.includes('품질'))) return '품질 개선';
    if (reasons.some(r => r.includes('최신'))) return '내용 업데이트';
    return '일반 수정';
  }

  private async calculateCurrentMetrics(language: string): Promise<any> {
    const workSummary = await this.getWorkSummary(language);
    const allWork = await this.listWorkNeeded(language, {});
    
    return {
      completionRate: ((workSummary.totalDocuments - workSummary.documentsNeedingWork) / workSummary.totalDocuments) * 100,
      qualityScore: this.calculateOverallQualityScore(allWork),
      updateFrequency: 0, // Would need historical data
      manualEditRate: this.calculateManualEditRate(allWork)
    };
  }

  private calculateManualEditRate(allWorkStatus: WorkStatusInfo[]): number {
    let totalFiles = 0;
    let editedFiles = 0;
    
    for (const work of allWorkStatus) {
      for (const file of work.generatedFiles) {
        if (file.exists) {
          totalFiles++;
          if (file.edited) editedFiles++;
        }
      }
    }
    
    return totalFiles > 0 ? (editedFiles / totalFiles) * 100 : 0;
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private identifyQualityIssues(workSummary: any, allWork: WorkStatusInfo[]): any[] {
    const issues = [];
    
    if (workSummary.templateFiles > workSummary.totalDocuments * 0.1) {
      issues.push({
        severity: 'major' as const,
        type: 'template_usage',
        count: workSummary.templateFiles,
        description: '템플릿 표현이 과도하게 사용됨',
        recommendation: '구체적인 내용으로 교체 필요'
      });
    }
    
    return issues;
  }

  private identifyStrengths(workSummary: any, allWork: WorkStatusInfo[]): string[] {
    const strengths = [];
    
    const completionRate = ((workSummary.totalDocuments - workSummary.documentsNeedingWork) / workSummary.totalDocuments) * 100;
    if (completionRate > 90) {
      strengths.push('높은 파일 완성률');
    }
    
    const editRate = this.calculateManualEditRate(allWork);
    if (editRate > 70) {
      strengths.push('높은 수동 편집률');
    }
    
    return strengths;
  }

  private identifyImprovementAreas(workSummary: any, allWork: WorkStatusInfo[]): string[] {
    const areas = [];
    
    if (workSummary.templateFiles > 0) {
      areas.push('템플릿 표현 제거');
    }
    
    if (workSummary.lowQualityFiles > 0) {
      areas.push('콘텐츠 품질 향상');
    }
    
    return areas;
  }
}