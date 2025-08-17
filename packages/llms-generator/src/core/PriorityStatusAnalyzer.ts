/**
 * Priority JSON 작업 현황 분석기
 * 
 * Priority JSON 파일들의 상태, 완성도, 통계를 분석하는 시스템
 */

import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface PriorityFileInfo {
  path: string;
  category: string;
  language: string;
  exists: boolean;
  size: number;
  lastModified?: Date;
  priorityCount: number;
  averagePriority: number;
  completionStatus: 'complete' | 'partial' | 'empty' | 'missing';
  tierDistribution: Record<string, number>;
  issues: string[];
}

export interface PriorityAnalysisReport {
  summary: {
    totalFiles: number;
    completeFiles: number;
    partialFiles: number;
    emptyFiles: number;
    missingFiles: number;
    completionRate: number;
  };
  byLanguage: Record<string, {
    total: number;
    complete: number;
    completionRate: number;
  }>;
  byCategory: Record<string, {
    total: number;
    complete: number;
    completionRate: number;
    averagePriority: number;
  }>;
  files: PriorityFileInfo[];
  issues: {
    missingFiles: string[];
    emptyFiles: string[];
    lowQualityFiles: string[];
    inconsistentFiles: string[];
  };
  recommendations: string[];
}

export interface PriorityWorkProgress {
  totalProgress: number;
  categoryProgress: Record<string, number>;
  languageProgress: Record<string, number>;
  recentChanges: Array<{
    file: string;
    action: 'created' | 'updated' | 'deleted';
    timestamp: Date;
    details: string;
  }>;
  upcomingTasks: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    category?: string;
  }>;
}

/**
 * Priority JSON 작업 현황 분석기
 */
export class PriorityStatusAnalyzer {
  private dataDir: string;
  private supportedLanguages: string[];
  private cache: Map<string, PriorityFileInfo> = new Map();

  constructor(dataDir: string = './data', supportedLanguages: string[] = ['ko', 'en']) {
    this.dataDir = dataDir;
    this.supportedLanguages = supportedLanguages;
  }

  /**
   * 전체 Priority JSON 현황 분석
   */
  async analyzeOverallStatus(): Promise<PriorityAnalysisReport> {
    console.log('🔍 Priority JSON 현황 분석을 시작합니다...');

    const files = await this.scanPriorityFiles();
    const analysis = await this.analyzeFiles(files);

    return this.generateReport(analysis);
  }

  /**
   * Priority JSON 파일들 스캔
   */
  private async scanPriorityFiles(): Promise<string[]> {
    const pattern = path.join(this.dataDir, '**/priority.json');
    try {
      return await glob(pattern);
    } catch (error) {
      throw new Error(`Failed to scan priority files: ${error}`);
    }
  }

  /**
   * 개별 Priority JSON 파일 분석
   */
  private async analyzePriorityFile(filePath: string): Promise<PriorityFileInfo> {
    const cacheKey = filePath;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const relativePath = path.relative(this.dataDir, filePath);
    const pathParts = relativePath.split('/');
    const language = pathParts[0];
    const category = pathParts[1];
    
    const info: PriorityFileInfo = {
      path: filePath,
      category,
      language,
      exists: existsSync(filePath),
      size: 0,
      priorityCount: 0,
      averagePriority: 0,
      completionStatus: 'missing',
      tierDistribution: {},
      issues: []
    };

    if (!info.exists) {
      info.issues.push('파일이 존재하지 않음');
      this.cache.set(cacheKey, info);
      return info;
    }

    try {
      const stats = await readFile(filePath, 'utf-8');
      info.size = stats.length;
      
      if (info.size === 0) {
        info.completionStatus = 'empty';
        info.issues.push('빈 파일');
      } else {
        const priorityData = JSON.parse(stats);
        await this.analyzePriorityContent(priorityData, info);
      }
    } catch (error) {
      info.issues.push(`파일 읽기 오류: ${error}`);
      info.completionStatus = 'empty';
    }

    this.cache.set(cacheKey, info);
    return info;
  }

  /**
   * Priority JSON 내용 분석
   */
  private async analyzePriorityContent(data: any, info: PriorityFileInfo): Promise<void> {
    if (!data || typeof data !== 'object') {
      info.issues.push('유효하지 않은 JSON 구조');
      info.completionStatus = 'empty';
      return;
    }

    // 우선순위 데이터 수집
    const priorities: number[] = [];
    const tiers: string[] = [];

    if (Array.isArray(data)) {
      // 배열 형태의 우선순위 데이터
      data.forEach(item => {
        if (item.priority_score && typeof item.priority_score === 'number') {
          priorities.push(item.priority_score);
        }
        if (item.priority_tier && typeof item.priority_tier === 'string') {
          tiers.push(item.priority_tier);
        }
      });
    } else if (data.documents && Array.isArray(data.documents)) {
      // documents 속성이 있는 경우
      data.documents.forEach((doc: any) => {
        if (doc.priority_score && typeof doc.priority_score === 'number') {
          priorities.push(doc.priority_score);
        }
        if (doc.priority_tier && typeof doc.priority_tier === 'string') {
          tiers.push(doc.priority_tier);
        }
      });
    }

    info.priorityCount = priorities.length;
    info.averagePriority = priorities.length > 0 
      ? priorities.reduce((sum, p) => sum + p, 0) / priorities.length 
      : 0;

    // Tier 분포 계산
    info.tierDistribution = tiers.reduce((acc, tier) => {
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 완성도 평가
    if (info.priorityCount === 0) {
      info.completionStatus = 'empty';
      info.issues.push('우선순위 데이터 없음');
    } else if (info.priorityCount < 5) {
      info.completionStatus = 'partial';
      info.issues.push('우선순위 데이터 부족 (< 5개)');
    } else {
      info.completionStatus = 'complete';
    }

    // 품질 검사
    this.performQualityChecks(data, info);
  }

  /**
   * 품질 검사 수행
   */
  private performQualityChecks(data: any, info: PriorityFileInfo): void {
    // 평균 우선순위가 너무 낮거나 높은 경우
    if (info.averagePriority < 20) {
      info.issues.push('평균 우선순위가 너무 낮음 (< 20)');
    } else if (info.averagePriority > 95) {
      info.issues.push('평균 우선순위가 너무 높음 (> 95)');
    }

    // Tier 분포가 불균형한 경우
    const totalTiers = Object.values(info.tierDistribution).reduce((sum, count) => sum + count, 0);
    if (totalTiers > 0) {
      const maxTierCount = Math.max(...Object.values(info.tierDistribution));
      const tierImbalance = maxTierCount / totalTiers;
      if (tierImbalance > 0.8) {
        info.issues.push('Tier 분포 불균형 (한 tier에 80% 이상 집중)');
      }
    }

    // 필수 필드 누락 검사
    const documents = Array.isArray(data) ? data : (data.documents || []);
    const missingFields = this.checkMissingFields(documents);
    if (missingFields.length > 0) {
      info.issues.push(`필수 필드 누락: ${missingFields.join(', ')}`);
    }
  }

  /**
   * 필수 필드 누락 검사
   */
  private checkMissingFields(documents: any[]): string[] {
    const requiredFields = ['id', 'title', 'priority_score', 'priority_tier'];
    const missingFields: string[] = [];

    documents.forEach((doc, index) => {
      requiredFields.forEach(field => {
        if (!doc[field]) {
          missingFields.push(`${field} (문서 ${index + 1})`);
        }
      });
    });

    return [...new Set(missingFields)]; // 중복 제거
  }

  /**
   * 파일들 분석
   */
  private async analyzeFiles(filePaths: string[]): Promise<PriorityFileInfo[]> {
    const results: PriorityFileInfo[] = [];

    console.log(`📄 ${filePaths.length}개의 Priority JSON 파일을 분석합니다...`);

    for (const filePath of filePaths) {
      try {
        const info = await this.analyzePriorityFile(filePath);
        results.push(info);
      } catch (error) {
        console.error(`❌ ${filePath} 분석 실패:`, error);
      }
    }

    return results;
  }

  /**
   * 분석 리포트 생성
   */
  private generateReport(files: PriorityFileInfo[]): PriorityAnalysisReport {
    const summary = this.calculateSummary(files);
    const byLanguage = this.groupByLanguage(files);
    const byCategory = this.groupByCategory(files);
    const issues = this.categorizeIssues(files);
    const recommendations = this.generateRecommendations(files, summary);

    return {
      summary,
      byLanguage,
      byCategory,
      files,
      issues,
      recommendations
    };
  }

  /**
   * 요약 통계 계산
   */
  private calculateSummary(files: PriorityFileInfo[]) {
    const total = files.length;
    const complete = files.filter(f => f.completionStatus === 'complete').length;
    const partial = files.filter(f => f.completionStatus === 'partial').length;
    const empty = files.filter(f => f.completionStatus === 'empty').length;
    const missing = files.filter(f => f.completionStatus === 'missing').length;

    return {
      totalFiles: total,
      completeFiles: complete,
      partialFiles: partial,
      emptyFiles: empty,
      missingFiles: missing,
      completionRate: total > 0 ? (complete / total) * 100 : 0
    };
  }

  /**
   * 언어별 그룹화
   */
  private groupByLanguage(files: PriorityFileInfo[]) {
    const grouped: Record<string, { total: number; complete: number; completionRate: number }> = {};

    files.forEach(file => {
      if (!grouped[file.language]) {
        grouped[file.language] = { total: 0, complete: 0, completionRate: 0 };
      }
      grouped[file.language].total++;
      if (file.completionStatus === 'complete') {
        grouped[file.language].complete++;
      }
    });

    // 완성률 계산
    Object.keys(grouped).forEach(lang => {
      const stats = grouped[lang];
      stats.completionRate = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0;
    });

    return grouped;
  }

  /**
   * 카테고리별 그룹화
   */
  private groupByCategory(files: PriorityFileInfo[]) {
    const grouped: Record<string, { total: number; complete: number; completionRate: number; averagePriority: number }> = {};

    files.forEach(file => {
      if (!grouped[file.category]) {
        grouped[file.category] = { total: 0, complete: 0, completionRate: 0, averagePriority: 0 };
      }
      grouped[file.category].total++;
      if (file.completionStatus === 'complete') {
        grouped[file.category].complete++;
      }
    });

    // 완성률 및 평균 우선순위 계산
    Object.keys(grouped).forEach(category => {
      const stats = grouped[category];
      const categoryFiles = files.filter(f => f.category === category);
      
      stats.completionRate = stats.total > 0 ? (stats.complete / stats.total) * 100 : 0;
      
      const validPriorities = categoryFiles
        .filter(f => f.averagePriority > 0)
        .map(f => f.averagePriority);
      
      stats.averagePriority = validPriorities.length > 0
        ? validPriorities.reduce((sum, p) => sum + p, 0) / validPriorities.length
        : 0;
    });

    return grouped;
  }

  /**
   * 이슈 분류
   */
  private categorizeIssues(files: PriorityFileInfo[]) {
    return {
      missingFiles: files.filter(f => f.completionStatus === 'missing').map(f => f.path),
      emptyFiles: files.filter(f => f.completionStatus === 'empty').map(f => f.path),
      lowQualityFiles: files.filter(f => f.issues.length > 2).map(f => f.path),
      inconsistentFiles: files.filter(f => 
        f.issues.some(issue => issue.includes('불균형') || issue.includes('누락'))
      ).map(f => f.path)
    };
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(files: PriorityFileInfo[], summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.completionRate < 80) {
      recommendations.push(`전체 완성률이 ${summary.completionRate.toFixed(1)}%로 낮습니다. 우선순위 작업 강화가 필요합니다.`);
    }

    if (summary.emptyFiles > 0) {
      recommendations.push(`${summary.emptyFiles}개의 빈 파일이 있습니다. 우선순위 데이터를 추가하세요.`);
    }

    if (summary.missingFiles > 0) {
      recommendations.push(`${summary.missingFiles}개의 파일이 누락되었습니다. Priority JSON 파일을 생성하세요.`);
    }

    const lowQualityFiles = files.filter(f => f.issues.length > 2).length;
    if (lowQualityFiles > 0) {
      recommendations.push(`${lowQualityFiles}개의 파일에 품질 문제가 있습니다. 데이터 검토 및 개선이 필요합니다.`);
    }

    const imbalancedFiles = files.filter(f => 
      f.issues.some(issue => issue.includes('불균형'))
    ).length;
    if (imbalancedFiles > 0) {
      recommendations.push(`${imbalancedFiles}개의 파일에 Tier 분포 불균형이 있습니다. 우선순위 재조정을 고려하세요.`);
    }

    return recommendations;
  }

  /**
   * 작업 진행 현황 추적
   */
  async getWorkProgress(): Promise<PriorityWorkProgress> {
    const files = await this.scanPriorityFiles();
    const analysis = await this.analyzeFiles(files);
    
    // 전체 진행률 계산
    const totalProgress = this.calculateOverallProgress(analysis);
    
    // 카테고리별 진행률
    const categoryProgress = this.calculateCategoryProgress(analysis);
    
    // 언어별 진행률
    const languageProgress = this.calculateLanguageProgress(analysis);
    
    // 최근 변경사항 (실제 구현에서는 파일 시스템 변경 추적 필요)
    const recentChanges = await this.getRecentChanges(files);
    
    // 향후 작업 추천
    const upcomingTasks = this.generateUpcomingTasks(analysis);

    return {
      totalProgress,
      categoryProgress,
      languageProgress,
      recentChanges,
      upcomingTasks
    };
  }

  private calculateOverallProgress(files: PriorityFileInfo[]): number {
    if (files.length === 0) return 0;
    
    const completeFiles = files.filter(f => f.completionStatus === 'complete').length;
    const partialFiles = files.filter(f => f.completionStatus === 'partial').length;
    
    // 완전한 파일은 100%, 부분적 파일은 50%로 계산
    const weightedProgress = (completeFiles * 100 + partialFiles * 50) / files.length;
    return Math.round(weightedProgress * 100) / 100;
  }

  private calculateCategoryProgress(files: PriorityFileInfo[]): Record<string, number> {
    const categories = [...new Set(files.map(f => f.category))];
    const progress: Record<string, number> = {};

    categories.forEach(category => {
      const categoryFiles = files.filter(f => f.category === category);
      progress[category] = this.calculateOverallProgress(categoryFiles);
    });

    return progress;
  }

  private calculateLanguageProgress(files: PriorityFileInfo[]): Record<string, number> {
    const languages = [...new Set(files.map(f => f.language))];
    const progress: Record<string, number> = {};

    languages.forEach(language => {
      const languageFiles = files.filter(f => f.language === language);
      progress[language] = this.calculateOverallProgress(languageFiles);
    });

    return progress;
  }

  private async getRecentChanges(files: string[]): Promise<Array<{
    file: string;
    action: 'created' | 'updated' | 'deleted';
    timestamp: Date;
    details: string;
  }>> {
    // 실제 구현에서는 Git log나 파일 시스템 변경 추적을 사용
    // 여기서는 임시로 빈 배열 반환
    return [];
  }

  private generateUpcomingTasks(files: PriorityFileInfo[]): Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    category?: string;
  }> {
    const tasks: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      category?: string;
    }> = [];

    // 누락된 파일들 처리
    const missingFiles = files.filter(f => f.completionStatus === 'missing');
    if (missingFiles.length > 0) {
      tasks.push({
        priority: 'high',
        description: `${missingFiles.length}개의 누락된 Priority JSON 파일 생성`,
      });
    }

    // 빈 파일들 처리
    const emptyFiles = files.filter(f => f.completionStatus === 'empty');
    if (emptyFiles.length > 0) {
      tasks.push({
        priority: 'high',
        description: `${emptyFiles.length}개의 빈 Priority JSON 파일에 데이터 추가`,
      });
    }

    // 부분적 파일들 완성
    const partialFiles = files.filter(f => f.completionStatus === 'partial');
    if (partialFiles.length > 0) {
      tasks.push({
        priority: 'medium',
        description: `${partialFiles.length}개의 부분적 Priority JSON 파일 완성`,
      });
    }

    // 품질 개선
    const lowQualityFiles = files.filter(f => f.issues.length > 2);
    if (lowQualityFiles.length > 0) {
      tasks.push({
        priority: 'medium',
        description: `${lowQualityFiles.length}개의 파일 품질 개선`,
      });
    }

    return tasks;
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear();
  }
}