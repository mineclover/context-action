/**
 * Tag-Based Document Filter - advanced tag filtering and selection logic
 */

import type { 
  DocumentMetadata, 
  EnhancedLLMSConfig, 
  TagConfig,
  TargetAudience
} from '../types/config.js';

export interface TagFilterOptions {
  requiredTags?: string[];
  preferredTags?: string[];
  excludedTags?: string[];
  targetAudience?: TargetAudience[];
  complexityLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  estimatedTimeRange?: {
    min?: number; // minutes
    max?: number; // minutes
  };
  requireAllRequired?: boolean;
  allowIncompatible?: boolean;
}

export interface TagFilterResult {
  filtered: DocumentMetadata[];
  excluded: Array<{
    document: DocumentMetadata;
    reason: string;
    tags: string[];
  }>;
  statistics: {
    total: number;
    included: number;
    excluded: number;
    byReason: Record<string, number>;
    tagCoverage: Record<string, number>;
  };
}

export interface TagGrouping {
  coreTags: DocumentMetadata[];
  beginnerFriendly: DocumentMetadata[];
  advanced: DocumentMetadata[];
  practical: DocumentMetadata[];
  technical: DocumentMetadata[];
  troubleshooting: DocumentMetadata[];
  quickStart: DocumentMetadata[];
}

export interface TagCompatibilityMatrix {
  [tagA: string]: {
    [tagB: string]: 'compatible' | 'incompatible' | 'neutral' | 'synergistic';
  };
}

export class TagBasedDocumentFilter {
  private config: EnhancedLLMSConfig;
  private compatibilityMatrix: TagCompatibilityMatrix;

  constructor(config: EnhancedLLMSConfig) {
    this.config = config;
    this.compatibilityMatrix = this.buildCompatibilityMatrix();
  }

  /**
   * Filter documents based on tag criteria
   */
  filterDocuments(
    documents: DocumentMetadata[],
    options: TagFilterOptions = {}
  ): TagFilterResult {
    const filtered: DocumentMetadata[] = [];
    const excluded: Array<{ document: DocumentMetadata; reason: string; tags: string[] }> = [];
    const reasonCounts: Record<string, number> = {};
    const tagCoverage: Record<string, number> = {};

    for (const document of documents) {
      const filterResult = this.evaluateDocument(document, options);
      
      if (filterResult.include) {
        filtered.push(document);
        
        // Track tag coverage
        for (const tag of document.tags.primary) {
          tagCoverage[tag] = (tagCoverage[tag] || 0) + 1;
        }
      } else {
        excluded.push({
          document,
          reason: filterResult.reason,
          tags: filterResult.problematicTags
        });
        
        // Track exclusion reasons
        reasonCounts[filterResult.reason] = (reasonCounts[filterResult.reason] || 0) + 1;
      }
    }

    return {
      filtered,
      excluded,
      statistics: {
        total: documents.length,
        included: filtered.length,
        excluded: excluded.length,
        byReason: reasonCounts,
        tagCoverage
      }
    };
  }

  /**
   * Group documents by tag patterns
   */
  groupDocumentsByTags(documents: DocumentMetadata[]): TagGrouping {
    const grouping: TagGrouping = {
      coreTags: [],
      beginnerFriendly: [],
      advanced: [],
      practical: [],
      technical: [],
      troubleshooting: [],
      quickStart: []
    };

    for (const document of documents) {
      const tags = document.tags.primary;

      if (this.hasTagsFromList(tags, ['core', 'essential', 'fundamental'])) {
        grouping.coreTags.push(document);
      }

      if (this.hasTagsFromList(tags, ['beginner', 'quick-start', 'step-by-step'])) {
        grouping.beginnerFriendly.push(document);
      }

      if (this.hasTagsFromList(tags, ['advanced', 'expert', 'optimization'])) {
        grouping.advanced.push(document);
      }

      if (this.hasTagsFromList(tags, ['practical', 'implementation', 'example'])) {
        grouping.practical.push(document);
      }

      if (this.hasTagsFromList(tags, ['technical', 'reference', 'api'])) {
        grouping.technical.push(document);
      }

      if (this.hasTagsFromList(tags, ['troubleshooting', 'debugging', 'problem-solving'])) {
        grouping.troubleshooting.push(document);
      }

      if (this.hasTagsFromList(tags, ['quick-start', 'getting-started', 'setup'])) {
        grouping.quickStart.push(document);
      }
    }

    return grouping;
  }

  /**
   * Find documents with synergistic tag combinations
   */
  findSynergisticDocuments(
    documents: DocumentMetadata[],
    targetTags: string[]
  ): Array<{
    document: DocumentMetadata;
    synergies: Array<{
      tags: string[];
      strength: number;
      description: string;
    }>;
    totalSynergyScore: number;
  }> {
    const results: Array<{
      document: DocumentMetadata;
      synergies: Array<{ tags: string[]; strength: number; description: string }>;
      totalSynergyScore: number;
    }> = [];

    for (const document of documents) {
      const synergies = this.findTagSynergies(document.tags.primary, targetTags);
      const totalScore = synergies.reduce((sum, synergy) => sum + synergy.strength, 0);

      if (synergies.length > 0) {
        results.push({
          document,
          synergies,
          totalSynergyScore: totalScore
        });
      }
    }

    // Sort by synergy score
    return results.sort((a, b) => b.totalSynergyScore - a.totalSynergyScore);
  }

  /**
   * Create balanced tag distribution
   */
  createBalancedTagDistribution(
    documents: DocumentMetadata[],
    maxDocuments: number,
    targetTags: string[] = []
  ): DocumentMetadata[] {
    if (documents.length <= maxDocuments) {
      return documents;
    }

    const tagGroups = this.groupDocumentsByTags(documents);
    const result: DocumentMetadata[] = [];
    const used = new Set<string>();

    // Calculate desired distribution
    const categories = Object.keys(tagGroups) as Array<keyof TagGrouping>;
    const docsPerCategory = Math.floor(maxDocuments / categories.length);
    const remainder = maxDocuments % categories.length;

    // Select documents from each category
    let remainingSlots = remainder;
    
    for (const category of categories) {
      const categoryDocs = tagGroups[category].filter(doc => !used.has(doc.document.id));
      const slotsForCategory = docsPerCategory + (remainingSlots > 0 ? 1 : 0);
      if (remainingSlots > 0) remainingSlots--;

      // Priority: target tags > highest score > diversity
      const sorted = this.sortByTagRelevance(categoryDocs, targetTags);
      const selected = sorted.slice(0, Math.min(slotsForCategory, sorted.length));

      for (const doc of selected) {
        result.push(doc);
        used.add(doc.document.id);
      }
    }

    // Fill remaining slots with best remaining documents
    if (result.length < maxDocuments) {
      const remaining = documents
        .filter(doc => !used.has(doc.document.id))
        .sort((a, b) => b.priority.score - a.priority.score);
      
      const needed = maxDocuments - result.length;
      result.push(...remaining.slice(0, needed));
    }

    return result;
  }

  /**
   * Analyze tag patterns in document collection
   */
  analyzeTagPatterns(documents: DocumentMetadata[]): {
    mostFrequentTags: Array<{ tag: string; count: number; percentage: number }>;
    tagCombinations: Array<{ combination: string[]; count: number; documents: string[] }>;
    audienceDistribution: Record<TargetAudience, number>;
    complexityDistribution: Record<string, number>;
    orphanTags: string[];
    dominantPatterns: Array<{ pattern: string; documents: string[]; strength: number }>;
  } {
    const tagCounts: Record<string, number> = {};
    const tagCombinations: Record<string, { count: number; documents: string[] }> = {};
    const audienceDistribution: Record<TargetAudience, number> = {} as any;
    const complexityDistribution: Record<string, number> = {};
    const allTags = new Set<string>();

    // Collect statistics
    for (const document of documents) {
      // Count individual tags
      for (const tag of document.tags.primary) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        allTags.add(tag);
      }

      // Count tag combinations
      if (document.tags.primary.length > 1) {
        const sortedTags = [...document.tags.primary].sort();
        const combination = sortedTags.join(',');
        
        if (!tagCombinations[combination]) {
          tagCombinations[combination] = { count: 0, documents: [] };
        }
        tagCombinations[combination].count++;
        tagCombinations[combination].documents.push(document.document.id);
      }

      // Audience distribution
      for (const audience of document.tags.audience) {
        audienceDistribution[audience] = (audienceDistribution[audience] || 0) + 1;
      }

      // Complexity distribution
      complexityDistribution[document.tags.complexity] = 
        (complexityDistribution[document.tags.complexity] || 0) + 1;
    }

    // Find most frequent tags
    const mostFrequentTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / documents.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Find common combinations
    const commonCombinations = Object.entries(tagCombinations)
      .map(([combo, data]) => ({
        combination: combo.split(','),
        count: data.count,
        documents: data.documents
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Find orphan tags (tags that appear in very few documents)
    const orphanTags = Object.entries(tagCounts)
      .filter(([, count]) => count === 1)
      .map(([tag]) => tag);

    // Identify dominant patterns
    const dominantPatterns = this.identifyDominantPatterns(documents, tagCounts);

    return {
      mostFrequentTags,
      tagCombinations: commonCombinations,
      audienceDistribution,
      complexityDistribution,
      orphanTags,
      dominantPatterns
    };
  }

  /**
   * Evaluate single document against filter options
   */
  private evaluateDocument(
    document: DocumentMetadata,
    options: TagFilterOptions
  ): { include: boolean; reason: string; problematicTags: string[] } {
    const docTags = document.tags.primary;

    // Check excluded tags
    if (options.excludedTags?.length) {
      const excluded = docTags.filter(tag => options.excludedTags!.includes(tag));
      if (excluded.length > 0) {
        return {
          include: false,
          reason: 'Contains excluded tags',
          problematicTags: excluded
        };
      }
    }

    // Check required tags
    if (options.requiredTags?.length) {
      const hasRequired = options.requireAllRequired
        ? options.requiredTags.every(tag => docTags.includes(tag))
        : options.requiredTags.some(tag => docTags.includes(tag));
      
      if (!hasRequired) {
        const missing = options.requiredTags.filter(tag => !docTags.includes(tag));
        return {
          include: false,
          reason: options.requireAllRequired 
            ? 'Missing required tags' 
            : 'No required tags found',
          problematicTags: missing
        };
      }
    }

    // Check target audience
    if (options.targetAudience?.length) {
      const hasTargetAudience = options.targetAudience.some(audience => 
        document.tags.audience.includes(audience)
      );
      
      if (!hasTargetAudience) {
        return {
          include: false,
          reason: 'Target audience mismatch',
          problematicTags: []
        };
      }
    }

    // Check complexity level
    if (options.complexityLevel && document.tags.complexity !== options.complexityLevel) {
      return {
        include: false,
        reason: `Complexity mismatch: expected ${options.complexityLevel}, got ${document.tags.complexity}`,
        problematicTags: []
      };
    }

    // Check tag compatibility
    if (!options.allowIncompatible) {
      const incompatibleTags = this.findIncompatibleTags(docTags);
      if (incompatibleTags.length > 0) {
        return {
          include: false,
          reason: 'Incompatible tag combination',
          problematicTags: incompatibleTags
        };
      }
    }

    // Check estimated time range
    if (options.estimatedTimeRange) {
      const timeStr = document.tags.estimatedReadingTime;
      const minutes = this.parseTimeToMinutes(timeStr);
      
      if (minutes !== null) {
        const { min = 0, max = Infinity } = options.estimatedTimeRange;
        if (minutes < min || minutes > max) {
          return {
            include: false,
            reason: `Reading time outside range: ${minutes}min not in ${min}-${max}min`,
            problematicTags: []
          };
        }
      }
    }

    return { include: true, reason: '', problematicTags: [] };
  }

  /**
   * Build tag compatibility matrix
   */
  private buildCompatibilityMatrix(): TagCompatibilityMatrix {
    const matrix: TagCompatibilityMatrix = {};

    for (const [tagA, configA] of Object.entries(this.config.tags)) {
      matrix[tagA] = {};
      
      for (const [tagB, configB] of Object.entries(this.config.tags)) {
        if (tagA === tagB) {
          matrix[tagA][tagB] = 'compatible';
        } else if (configA.compatibleWith.includes(tagB)) {
          // Check for synergy
          const isSynergistic = configB.compatibleWith.includes(tagA);
          matrix[tagA][tagB] = isSynergistic ? 'synergistic' : 'compatible';
        } else {
          matrix[tagA][tagB] = 'incompatible';
        }
      }
    }

    return matrix;
  }

  /**
   * Helper methods
   */
  private hasTagsFromList(documentTags: string[], targetTags: string[]): boolean {
    return targetTags.some(tag => documentTags.includes(tag));
  }

  private findIncompatibleTags(tags: string[]): string[] {
    const incompatible: string[] = [];
    
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const compatibility = this.compatibilityMatrix[tags[i]]?.[tags[j]];
        if (compatibility === 'incompatible') {
          incompatible.push(tags[i], tags[j]);
        }
      }
    }
    
    return [...new Set(incompatible)];
  }

  private findTagSynergies(
    documentTags: string[], 
    targetTags: string[]
  ): Array<{ tags: string[]; strength: number; description: string }> {
    const synergies: Array<{ tags: string[]; strength: number; description: string }> = [];

    for (const docTag of documentTags) {
      for (const targetTag of targetTags) {
        const compatibility = this.compatibilityMatrix[docTag]?.[targetTag];
        if (compatibility === 'synergistic') {
          const tagConfigA = this.config.tags[docTag];
          const tagConfigB = this.config.tags[targetTag];
          const strength = (tagConfigA?.weight || 1) * (tagConfigB?.weight || 1);
          
          synergies.push({
            tags: [docTag, targetTag],
            strength,
            description: `${docTag} synergizes with ${targetTag}`
          });
        }
      }
    }

    return synergies;
  }

  private sortByTagRelevance(
    documents: DocumentMetadata[], 
    targetTags: string[]
  ): DocumentMetadata[] {
    return documents.sort((a, b) => {
      const scoreA = this.calculateTagRelevanceScore(a, targetTags);
      const scoreB = this.calculateTagRelevanceScore(b, targetTags);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.priority.score - a.priority.score;
    });
  }

  private calculateTagRelevanceScore(document: DocumentMetadata, targetTags: string[]): number {
    let score = 0;
    
    for (const tag of document.tags.primary) {
      if (targetTags.includes(tag)) {
        const tagConfig = this.config.tags[tag];
        score += tagConfig?.weight || 1;
      }
    }
    
    return score;
  }

  private parseTimeToMinutes(timeStr: string): number | null {
    const match = timeStr.match(/(\d+)(-(\d+))?\s*분/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[3] ? parseInt(match[3]) : min;
      return (min + max) / 2;
    }
    return null;
  }

  private identifyDominantPatterns(
    documents: DocumentMetadata[],
    tagCounts: Record<string, number>
  ): Array<{ pattern: string; documents: string[]; strength: number }> {
    const patterns: Array<{ pattern: string; documents: string[]; strength: number }> = [];

    // Common patterns to look for
    const patternDefinitions = [
      { name: 'beginner-friendly', tags: ['beginner', 'step-by-step', 'practical'] },
      { name: 'technical-reference', tags: ['technical', 'reference', 'api'] },
      { name: 'quick-start', tags: ['quick-start', 'getting-started', 'beginner'] },
      { name: 'advanced-concepts', tags: ['advanced', 'concept', 'architecture'] },
      { name: 'troubleshooting', tags: ['troubleshooting', 'debugging', 'problem-solving'] }
    ];

    for (const pattern of patternDefinitions) {
      const matchingDocs = documents.filter(doc => 
        pattern.tags.some(tag => doc.tags.primary.includes(tag))
      );

      if (matchingDocs.length > 0) {
        const strength = matchingDocs.length / documents.length;
        patterns.push({
          pattern: pattern.name,
          documents: matchingDocs.map(doc => doc.document.id),
          strength
        });
      }
    }

    return patterns.sort((a, b) => b.strength - a.strength);
  }
}