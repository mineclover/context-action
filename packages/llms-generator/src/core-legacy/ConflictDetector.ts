/**
 * Conflict Detector - detects and resolves conflicts between documents
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  DependencyConfig,
  TagConfig
} from '../types/config.js';

export interface ConflictRule {
  type: 'tag-incompatible' | 'version-conflict' | 'content-duplicate' | 'dependency-cycle' | 'audience-mismatch' | 'complexity-gap' | 'category-exclusive';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  detectFunction: (docA: DocumentMetadata, docB: DocumentMetadata, config: EnhancedLLMSConfig) => boolean;
  resolveFunction?: (docA: DocumentMetadata, docB: DocumentMetadata, config: EnhancedLLMSConfig) => ConflictResolution;
}

export interface ConflictResolution {
  action: 'exclude-first' | 'exclude-second' | 'exclude-both' | 'modify-first' | 'modify-second' | 'merge' | 'keep-both' | 'manual-review';
  reason: string;
  confidence: number; // 0-1
  suggestedChanges?: Array<{
    documentId: string;
    changes: Record<string, any>;
    rationale: string;
  }>;
}

export interface Conflict {
  id: string;
  documentA: DocumentMetadata;
  documentB: DocumentMetadata;
  rule: ConflictRule;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  resolution?: ConflictResolution;
  autoResolvable: boolean;
  impact: {
    userExperience: number; // 0-1
    contentQuality: number; // 0-1
    systemComplexity: number; // 0-1
  };
}

export interface ConflictAnalysisResult {
  conflicts: Conflict[];
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    autoResolvable: number;
    requiresManualReview: number;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    reason: string;
    affectedDocuments: string[];
  }>;
  resolutionPlan: Array<{
    step: number;
    action: 'exclude' | 'modify' | 'merge' | 'review';
    documentIds: string[];
    rationale: string;
    dependencies: number[]; // Other steps that must complete first
  }>;
}

export interface ConflictDetectionOptions {
  enabledRules?: string[];
  severityThreshold?: 'minor' | 'moderate' | 'major' | 'critical';
  autoResolve?: boolean;
  generateResolutionPlan?: boolean;
  includeImpactAnalysis?: boolean;
}

export class ConflictDetector {
  private config: EnhancedLLMSConfig;
  private rules: Map<string, ConflictRule>;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.rules = this.initializeConflictRules();
  }

  /**
   * Detect conflicts between documents
   */
  detectConflicts(
    documents: DocumentMetadata[],
    options: ConflictDetectionOptions = {}
  ): ConflictAnalysisResult {
    const {
      enabledRules = Array.from(this.rules.keys()),
      severityThreshold = 'minor',
      autoResolve = true,
      generateResolutionPlan = true,
      includeImpactAnalysis = true
    } = options;

    const conflicts: Conflict[] = [];
    const severityLevels = ['minor', 'moderate', 'major', 'critical'];
    const minSeverityIndex = severityLevels.indexOf(severityThreshold);

    // Check each pair of documents
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const docA = documents[i];
        const docB = documents[j];

        // Apply each enabled rule
        for (const ruleName of enabledRules) {
          const rule = this.rules.get(ruleName);
          if (!rule) continue;

          // Skip if below severity threshold
          const severityIndex = severityLevels.indexOf(rule.severity);
          if (severityIndex < minSeverityIndex) continue;

          // Check if conflict exists
          if (rule.detectFunction(docA, docB, this.config)) {
            const conflict: Conflict = {
              id: `${docA.document.id}-${docB.document.id}-${ruleName}`,
              documentA: docA,
              documentB: docB,
              rule,
              severity: rule.severity,
              description: `${rule.description}: ${docA.document.title} vs ${docB.document.title}`,
              autoResolvable: !!rule.resolveFunction,
              impact: includeImpactAnalysis 
                ? this.calculateImpact(docA, docB, rule)
                : { userExperience: 0, contentQuality: 0, systemComplexity: 0 }
            };

            // Auto-resolve if enabled and possible
            if (autoResolve && rule.resolveFunction) {
              conflict.resolution = rule.resolveFunction(docA, docB, this.config);
            }

            conflicts.push(conflict);
          }
        }
      }
    }

    // Generate summary
    const summary = this.generateSummary(conflicts);

    // Generate recommendations
    const recommendations = this.generateRecommendations(conflicts, documents);

    // Generate resolution plan
    const resolutionPlan = generateResolutionPlan 
      ? this.generateResolutionPlan(conflicts)
      : [];

    return {
      conflicts,
      summary,
      recommendations,
      resolutionPlan
    };
  }

  /**
   * Apply conflict resolutions to document set
   */
  applyConflictResolutions(
    documents: DocumentMetadata[],
    conflicts: Conflict[]
  ): {
    resolvedDocuments: DocumentMetadata[];
    excludedDocuments: Array<{
      document: DocumentMetadata;
      reason: string;
      conflicts: string[];
    }>;
    modifiedDocuments: Array<{
      original: DocumentMetadata;
      modified: DocumentMetadata;
      changes: Record<string, any>;
    }>;
    unresolved: Conflict[];
  } {
    const resolvedDocuments: DocumentMetadata[] = [...documents];
    const excludedDocuments: Array<{ document: DocumentMetadata; reason: string; conflicts: string[] }> = [];
    const modifiedDocuments: Array<{ original: DocumentMetadata; modified: DocumentMetadata; changes: Record<string, any> }> = [];
    const unresolved: Conflict[] = [];
    const excluded = new Set<string>();

    // Process conflicts by severity (critical first)
    const sortedConflicts = conflicts
      .filter(conflict => conflict.resolution)
      .sort((a, b) => {
        const severityOrder = { 'critical': 3, 'major': 2, 'moderate': 1, 'minor': 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    for (const conflict of sortedConflicts) {
      const resolution = conflict.resolution!;
      const docA = conflict.documentA;
      const docB = conflict.documentB;

      // Skip if documents already excluded
      if (excluded.has(docA.document.id) || excluded.has(docB.document.id)) {
        continue;
      }

      switch (resolution.action) {
        case 'exclude-first':
          this.excludeDocument(docA, resolution.reason, [conflict.id], excludedDocuments, excluded, resolvedDocuments);
          break;

        case 'exclude-second':
          this.excludeDocument(docB, resolution.reason, [conflict.id], excludedDocuments, excluded, resolvedDocuments);
          break;

        case 'exclude-both':
          this.excludeDocument(docA, resolution.reason, [conflict.id], excludedDocuments, excluded, resolvedDocuments);
          this.excludeDocument(docB, resolution.reason, [conflict.id], excludedDocuments, excluded, resolvedDocuments);
          break;

        case 'modify-first':
        case 'modify-second':
          // Apply modifications if suggested changes are provided
          if (resolution.suggestedChanges) {
            for (const change of resolution.suggestedChanges) {
              const docIndex = resolvedDocuments.findIndex(doc => doc.document.id === change.documentId);
              if (docIndex !== -1) {
                const originalDoc = resolvedDocuments[docIndex];
                const modifiedDoc = this.applyChangesToDocument(originalDoc, change.changes);
                resolvedDocuments[docIndex] = modifiedDoc;
                
                modifiedDocuments.push({
                  original: originalDoc,
                  modified: modifiedDoc,
                  changes: change.changes
                });
              }
            }
          }
          break;

        case 'keep-both':
          // No action needed - both documents remain
          break;

        case 'manual-review':
          unresolved.push(conflict);
          break;

        default:
          unresolved.push(conflict);
      }
    }

    // Add unresolvable conflicts to unresolved
    const unresolvableConflicts = conflicts.filter(conflict => !conflict.resolution);
    unresolved.push(...unresolvableConflicts);

    return {
      resolvedDocuments,
      excludedDocuments,
      modifiedDocuments,
      unresolved
    };
  }

  /**
   * Initialize built-in conflict detection rules
   */
  private initializeConflictRules(): Map<string, ConflictRule> {
    const rules = new Map<string, ConflictRule>();

    // Tag incompatibility rule
    rules.set('tag-incompatible', {
      type: 'tag-incompatible',
      severity: 'moderate',
      description: 'Documents have incompatible tags',
      detectFunction: (docA, docB, config) => {
        return this.hasIncompatibleTags(docA, docB, config);
      },
      resolveFunction: (docA, docB, config) => {
        const scoreA = docA.priority.score;
        const scoreB = docB.priority.score;
        
        return {
          action: scoreA >= scoreB ? 'exclude-second' : 'exclude-first',
          reason: 'Excluded due to tag incompatibility - keeping higher priority document',
          confidence: 0.8
        };
      }
    });

    // Content duplication rule
    rules.set('content-duplicate', {
      type: 'content-duplicate',
      severity: 'major',
      description: 'Documents appear to be duplicates or highly similar',
      detectFunction: (docA, docB, config) => {
        return this.isContentDuplicate(docA, docB);
      },
      resolveFunction: (docA, docB, config) => {
        const scoreA = docA.priority.score;
        const scoreB = docB.priority.score;
        
        return {
          action: scoreA >= scoreB ? 'exclude-second' : 'exclude-first',
          reason: 'Excluded duplicate content - keeping higher priority document',
          confidence: 0.9
        };
      }
    });

    // Audience mismatch rule
    rules.set('audience-mismatch', {
      type: 'audience-mismatch',
      severity: 'minor',
      description: 'Documents target conflicting audience levels',
      detectFunction: (docA, docB, config) => {
        return this.hasAudienceMismatch(docA, docB);
      },
      resolveFunction: (docA, docB, config) => {
        return {
          action: 'keep-both',
          reason: 'Different audiences can coexist',
          confidence: 0.6
        };
      }
    });

    // Complexity gap rule
    rules.set('complexity-gap', {
      type: 'complexity-gap',
      severity: 'minor',
      description: 'Large complexity gap between related documents',
      detectFunction: (docA, docB, config) => {
        return this.hasComplexityGap(docA, docB);
      },
      resolveFunction: (docA, docB, config) => {
        return {
          action: 'keep-both',
          reason: 'Complexity gap is manageable with proper ordering',
          confidence: 0.5
        };
      }
    });

    // Category exclusivity rule
    rules.set('category-exclusive', {
      type: 'category-exclusive',
      severity: 'moderate',
      description: 'Documents belong to mutually exclusive categories',
      detectFunction: (docA, docB, config) => {
        return this.hasCategoryConflict(docA, docB, config);
      },
      resolveFunction: (docA, docB, config) => {
        const categoryA = config.categories[docA.document.category];
        const categoryB = config.categories[docB.document.category];
        
        const priorityA = categoryA?.priority || 0;
        const priorityB = categoryB?.priority || 0;
        
        return {
          action: priorityA >= priorityB ? 'exclude-second' : 'exclude-first',
          reason: 'Excluded due to category exclusivity - keeping higher priority category',
          confidence: 0.7
        };
      }
    });

    return rules;
  }

  /**
   * Check for incompatible tags between documents
   */
  private hasIncompatibleTags(docA: DocumentMetadata, docB: DocumentMetadata, config: EnhancedLLMSConfig): boolean {
    const tagsA = new Set(docA.tags.primary);
    const tagsB = new Set(docB.tags.secondary);

    for (const tagA of tagsA) {
      const tagConfigA = config.tags[tagA];
      if (!tagConfigA) continue;

      for (const tagB of tagsB) {
        // Check if tagA is incompatible with tagB
        if (!tagConfigA.compatibleWith.includes(tagB)) {
          // Also check if there's explicit incompatibility
          const tagConfigB = config.tags[tagB];
          if (tagConfigB && !tagConfigB.compatibleWith.includes(tagA)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if documents are content duplicates
   */
  private isContentDuplicate(docA: DocumentMetadata, docB: DocumentMetadata): boolean {
    // Simple heuristic: same title or very similar IDs
    if (docA.document.title === docB.document.title) {
      return true;
    }

    // Check for similar document IDs (edit distance)
    const similarity = this.calculateStringSimilarity(docA.document.id, docB.document.id);
    return similarity > 0.8;
  }

  /**
   * Check for audience mismatch
   */
  private hasAudienceMismatch(docA: DocumentMetadata, docB: DocumentMetadata): boolean {
    const audiencesA = new Set(docA.tags.audience);
    const audiencesB = new Set(docB.tags.audience);

    // Check for conflicting audiences
    const conflictingPairs = [
      ['beginners', 'advanced'],
      ['beginners', 'experts'],
      ['intermediate', 'experts']
    ];

    for (const [aud1, aud2] of conflictingPairs) {
      if ((audiencesA.has(aud1 as any) && audiencesB.has(aud2 as any)) ||
          (audiencesA.has(aud2 as any) && audiencesB.has(aud1 as any))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for complexity gap
   */
  private hasComplexityGap(docA: DocumentMetadata, docB: DocumentMetadata): boolean {
    const complexityLevels = ['basic', 'intermediate', 'advanced', 'expert'];
    const levelA = complexityLevels.indexOf(docA.tags.complexity);
    const levelB = complexityLevels.indexOf(docB.tags.complexity);

    // Gap of 2 or more levels is problematic
    return Math.abs(levelA - levelB) >= 2;
  }

  /**
   * Check for category conflicts
   */
  private hasCategoryConflict(docA: DocumentMetadata, docB: DocumentMetadata, config: EnhancedLLMSConfig): boolean {
    // Define mutually exclusive category pairs
    const exclusivePairs = [
      ['guide', 'reference'], // Guides and references can conflict in some strategies
      ['example', 'concept']  // Examples and pure concepts might conflict
    ];

    const catA = docA.document.category;
    const catB = docB.document.category;

    return exclusivePairs.some(([cat1, cat2]) =>
      (catA === cat1 && catB === cat2) || (catA === cat2 && catB === cat1)
    );
  }

  /**
   * Calculate impact of conflict
   */
  private calculateImpact(docA: DocumentMetadata, docB: DocumentMetadata, rule: ConflictRule): Conflict['impact'] {
    let userExperience = 0;
    let contentQuality = 0;
    let systemComplexity = 0;

    switch (rule.type) {
      case 'tag-incompatible':
        userExperience = 0.4; // Confusing for users
        contentQuality = 0.3; // Moderate quality impact
        systemComplexity = 0.2; // Low system impact
        break;

      case 'content-duplicate':
        userExperience = 0.8; // Very confusing
        contentQuality = 0.9; // Major quality issue
        systemComplexity = 0.3; // Moderate system impact
        break;

      case 'audience-mismatch':
        userExperience = 0.6; // Can be confusing
        contentQuality = 0.2; // Low quality impact
        systemComplexity = 0.1; // Minimal system impact
        break;

      case 'complexity-gap':
        userExperience = 0.7; // Can be jarring
        contentQuality = 0.4; // Moderate quality impact
        systemComplexity = 0.2; // Low system impact
        break;

      case 'category-exclusive':
        userExperience = 0.5; // Somewhat confusing
        contentQuality = 0.3; // Moderate quality impact
        systemComplexity = 0.4; // Higher system impact
        break;
    }

    return { userExperience, contentQuality, systemComplexity };
  }

  /**
   * Generate summary of conflicts
   */
  private generateSummary(conflicts: Conflict[]): ConflictAnalysisResult['summary'] {
    const bySeverity: Record<string, number> = { minor: 0, moderate: 0, major: 0, critical: 0 };
    const byType: Record<string, number> = {};
    let autoResolvable = 0;
    let requiresManualReview = 0;

    for (const conflict of conflicts) {
      bySeverity[conflict.severity]++;
      byType[conflict.rule.type] = (byType[conflict.rule.type] || 0) + 1;
      
      if (conflict.autoResolvable) {
        autoResolvable++;
      } else {
        requiresManualReview++;
      }
    }

    return {
      total: conflicts.length,
      bySeverity,
      byType,
      autoResolvable,
      requiresManualReview
    };
  }

  /**
   * Generate recommendations based on conflicts
   */
  private generateRecommendations(
    conflicts: Conflict[], 
    documents: DocumentMetadata[]
  ): ConflictAnalysisResult['recommendations'] {
    const recommendations: ConflictAnalysisResult['recommendations'] = [];
    
    // High-impact conflicts
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    if (criticalConflicts.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Resolve critical conflicts immediately',
        reason: `${criticalConflicts.length} critical conflicts detected that will severely impact user experience`,
        affectedDocuments: criticalConflicts.flatMap(c => [c.documentA.document.id, c.documentB.document.id])
      });
    }

    // Duplicate content
    const duplicates = conflicts.filter(c => c.rule.type === 'content-duplicate');
    if (duplicates.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Remove duplicate content',
        reason: 'Duplicate documents reduce content quality and confuse users',
        affectedDocuments: duplicates.flatMap(c => [c.documentA.document.id, c.documentB.document.id])
      });
    }

    // Tag incompatibilities
    const tagConflicts = conflicts.filter(c => c.rule.type === 'tag-incompatible');
    if (tagConflicts.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Review tag assignments',
        reason: 'Incompatible tags can create confusion in document selection',
        affectedDocuments: tagConflicts.flatMap(c => [c.documentA.document.id, c.documentB.document.id])
      });
    }

    return recommendations;
  }

  /**
   * Generate resolution plan
   */
  private generateResolutionPlan(conflicts: Conflict[]): ConflictAnalysisResult['resolutionPlan'] {
    const plan: ConflictAnalysisResult['resolutionPlan'] = [];
    let stepNumber = 1;

    // Sort conflicts by severity and resolvability
    const sortedConflicts = conflicts
      .filter(c => c.resolution)
      .sort((a, b) => {
        const severityOrder = { 'critical': 3, 'major': 2, 'moderate': 1, 'minor': 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    // Group conflicts by resolution action
    const groupedByAction = new Map<string, Conflict[]>();
    for (const conflict of sortedConflicts) {
      const action = conflict.resolution!.action;
      if (!groupedByAction.has(action)) {
        groupedByAction.set(action, []);
      }
      groupedByAction.get(action)!.push(conflict);
    }

    // Create steps for each action group
    for (const [action, conflictGroup] of groupedByAction) {
      const affectedDocs = new Set<string>();
      conflictGroup.forEach(conflict => {
        affectedDocs.add(conflict.documentA.document.id);
        affectedDocs.add(conflict.documentB.document.id);
      });

      let stepAction: 'exclude' | 'modify' | 'merge' | 'review';
      let rationale: string;

      switch (action) {
        case 'exclude-first':
        case 'exclude-second':
        case 'exclude-both':
          stepAction = 'exclude';
          rationale = `Exclude documents to resolve ${conflictGroup.length} conflicts`;
          break;
        case 'modify-first':
        case 'modify-second':
          stepAction = 'modify';
          rationale = `Modify documents to resolve ${conflictGroup.length} conflicts`;
          break;
        case 'merge':
          stepAction = 'merge';
          rationale = `Merge documents to resolve ${conflictGroup.length} conflicts`;
          break;
        default:
          stepAction = 'review';
          rationale = `Manual review required for ${conflictGroup.length} conflicts`;
      }

      plan.push({
        step: stepNumber++,
        action: stepAction,
        documentIds: Array.from(affectedDocs),
        rationale,
        dependencies: [] // For now, no dependencies between steps
      });
    }

    return plan;
  }

  /**
   * Helper methods
   */
  private excludeDocument(
    document: DocumentMetadata,
    reason: string,
    conflictIds: string[],
    excludedDocuments: Array<{ document: DocumentMetadata; reason: string; conflicts: string[] }>,
    excluded: Set<string>,
    resolvedDocuments: DocumentMetadata[]
  ): void {
    if (excluded.has(document.document.id)) return;

    excluded.add(document.document.id);
    excludedDocuments.push({
      document,
      reason,
      conflicts: conflictIds
    });

    // Remove from resolved documents
    const index = resolvedDocuments.findIndex(doc => doc.document.id === document.document.id);
    if (index !== -1) {
      resolvedDocuments.splice(index, 1);
    }
  }

  private applyChangesToDocument(document: DocumentMetadata, changes: Record<string, any>): DocumentMetadata {
    // Deep clone and apply changes
    const modified = JSON.parse(JSON.stringify(document));
    
    for (const [path, value] of Object.entries(changes)) {
      const parts = path.split('.');
      let current = modified;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
    }

    return modified;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return 1 - (matrix[len1][len2] / maxLen);
  }

  /**
   * Add custom conflict rule
   */
  addCustomRule(name: string, rule: ConflictRule): void {
    this.rules.set(name, rule);
  }

  /**
   * Remove conflict rule
   */
  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /**
   * Get all available rules
   */
  getAvailableRules(): Array<{ name: string; rule: ConflictRule }> {
    return Array.from(this.rules.entries()).map(([name, rule]) => ({ name, rule }));
  }
}