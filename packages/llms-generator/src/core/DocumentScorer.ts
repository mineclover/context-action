/**
 * Document Scorer - implements tag-based filtering and category-based scoring
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  SelectionContext, 
  SelectionConstraints,
  TagConfig,
  CategoryConfig,
  CompositionStrategyConfig
} from '../types/config.js';

export interface ScoringOptions {
  strategy?: string;
  targetTags?: string[];
  targetCategory?: string;
  contextualRelevance?: Record<string, number>;
  userJourneyStage?: string;
  priorityWeight?: number;
}

export interface ScoringResult {
  document: DocumentMetadata;
  scores: {
    total: number;
    category: number;
    tag: number;
    dependency: number;
    priority: number;
    contextual?: number;
  };
  reasons: string[];
  excluded: boolean;
  exclusionReason?: string;
  breakdown?: {
    categoryContribution: number;
    tagContribution: number;
    dependencyContribution: number;
    priorityContribution: number;
  };
  confidence?: number;
}

export interface TagAffinityResult {
  score: number;
  matchedTags: string[];
  compatibleTags: string[];
  incompatibleTags: string[];
  affinityBreakdown: Record<string, number>;
  affinity?: Record<string, number>;
}

export class DocumentScorer {
  private config: EnhancedLLMSConfig;
  private strategy: CompositionStrategyConfig;

  constructor(config: EnhancedLLMSConfig, strategyName: string = 'balanced') {
    this.config = config;
    this.strategy = config.composition.strategies[strategyName] || config.composition.strategies['balanced'];
    
    if (!this.strategy) {
      throw new Error(`Strategy '${strategyName}' not found and no balanced strategy available`);
    }
  }

  /**
   * Score a document against the current selection context
   */
  scoreDocument(
    document: DocumentMetadata,
    context: SelectionContext,
    options: ScoringOptions = {}
  ): ScoringResult {
    const reasons: string[] = [];
    let excluded = false;
    let exclusionReason: string | undefined;

    // Pre-filtering checks
    const preFilterResult = this.performPreFiltering(document, context, options);
    if (preFilterResult.excluded) {
      excluded = true;
      exclusionReason = preFilterResult.reason;
    }

    // Calculate individual scores
    const categoryScore = this.calculateCategoryScore(document, context, reasons);
    const tagScore = this.calculateTagScore(document, context, reasons);
    const dependencyScore = this.calculateDependencyScore(document, context, reasons);
    const priorityScore = this.calculatePriorityScore(document, reasons);
    const contextualScore = options.contextualRelevance ? 
      this.calculateContextualScore(document, options.contextualRelevance, reasons) : 0;

    // Apply strategy weights
    const totalScore = this.calculateWeightedScore({
      category: categoryScore,
      tag: tagScore,
      dependency: dependencyScore,
      priority: priorityScore,
      contextual: contextualScore
    }, options);

    // Calculate confidence based on data completeness
    let confidence = 1.0;
    if (!document.tags || !document.tags.primary) confidence -= 0.3;
    if (!document.composition) confidence -= 0.2;
    if (!document.tags?.secondary) confidence -= 0.1;
    if (!document.priority || document.priority.score === undefined) confidence -= 0.2;
    confidence = Math.max(0, confidence);

    // Calculate breakdown for strategy analysis
    const weights = this.strategy.weights || this.strategy.criteria || {} as any;
    const weightConfig = {
      categoryWeight: weights.categoryWeight || 0.25,
      tagWeight: weights.tagWeight || 0.25,
      dependencyWeight: weights.dependencyWeight || 0.25,
      priorityWeight: weights.priorityWeight || 0.25
    };
    const breakdown = {
      categoryContribution: categoryScore * weightConfig.categoryWeight,
      tagContribution: tagScore * weightConfig.tagWeight,
      dependencyContribution: dependencyScore * weightConfig.dependencyWeight,
      priorityContribution: priorityScore * weightConfig.priorityWeight
    };

    return {
      document,
      scores: {
        total: totalScore,
        category: categoryScore,
        tag: tagScore,
        dependency: dependencyScore,
        priority: priorityScore,
        contextual: contextualScore
      },
      breakdown,
      confidence,
      reasons,
      excluded,
      exclusionReason
    };
  }

  /**
   * Calculate tag affinity between document and target tags
   */
  calculateTagAffinity(
    document: DocumentMetadata,
    targetTags: string[]
  ): TagAffinityResult {
    const matchedTags: string[] = [];
    const compatibleTags: string[] = [];
    const incompatibleTags: string[] = [];
    const affinityBreakdown: Record<string, number> = {};

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const targetTag of targetTags) {
      const tagConfig = this.config.tags[targetTag];
      if (!tagConfig) {
        affinityBreakdown[targetTag] = 0;
        maxPossibleScore += 1;
        continue;
      }

      maxPossibleScore += tagConfig.weight;

      // Direct match
      if (document.tags?.primary?.includes(targetTag)) {
        const score = tagConfig.weight;
        totalScore += score;
        matchedTags.push(targetTag);
        affinityBreakdown[targetTag] = score;
        continue;
      }

      // Secondary match
      if (document.tags?.secondary?.includes(targetTag)) {
        const score = tagConfig.weight * 0.7;
        totalScore += score;
        matchedTags.push(targetTag);
        affinityBreakdown[targetTag] = score;
        continue;
      }

      // Compatible tag match
      let bestCompatibilityScore = 0;
      for (const docTag of document.tags?.primary || []) {
        const docTagConfig = this.config.tags[docTag];
        if (docTagConfig && docTagConfig.compatibleWith?.includes(targetTag)) {
          const score = tagConfig.weight * 0.5;
          if (score > bestCompatibilityScore) {
            bestCompatibilityScore = score;
          }
        }
      }

      if (bestCompatibilityScore > 0) {
        totalScore += bestCompatibilityScore;
        compatibleTags.push(targetTag);
        affinityBreakdown[targetTag] = bestCompatibilityScore;
      } else {
        // Check for incompatibility
        const hasIncompatibleTag = document.tags?.primary?.some(docTag => {
          const docTagConfig = this.config.tags[docTag];
          return docTagConfig && !docTagConfig.compatibleWith.includes(targetTag);
        }) || false;

        if (hasIncompatibleTag) {
          incompatibleTags.push(targetTag);
        }

        affinityBreakdown[targetTag] = 0;
      }
    }

    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

    return {
      score: normalizedScore,
      matchedTags,
      compatibleTags,
      incompatibleTags,
      affinityBreakdown
    };
  }

  /**
   * Filter documents by tag compatibility
   */
  filterByTagCompatibility(
    documents: DocumentMetadata[],
    targetTags: string[],
    minAffinityScore: number = 0.3
  ): DocumentMetadata[] {
    return documents.filter(document => {
      const affinity = this.calculateTagAffinity(document, targetTags);
      return affinity.score >= minAffinityScore && affinity.incompatibleTags.length === 0;
    });
  }

  /**
   * Perform pre-filtering to exclude documents that shouldn't be considered
   */
  private performPreFiltering(
    document: DocumentMetadata,
    context: SelectionContext,
    options: ScoringOptions
  ): { excluded: boolean; reason?: string } {
    // Check if document is already selected
    if (context.selectedDocuments.some(doc => doc.document.id === document.document.id)) {
      return { excluded: true, reason: 'Document already selected' };
    }

    // Check category filtering
    if (context.targetCategory && document.document.category !== context.targetCategory) {
      return { excluded: true, reason: `Category mismatch: expected ${context.targetCategory}` };
    }

    // Check tag incompatibility
    if (context.targetTags.length > 0) {
      const affinity = this.calculateTagAffinity(document, context.targetTags);
      if (affinity.incompatibleTags.length > 0) {
        return { 
          excluded: true, 
          reason: `Incompatible tags: ${affinity.incompatibleTags.join(', ')}` 
        };
      }
    }

    // Check strategy constraints
    if (this.strategy.constraints?.requireCoreTags) {
      const hasCoreTags = document.tags?.primary?.some(tag => {
        const tagConfig = this.config.tags[tag];
        return tagConfig && tagConfig.importance === 'critical';
      });
      
      if (!hasCoreTags) {
        return { excluded: true, reason: 'Required core tags missing' };
      }
    }

    // Check preferred tags for beginner-friendly strategy
    if (this.strategy.constraints?.preferredTags) {
      const hasPreferredTag = document.tags?.primary?.some(tag => 
        this.strategy.constraints?.preferredTags?.includes(tag)
      );
      
      if (!hasPreferredTag) {
        return { excluded: true, reason: 'No preferred tags found' };
      }
    }

    return { excluded: false };
  }

  /**
   * Calculate category-based score
   */
  private calculateCategoryScore(
    document: DocumentMetadata,
    context: SelectionContext,
    reasons: string[]
  ): number {
    const categoryConfig = this.config.categories[document.document.category];
    if (!categoryConfig) {
      reasons.push(`Unknown category: ${document.document.category}`);
      return 0;
    }

    let score = categoryConfig.priority / 100; // Normalize to 0-1

    // Apply category affinity if available
    if (document.composition?.categoryAffinity) {
      const targetCategory = context.targetCategory || document.document.category;
      const affinity = document.composition.categoryAffinity[targetCategory] || 0;
      score *= (1 + affinity * 0.5); // Boost by up to 50% based on affinity
      reasons.push(`Category affinity boost: ${Math.round(affinity * 50)}%`);
    }

    reasons.push(`Category score: ${Math.round(score * 100)}/100`);
    return Math.min(score, 1);
  }

  /**
   * Calculate tag-based score
   */
  private calculateTagScore(
    document: DocumentMetadata,
    context: SelectionContext,
    reasons: string[]
  ): number {
    if (context.targetTags.length === 0) {
      return 0.5; // Neutral score when no specific tags requested
    }

    const affinity = this.calculateTagAffinity(document, context.targetTags);
    
    // Apply tag weight multipliers
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [tag, weight] of Object.entries(context.tagWeights)) {
      if (document.tags?.primary?.includes(tag)) {
        weightedScore += weight * 1.0;
        totalWeight += weight;
      } else if (document.tags?.secondary?.includes(tag)) {
        weightedScore += weight * 0.7;
        totalWeight += weight;
      }
    }

    const contextWeightedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const finalScore = (affinity.score * 0.7) + (contextWeightedScore * 0.3);

    reasons.push(`Tag affinity: ${Math.round(affinity.score * 100)}%`);
    reasons.push(`Matched tags: ${affinity.matchedTags.join(', ') || 'none'}`);
    
    if (affinity.compatibleTags.length > 0) {
      reasons.push(`Compatible tags: ${affinity.compatibleTags.join(', ')}`);
    }

    return Math.min(finalScore, 1);
  }

  /**
   * Calculate dependency-based score
   */
  private calculateDependencyScore(
    document: DocumentMetadata,
    context: SelectionContext,
    reasons: string[]
  ): number {
    let score = 0.5; // Base score
    const selectedIds = new Set(context.selectedDocuments.map(doc => doc.document.id));

    // Check prerequisites satisfaction
    const prereqSatisfied = document.dependencies?.prerequisites?.filter(
      prereq => selectedIds.has(prereq.documentId)
    ) || [];
    const prereqTotal = document.dependencies?.prerequisites?.length || 0;
    
    if (prereqTotal > 0) {
      const satisfaction = prereqSatisfied.length / prereqTotal;
      score += satisfaction * 0.3; // Up to 30% boost for satisfied prerequisites
      reasons.push(`Prerequisites: ${prereqSatisfied.length}/${prereqTotal} satisfied`);
    }

    // Check complementary relationships
    const complements = document.dependencies?.complements?.filter(
      comp => selectedIds.has(comp.documentId)
    ) || [];
    if (complements.length > 0) {
      score += complements.length * 0.1; // 10% boost per complement
      reasons.push(`Complementary documents: ${complements.length}`);
    }

    // Penalize conflicts
    const conflicts = document.dependencies?.conflicts?.filter(
      conf => selectedIds.has(conf.documentId)
    ) || [];
    if (conflicts.length > 0) {
      score -= conflicts.length * 0.4; // 40% penalty per conflict
      reasons.push(`Conflicts detected: ${conflicts.length}`);
    }

    return Math.max(Math.min(score, 1), 0);
  }

  /**
   * Calculate priority-based score
   */
  private calculatePriorityScore(
    document: DocumentMetadata,
    reasons: string[]
  ): number {
    const priorityScore = document.priority?.score || 50; // Default to 50 if not set
    const priorityTier = document.priority?.tier || 'important';
    const score = priorityScore / 100; // Normalize to 0-1
    reasons.push(`Priority: ${priorityScore}/100 (${priorityTier})`);
    return score;
  }

  /**
   * Calculate contextual relevance score
   */
  private calculateContextualScore(
    document: DocumentMetadata,
    contextualRelevance: Record<string, number>,
    reasons: string[]
  ): number {
    if (!document.composition?.contextualRelevance) {
      return 0;
    }

    let score = 0;
    let weight = 0;

    for (const [context, importance] of Object.entries(contextualRelevance)) {
      const docRelevance = document.composition.contextualRelevance[context as keyof typeof document.composition.contextualRelevance] || 0;
      score += docRelevance * importance;
      weight += importance;
    }

    const normalizedScore = weight > 0 ? score / weight : 0;
    reasons.push(`Contextual relevance: ${Math.round(normalizedScore * 100)}%`);
    
    return normalizedScore;
  }

  /**
   * Calculate weighted total score based on strategy
   */
  private calculateWeightedScore(
    scores: Record<string, number>,
    options: ScoringOptions
  ): number {
    // Handle both 'weights' and 'criteria' naming conventions
    const strategyWeights = this.strategy.weights || this.strategy.criteria || {} as any;
    const weights = {
      category: strategyWeights.categoryWeight || 0.25,
      tag: strategyWeights.tagWeight || 0.25,
      dependency: strategyWeights.dependencyWeight || 0.25,
      priority: strategyWeights.priorityWeight || 0.1,
      contextual: strategyWeights.contextualWeight || 0
    };

    // Apply priority weight override if specified
    if (options.priorityWeight !== undefined) {
      weights.priority = options.priorityWeight;
    }

    // Ensure weights sum to 1
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) {
      throw new Error('Strategy weights cannot all be zero');
    }

    let weightedScore = 0;
    for (const [component, weight] of Object.entries(weights)) {
      const score = scores[component] || 0;
      weightedScore += (score * weight) / totalWeight;
    }

    return Math.min(Math.max(weightedScore, 0), 1);
  }

  /**
   * Get category configuration for a document
   */
  getCategoryConfig(document: DocumentMetadata): CategoryConfig | null {
    return this.config.categories[document.document.category] || null;
  }

  /**
   * Get tag configurations for document tags
   */
  getTagConfigs(document: DocumentMetadata): Record<string, TagConfig> {
    const configs: Record<string, TagConfig> = {};
    
    for (const tag of [...document.tags.primary, ...(document.tags.secondary || [])]) {
      const config = this.config.tags[tag];
      if (config) {
        configs[tag] = config;
      }
    }

    return configs;
  }

  /**
   * Update scoring strategy
   */
  updateStrategy(strategyName: string): void {
    const strategy = this.config.composition.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Strategy '${strategyName}' not found`);
    }
    this.strategy = strategy;
  }

  /**
   * Get current strategy information
   */
  getStrategyInfo(): { name: string; strategy: CompositionStrategyConfig } {
    const name = Object.entries(this.config.composition.strategies)
      .find(([, strategy]) => strategy === this.strategy)?.[0] || 'unknown';
    
    return { name, strategy: this.strategy };
  }
}