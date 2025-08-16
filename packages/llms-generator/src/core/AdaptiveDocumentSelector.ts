/**
 * Adaptive Document Selector - intelligent document selection with multiple algorithms
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  SelectionContext, 
  SelectionConstraints
} from '../types/config.js';

import { DocumentScorer, type ScoringResult } from './DocumentScorer.js';
import { TagBasedDocumentFilter } from './TagBasedDocumentFilter.js';
import { CategoryStrategyManager } from './CategoryStrategyManager.js';
import { DependencyResolver, type ResolutionResult } from './DependencyResolver.js';
import { ConflictDetector, type ConflictAnalysisResult } from './ConflictDetector.js';

export interface SelectionStrategy {
  name: string;
  description: string;
  algorithm: 'knapsack' | 'greedy' | 'multi-criteria' | 'hybrid' | 'machine-learning';
  criteria: {
    priorityWeight: number;
    diversityWeight: number;
    dependencyWeight: number;
    qualityWeight: number;
    spaceUtilization: number;
  };
  constraints: {
    maxDocuments?: number;
    minQualityScore?: number;
    requiredCategories?: string[];
    balanceRequirement?: number; // 0-1, how balanced categories should be
  };
}

export interface SelectionResult {
  selectedDocuments: DocumentMetadata[];
  strategy: SelectionStrategy;
  scoring: {
    totalScore: number;
    averageScore: number;
    scoreDistribution: ScoringResult[];
  };
  optimization: {
    spaceUtilization: number; // How much of character limit is used
    qualityScore: number; // Overall quality score
    diversityScore: number; // How diverse the selection is
    balanceScore: number; // How balanced categories are
  };
  analysis: {
    categoryCoverage: Record<string, number>;
    tagCoverage: Record<string, number>;
    audienceCoverage: Record<string, number>;
    complexityDistribution: Record<string, number>;
  };
  dependencies: {
    resolved: ResolutionResult;
    includedDependencies: number;
    cyclesDetected: number;
  };
  conflicts: {
    analysis: ConflictAnalysisResult;
    resolved: number;
    remaining: number;
  };
  metadata: {
    selectionTime: number; // milliseconds
    algorithmsUsed: string[];
    iterationsPerformed: number;
    convergenceAchieved: boolean;
  };
}

export interface AdaptiveSelectionOptions {
  strategy?: string;
  maxIterations?: number;
  convergenceThreshold?: number;
  enableOptimization?: boolean;
  enableConflictResolution?: boolean;
  enableDependencyResolution?: boolean;
  customWeights?: Partial<SelectionStrategy['criteria']>;
  debugMode?: boolean;
}

export interface SelectionCandidate {
  document: DocumentMetadata;
  score: number;
  estimatedCharacters: number;
  priority: number;
  categoryAffinity: number;
  tagAffinity: number;
  dependencyBonus: number;
  diversityBonus: number;
  selected: boolean;
  reasons: string[];
}

export class AdaptiveDocumentSelector {
  private config: EnhancedLLMSConfig;
  private scorer: DocumentScorer;
  private filter: TagBasedDocumentFilter;
  private categoryManager: CategoryStrategyManager;
  private dependencyResolver: DependencyResolver;
  private conflictDetector: ConflictDetector;
  private strategies: Map<string, SelectionStrategy>;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.scorer = new DocumentScorer(config);
    this.filter = new TagBasedDocumentFilter(config);
    this.categoryManager = new CategoryStrategyManager(config);
    this.dependencyResolver = new DependencyResolver(config);
    this.conflictDetector = new ConflictDetector(config);
    this.strategies = this.initializeStrategies();
  }

  /**
   * Select optimal document set using adaptive algorithms
   */
  async selectDocuments(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    options: AdaptiveSelectionOptions = {}
  ): Promise<SelectionResult> {
    const startTime = Date.now();
    const {
      strategy: strategyName = 'hybrid',
      maxIterations = 100,
      convergenceThreshold = 0.01,
      enableOptimization = true,
      enableConflictResolution = true,
      enableDependencyResolution = true,
      debugMode = false
    } = options;

    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown selection strategy: ${strategyName}`);
    }

    // Apply custom weights if provided
    if (options.customWeights) {
      Object.assign(strategy.criteria, options.customWeights);
    }

    let currentDocuments = [...documents];
    const algorithmsUsed: string[] = [];

    // Phase 1: Initial filtering and conflict resolution
    if (enableConflictResolution) {
      const conflictAnalysis = this.conflictDetector.detectConflicts(currentDocuments);
      const conflictResolution = this.conflictDetector.applyConflictResolutions(currentDocuments, conflictAnalysis.conflicts);
      currentDocuments = conflictResolution.resolvedDocuments;
      algorithmsUsed.push('conflict-resolution');
      
      if (debugMode) {
        console.log(`Conflict resolution: ${documents.length} -> ${currentDocuments.length} documents`);
      }
    }

    // Phase 2: Dependency resolution
    let dependencyResult: ResolutionResult | null = null;
    if (enableDependencyResolution) {
      dependencyResult = this.dependencyResolver.resolveDependencies(currentDocuments);
      currentDocuments = dependencyResult.orderedDocuments;
      algorithmsUsed.push('dependency-resolution');
      
      if (debugMode) {
        console.log(`Dependency resolution: added ${dependencyResult.includedDependencies.length} dependencies`);
      }
    }

    // Phase 3: Core selection algorithm
    let selectedDocuments: DocumentMetadata[];
    let scoringResults: ScoringResult[];
    let iterationsPerformed = 0;
    let convergenceAchieved = false;

    switch (strategy.algorithm) {
      case 'knapsack':
        ({ selectedDocuments, scoringResults, iterationsPerformed, convergenceAchieved } = 
          this.knapsackSelection(currentDocuments, constraints, strategy, maxIterations, convergenceThreshold));
        algorithmsUsed.push('knapsack');
        break;

      case 'greedy':
        ({ selectedDocuments, scoringResults, iterationsPerformed, convergenceAchieved } = 
          this.greedySelection(currentDocuments, constraints, strategy));
        algorithmsUsed.push('greedy');
        break;

      case 'multi-criteria':
        ({ selectedDocuments, scoringResults, iterationsPerformed, convergenceAchieved } = 
          this.multiCriteriaSelection(currentDocuments, constraints, strategy, maxIterations));
        algorithmsUsed.push('multi-criteria');
        break;

      case 'hybrid':
        ({ selectedDocuments, scoringResults, iterationsPerformed, convergenceAchieved } = 
          this.hybridSelection(currentDocuments, constraints, strategy, maxIterations, convergenceThreshold));
        algorithmsUsed.push('hybrid');
        break;

      default:
        throw new Error(`Unsupported algorithm: ${strategy.algorithm}`);
    }

    // Phase 4: Optimization (if enabled)
    if (enableOptimization && !convergenceAchieved) {
      const optimized = this.optimizeSelection(selectedDocuments, currentDocuments, constraints, strategy);
      selectedDocuments = optimized.documents;
      iterationsPerformed += optimized.iterations;
      convergenceAchieved = optimized.converged;
      algorithmsUsed.push('optimization');
    }

    // Calculate final metrics
    const selectionTime = Date.now() - startTime;
    const finalAnalysis = this.analyzeSelection(selectedDocuments, constraints, strategy);
    const conflictAnalysis = enableConflictResolution 
      ? this.conflictDetector.detectConflicts(selectedDocuments)
      : { conflicts: [], summary: { total: 0, bySeverity: {}, byType: {}, autoResolvable: 0, requiresManualReview: 0 }, recommendations: [], resolutionPlan: [] };

    return {
      selectedDocuments,
      strategy,
      scoring: {
        totalScore: scoringResults.reduce((sum, result) => sum + result.scores.total, 0),
        averageScore: scoringResults.reduce((sum, result) => sum + result.scores.total, 0) / scoringResults.length,
        scoreDistribution: scoringResults
      },
      optimization: finalAnalysis.optimization,
      analysis: finalAnalysis.analysis,
      dependencies: {
        resolved: dependencyResult || { orderedDocuments: [], includedDependencies: [], excludedConflicts: [], cycles: [], warnings: [], statistics: { totalProcessed: 0, dependenciesResolved: 0, conflictsExcluded: 0, averageDepth: 0 } },
        includedDependencies: dependencyResult?.includedDependencies.length || 0,
        cyclesDetected: dependencyResult?.cycles.length || 0
      },
      conflicts: {
        analysis: conflictAnalysis,
        resolved: conflictAnalysis.summary.autoResolvable,
        remaining: conflictAnalysis.summary.requiresManualReview
      },
      metadata: {
        selectionTime,
        algorithmsUsed,
        iterationsPerformed,
        convergenceAchieved
      }
    };
  }

  /**
   * Knapsack-based selection algorithm (dynamic programming)
   */
  private knapsackSelection(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy,
    maxIterations: number,
    convergenceThreshold: number
  ): { selectedDocuments: DocumentMetadata[]; scoringResults: ScoringResult[]; iterationsPerformed: number; convergenceAchieved: boolean } {
    const candidates = this.createSelectionCandidates(documents, constraints, strategy);
    const maxCharacters = constraints.maxCharacters;

    // Classic 0/1 knapsack with floating point weights
    const n = candidates.length;
    const W = Math.floor(maxCharacters / 10); // Scale down for DP table size
    
    const dp = Array(n + 1).fill(null).map(() => Array(W + 1).fill(0));
    const keep = Array(n + 1).fill(null).map(() => Array(W + 1).fill(false));

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const candidate = candidates[i - 1];
      const weight = Math.floor(candidate.estimatedCharacters / 10);
      const value = candidate.score * 1000; // Scale up for precision

      for (let w = 0; w <= W; w++) {
        if (weight <= w) {
          const includeValue = dp[i - 1][w - weight] + value;
          if (includeValue > dp[i - 1][w]) {
            dp[i][w] = includeValue;
            keep[i][w] = true;
          } else {
            dp[i][w] = dp[i - 1][w];
          }
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Backtrack to find selected items
    const selectedIndices = new Set<number>();
    let i = n, w = W;
    while (i > 0 && w > 0) {
      if (keep[i][w]) {
        selectedIndices.add(i - 1);
        const candidate = candidates[i - 1];
        w -= Math.floor(candidate.estimatedCharacters / 10);
      }
      i--;
    }

    const selectedDocuments = Array.from(selectedIndices).map(idx => candidates[idx].document);
    const scoringResults = candidates
      .filter((_, idx) => selectedIndices.has(idx))
      .map(candidate => ({
        document: candidate.document,
        scores: {
          total: candidate.score,
          category: candidate.categoryAffinity,
          tag: candidate.tagAffinity,
          dependency: candidate.dependencyBonus,
          priority: candidate.priority / 100
        },
        reasons: candidate.reasons,
        excluded: false
      }));

    return {
      selectedDocuments,
      scoringResults,
      iterationsPerformed: 1,
      convergenceAchieved: true
    };
  }

  /**
   * Greedy selection algorithm
   */
  private greedySelection(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): { selectedDocuments: DocumentMetadata[]; scoringResults: ScoringResult[]; iterationsPerformed: number; convergenceAchieved: boolean } {
    const candidates = this.createSelectionCandidates(documents, constraints, strategy);
    
    // Sort by score/character ratio (efficiency)
    candidates.sort((a, b) => {
      const efficiencyA = a.score / Math.max(a.estimatedCharacters, 1);
      const efficiencyB = b.score / Math.max(b.estimatedCharacters, 1);
      return efficiencyB - efficiencyA;
    });

    const selectedDocuments: DocumentMetadata[] = [];
    const scoringResults: ScoringResult[] = [];
    let usedCharacters = 0;
    const maxCharacters = constraints.maxCharacters;

    for (const candidate of candidates) {
      if (usedCharacters + candidate.estimatedCharacters <= maxCharacters) {
        selectedDocuments.push(candidate.document);
        usedCharacters += candidate.estimatedCharacters;
        
        scoringResults.push({
          document: candidate.document,
          scores: {
            total: candidate.score,
            category: candidate.categoryAffinity,
            tag: candidate.tagAffinity,
            dependency: candidate.dependencyBonus,
            priority: candidate.priority / 100
          },
          reasons: candidate.reasons,
          excluded: false
        });

        // Apply diversity penalty to remaining candidates
        this.applyDiversityPenalty(candidates, candidate, selectedDocuments.length);
      }
    }

    return {
      selectedDocuments,
      scoringResults,
      iterationsPerformed: 1,
      convergenceAchieved: true
    };
  }

  /**
   * Multi-criteria decision analysis
   */
  private multiCriteriaSelection(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy,
    maxIterations: number
  ): { selectedDocuments: DocumentMetadata[]; scoringResults: ScoringResult[]; iterationsPerformed: number; convergenceAchieved: boolean } {
    const candidates = this.createSelectionCandidates(documents, constraints, strategy);
    
    // Normalize criteria scores
    const normalizedCandidates = this.normalizeCandidateScores(candidates);
    
    // Apply TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
    const topsisScores = this.calculateTOPSISScores(normalizedCandidates, strategy.criteria);
    
    // Sort by TOPSIS scores
    const rankedCandidates = normalizedCandidates.map((candidate, index) => ({
      ...candidate,
      topsisScore: topsisScores[index]
    })).sort((a, b) => b.topsisScore - a.topsisScore);

    // Select documents within character constraints
    const selectedDocuments: DocumentMetadata[] = [];
    const scoringResults: ScoringResult[] = [];
    let usedCharacters = 0;

    for (const candidate of rankedCandidates) {
      if (usedCharacters + candidate.estimatedCharacters <= constraints.maxCharacters) {
        selectedDocuments.push(candidate.document);
        usedCharacters += candidate.estimatedCharacters;
        
        scoringResults.push({
          document: candidate.document,
          scores: {
            total: candidate.topsisScore,
            category: candidate.categoryAffinity,
            tag: candidate.tagAffinity,
            dependency: candidate.dependencyBonus,
            priority: candidate.priority / 100
          },
          reasons: [...candidate.reasons, `TOPSIS score: ${candidate.topsisScore.toFixed(3)}`],
          excluded: false
        });
      }
    }

    return {
      selectedDocuments,
      scoringResults,
      iterationsPerformed: 1,
      convergenceAchieved: true
    };
  }

  /**
   * Hybrid selection combining multiple algorithms
   */
  private hybridSelection(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy,
    maxIterations: number,
    convergenceThreshold: number
  ): { selectedDocuments: DocumentMetadata[]; scoringResults: ScoringResult[]; iterationsPerformed: number; convergenceAchieved: boolean } {
    let bestSelection: DocumentMetadata[] = [];
    let bestScore = -Infinity;
    let bestScoringResults: ScoringResult[] = [];
    let iterationsPerformed = 0;
    let lastScore = -Infinity;
    let convergenceAchieved = false;

    // Try multiple algorithms and pick the best
    const algorithms = [
      () => this.greedySelection(documents, constraints, strategy),
      () => this.multiCriteriaSelection(documents, constraints, strategy, maxIterations),
      () => this.knapsackSelection(documents, constraints, strategy, maxIterations, convergenceThreshold)
    ];

    for (const algorithm of algorithms) {
      try {
        const result = algorithm();
        const totalScore = result.scoringResults.reduce((sum, sr) => sum + sr.scores.total, 0);
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestSelection = result.selectedDocuments;
          bestScoringResults = result.scoringResults;
        }
        
        iterationsPerformed += result.iterationsPerformed;
      } catch (error) {
        console.warn(`Algorithm failed:`, error);
        continue;
      }
    }

    // Local optimization iterations
    for (let iter = 0; iter < maxIterations && !convergenceAchieved; iter++) {
      const optimized = this.localOptimizationStep(bestSelection, documents, constraints, strategy);
      
      if (optimized.improvement > convergenceThreshold) {
        bestSelection = optimized.documents;
        bestScore = optimized.score;
        bestScoringResults = optimized.scoringResults;
        lastScore = bestScore;
      } else {
        convergenceAchieved = true;
      }
      
      iterationsPerformed++;
    }

    return {
      selectedDocuments: bestSelection,
      scoringResults: bestScoringResults,
      iterationsPerformed,
      convergenceAchieved
    };
  }

  /**
   * Create selection candidates with estimated characters and scores
   */
  private createSelectionCandidates(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): SelectionCandidate[] {
    return documents.map(document => {
      const scoringResult = this.scorer.scoreDocument(document, constraints.context);
      const estimatedChars = this.estimateDocumentCharacters(document);
      
      return {
        document,
        score: scoringResult.scores.total,
        estimatedCharacters: estimatedChars,
        priority: document.priority.score,
        categoryAffinity: scoringResult.scores.category,
        tagAffinity: scoringResult.scores.tag,
        dependencyBonus: scoringResult.scores.dependency,
        diversityBonus: 0, // Will be calculated dynamically
        selected: false,
        reasons: scoringResult.reasons
      };
    });
  }

  /**
   * Estimate character count for a document
   */
  private estimateDocumentCharacters(document: DocumentMetadata): number {
    // Use category-based estimates with adjustments for complexity and tags
    const baseEstimates: Record<string, number> = {
      'guide': 1500,
      'api': 800,
      'concept': 1200,
      'example': 1000,
      'reference': 600,
      'llms': 400
    };

    let estimate = baseEstimates[document.document.category] || 1000;

    // Adjust for complexity
    const complexityMultipliers = {
      'basic': 0.8,
      'intermediate': 1.0,
      'advanced': 1.3,
      'expert': 1.6
    };
    estimate *= complexityMultipliers[document.tags.complexity] || 1.0;

    // Adjust for word count if available
    if (document.document.wordCount) {
      estimate = document.document.wordCount * 5; // Rough chars per word
    }

    return Math.round(estimate);
  }

  /**
   * Apply diversity penalty to reduce similarity clustering
   */
  private applyDiversityPenalty(
    candidates: SelectionCandidate[],
    selectedCandidate: SelectionCandidate,
    selectedCount: number
  ): void {
    const penaltyRate = 0.1; // 10% penalty per similar document
    
    for (const candidate of candidates) {
      if (candidate.selected || candidate === selectedCandidate) continue;

      let similarity = 0;
      
      // Category similarity
      if (candidate.document.document.category === selectedCandidate.document.document.category) {
        similarity += 0.3;
      }

      // Tag similarity
      const candidateTags = new Set(candidate.document.tags.primary);
      const selectedTags = new Set(selectedCandidate.document.tags.primary);
      const intersection = new Set([...candidateTags].filter(tag => selectedTags.has(tag)));
      const union = new Set([...candidateTags, ...selectedTags]);
      similarity += (intersection.size / union.size) * 0.4;

      // Audience similarity
      const candidateAudiences = new Set(candidate.document.tags.audience);
      const selectedAudiences = new Set(selectedCandidate.document.tags.audience);
      const audienceIntersection = new Set([...candidateAudiences].filter(aud => selectedAudiences.has(aud)));
      similarity += (audienceIntersection.size / Math.max(candidateAudiences.size, selectedAudiences.size)) * 0.3;

      // Apply penalty
      const penalty = similarity * penaltyRate * selectedCount;
      candidate.score = Math.max(0, candidate.score - penalty);
    }
  }

  /**
   * Normalize candidate scores for multi-criteria analysis
   */
  private normalizeCandidateScores(candidates: SelectionCandidate[]): SelectionCandidate[] {
    const getMinMax = (getValue: (c: SelectionCandidate) => number) => {
      const values = candidates.map(getValue);
      return { min: Math.min(...values), max: Math.max(...values) };
    };

    const scoreRange = getMinMax(c => c.score);
    const priorityRange = getMinMax(c => c.priority);
    const categoryRange = getMinMax(c => c.categoryAffinity);
    const tagRange = getMinMax(c => c.tagAffinity);

    return candidates.map(candidate => ({
      ...candidate,
      score: this.normalize(candidate.score, scoreRange.min, scoreRange.max),
      priority: this.normalize(candidate.priority, priorityRange.min, priorityRange.max),
      categoryAffinity: this.normalize(candidate.categoryAffinity, categoryRange.min, categoryRange.max),
      tagAffinity: this.normalize(candidate.tagAffinity, tagRange.min, tagRange.max)
    }));
  }

  /**
   * Calculate TOPSIS scores for multi-criteria decision making
   */
  private calculateTOPSISScores(
    candidates: SelectionCandidate[],
    criteria: SelectionStrategy['criteria']
  ): number[] {
    // Define criteria weights
    const weights = [
      criteria.priorityWeight,
      criteria.diversityWeight,
      criteria.dependencyWeight,
      criteria.qualityWeight
    ];

    // Create decision matrix
    const matrix = candidates.map(candidate => [
      candidate.priority,
      candidate.diversityBonus,
      candidate.dependencyBonus,
      candidate.score
    ]);

    // Find ideal and negative ideal solutions
    const idealSolution = weights.map((_, colIndex) => 
      Math.max(...matrix.map(row => row[colIndex]))
    );
    const negativeIdealSolution = weights.map((_, colIndex) => 
      Math.min(...matrix.map(row => row[colIndex]))
    );

    // Calculate distances and TOPSIS scores
    return matrix.map(row => {
      const distanceToIdeal = Math.sqrt(
        weights.reduce((sum, weight, index) => 
          sum + weight * Math.pow(row[index] - idealSolution[index], 2), 0)
      );
      const distanceToNegativeIdeal = Math.sqrt(
        weights.reduce((sum, weight, index) => 
          sum + weight * Math.pow(row[index] - negativeIdealSolution[index], 2), 0)
      );

      return distanceToNegativeIdeal / (distanceToIdeal + distanceToNegativeIdeal);
    });
  }

  /**
   * Perform one step of local optimization
   */
  private localOptimizationStep(
    currentSelection: DocumentMetadata[],
    allDocuments: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): { documents: DocumentMetadata[]; score: number; scoringResults: ScoringResult[]; improvement: number } {
    const currentScore = this.calculateSelectionScore(currentSelection, constraints, strategy);
    let bestSelection = [...currentSelection];
    let bestScore = currentScore;
    let bestScoringResults: ScoringResult[] = [];

    // Try swapping each selected document with each unselected document
    const selectedIds = new Set(currentSelection.map(doc => doc.document.id));
    const unselected = allDocuments.filter(doc => !selectedIds.has(doc.document.id));

    for (let i = 0; i < currentSelection.length; i++) {
      for (const candidate of unselected) {
        // Create new selection by swapping
        const newSelection = [...currentSelection];
        newSelection[i] = candidate;

        // Check if it fits within constraints
        const totalChars = newSelection.reduce((sum, doc) => 
          sum + this.estimateDocumentCharacters(doc), 0);
        
        if (totalChars <= constraints.maxCharacters) {
          const score = this.calculateSelectionScore(newSelection, constraints, strategy);
          
          if (score > bestScore) {
            bestScore = score;
            bestSelection = newSelection;
            // Create scoring results for best selection
            bestScoringResults = newSelection.map(doc => 
              this.scorer.scoreDocument(doc, constraints.context)
            );
          }
        }
      }
    }

    const improvement = (bestScore - currentScore) / Math.max(currentScore, 1);

    return {
      documents: bestSelection,
      score: bestScore,
      scoringResults: bestScoringResults,
      improvement
    };
  }

  /**
   * Calculate overall score for a document selection
   */
  private calculateSelectionScore(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): number {
    let totalScore = 0;
    
    for (const document of documents) {
      const result = this.scorer.scoreDocument(document, constraints.context);
      totalScore += result.scores.total;
    }

    // Apply diversity and balance bonuses
    const diversityBonus = this.calculateDiversityBonus(documents) * strategy.criteria.diversityWeight;
    const balanceBonus = this.calculateBalanceBonus(documents) * (strategy.constraints.balanceRequirement || 0);

    return totalScore + diversityBonus + balanceBonus;
  }

  /**
   * Calculate diversity bonus for document selection
   */
  private calculateDiversityBonus(documents: DocumentMetadata[]): number {
    if (documents.length <= 1) return 0;

    // Category diversity
    const categories = new Set(documents.map(doc => doc.document.category));
    const categoryDiversity = categories.size / Math.min(documents.length, 6); // Max 6 categories

    // Tag diversity
    const allTags = new Set<string>();
    documents.forEach(doc => doc.tags.primary.forEach(tag => allTags.add(tag)));
    const tagDiversity = Math.min(allTags.size / (documents.length * 2), 1); // Normalize

    // Complexity diversity
    const complexities = new Set(documents.map(doc => doc.tags.complexity));
    const complexityDiversity = complexities.size / 4; // 4 complexity levels

    return (categoryDiversity + tagDiversity + complexityDiversity) / 3;
  }

  /**
   * Calculate balance bonus for even category distribution
   */
  private calculateBalanceBonus(documents: DocumentMetadata[]): number {
    const categoryCounts = new Map<string, number>();
    
    for (const doc of documents) {
      const category = doc.document.category;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }

    if (categoryCounts.size <= 1) return 0;

    const counts = Array.from(categoryCounts.values());
    const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / counts.length;
    
    // Lower variance = better balance
    return Math.max(0, 1 - (variance / average));
  }

  /**
   * Optimize selection through iterative improvement
   */
  private optimizeSelection(
    documents: DocumentMetadata[],
    allDocuments: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): { documents: DocumentMetadata[]; iterations: number; converged: boolean } {
    let currentDocuments = [...documents];
    let currentScore = this.calculateSelectionScore(currentDocuments, constraints, strategy);
    let iterations = 0;
    let converged = false;
    const maxIterations = 50;
    const convergenceThreshold = 0.001;

    while (iterations < maxIterations && !converged) {
      const optimized = this.localOptimizationStep(currentDocuments, allDocuments, constraints, strategy);
      
      if (optimized.improvement > convergenceThreshold) {
        currentDocuments = optimized.documents;
        currentScore = optimized.score;
      } else {
        converged = true;
      }
      
      iterations++;
    }

    return { documents: currentDocuments, iterations, converged };
  }

  /**
   * Analyze selection results
   */
  private analyzeSelection(
    documents: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: SelectionStrategy
  ): {
    optimization: SelectionResult['optimization'];
    analysis: SelectionResult['analysis'];
  } {
    const totalCharacters = documents.reduce((sum, doc) => sum + this.estimateDocumentCharacters(doc), 0);
    const spaceUtilization = totalCharacters / constraints.maxCharacters;

    // Category coverage
    const categoryCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const audienceCounts = new Map<string, number>();
    const complexityCounts = new Map<string, number>();

    for (const doc of documents) {
      categoryCounts.set(doc.document.category, (categoryCounts.get(doc.document.category) || 0) + 1);
      complexityCounts.set(doc.tags.complexity, (complexityCounts.get(doc.tags.complexity) || 0) + 1);
      
      for (const tag of doc.tags.primary) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
      
      for (const audience of doc.tags.audience) {
        audienceCounts.set(audience, (audienceCounts.get(audience) || 0) + 1);
      }
    }

    const qualityScore = documents.reduce((sum, doc) => sum + (doc.priority.score / 100), 0) / documents.length;
    const diversityScore = this.calculateDiversityBonus(documents);
    const balanceScore = this.calculateBalanceBonus(documents);

    return {
      optimization: {
        spaceUtilization,
        qualityScore,
        diversityScore,
        balanceScore
      },
      analysis: {
        categoryCoverage: Object.fromEntries(categoryCounts),
        tagCoverage: Object.fromEntries(tagCounts),
        audienceCoverage: Object.fromEntries(audienceCounts),
        complexityDistribution: Object.fromEntries(complexityCounts)
      }
    };
  }

  /**
   * Initialize selection strategies
   */
  private initializeStrategies(): Map<string, SelectionStrategy> {
    const strategies = new Map<string, SelectionStrategy>();

    strategies.set('balanced', {
      name: 'Balanced Selection',
      description: 'Balanced approach considering all factors equally',
      algorithm: 'hybrid',
      criteria: {
        priorityWeight: 0.3,
        diversityWeight: 0.2,
        dependencyWeight: 0.2,
        qualityWeight: 0.2,
        spaceUtilization: 0.1
      },
      constraints: {
        minQualityScore: 0.6,
        balanceRequirement: 0.5
      }
    });

    strategies.set('quality-focused', {
      name: 'Quality Focused',
      description: 'Prioritizes high-quality documents',
      algorithm: 'multi-criteria',
      criteria: {
        priorityWeight: 0.5,
        diversityWeight: 0.1,
        dependencyWeight: 0.2,
        qualityWeight: 0.15,
        spaceUtilization: 0.05
      },
      constraints: {
        minQualityScore: 0.8
      }
    });

    strategies.set('diverse', {
      name: 'Diversity Maximization',
      description: 'Maximizes diversity across categories and tags',
      algorithm: 'greedy',
      criteria: {
        priorityWeight: 0.2,
        diversityWeight: 0.4,
        dependencyWeight: 0.2,
        qualityWeight: 0.15,
        spaceUtilization: 0.05
      },
      constraints: {
        balanceRequirement: 0.8,
        requiredCategories: ['guide', 'concept', 'example']
      }
    });

    strategies.set('efficiency', {
      name: 'Space Efficient',
      description: 'Maximizes information density',
      algorithm: 'knapsack',
      criteria: {
        priorityWeight: 0.25,
        diversityWeight: 0.15,
        dependencyWeight: 0.15,
        qualityWeight: 0.25,
        spaceUtilization: 0.2
      },
      constraints: {
        minQualityScore: 0.5
      }
    });

    // Add missing strategies that tests are looking for
    strategies.set('greedy', {
      name: 'Greedy Selection',
      description: 'Fast greedy algorithm prioritizing efficiency',
      algorithm: 'greedy',
      criteria: {
        priorityWeight: 0.4,
        diversityWeight: 0.3,
        dependencyWeight: 0.2,
        qualityWeight: 0.1,
        spaceUtilization: 0.0
      },
      constraints: {
        minQualityScore: 0.4
      }
    });

    strategies.set('hybrid', {
      name: 'Hybrid Selection',
      description: 'Combines multiple algorithms for optimal results',
      algorithm: 'hybrid',
      criteria: {
        priorityWeight: 0.3,
        diversityWeight: 0.25,
        dependencyWeight: 0.25,
        qualityWeight: 0.15,
        spaceUtilization: 0.05
      },
      constraints: {
        minQualityScore: 0.5,
        balanceRequirement: 0.6
      }
    });

    strategies.set('adaptive', {
      name: 'Adaptive Selection',
      description: 'Dynamically adapts strategy based on document characteristics',
      algorithm: 'multi-criteria',
      criteria: {
        priorityWeight: 0.25,
        diversityWeight: 0.25,
        dependencyWeight: 0.25,
        qualityWeight: 0.25,
        spaceUtilization: 0.0
      },
      constraints: {
        minQualityScore: 0.6,
        balanceRequirement: 0.7
      }
    });

    return strategies;
  }

  /**
   * Helper methods
   */
  private normalize(value: number, min: number, max: number): number {
    return max === min ? 0.5 : (value - min) / (max - min);
  }

  /**
   * Add custom selection strategy
   */
  addStrategy(name: string, strategy: SelectionStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): Array<{ name: string; strategy: SelectionStrategy }> {
    return Array.from(this.strategies.entries()).map(([name, strategy]) => ({ name, strategy }));
  }

  /**
   * Update strategy configuration
   */
  updateStrategy(name: string, updates: Partial<SelectionStrategy>): void {
    const strategy = this.strategies.get(name);
    if (strategy) {
      Object.assign(strategy, updates);
    }
  }
}