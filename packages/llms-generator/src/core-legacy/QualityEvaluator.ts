/**
 * Quality Evaluator - comprehensive quality assessment for document selections
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  SelectionConstraints,
  TagConfig,
  CategoryConfig
} from '../types/config.js';

import type { SelectionResult } from './AdaptiveDocumentSelector.js';

export interface QualityMetric {
  name: string;
  description: string;
  category: 'content' | 'structure' | 'accessibility' | 'coherence' | 'completeness' | 'efficiency';
  weight: number;
  calculate: (selection: DocumentMetadata[], constraints: SelectionConstraints, config: EnhancedLLMSConfig) => QualityScore;
}

export interface QualityScore {
  value: number; // 0-1
  confidence: number; // 0-1, how confident we are in this score
  details: {
    measured: any;
    expected: any;
    reasoning: string[];
    suggestions: string[];
  };
}

export interface QualityReport {
  overallScore: number; // 0-100
  confidence: number; // 0-1
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  metrics: {
    [metricName: string]: QualityScore;
  };
  summary: {
    strengths: string[];
    weaknesses: string[];
    criticalIssues: string[];
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      reason: string;
      impact: number; // Expected improvement 0-1
    }>;
  };
  benchmarks: {
    category: string;
    performance: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    percentile: number; // 0-100
    comparison: string;
  };
  validation: {
    passed: Array<{ rule: string; description: string }>;
    failed: Array<{ rule: string; description: string; severity: 'error' | 'warning' }>;
    score: number; // 0-1
  };
}

export interface QualityBenchmark {
  name: string;
  description: string;
  category: string;
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    belowAverage: number;
    poor: number;
  };
  historicalData?: {
    samples: number;
    mean: number;
    stdDev: number;
    percentiles: Record<number, number>;
  };
}

export interface ValidationRule {
  name: string;
  description: string;
  category: 'mandatory' | 'recommended' | 'optional';
  severity: 'error' | 'warning' | 'info';
  check: (selection: DocumentMetadata[], constraints: SelectionConstraints, config: EnhancedLLMSConfig) => {
    passed: boolean;
    details?: string;
  };
}

export class QualityEvaluator {
  private config: EnhancedLLMSConfig;
  private metrics: Map<string, QualityMetric>;
  private benchmarks: Map<string, QualityBenchmark>;
  private validationRules: Map<string, ValidationRule>;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.benchmarks = this.initializeBenchmarks();
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * Evaluate quality of document selection
   */
  evaluateQuality(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    selectionResult?: SelectionResult
  ): QualityReport {
    // Calculate all metrics
    const metricScores: { [metricName: string]: QualityScore } = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;

    for (const [name, metric] of this.metrics) {
      try {
        const score = metric.calculate(selection, constraints, this.config);
        metricScores[name] = score;
        
        totalWeightedScore += score.value * metric.weight;
        totalWeight += metric.weight;
        totalConfidence += score.confidence;
      } catch (error) {
        console.warn(`Failed to calculate metric ${name}:`, error);
        // Create default score for failed metrics
        metricScores[name] = {
          value: 0,
          confidence: 0,
          details: {
            measured: null,
            expected: null,
            reasoning: [`Error calculating metric: ${error}`],
            suggestions: ['Review metric implementation']
          }
        };
      }
    }

    const overallScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    const averageConfidence = this.metrics.size > 0 ? totalConfidence / this.metrics.size : 0;

    // Determine grade
    const grade = this.calculateGrade(overallScore);

    // Generate summary
    const summary = this.generateSummary(metricScores);

    // Run benchmark comparison
    const benchmarks = this.runBenchmarks(metricScores, overallScore);

    // Run validation
    const validation = this.runValidation(selection, constraints);

    return {
      overallScore,
      confidence: averageConfidence,
      grade,
      metrics: metricScores,
      summary,
      benchmarks,
      validation
    };
  }

  /**
   * Initialize quality metrics
   */
  private initializeMetrics(): Map<string, QualityMetric> {
    const metrics = new Map<string, QualityMetric>();

    // Content Quality Metrics
    metrics.set('content-relevance', {
      name: 'Content Relevance',
      description: 'How relevant are the selected documents to the target context',
      category: 'content',
      weight: 1.0,
      calculate: this.calculateContentRelevance.bind(this)
    });

    metrics.set('content-completeness', {
      name: 'Content Completeness',
      description: 'How well the selection covers the required topics',
      category: 'content',
      weight: 0.9,
      calculate: this.calculateContentCompleteness.bind(this)
    });

    metrics.set('content-accuracy', {
      name: 'Content Accuracy',
      description: 'Quality and accuracy of individual documents',
      category: 'content',
      weight: 0.8,
      calculate: this.calculateContentAccuracy.bind(this)
    });

    // Structure Quality Metrics
    metrics.set('logical-flow', {
      name: 'Logical Flow',
      description: 'How well documents flow logically from one to another',
      category: 'structure',
      weight: 0.7,
      calculate: this.calculateLogicalFlow.bind(this)
    });

    metrics.set('dependency-satisfaction', {
      name: 'Dependency Satisfaction',
      description: 'How well prerequisite dependencies are satisfied',
      category: 'structure',
      weight: 0.8,
      calculate: this.calculateDependencySatisfaction.bind(this)
    });

    // Accessibility Metrics
    metrics.set('complexity-appropriateness', {
      name: 'Complexity Appropriateness',
      description: 'How appropriate the complexity level is for the target audience',
      category: 'accessibility',
      weight: 0.6,
      calculate: this.calculateComplexityAppropriateness.bind(this)
    });

    metrics.set('audience-alignment', {
      name: 'Audience Alignment',
      description: 'How well documents align with target audience',
      category: 'accessibility',
      weight: 0.7,
      calculate: this.calculateAudienceAlignment.bind(this)
    });

    // Coherence Metrics
    metrics.set('thematic-coherence', {
      name: 'Thematic Coherence',
      description: 'How coherent the overall theme and focus is',
      category: 'coherence',
      weight: 0.6,
      calculate: this.calculateThematicCoherence.bind(this)
    });

    metrics.set('tag-consistency', {
      name: 'Tag Consistency',
      description: 'How consistent and compatible the tag usage is',
      category: 'coherence',
      weight: 0.5,
      calculate: this.calculateTagConsistency.bind(this)
    });

    // Completeness Metrics
    metrics.set('category-coverage', {
      name: 'Category Coverage',
      description: 'How well different document categories are represented',
      category: 'completeness',
      weight: 0.6,
      calculate: this.calculateCategoryCoverage.bind(this)
    });

    metrics.set('topic-breadth', {
      name: 'Topic Breadth',
      description: 'Breadth of topics covered in the selection',
      category: 'completeness',
      weight: 0.5,
      calculate: this.calculateTopicBreadth.bind(this)
    });

    // Efficiency Metrics
    metrics.set('space-efficiency', {
      name: 'Space Efficiency',
      description: 'How efficiently the character limit is used',
      category: 'efficiency',
      weight: 0.4,
      calculate: this.calculateSpaceEfficiency.bind(this)
    });

    metrics.set('information-density', {
      name: 'Information Density',
      description: 'Amount of valuable information per character',
      category: 'efficiency',
      weight: 0.5,
      calculate: this.calculateInformationDensity.bind(this)
    });

    return metrics;
  }

  /**
   * Calculate content relevance score
   */
  private calculateContentRelevance(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const targetTags = constraints.context.targetTags || [];
    const targetCategory = constraints.context.targetCategory;
    
    let totalRelevance = 0;
    let maxPossibleRelevance = 0;
    const details: string[] = [];

    for (const document of selection) {
      let documentRelevance = 0;
      const maxDocumentRelevance = targetTags.length + (targetCategory ? 1 : 0);

      // Tag relevance
      const matchingTags = document.tags.primary.filter(tag => targetTags.includes(tag));
      documentRelevance += matchingTags.length;

      // Category relevance
      if (targetCategory && document.document.category === targetCategory) {
        documentRelevance += 1;
      }

      totalRelevance += documentRelevance;
      maxPossibleRelevance += maxDocumentRelevance;

      if (matchingTags.length > 0) {
        details.push(`${document.document.title}: matches ${matchingTags.length}/${targetTags.length} target tags`);
      }
    }

    const score = maxPossibleRelevance > 0 ? totalRelevance / maxPossibleRelevance : 0.5;

    return {
      value: score,
      confidence: 0.8,
      details: {
        measured: totalRelevance,
        expected: maxPossibleRelevance,
        reasoning: [
          `${Math.round((totalRelevance / maxPossibleRelevance) * 100)}% relevance to target context`,
          ...details
        ],
        suggestions: score < 0.6 ? [
          'Consider including more documents with target tags',
          'Review target context alignment'
        ] : []
      }
    };
  }

  /**
   * Calculate content completeness score
   */
  private calculateContentCompleteness(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const requiredTopics = constraints.context.requiredTopics || [];
    const availableCategories = Object.keys(config.categories);
    
    // Topic coverage
    const coveredTopics = new Set<string>();
    for (const document of selection) {
      document.tags.primary.forEach(tag => coveredTopics.add(tag));
      document.tags.secondary?.forEach(tag => coveredTopics.add(tag));
    }

    const topicCoverage = requiredTopics.length > 0 
      ? requiredTopics.filter(topic => coveredTopics.has(topic)).length / requiredTopics.length
      : 1;

    // Category coverage
    const representedCategories = new Set(selection.map(doc => doc.document.category));
    const categoryCoverage = representedCategories.size / availableCategories.length;

    const overallCompleteness = (topicCoverage * 0.7) + (categoryCoverage * 0.3);

    return {
      value: overallCompleteness,
      confidence: 0.7,
      details: {
        measured: { topicCoverage, categoryCoverage },
        expected: { topicCoverage: 1, categoryCoverage: 0.6 },
        reasoning: [
          `Topic coverage: ${Math.round(topicCoverage * 100)}%`,
          `Category coverage: ${Math.round(categoryCoverage * 100)}%`,
          `Represented categories: ${Array.from(representedCategories).join(', ')}`
        ],
        suggestions: overallCompleteness < 0.7 ? [
          'Include documents from missing categories',
          'Ensure all required topics are covered'
        ] : []
      }
    };
  }

  /**
   * Calculate content accuracy score
   */
  private calculateContentAccuracy(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    let totalAccuracy = 0;
    let totalDocuments = selection.length;
    const details: string[] = [];

    for (const document of selection) {
      // Base accuracy from priority score (normalized)
      let documentAccuracy = document.priority.score / 100;

      // Boost for recent documents
      if (document.document.lastModified) {
        const lastModified = new Date(document.document.lastModified);
        const monthsOld = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24 * 30);
        const recencyBonus = Math.max(0, (12 - monthsOld) / 12) * 0.1;
        documentAccuracy = Math.min(1, documentAccuracy + recencyBonus);
      }

      // Penalty for auto-calculated priorities
      if (document.priority.autoCalculated) {
        documentAccuracy *= 0.9;
      }

      totalAccuracy += documentAccuracy;
      details.push(`${document.document.title}: ${Math.round(documentAccuracy * 100)}% accuracy`);
    }

    const averageAccuracy = totalDocuments > 0 ? totalAccuracy / totalDocuments : 0;

    return {
      value: averageAccuracy,
      confidence: 0.6, // Lower confidence since we're estimating
      details: {
        measured: averageAccuracy,
        expected: 0.8,
        reasoning: [
          `Average document accuracy: ${Math.round(averageAccuracy * 100)}%`,
          ...details.slice(0, 3) // Show first 3 document details
        ],
        suggestions: averageAccuracy < 0.7 ? [
          'Review document priorities and quality',
          'Update outdated documents',
          'Verify auto-calculated priorities'
        ] : []
      }
    };
  }

  /**
   * Calculate logical flow score
   */
  private calculateLogicalFlow(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    if (selection.length <= 1) {
      return {
        value: 1,
        confidence: 1,
        details: {
          measured: 1,
          expected: 1,
          reasoning: ['Single document selection has perfect flow'],
          suggestions: []
        }
      };
    }

    let flowScore = 0;
    let flowChecks = 0;
    const issues: string[] = [];

    // Check complexity progression
    const complexityLevels = ['basic', 'intermediate', 'advanced', 'expert'];
    for (let i = 0; i < selection.length - 1; i++) {
      const currentLevel = complexityLevels.indexOf(selection[i].tags.complexity);
      const nextLevel = complexityLevels.indexOf(selection[i + 1].tags.complexity);
      
      const gap = Math.abs(nextLevel - currentLevel);
      if (gap > 1) {
        issues.push(`Complexity gap between "${selection[i].document.title}" and "${selection[i + 1].document.title}"`);
      } else {
        flowScore += 1;
      }
      flowChecks += 1;
    }

    // Check category transitions
    for (let i = 0; i < selection.length - 1; i++) {
      const currentCategory = selection[i].document.category;
      const nextCategory = selection[i + 1].document.category;
      
      // Some category transitions are more natural than others
      const goodTransitions = [
        ['concept', 'guide'],
        ['guide', 'example'],
        ['example', 'api'],
        ['api', 'reference']
      ];
      
      const hasGoodTransition = goodTransitions.some(([from, to]) => 
        currentCategory === from && nextCategory === to
      );
      
      if (hasGoodTransition || currentCategory === nextCategory) {
        flowScore += 0.5;
      }
      flowChecks += 0.5;
    }

    const normalizedScore = flowChecks > 0 ? flowScore / flowChecks : 1;

    return {
      value: normalizedScore,
      confidence: 0.7,
      details: {
        measured: normalizedScore,
        expected: 0.8,
        reasoning: [
          `Flow score: ${Math.round(normalizedScore * 100)}%`,
          `${issues.length} flow issues detected`,
          ...issues.slice(0, 3)
        ],
        suggestions: normalizedScore < 0.7 ? [
          'Reorder documents for better complexity progression',
          'Group related categories together',
          'Add bridging documents between complex topics'
        ] : []
      }
    };
  }

  /**
   * Calculate dependency satisfaction score
   */
  private calculateDependencySatisfaction(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const selectedIds = new Set(selection.map(doc => doc.document.id));
    let totalDependencies = 0;
    let satisfiedDependencies = 0;
    const unsatisfied: string[] = [];

    for (const document of selection) {
      // Check prerequisites
      for (const prereq of document.dependencies.prerequisites) {
        totalDependencies += 1;
        if (selectedIds.has(prereq.documentId)) {
          satisfiedDependencies += 1;
        } else {
          unsatisfied.push(`${document.document.title} needs ${prereq.documentId}`);
        }
      }

      // Check required references (high importance ones)
      for (const ref of document.dependencies.references) {
        if (ref.relevance && ref.relevance > 0.8) {
          totalDependencies += 0.5;
          if (selectedIds.has(ref.documentId)) {
            satisfiedDependencies += 0.5;
          }
        }
      }
    }

    const satisfactionRate = totalDependencies > 0 ? satisfiedDependencies / totalDependencies : 1;

    return {
      value: satisfactionRate,
      confidence: 0.9,
      details: {
        measured: satisfiedDependencies,
        expected: totalDependencies,
        reasoning: [
          `${satisfiedDependencies}/${totalDependencies} dependencies satisfied`,
          `Satisfaction rate: ${Math.round(satisfactionRate * 100)}%`,
          ...unsatisfied.slice(0, 3)
        ],
        suggestions: satisfactionRate < 0.8 ? [
          'Include missing prerequisite documents',
          'Review dependency requirements',
          'Consider alternative documents with fewer dependencies'
        ] : []
      }
    };
  }

  /**
   * Calculate complexity appropriateness score
   */
  private calculateComplexityAppropriateness(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const targetAudience = constraints.context.selectedDocuments?.[0]?.tags.audience || ['framework-users'];
    const complexityDistribution = new Map<string, number>();

    // Count complexity levels
    for (const document of selection) {
      const complexity = document.tags.complexity;
      complexityDistribution.set(complexity, (complexityDistribution.get(complexity) || 0) + 1);
    }

    // Define ideal distributions for different audiences
    const idealDistributions: Record<string, Record<string, number>> = {
      'beginners': { basic: 0.6, intermediate: 0.3, advanced: 0.1, expert: 0 },
      'intermediate': { basic: 0.2, intermediate: 0.5, advanced: 0.3, expert: 0 },
      'advanced': { basic: 0.1, intermediate: 0.3, advanced: 0.5, expert: 0.1 },
      'experts': { basic: 0, intermediate: 0.2, advanced: 0.4, expert: 0.4 }
    };

    // Get ideal distribution (default to intermediate if audience not found)
    const primaryAudience = targetAudience[0] || 'intermediate';
    const idealDistribution = idealDistributions[primaryAudience] || idealDistributions['intermediate'];

    // Calculate divergence from ideal
    let divergence = 0;
    const actualDistribution: Record<string, number> = {};
    
    for (const [complexity, count] of complexityDistribution) {
      const actual = count / selection.length;
      const ideal = idealDistribution[complexity] || 0;
      actualDistribution[complexity] = actual;
      divergence += Math.abs(actual - ideal);
    }

    // Add penalty for missing expected complexity levels
    for (const [complexity, ideal] of Object.entries(idealDistribution)) {
      if (ideal > 0 && !complexityDistribution.has(complexity)) {
        divergence += ideal;
      }
    }

    const appropriatenessScore = Math.max(0, 1 - (divergence / 2));

    return {
      value: appropriatenessScore,
      confidence: 0.8,
      details: {
        measured: actualDistribution,
        expected: idealDistribution,
        reasoning: [
          `Complexity appropriateness: ${Math.round(appropriatenessScore * 100)}%`,
          `Target audience: ${primaryAudience}`,
          `Divergence from ideal: ${Math.round(divergence * 100)}%`
        ],
        suggestions: appropriatenessScore < 0.7 ? [
          `Adjust complexity distribution for ${primaryAudience} audience`,
          'Add more documents at appropriate complexity levels',
          'Consider audience segmentation'
        ] : []
      }
    };
  }

  /**
   * Calculate audience alignment score
   */
  private calculateAudienceAlignment(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    // Get target audiences from constraints or infer from selected documents
    const allAudiences = new Set<string>();
    for (const document of selection) {
      document.tags.audience.forEach(aud => allAudiences.add(aud));
    }

    if (allAudiences.size === 0) {
      return {
        value: 0.5,
        confidence: 0.3,
        details: {
          measured: 0,
          expected: 1,
          reasoning: ['No audience information available'],
          suggestions: ['Add audience tags to documents']
        }
      };
    }

    // Check for conflicting audiences
    const conflictingPairs = [
      ['beginners', 'advanced'],
      ['beginners', 'experts'], 
      ['new-users', 'experienced-users']
    ];

    let conflictCount = 0;
    for (const [aud1, aud2] of conflictingPairs) {
      if (allAudiences.has(aud1) && allAudiences.has(aud2)) {
        conflictCount += 1;
      }
    }

    // Calculate alignment score (penalize conflicts)
    const baseAlignment = 1;
    const conflictPenalty = conflictCount * 0.3;
    const alignmentScore = Math.max(0, baseAlignment - conflictPenalty);

    // Bonus for consistent audience targeting
    const audienceConsistency = allAudiences.size <= 2 ? 0.1 : 0;
    const finalScore = Math.min(1, alignmentScore + audienceConsistency);

    return {
      value: finalScore,
      confidence: 0.7,
      details: {
        measured: allAudiences.size,
        expected: 2,
        reasoning: [
          `${conflictCount} audience conflicts detected`,
          `Targeting ${allAudiences.size} different audiences`,
          `Audiences: ${Array.from(allAudiences).join(', ')}`
        ],
        suggestions: conflictCount > 0 ? [
          'Remove documents with conflicting audience targets',
          'Consider separate selections for different audiences',
          'Add bridging content for mixed audiences'
        ] : []
      }
    };
  }

  /**
   * Calculate thematic coherence score
   */
  private calculateThematicCoherence(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    // Analyze tag co-occurrence and thematic consistency
    const allTags = new Set<string>();
    const tagFrequency = new Map<string, number>();

    for (const document of selection) {
      for (const tag of document.tags.primary) {
        allTags.add(tag);
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      }
    }

    // Find dominant themes
    const dominantTags = Array.from(tagFrequency.entries())
      .filter(([tag, frequency]) => frequency >= selection.length * 0.3)
      .map(([tag]) => tag);

    // Calculate coherence based on tag compatibility
    let compatibilityScore = 0;
    let compatibilityChecks = 0;

    for (const tagA of allTags) {
      for (const tagB of allTags) {
        if (tagA !== tagB) {
          const configA = config.tags[tagA];
          const configB = config.tags[tagB];
          
          if (configA && configB) {
            if (configA.compatibleWith.includes(tagB)) {
              compatibilityScore += 1;
            }
            compatibilityChecks += 1;
          }
        }
      }
    }

    const thematicCoherence = compatibilityChecks > 0 
      ? compatibilityScore / compatibilityChecks 
      : 0.5;

    return {
      value: thematicCoherence,
      confidence: 0.6,
      details: {
        measured: compatibilityScore,
        expected: compatibilityChecks,
        reasoning: [
          `Thematic coherence: ${Math.round(thematicCoherence * 100)}%`,
          `${dominantTags.length} dominant themes identified`,
          `Dominant themes: ${dominantTags.join(', ')}`
        ],
        suggestions: thematicCoherence < 0.6 ? [
          'Focus on more coherent theme selection',
          'Remove documents with incompatible tags',
          'Add documents that bridge different themes'
        ] : []
      }
    };
  }

  /**
   * Calculate tag consistency score
   */
  private calculateTagConsistency(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    let consistencyIssues = 0;
    let totalTagPairs = 0;
    const issues: string[] = [];

    // Check for tag inconsistencies within documents
    for (const document of selection) {
      const tags = document.tags.primary;
      
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const tagA = tags[i];
          const tagB = tags[j];
          const configA = config.tags[tagA];
          const configB = config.tags[tagB];

          totalTagPairs += 1;

          if (configA && configB) {
            if (!configA.compatibleWith.includes(tagB) && !configB.compatibleWith.includes(tagA)) {
              consistencyIssues += 1;
              issues.push(`Incompatible tags in ${document.document.title}: ${tagA} + ${tagB}`);
            }
          }
        }
      }
    }

    const consistencyScore = totalTagPairs > 0 
      ? 1 - (consistencyIssues / totalTagPairs)
      : 1;

    return {
      value: consistencyScore,
      confidence: 0.8,
      details: {
        measured: consistencyIssues,
        expected: 0,
        reasoning: [
          `${consistencyIssues}/${totalTagPairs} tag inconsistencies found`,
          `Consistency score: ${Math.round(consistencyScore * 100)}%`,
          ...issues.slice(0, 3)
        ],
        suggestions: consistencyIssues > 0 ? [
          'Review and fix tag incompatibilities',
          'Update tag configuration for better consistency',
          'Remove or modify problematic tag combinations'
        ] : []
      }
    };
  }

  /**
   * Calculate category coverage score
   */
  private calculateCategoryCoverage(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const availableCategories = Object.keys(config.categories);
    const representedCategories = new Set(selection.map(doc => doc.document.category));
    
    const coverage = representedCategories.size / availableCategories.length;
    const idealCoverage = Math.min(0.8, selection.length / availableCategories.length);
    
    // Calculate how close we are to ideal coverage
    const coverageScore = coverage >= idealCoverage ? 1 : coverage / idealCoverage;

    return {
      value: coverageScore,
      confidence: 0.9,
      details: {
        measured: representedCategories.size,
        expected: Math.ceil(idealCoverage * availableCategories.length),
        reasoning: [
          `${representedCategories.size}/${availableCategories.length} categories covered`,
          `Coverage: ${Math.round(coverage * 100)}%`,
          `Represented: ${Array.from(representedCategories).join(', ')}`
        ],
        suggestions: coverage < idealCoverage ? [
          'Include documents from missing categories',
          'Aim for more balanced category representation',
          'Consider category importance for current context'
        ] : []
      }
    };
  }

  /**
   * Calculate topic breadth score
   */
  private calculateTopicBreadth(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    const allTags = new Set<string>();
    for (const document of selection) {
      document.tags.primary.forEach(tag => allTags.add(tag));
      document.tags.secondary?.forEach(tag => allTags.add(tag));
    }

    // Calculate breadth relative to collection size
    const expectedBreadth = Math.min(selection.length * 1.5, Object.keys(config.tags).length * 0.4);
    const actualBreadth = allTags.size;
    const breadthScore = Math.min(1, actualBreadth / expectedBreadth);

    return {
      value: breadthScore,
      confidence: 0.7,
      details: {
        measured: actualBreadth,
        expected: Math.round(expectedBreadth),
        reasoning: [
          `${actualBreadth} unique topics covered`,
          `Breadth score: ${Math.round(breadthScore * 100)}%`,
          `Topics: ${Array.from(allTags).slice(0, 10).join(', ')}${allTags.size > 10 ? '...' : ''}`
        ],
        suggestions: breadthScore < 0.7 ? [
          'Include documents covering more diverse topics',
          'Add documents with unique tag combinations',
          'Balance specialization with breadth'
        ] : []
      }
    };
  }

  /**
   * Calculate space efficiency score
   */
  private calculateSpaceEfficiency(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    // Estimate total character usage
    let totalCharacters = 0;
    for (const document of selection) {
      totalCharacters += this.estimateDocumentCharacters(document);
    }

    const utilization = totalCharacters / constraints.characterLimit;
    const targetUtilization = config.composition.optimization.spaceUtilizationTarget;
    
    // Score is based on how close we are to target utilization
    const efficiency = utilization <= targetUtilization 
      ? utilization / targetUtilization 
      : Math.max(0, 2 - (utilization / targetUtilization));

    return {
      value: efficiency,
      confidence: 0.6, // Lower confidence due to estimation
      details: {
        measured: utilization,
        expected: targetUtilization,
        reasoning: [
          `Space utilization: ${Math.round(utilization * 100)}%`,
          `Target utilization: ${Math.round(targetUtilization * 100)}%`,
          `Estimated characters: ${totalCharacters}/${constraints.characterLimit}`
        ],
        suggestions: efficiency < 0.8 ? [
          utilization < targetUtilization 
            ? 'Consider adding more documents to use available space'
            : 'Selection exceeds optimal character limit',
          'Review character estimates and constraints'
        ] : []
      }
    };
  }

  /**
   * Calculate information density score
   */
  private calculateInformationDensity(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints,
    config: EnhancedLLMSConfig
  ): QualityScore {
    // Information density = (total priority score) / (estimated characters)
    let totalPriority = 0;
    let totalCharacters = 0;

    for (const document of selection) {
      totalPriority += document.priority.score;
      totalCharacters += this.estimateDocumentCharacters(document);
    }

    const averagePriority = selection.length > 0 ? totalPriority / selection.length : 0;
    const charactersPerDocument = selection.length > 0 ? totalCharacters / selection.length : 1;
    
    // Normalize: high priority per character is good
    const rawDensity = (averagePriority / 100) / (charactersPerDocument / 1000); // per 1K chars
    const normalizedDensity = Math.min(1, rawDensity / 0.8); // Normalize to reasonable range

    return {
      value: normalizedDensity,
      confidence: 0.5, // Lower confidence due to estimation
      details: {
        measured: rawDensity,
        expected: 0.8,
        reasoning: [
          `Information density: ${rawDensity.toFixed(3)} priority points per 1K chars`,
          `Average priority: ${averagePriority.toFixed(1)}/100`,
          `Average document size: ${Math.round(charactersPerDocument)} chars`
        ],
        suggestions: normalizedDensity < 0.6 ? [
          'Include higher-priority documents',
          'Remove lower-value documents',
          'Optimize document selection for value density'
        ] : []
      }
    };
  }

  /**
   * Estimate document character count
   */
  private estimateDocumentCharacters(document: DocumentMetadata): number {
    const categoryEstimates: Record<string, number> = {
      'guide': 1500,
      'api': 800,
      'concept': 1200,
      'example': 1000,
      'reference': 600,
      'llms': 400
    };

    let estimate = categoryEstimates[document.document.category] || 1000;

    // Adjust for complexity
    const complexityMultipliers = {
      'basic': 0.8,
      'intermediate': 1.0,
      'advanced': 1.3,
      'expert': 1.6
    };

    estimate *= complexityMultipliers[document.tags.complexity] || 1.0;

    // Use word count if available
    if (document.document.wordCount && document.document.wordCount > 0) {
      estimate = document.document.wordCount * 5.2; // Average chars per word
    }

    return Math.round(estimate);
  }

  /**
   * Calculate letter grade based on score
   */
  private calculateGrade(score: number): QualityReport['grade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'B+';
    if (score >= 87) return 'B';
    if (score >= 83) return 'C+';
    if (score >= 80) return 'C';
    if (score >= 70) return 'D';
    return 'F';
  }

  /**
   * Generate quality summary
   */
  private generateSummary(metrics: { [metricName: string]: QualityScore }): QualityReport['summary'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const criticalIssues: string[] = [];
    const recommendations: QualityReport['summary']['recommendations'] = [];

    for (const [name, score] of Object.entries(metrics)) {
      if (score.value >= 0.8) {
        strengths.push(`Excellent ${name.replace('-', ' ')}`);
      } else if (score.value <= 0.4) {
        weaknesses.push(`Poor ${name.replace('-', ' ')}`);
        if (score.value <= 0.2) {
          criticalIssues.push(`Critical: ${name.replace('-', ' ')} needs immediate attention`);
        }
      }

      // Add recommendations from metric suggestions
      if (score.details.suggestions.length > 0) {
        const priority = score.value <= 0.3 ? 'high' : score.value <= 0.6 ? 'medium' : 'low';
        const impact = 1 - score.value; // Lower scores have higher potential impact
        
        recommendations.push({
          priority,
          action: score.details.suggestions[0],
          reason: `Improve ${name.replace('-', ' ')} (current: ${Math.round(score.value * 100)}%)`,
          impact
        });
      }
    }

    // Sort recommendations by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.impact - a.impact;
    });

    return {
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      criticalIssues,
      recommendations: recommendations.slice(0, 8)
    };
  }

  /**
   * Initialize benchmarks
   */
  private initializeBenchmarks(): Map<string, QualityBenchmark> {
    const benchmarks = new Map<string, QualityBenchmark>();

    benchmarks.set('overall', {
      name: 'Overall Quality',
      description: 'Overall document selection quality',
      category: 'general',
      thresholds: {
        excellent: 90,
        good: 80,
        average: 70,
        belowAverage: 60,
        poor: 50
      }
    });

    return benchmarks;
  }

  /**
   * Run benchmark comparisons
   */
  private runBenchmarks(
    metrics: { [metricName: string]: QualityScore },
    overallScore: number
  ): QualityReport['benchmarks'] {
    const benchmark = this.benchmarks.get('overall')!;
    
    let performance: QualityReport['benchmarks']['performance'];
    let percentile: number;

    if (overallScore >= benchmark.thresholds.excellent) {
      performance = 'excellent';
      percentile = 95;
    } else if (overallScore >= benchmark.thresholds.good) {
      performance = 'good';
      percentile = 80;
    } else if (overallScore >= benchmark.thresholds.average) {
      performance = 'average';
      percentile = 50;
    } else if (overallScore >= benchmark.thresholds.belowAverage) {
      performance = 'below-average';
      percentile = 25;
    } else {
      performance = 'poor';
      percentile = 10;
    }

    return {
      category: 'Document Selection Quality',
      performance,
      percentile,
      comparison: `This selection performs ${performance} compared to typical document selections.`
    };
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): Map<string, ValidationRule> {
    const rules = new Map<string, ValidationRule>();

    rules.set('min-documents', {
      name: 'Minimum Documents',
      description: 'Selection must contain at least one document',
      category: 'mandatory',
      severity: 'error',
      check: (selection) => ({
        passed: selection.length > 0,
        details: selection.length === 0 ? 'No documents selected' : undefined
      })
    });

    rules.set('character-limit', {
      name: 'Character Limit',
      description: 'Selection should not significantly exceed character limit',
      category: 'recommended',
      severity: 'warning',
      check: (selection, constraints) => {
        let totalChars = 0;
        for (const doc of selection) {
          totalChars += this.estimateDocumentCharacters(doc);
        }
        const withinLimit = totalChars <= constraints.characterLimit * 1.1; // 10% tolerance
        return {
          passed: withinLimit,
          details: withinLimit ? undefined : `Estimated ${totalChars} chars exceeds limit of ${constraints.characterLimit}`
        };
      }
    });

    rules.set('quality-threshold', {
      name: 'Quality Threshold',
      description: 'Documents should meet minimum quality standards',
      category: 'recommended',
      severity: 'warning',
      check: (selection, constraints, config) => {
        const minScore = config.validation.quality.minPriorityScore;
        const lowQuality = selection.filter(doc => doc.priority.score < minScore);
        return {
          passed: lowQuality.length === 0,
          details: lowQuality.length > 0 
            ? `${lowQuality.length} documents below quality threshold (${minScore})`
            : undefined
        };
      }
    });

    return rules;
  }

  /**
   * Run validation checks
   */
  private runValidation(
    selection: DocumentMetadata[],
    constraints: SelectionConstraints
  ): QualityReport['validation'] {
    const passed: Array<{ rule: string; description: string }> = [];
    const failed: Array<{ rule: string; description: string; severity: 'error' | 'warning' }> = [];

    for (const [name, rule] of this.validationRules) {
      try {
        const result = rule.check(selection, constraints, this.config);
        
        if (result.passed) {
          passed.push({
            rule: name,
            description: rule.description
          });
        } else {
          failed.push({
            rule: name,
            description: result.details || rule.description,
            severity: rule.severity === 'info' ? 'warning' : rule.severity
          });
        }
      } catch (error) {
        failed.push({
          rule: name,
          description: `Validation error: ${error}`,
          severity: 'error'
        });
      }
    }

    const score = (passed.length / (passed.length + failed.length)) || 0;

    return { passed, failed, score };
  }

  /**
   * Add custom quality metric
   */
  addMetric(name: string, metric: QualityMetric): void {
    this.metrics.set(name, metric);
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(name: string, rule: ValidationRule): void {
    this.validationRules.set(name, rule);
  }

  /**
   * Get available metrics
   */
  getAvailableMetrics(): Array<{ name: string; metric: QualityMetric }> {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({ name, metric }));
  }
}