/**
 * Category Strategy Manager - handles category-based default strategies and selection logic
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  DocumentCategory,
  ExtractStrategy,
  CategoryConfig,
  SelectionContext
} from '../types/config.js';

export interface CategoryStrategy {
  category: DocumentCategory;
  config: CategoryConfig;
  extractStrategy: ExtractStrategy;
  selectionCriteria: {
    priorityWeight: number;
    tagWeight: number;
    dependencyWeight: number;
    maxDocuments: number;
    preferredTags: string[];
    requiredCharacteristics: string[];
  };
  compositionRules: {
    idealMix: Record<string, number>; // percentage of documents with certain characteristics
    synergisticTags: string[][];
    avoidCombinations: string[][];
  };
}

export interface CategoryAnalysis {
  category: DocumentCategory;
  totalDocuments: number;
  averagePriority: number;
  commonTags: Array<{ tag: string; frequency: number }>;
  complexityDistribution: Record<string, number>;
  audienceAlignment: Record<string, number>;
  recommendedStrategy: ExtractStrategy;
  optimizationSuggestions: string[];
}

export interface CategoryMixRecommendation {
  categories: Array<{
    category: DocumentCategory;
    recommendedCount: number;
    documents: DocumentMetadata[];
    rationale: string;
  }>;
  totalDocuments: number;
  expectedCharacterCount: number;
  balanceScore: number;
}

export class CategoryStrategyManager {
  private config: EnhancedLLMSConfig;
  private strategies: Map<DocumentCategory, CategoryStrategy>;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.strategies = this.initializeStrategies();
  }

  /**
   * Get strategy for a specific category
   */
  getStrategy(category: DocumentCategory): CategoryStrategy {
    const strategy = this.strategies.get(category);
    if (!strategy) {
      throw new Error(`No strategy found for category: ${category}`);
    }
    return strategy;
  }

  /**
   * Get all available strategies
   */
  getAllStrategies(): Map<DocumentCategory, CategoryStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Select documents based on category strategy
   */
  selectDocumentsByCategory(
    documents: DocumentMetadata[],
    category: DocumentCategory,
    maxDocuments: number,
    context?: Partial<SelectionContext>
  ): DocumentMetadata[] {
    const strategy = this.getStrategy(category);
    const categoryDocs = documents.filter(doc => doc.document.category === category);

    if (categoryDocs.length === 0) {
      return [];
    }

    // Apply category-specific filtering and scoring
    const scored = this.scoreDocumentsByStrategy(categoryDocs, strategy, context);
    const filtered = this.applyStrategyConstraints(scored, strategy);

    // Select top documents based on strategy
    const selected = this.selectOptimalMix(filtered, strategy, Math.min(maxDocuments, strategy.selectionCriteria.maxDocuments));

    return selected;
  }

  /**
   * Analyze category distribution in document collection
   */
  analyzeCategoryDistribution(documents: DocumentMetadata[]): Map<DocumentCategory, CategoryAnalysis> {
    const analyses = new Map<DocumentCategory, CategoryAnalysis>();
    const categorized = this.groupDocumentsByCategory(documents);

    for (const [category, categoryDocs] of categorized) {
      const analysis = this.analyzeCategory(category, categoryDocs);
      analyses.set(category, analysis);
    }

    return analyses;
  }

  /**
   * Recommend optimal category mix for a given character limit
   */
  recommendCategoryMix(
    documents: DocumentMetadata[],
    targetCharacterLimit: number,
    preferences: {
      strategy?: string;
      focusCategories?: DocumentCategory[];
      targetAudience?: string[];
      complexityLevel?: string;
    } = {}
  ): CategoryMixRecommendation {
    const categorized = this.groupDocumentsByCategory(documents);
    const recommendations: CategoryMixRecommendation['categories'] = [];
    
    // Get composition strategy
    const compositionStrategy = this.config.composition.strategies[preferences.strategy || 'balanced'];
    if (!compositionStrategy) {
      throw new Error(`Unknown composition strategy: ${preferences.strategy}`);
    }

    // Calculate character budget per category
    const totalCategories = categorized.size;
    const baseCharactersPerCategory = Math.floor(targetCharacterLimit / totalCategories);

    // Prioritize categories based on strategy and preferences
    const prioritizedCategories = this.prioritizeCategories(
      Array.from(categorized.keys()),
      compositionStrategy,
      preferences
    );

    let remainingCharacters = targetCharacterLimit;
    let totalDocs = 0;

    for (const category of prioritizedCategories) {
      const categoryDocs = categorized.get(category) || [];
      if (categoryDocs.length === 0) continue;

      const strategy = this.getStrategy(category);
      const avgCharactersPerDoc = this.estimateAverageCharactersPerDocument(category);
      
      // Calculate how many documents we can include from this category
      const maxDocsForCategory = Math.floor(remainingCharacters / avgCharactersPerDoc);
      const recommendedCount = Math.min(
        maxDocsForCategory,
        strategy.selectionCriteria.maxDocuments,
        Math.ceil(categoryDocs.length * 0.7) // Don't take more than 70% of category
      );

      if (recommendedCount > 0) {
        const selectedDocs = this.selectDocumentsByCategory(
          categoryDocs, 
          category, 
          recommendedCount
        );

        const estimatedCharacters = selectedDocs.length * avgCharactersPerDoc;
        remainingCharacters -= estimatedCharacters;
        totalDocs += selectedDocs.length;

        recommendations.push({
          category,
          recommendedCount: selectedDocs.length,
          documents: selectedDocs,
          rationale: this.generateCategoryRationale(category, selectedDocs.length, strategy)
        });
      }
    }

    // Calculate balance score
    const balanceScore = this.calculateBalanceScore(recommendations, compositionStrategy);

    return {
      categories: recommendations,
      totalDocuments: totalDocs,
      expectedCharacterCount: targetCharacterLimit - remainingCharacters,
      balanceScore
    };
  }

  /**
   * Update category configuration
   */
  updateCategoryConfig(category: DocumentCategory, updates: Partial<CategoryConfig>): void {
    const currentConfig = this.config.categories[category];
    if (!currentConfig) {
      throw new Error(`Category ${category} not found in configuration`);
    }

    // Update config
    Object.assign(currentConfig, updates);

    // Regenerate strategy
    const strategy = this.createCategoryStrategy(category, currentConfig);
    this.strategies.set(category, strategy);
  }

  /**
   * Initialize category strategies based on configuration
   */
  private initializeStrategies(): Map<DocumentCategory, CategoryStrategy> {
    const strategies = new Map<DocumentCategory, CategoryStrategy>();

    for (const [categoryName, config] of Object.entries(this.config.categories)) {
      const category = categoryName as DocumentCategory;
      const strategy = this.createCategoryStrategy(category, config);
      strategies.set(category, strategy);
    }

    return strategies;
  }

  /**
   * Create strategy for a specific category
   */
  private createCategoryStrategy(category: DocumentCategory, config: CategoryConfig): CategoryStrategy {
    const baseStrategy: CategoryStrategy = {
      category,
      config,
      extractStrategy: config.defaultStrategy,
      selectionCriteria: {
        priorityWeight: 0.4,
        tagWeight: 0.3,
        dependencyWeight: 0.2,
        maxDocuments: 10,
        preferredTags: config.tags,
        requiredCharacteristics: []
      },
      compositionRules: {
        idealMix: {},
        synergisticTags: [],
        avoidCombinations: []
      }
    };

    // Customize strategy based on category type
    switch (category) {
      case 'guide':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.5,
          tagWeight: 0.3,
          preferredTags: ['beginner', 'step-by-step', 'practical'],
          maxDocuments: 8,
          requiredCharacteristics: ['clear-structure', 'examples']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'beginner': 40, 'intermediate': 40, 'advanced': 20 },
          synergisticTags: [['beginner', 'step-by-step'], ['practical', 'example']],
          avoidCombinations: [['beginner', 'advanced'], ['basic', 'expert']]
        };
        break;

      case 'api':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.3,
          tagWeight: 0.4,
          dependencyWeight: 0.3,
          preferredTags: ['reference', 'technical', 'developer'],
          maxDocuments: 12,
          requiredCharacteristics: ['complete-signature', 'parameters', 'examples']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'core-methods': 60, 'utilities': 30, 'advanced': 10 },
          synergisticTags: [['reference', 'technical'], ['api', 'developer']],
          avoidCombinations: [['beginner', 'technical']]
        };
        break;

      case 'concept':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.6,
          tagWeight: 0.2,
          dependencyWeight: 0.2,
          preferredTags: ['theory', 'architecture', 'design'],
          maxDocuments: 6,
          requiredCharacteristics: ['clear-definition', 'context', 'relationships']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'fundamental': 50, 'detailed': 30, 'advanced': 20 },
          synergisticTags: [['theory', 'architecture'], ['design', 'principle']],
          avoidCombinations: [['simple', 'complex']]
        };
        break;

      case 'example':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.3,
          tagWeight: 0.4,
          dependencyWeight: 0.3,
          preferredTags: ['practical', 'code', 'sample'],
          maxDocuments: 15,
          requiredCharacteristics: ['working-code', 'explanation', 'context']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'basic-examples': 40, 'practical-use': 40, 'advanced-patterns': 20 },
          synergisticTags: [['practical', 'code'], ['sample', 'working']],
          avoidCombinations: [['simple', 'complex']]
        };
        break;

      case 'reference':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.2,
          tagWeight: 0.3,
          dependencyWeight: 0.5,
          preferredTags: ['detailed', 'comprehensive', 'lookup'],
          maxDocuments: 20,
          requiredCharacteristics: ['complete-info', 'searchable', 'accurate']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'core-reference': 60, 'detailed-specs': 25, 'examples': 15 },
          synergisticTags: [['detailed', 'comprehensive'], ['lookup', 'searchable']],
          avoidCombinations: []
        };
        break;

      case 'llms':
        baseStrategy.selectionCriteria = {
          ...baseStrategy.selectionCriteria,
          priorityWeight: 0.5,
          tagWeight: 0.4,
          dependencyWeight: 0.1,
          preferredTags: ['llms', 'optimized', 'concise'],
          maxDocuments: 25,
          requiredCharacteristics: ['token-efficient', 'structured', 'clear']
        };
        baseStrategy.compositionRules = {
          idealMix: { 'essential-info': 70, 'context': 20, 'examples': 10 },
          synergisticTags: [['llms', 'optimized'], ['concise', 'structured']],
          avoidCombinations: [['verbose', 'concise']]
        };
        break;
    }

    return baseStrategy;
  }

  /**
   * Score documents based on category strategy
   */
  private scoreDocumentsByStrategy(
    documents: DocumentMetadata[],
    strategy: CategoryStrategy,
    context?: Partial<SelectionContext>
  ): Array<{ document: DocumentMetadata; score: number; reasons: string[] }> {
    return documents.map(doc => {
      const reasons: string[] = [];
      let score = 0;

      // Priority score
      const priorityScore = (doc.priority.score / 100) * strategy.selectionCriteria.priorityWeight;
      score += priorityScore;
      reasons.push(`Priority: ${doc.priority.score}/100`);

      // Tag alignment score
      const tagAlignment = this.calculateTagAlignment(doc, strategy);
      const tagScore = tagAlignment * strategy.selectionCriteria.tagWeight;
      score += tagScore;
      reasons.push(`Tag alignment: ${Math.round(tagAlignment * 100)}%`);

      // Dependency relevance (if context provided)
      if (context?.selectedDocuments?.length) {
        const dependencyScore = this.calculateDependencyRelevance(doc, context.selectedDocuments) * 
          strategy.selectionCriteria.dependencyWeight;
        score += dependencyScore;
        reasons.push(`Dependency relevance: ${Math.round(dependencyScore * 100)}%`);
      }

      // Category-specific bonuses
      score += this.calculateCategorySpecificBonus(doc, strategy);

      return { document: doc, score, reasons };
    });
  }

  /**
   * Calculate tag alignment with strategy preferences
   */
  private calculateTagAlignment(document: DocumentMetadata, strategy: CategoryStrategy): number {
    const docTags = document.tags.primary;
    const preferredTags = strategy.selectionCriteria.preferredTags;

    if (preferredTags.length === 0) return 0.5;

    const matchedTags = docTags.filter(tag => preferredTags.includes(tag));
    const alignmentScore = matchedTags.length / preferredTags.length;

    // Bonus for synergistic tag combinations
    const synergies = strategy.compositionRules.synergisticTags.filter(synergy =>
      synergy.every(tag => docTags.includes(tag))
    );
    const synergyBonus = synergies.length * 0.1;

    // Penalty for avoided combinations
    const conflicts = strategy.compositionRules.avoidCombinations.filter(combination =>
      combination.every(tag => docTags.includes(tag))
    );
    const conflictPenalty = conflicts.length * 0.2;

    return Math.max(0, Math.min(1, alignmentScore + synergyBonus - conflictPenalty));
  }

  /**
   * Calculate dependency relevance to already selected documents
   */
  private calculateDependencyRelevance(
    document: DocumentMetadata,
    selectedDocuments: DocumentMetadata[]
  ): number {
    const selectedIds = new Set(selectedDocuments.map(doc => doc.document.id));
    let relevanceScore = 0;

    // Check prerequisites
    const satisfiedPrereqs = document.dependencies.prerequisites.filter(
      prereq => selectedIds.has(prereq.documentId)
    ).length;
    const totalPrereqs = document.dependencies.prerequisites.length;
    if (totalPrereqs > 0) {
      relevanceScore += (satisfiedPrereqs / totalPrereqs) * 0.4;
    }

    // Check complements
    const presentComplements = document.dependencies.complements.filter(
      comp => selectedIds.has(comp.documentId)
    ).length;
    relevanceScore += Math.min(presentComplements * 0.2, 0.4);

    // Check conflicts (negative score)
    const conflicts = document.dependencies.conflicts.filter(
      conflict => selectedIds.has(conflict.documentId)
    ).length;
    relevanceScore -= conflicts * 0.3;

    return Math.max(0, Math.min(1, relevanceScore));
  }

  /**
   * Calculate category-specific bonus
   */
  private calculateCategorySpecificBonus(
    document: DocumentMetadata,
    strategy: CategoryStrategy
  ): number {
    let bonus = 0;

    // Bonus for required characteristics (simplified check)
    const hasRequiredCharacteristics = strategy.selectionCriteria.requiredCharacteristics.every(
      characteristic => {
        // Simple heuristic: check if document has related tags or properties
        return document.tags.primary.some(tag => tag.includes(characteristic.split('-')[0])) ||
               document.tags.secondary?.some(tag => tag.includes(characteristic.split('-')[0]));
      }
    );

    if (hasRequiredCharacteristics) {
      bonus += 0.1;
    }

    return bonus;
  }

  /**
   * Apply strategy constraints to filter documents
   */
  private applyStrategyConstraints(
    scoredDocuments: Array<{ document: DocumentMetadata; score: number; reasons: string[] }>,
    strategy: CategoryStrategy
  ): Array<{ document: DocumentMetadata; score: number; reasons: string[] }> {
    // Sort by score
    const sorted = scoredDocuments.sort((a, b) => b.score - a.score);

    // Apply maximum document limit
    const limited = sorted.slice(0, strategy.selectionCriteria.maxDocuments);

    return limited;
  }

  /**
   * Select optimal mix of documents based on strategy
   */
  private selectOptimalMix(
    documents: Array<{ document: DocumentMetadata; score: number; reasons: string[] }>,
    strategy: CategoryStrategy,
    maxDocuments: number
  ): DocumentMetadata[] {
    if (documents.length <= maxDocuments) {
      return documents.map(doc => doc.document);
    }

    // Apply ideal mix ratios if defined
    const idealMix = strategy.compositionRules.idealMix;
    if (Object.keys(idealMix).length > 0) {
      return this.applyIdealMix(documents, idealMix, maxDocuments);
    }

    // Otherwise, just take top scoring documents
    return documents.slice(0, maxDocuments).map(doc => doc.document);
  }

  /**
   * Apply ideal mix ratios to document selection
   */
  private applyIdealMix(
    documents: Array<{ document: DocumentMetadata; score: number; reasons: string[] }>,
    idealMix: Record<string, number>,
    maxDocuments: number
  ): DocumentMetadata[] {
    const result: DocumentMetadata[] = [];
    const used = new Set<string>();

    // Group documents by mix categories (simplified heuristic)
    const groups: Record<string, typeof documents> = {};
    
    for (const mixCategory of Object.keys(idealMix)) {
      groups[mixCategory] = documents.filter(({ document }) => {
        const tags = document.tags.primary;
        return tags.some(tag => tag.includes(mixCategory.split('-')[0]));
      });
    }

    // Allocate documents based on ideal mix percentages
    for (const [category, percentage] of Object.entries(idealMix)) {
      const targetCount = Math.floor((percentage / 100) * maxDocuments);
      const availableDocs = groups[category]?.filter(({ document }) => 
        !used.has(document.document.id)
      ) || [];

      const selected = availableDocs.slice(0, targetCount);
      for (const { document } of selected) {
        result.push(document);
        used.add(document.document.id);
      }
    }

    // Fill remaining slots with highest scoring documents
    const remaining = documents
      .filter(({ document }) => !used.has(document.document.id))
      .slice(0, maxDocuments - result.length);

    result.push(...remaining.map(doc => doc.document));

    return result;
  }

  /**
   * Helper methods
   */
  private groupDocumentsByCategory(documents: DocumentMetadata[]): Map<DocumentCategory, DocumentMetadata[]> {
    const groups = new Map<DocumentCategory, DocumentMetadata[]>();
    
    for (const doc of documents) {
      const category = doc.document.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(doc);
    }

    return groups;
  }

  private analyzeCategory(category: DocumentCategory, documents: DocumentMetadata[]): CategoryAnalysis {
    const totalDocuments = documents.length;
    const averagePriority = documents.reduce((sum, doc) => sum + doc.priority.score, 0) / totalDocuments;

    // Count tag frequencies
    const tagCounts: Record<string, number> = {};
    const complexityCounts: Record<string, number> = {};
    const audienceCounts: Record<string, number> = {};

    for (const doc of documents) {
      // Count tags
      for (const tag of doc.tags.primary) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }

      // Count complexity
      complexityCounts[doc.tags.complexity] = (complexityCounts[doc.tags.complexity] || 0) + 1;

      // Count audience
      for (const audience of doc.tags.audience) {
        audienceCounts[audience] = (audienceCounts[audience] || 0) + 1;
      }
    }

    const commonTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, frequency: count / totalDocuments }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Recommend strategy based on analysis
    const recommendedStrategy = this.recommendStrategyForCategory(category, {
      commonTags: commonTags.map(t => t.tag),
      averagePriority,
      complexityDistribution: complexityCounts
    });

    return {
      category,
      totalDocuments,
      averagePriority,
      commonTags,
      complexityDistribution: complexityCounts,
      audienceAlignment: audienceCounts,
      recommendedStrategy,
      optimizationSuggestions: this.generateOptimizationSuggestions(category, {
        commonTags,
        averagePriority,
        complexityDistribution: complexityCounts
      })
    };
  }

  private recommendStrategyForCategory(
    category: DocumentCategory,
    analysis: { commonTags: string[]; averagePriority: number; complexityDistribution: Record<string, number> }
  ): ExtractStrategy {
    // Default strategies by category
    const defaults: Record<DocumentCategory, ExtractStrategy> = {
      'guide': 'tutorial-first',
      'api': 'api-first',
      'concept': 'concept-first',
      'example': 'example-first',
      'reference': 'reference-first',
      'llms': 'reference-first'
    };

    return defaults[category];
  }

  private generateOptimizationSuggestions(
    category: DocumentCategory,
    analysis: { commonTags: Array<{ tag: string; frequency: number }>; averagePriority: number; complexityDistribution: Record<string, number> }
  ): string[] {
    const suggestions: string[] = [];

    // Priority-based suggestions
    if (analysis.averagePriority < 60) {
      suggestions.push(`Consider increasing priority scores for ${category} documents`);
    }

    // Tag diversity suggestions
    if (analysis.commonTags.length < 3) {
      suggestions.push(`Add more diverse tags to ${category} documents for better categorization`);
    }

    // Complexity balance suggestions
    const complexities = Object.keys(analysis.complexityDistribution);
    if (complexities.length === 1) {
      suggestions.push(`Consider adding documents with different complexity levels to ${category}`);
    }

    return suggestions;
  }

  private prioritizeCategories(
    categories: DocumentCategory[],
    strategy: any,
    preferences: { focusCategories?: DocumentCategory[]; targetAudience?: string[]; complexityLevel?: string }
  ): DocumentCategory[] {
    return categories.sort((a, b) => {
      // Prioritize focus categories
      if (preferences.focusCategories) {
        const aInFocus = preferences.focusCategories.includes(a);
        const bInFocus = preferences.focusCategories.includes(b);
        if (aInFocus && !bInFocus) return -1;
        if (!aInFocus && bInFocus) return 1;
      }

      // Otherwise sort by category priority in config
      const configA = this.config.categories[a];
      const configB = this.config.categories[b];
      
      return (configB?.priority || 0) - (configA?.priority || 0);
    });
  }

  private estimateAverageCharactersPerDocument(category: DocumentCategory): number {
    // Rough estimates based on category type
    const estimates: Record<DocumentCategory, number> = {
      'guide': 1500,
      'api': 800,
      'concept': 1200,
      'example': 1000,
      'reference': 600,
      'llms': 400
    };

    return estimates[category] || 1000;
  }

  private generateCategoryRationale(
    category: DocumentCategory,
    count: number,
    strategy: CategoryStrategy
  ): string {
    const reasons = [
      `Selected ${count} ${category} documents`,
      `Priority weight: ${strategy.selectionCriteria.priorityWeight}`,
      `Preferred tags: ${strategy.selectionCriteria.preferredTags.join(', ')}`
    ];

    return reasons.join('; ');
  }

  private calculateBalanceScore(
    recommendations: CategoryMixRecommendation['categories'],
    strategy: any
  ): number {
    // Simple balance scoring: how evenly distributed are the documents across categories?
    const counts = recommendations.map(r => r.recommendedCount);
    const total = counts.reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 0;

    const expectedPerCategory = total / recommendations.length;
    const variance = counts.reduce((sum, count) => 
      sum + Math.pow(count - expectedPerCategory, 2), 0
    ) / recommendations.length;

    // Lower variance = better balance, convert to 0-1 score
    const normalizedVariance = Math.min(variance / (expectedPerCategory * expectedPerCategory), 1);
    return 1 - normalizedVariance;
  }
}