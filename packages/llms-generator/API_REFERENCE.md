# Enhanced LLMS-Generator API Reference

## Core Classes

### EnhancedConfigManager

Enhanced configuration management with preset support and auto-enhancement capabilities.

#### Constructor
```typescript
new EnhancedConfigManager(configPath?: string)
```

#### Methods

##### `loadConfig(): Promise<EnhancedLLMSConfig>`
Loads configuration from file with auto-enhancement.

**Returns**: Promise resolving to enhanced configuration

**Example**:
```typescript
const configManager = new EnhancedConfigManager();
const config = await configManager.loadConfig();
```

##### `initializeConfig(presetName: string): Promise<EnhancedLLMSConfig>`
Initializes configuration with a preset.

**Parameters**:
- `presetName`: One of `"standard"`, `"minimal"`, `"extended"`, `"blog"`

**Returns**: Promise resolving to initialized configuration

**Example**:
```typescript
const config = await configManager.initializeConfig('standard');
```

##### `getConfigPreset(presetName: string): ConfigPreset`
Gets a configuration preset.

**Parameters**:
- `presetName`: Preset name to retrieve

**Returns**: Configuration preset object

**Throws**: Error if preset not found

### DocumentScorer

Multi-dimensional document scoring system with strategy-based weighting.

#### Constructor
```typescript
new DocumentScorer(config: EnhancedLLMSConfig, strategyName?: string)
```

#### Methods

##### `scoreDocument(document: DocumentMetadata, context: SelectionContext, options?: ScoringOptions): ScoringResult`
Scores a document against selection context.

**Parameters**:
- `document`: Document metadata to score
- `context`: Selection context with target criteria
- `options`: Optional scoring configuration

**Returns**: Detailed scoring result with breakdown

**Example**:
```typescript
const scorer = new DocumentScorer(config, 'balanced');
const result = scorer.scoreDocument(document, context);
console.log(`Total score: ${result.scores.total}`);
```

##### `calculateTagAffinity(document: DocumentMetadata, targetTags: string[]): TagAffinityResult`
Calculates tag affinity between document and target tags.

**Parameters**:
- `document`: Document to analyze
- `targetTags`: Array of target tags to match

**Returns**: Detailed tag affinity analysis

**Example**:
```typescript
const affinity = scorer.calculateTagAffinity(document, ['beginner', 'practical']);
console.log(`Matched tags: ${affinity.matchedTags.join(', ')}`);
```

### TagBasedDocumentFilter

Advanced tag filtering with compatibility analysis and grouping.

#### Constructor
```typescript
new TagBasedDocumentFilter(config: EnhancedLLMSConfig)
```

#### Methods

##### `filterDocuments(documents: DocumentMetadata[], options?: TagFilterOptions): TagFilterResult`
Filters documents based on tag criteria with detailed analysis.

**Parameters**:
- `documents`: Array of documents to filter
- `options`: Filter configuration options

**Returns**: Filter results with statistics and exclusions

**Example**:
```typescript
const filter = new TagBasedDocumentFilter(config);
const result = filter.filterDocuments(documents, {
  requiredTags: ['core'],
  excludedTags: ['advanced'],
  targetAudience: ['beginners']
});
```

##### `groupDocumentsByTags(documents: DocumentMetadata[]): TagGrouping`
Groups documents by common tag patterns.

**Returns**: Documents grouped by tag categories

### AdaptiveDocumentSelector

Intelligent document selection using multiple optimization algorithms.

#### Constructor
```typescript
new AdaptiveDocumentSelector(config: EnhancedLLMSConfig)
```

#### Methods

##### `selectDocuments(documents: DocumentMetadata[], constraints: SelectionConstraints, options?: AdaptiveSelectionOptions): Promise<SelectionResult>`
Selects optimal document set using adaptive algorithms.

**Parameters**:
- `documents`: Available documents for selection
- `constraints`: Character limits and context constraints
- `options`: Selection algorithm configuration

**Returns**: Promise resolving to comprehensive selection result

**Example**:
```typescript
const selector = new AdaptiveDocumentSelector(config);
const result = await selector.selectDocuments(documents, {
  maxCharacters: 5000,
  targetCharacterLimit: 5000,
  context: {
    targetTags: ['beginner', 'practical'],
    tagWeights: { 'beginner': 1.5, 'practical': 1.2 },
    selectedDocuments: [],
    maxCharacters: 5000,
    targetCharacterLimit: 5000
  }
}, {
  strategy: 'hybrid',
  enableOptimization: true,
  enableConflictResolution: true
});
```

##### `getAvailableStrategies(): Array<{ name: string; strategy: SelectionStrategy }>`
Gets all available selection strategies.

**Returns**: Array of available strategies with configurations

### DependencyResolver

Resolves document dependencies using graph algorithms.

#### Constructor
```typescript
new DependencyResolver(config: EnhancedLLMSConfig)
```

#### Methods

##### `resolveDependencies(documents: DocumentMetadata[], options?: ResolutionOptions): ResolutionResult`
Resolves dependencies and orders documents.

**Parameters**:
- `documents`: Documents to analyze for dependencies
- `options`: Resolution configuration

**Returns**: Resolved documents with dependency analysis

**Example**:
```typescript
const resolver = new DependencyResolver(config);
const result = resolver.resolveDependencies(documents, {
  maxDepth: 3,
  includeOptionalDependencies: true,
  resolveConflicts: true,
  conflictResolution: 'higher-score-wins'
});
```

##### `buildDependencyGraph(documents: DocumentMetadata[]): DependencyGraph`
Builds dependency graph from documents.

**Returns**: Dependency graph with nodes and relationships

##### `detectCycles(graph: DependencyGraph): string[][]`
Detects dependency cycles in the graph.

**Returns**: Array of cycles (each cycle is an array of document IDs)

### ConflictDetector

Detects and resolves conflicts between documents.

#### Constructor
```typescript
new ConflictDetector(config: EnhancedLLMSConfig)
```

#### Methods

##### `detectConflicts(documents: DocumentMetadata[], options?: ConflictDetectionOptions): ConflictAnalysisResult`
Detects conflicts between documents with comprehensive analysis.

**Parameters**:
- `documents`: Documents to analyze for conflicts
- `options`: Detection configuration

**Returns**: Complete conflict analysis with resolutions

**Example**:
```typescript
const detector = new ConflictDetector(config);
const analysis = detector.detectConflicts(documents, {
  autoResolve: true,
  severityThreshold: 'moderate'
});
```

##### `applyConflictResolutions(documents: DocumentMetadata[], conflicts: Conflict[]): Resolution`
Applies conflict resolutions to document set.

**Returns**: Resolved documents with exclusions and modifications

### QualityEvaluator

Comprehensive quality assessment with 12 quality dimensions.

#### Constructor
```typescript
new QualityEvaluator(config: EnhancedLLMSConfig)
```

#### Methods

##### `evaluateQuality(selection: DocumentMetadata[], constraints: SelectionConstraints, selectionResult?: SelectionResult): QualityReport`
Evaluates quality of document selection across all dimensions.

**Parameters**:
- `selection`: Selected documents to evaluate
- `constraints`: Selection constraints for context
- `selectionResult`: Optional selection result for additional context

**Returns**: Comprehensive quality report with scores and recommendations

**Example**:
```typescript
const evaluator = new QualityEvaluator(config);
const report = evaluator.evaluateQuality(selectedDocuments, constraints);
console.log(`Overall Score: ${report.overallScore}/100 (${report.grade})`);
console.log(`Strengths: ${report.summary.strengths.join(', ')}`);
```

##### `addMetric(name: string, metric: QualityMetric): void`
Adds custom quality metric.

**Parameters**:
- `name`: Unique metric name
- `metric`: Metric configuration and calculation function

## Type Definitions

### Configuration Types

#### EnhancedLLMSConfig
```typescript
interface EnhancedLLMSConfig extends LLMSConfig {
  categories: Record<string, CategoryConfig>;
  tags: Record<string, TagConfig>;
  dependencies: DependencyConfig;
  composition: CompositionConfig;
  extraction: ExtractionConfig;
  validation: ValidationConfig;
  ui: UIConfig;
}
```

#### CategoryConfig
```typescript
interface CategoryConfig {
  name: string;                    // Display name
  description: string;             // Category description
  priority: number;                // Base priority (1-100)
  defaultStrategy: ExtractStrategy; // Default extraction strategy
  tags: string[];                  // Associated tags
  color?: string;                  // UI color
  icon?: string;                   // UI icon
}
```

#### TagConfig
```typescript
interface TagConfig {
  name: string;                    // Display name
  description: string;             // Tag description
  weight: number;                  // Scoring weight
  compatibleWith: string[];        // Compatible tags
  audience?: string[];             // Target audiences
  estimatedTime?: string;          // Estimated reading time
  importance?: 'critical' | 'optional';
  frequency?: 'high' | 'low';
  urgency?: 'high' | 'medium' | 'low';
}
```

### Selection Types

#### SelectionConstraints
```typescript
interface SelectionConstraints {
  maxCharacters: number;           // Maximum character limit
  targetCharacterLimit: number;    // Target character count
  context: SelectionContext;       // Selection context
}
```

#### SelectionContext
```typescript
interface SelectionContext {
  targetCategory?: DocumentCategory;
  targetTags: string[];
  tagWeights: Record<string, number>;
  selectedDocuments: DocumentMetadata[];
  requiredTopics?: string[];
  maxCharacters: number;
  targetCharacterLimit: number;
}
```

#### SelectionResult
```typescript
interface SelectionResult {
  selectedDocuments: DocumentMetadata[];
  strategy: SelectionStrategy;
  scoring: {
    totalScore: number;
    averageScore: number;
    scoreDistribution: ScoringResult[];
  };
  optimization: {
    spaceUtilization: number;
    qualityScore: number;
    diversityScore: number;
    balanceScore: number;
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
    selectionTime: number;
    algorithmsUsed: string[];
    iterationsPerformed: number;
    convergenceAchieved: boolean;
  };
}
```

### Quality Types

#### QualityReport
```typescript
interface QualityReport {
  overallScore: number;            // 0-100
  confidence: number;              // 0-1
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
      impact: number;
    }>;
  };
  benchmarks: {
    category: string;
    performance: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    percentile: number;
    comparison: string;
  };
  validation: {
    passed: Array<{ rule: string; description: string }>;
    failed: Array<{ rule: string; description: string; severity: 'error' | 'warning' }>;
    score: number;
  };
}
```

#### QualityScore
```typescript
interface QualityScore {
  value: number;                   // 0-1
  confidence: number;              // 0-1
  details: {
    measured: any;
    expected: any;
    reasoning: string[];
    suggestions: string[];
  };
}
```

## Usage Examples

### Basic Document Selection
```typescript
import { 
  EnhancedConfigManager, 
  AdaptiveDocumentSelector, 
  QualityEvaluator 
} from '@context-action/llms-generator';

// Initialize system
const configManager = new EnhancedConfigManager();
const config = await configManager.loadConfig();
const selector = new AdaptiveDocumentSelector(config);
const evaluator = new QualityEvaluator(config);

// Define constraints
const constraints = {
  maxCharacters: 5000,
  targetCharacterLimit: 5000,
  context: {
    targetTags: ['beginner', 'practical'],
    tagWeights: { 'beginner': 1.5, 'practical': 1.2 },
    selectedDocuments: [],
    maxCharacters: 5000,
    targetCharacterLimit: 5000
  }
};

// Select documents
const result = await selector.selectDocuments(documents, constraints, {
  strategy: 'balanced',
  enableOptimization: true
});

// Evaluate quality
const quality = evaluator.evaluateQuality(result.selectedDocuments, constraints, result);

console.log(`Selected ${result.selectedDocuments.length} documents`);
console.log(`Quality: ${quality.overallScore}/100 (${quality.grade})`);
console.log(`Space utilization: ${Math.round(result.optimization.spaceUtilization * 100)}%`);
```

### Advanced Configuration
```typescript
// Initialize with custom preset
const config = await configManager.initializeConfig('extended');

// Add custom quality metric
evaluator.addMetric('domain-relevance', {
  name: 'Domain Relevance',
  category: 'content',
  weight: 0.8,
  calculate: (selection, constraints, config) => {
    // Custom domain-specific scoring logic
    const relevance = calculateDomainRelevance(selection);
    return {
      value: relevance,
      confidence: 0.9,
      details: {
        measured: relevance,
        expected: 0.8,
        reasoning: ['Domain relevance analysis'],
        suggestions: relevance < 0.6 ? ['Include more domain-specific content'] : []
      }
    };
  }
});

// Use dependency-driven strategy
const result = await selector.selectDocuments(documents, constraints, {
  strategy: 'dependency-driven',
  enableDependencyResolution: true,
  enableConflictResolution: true,
  customWeights: {
    dependencyWeight: 0.6,
    categoryWeight: 0.2,
    tagWeight: 0.2
  }
});
```

### Conflict Resolution
```typescript
import { ConflictDetector } from '@context-action/llms-generator';

const detector = new ConflictDetector(config);

// Detect conflicts
const analysis = detector.detectConflicts(documents, {
  enabledRules: ['tag-incompatible', 'content-duplicate', 'audience-mismatch'],
  severityThreshold: 'moderate',
  autoResolve: true
});

console.log(`Found ${analysis.summary.total} conflicts`);
console.log(`Auto-resolvable: ${analysis.summary.autoResolvable}`);

// Apply resolutions
const resolution = detector.applyConflictResolutions(documents, analysis.conflicts);
console.log(`Excluded ${resolution.excludedDocuments.length} conflicted documents`);
```

## Error Handling

### Common Errors

#### Configuration Errors
```typescript
try {
  const config = await configManager.loadConfig();
} catch (error) {
  if (error.message.includes('not found')) {
    // Initialize with default preset
    const config = await configManager.initializeConfig('standard');
  } else {
    throw error;
  }
}
```

#### Selection Errors
```typescript
try {
  const result = await selector.selectDocuments(documents, constraints);
} catch (error) {
  if (error.message.includes('Unknown strategy')) {
    // Fallback to balanced strategy
    const result = await selector.selectDocuments(documents, constraints, {
      strategy: 'balanced'
    });
  } else {
    throw error;
  }
}
```

### Validation Errors
```typescript
const report = evaluator.evaluateQuality(selection, constraints);

if (report.validation.failed.length > 0) {
  const errors = report.validation.failed.filter(f => f.severity === 'error');
  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    // Handle critical validation failures
  }
}
```

## Performance Guidelines

### Memory Management
- Reuse `DocumentScorer` instances for multiple scoring operations
- Clear large result sets when no longer needed
- Use streaming for very large document collections

### Optimization Tips
- Enable caching for repeated selections with similar constraints
- Use simpler algorithms (`greedy`) for real-time scenarios
- Batch multiple quality evaluations when possible

### Scalability Limits
- **Documents**: Optimized for 1K-10K documents
- **Characters**: Supports up to 1M character constraints  
- **Dependencies**: Handles up to 10K relationships efficiently
- **Categories/Tags**: Up to 100 categories, 500 tags recommended