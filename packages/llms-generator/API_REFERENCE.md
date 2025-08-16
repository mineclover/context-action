# API Reference

## Core Classes

### CategoryMinimumGenerator

Main class for generating category-based minimal LLMS content.

#### Constructor

```typescript
new CategoryMinimumGenerator(options?: CategoryMinimumOptions)
```

**Parameters**:
- `options.dataDir?: string` - Source data directory (default: `'./data'`)
- `options.outputDir?: string` - Output directory (default: `'./test/outputs'`)
- `options.languages?: string[]` - Supported languages (default: `['ko', 'en']`)
- `options.categories?: string[]` - Categories to process (default: `['api-spec', 'guide']`)
- `options.baseUrl?: string` - Base URL for generated links

#### Methods

##### `generateSingle(category: string, language: string): Promise<GenerationResult>`

Generate minimal LLMS content for a specific category and language.

**Parameters**:
- `category` - Category name (`'api-spec'` or `'guide'`)
- `language` - Language code (`'ko'`, `'en'`, etc.)

**Returns**: Promise resolving to generation result

**Example**:
```typescript
const generator = new CategoryMinimumGenerator();
const result = await generator.generateSingle('api-spec', 'en');

if (result.success) {
  console.log(`Generated ${result.documentCount} documents to ${result.filePath}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

##### `generateBatch(options?: CategoryMinimumOptions): Promise<GenerationResult[]>`

Batch generate content for multiple categories and languages.

**Parameters**:
- `options` - Optional configuration overrides

**Returns**: Promise resolving to array of generation results

**Example**:
```typescript
const results = await generator.generateBatch({
  categories: ['api-spec', 'guide'],
  languages: ['en', 'ko']
});

results.forEach(result => {
  console.log(`${result.category}-${result.language}: ${result.success ? 'Success' : 'Failed'}`);
});
```

##### `getAvailableCategories(): string[]`

Get list of available document categories.

**Returns**: Array of category names

##### `getCategoryStats(category: string, language: string): CategoryStats`

Get statistics for a specific category and language.

**Parameters**:
- `category` - Category name
- `language` - Language code

**Returns**: Statistics object with document counts and priority breakdown

**Example**:
```typescript
const stats = generator.getCategoryStats('api-spec', 'en');
console.log(`Total documents: ${stats.totalDocuments}`);
console.log(`Average priority: ${stats.averagePriorityScore}`);
console.log('By tier:', stats.tierBreakdown);
```

##### `getAvailableDocuments(language: string): DocumentInfo[]`

Get available documents for a language across all categories.

**Parameters**:
- `language` - Language code

**Returns**: Array of document information objects

### AdaptiveDocumentSelector

Advanced document selection with multiple algorithms and optimization strategies.

#### Constructor

```typescript
new AdaptiveDocumentSelector(config: EnhancedLLMSConfig)
```

#### Methods

##### `selectDocuments(documents, constraints, options?): Promise<SelectionResult>`

Select optimal document set using adaptive algorithms.

**Parameters**:
- `documents` - Array of document metadata
- `constraints` - Selection constraints (character limits, quality thresholds)
- `options` - Selection options including strategy and optimization settings

**Available Strategies**:
- `'balanced'` - Balanced approach considering all factors
- `'greedy'` - Fast greedy algorithm prioritizing efficiency  
- `'hybrid'` - Combines multiple algorithms for optimal results
- `'adaptive'` - Dynamically adapts strategy based on characteristics
- `'quality-focused'` - Prioritizes high-quality documents
- `'diverse'` - Maximizes diversity across categories

**Example**:
```typescript
const selector = new AdaptiveDocumentSelector(config);

const result = await selector.selectDocuments(documents, 
  { maxCharacters: 5000 },
  { 
    strategy: 'balanced',
    enableOptimization: true,
    maxIterations: 100
  }
);

console.log(`Selected ${result.selectedDocuments.length} documents`);
console.log(`Space utilization: ${result.optimization.spaceUtilization * 100}%`);
```

### ConfigManager

Basic configuration management for LLMS generator.

#### Static Methods

##### `findAndLoadConfig(startDir?: string): Promise<ResolvedConfig>`

Find and load configuration from project root.

##### `mergeConfigurations(...configs): UserConfig`

Merge multiple configuration objects.

**Example**:
```typescript
const baseConfig = await ConfigManager.findAndLoadConfig();
const customConfig = { characterLimits: [100, 500] };
const merged = ConfigManager.mergeConfigurations(baseConfig, customConfig);
```

## Type Definitions

### CategoryMinimumOptions

```typescript
interface CategoryMinimumOptions {
  dataDir?: string;
  outputDir?: string;
  languages?: string[];
  categories?: string[];
  baseUrl?: string;
}
```

### GenerationResult

```typescript
interface GenerationResult {
  category: string;
  language: string;
  documentCount: number;
  filePath: string;
  success: boolean;
  error?: string;
}
```

### CategoryStats

```typescript
interface CategoryStats {
  category: string;
  totalDocuments: number;
  tierBreakdown: Record<string, number>;
  averagePriorityScore: number;
}
```

### CategoryDocument

```typescript
interface CategoryDocument {
  id: string;
  title: string;
  category: string;
  priority_score: number;
  priority_tier: string;
  source_path: string;
  folder_name: string;
  url: string;
}
```

### SelectionResult

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
  };
  metadata: {
    selectionTime: number;
    algorithmsUsed: string[];
    iterationsPerformed: number;
    convergenceAchieved: boolean;
  };
}
```

## Configuration

### Default Configuration

```typescript
export const DEFAULT_CONFIG = {
  paths: {
    docsDir: './docs',
    llmContentDir: './packages/llms-generator/data',
    outputDir: './docs/llms',
    templatesDir: './templates',
    instructionsDir: './instructions'
  },
  generation: {
    supportedLanguages: ['en', 'ko'],
    characterLimits: [100, 300, 500, 1000, 2000, 3000, 4000],
    defaultCharacterLimits: {
      summary: 1000,
      detailed: 3000,
      comprehensive: 5000
    },
    defaultLanguage: 'en',
    outputFormat: 'txt'
  },
  quality: {
    minCompletenessThreshold: 0.8,
    enableValidation: true,
    strictMode: false
  }
};
```

## Usage Examples

### Basic Category Generation

```typescript
import { CategoryMinimumGenerator } from '@context-action/llms-generator';

const generator = new CategoryMinimumGenerator({
  dataDir: './data',
  outputDir: './output',
  baseUrl: 'https://example.com/docs'
});

// Generate API documentation
const apiResult = await generator.generateSingle('api-spec', 'en');
console.log(`API docs: ${apiResult.filePath}`);

// Generate user guides
const guideResult = await generator.generateSingle('guide', 'ko');
console.log(`Guide docs: ${guideResult.filePath}`);
```

### Batch Processing

```typescript
// Process multiple categories and languages
const results = await generator.generateBatch({
  categories: ['api-spec', 'guide'],
  languages: ['en', 'ko', 'ja']
});

// Show results summary
results.forEach(result => {
  if (result.success) {
    console.log(`✅ ${result.category}-${result.language}: ${result.documentCount} docs`);
  } else {
    console.log(`❌ ${result.category}-${result.language}: ${result.error}`);
  }
});
```

### Advanced Document Selection

```typescript
import { AdaptiveDocumentSelector, EnhancedConfigManager } from '@context-action/llms-generator';

const configManager = new EnhancedConfigManager();
const config = await configManager.initializeConfig('standard');
const selector = new AdaptiveDocumentSelector(config);

const documents = /* load your documents */;

const result = await selector.selectDocuments(
  documents,
  {
    maxCharacters: 10000,
    context: {
      purpose: 'API reference generation',
      targetTags: ['api', 'reference'],
      audience: ['developers']
    }
  },
  {
    strategy: 'quality-focused',
    enableOptimization: true,
    enableConflictResolution: true,
    debugMode: false
  }
);

console.log(`Selected ${result.selectedDocuments.length} documents`);
console.log(`Quality score: ${result.optimization.qualityScore}`);
console.log(`Space utilization: ${(result.optimization.spaceUtilization * 100).toFixed(1)}%`);
```

## Infrastructure APIs

### Performance Monitoring

The performance monitoring system tracks execution metrics, memory usage, and provides optimization recommendations.

#### PerformanceMonitor

```typescript
import { globalPerformanceMonitor, monitor } from '@context-action/llms-generator/infrastructure';

// Basic usage - automatic timing
class MyService {
  @monitor
  async processDocuments(documents: Document[]) {
    // Method automatically tracked
    return await this.complexProcessing(documents);
  }
}

// Manual timing
const stopTiming = globalPerformanceMonitor.startTiming('custom_operation');
await performOperation();
stopTiming();

// Get performance report
const report = globalPerformanceMonitor.generateReport();
console.log('Performance Report:', {
  totalExecutionTime: report.summary.totalExecutionTime,
  averageResponseTime: report.summary.averageResponseTime,
  peakMemoryUsage: report.summary.peakMemoryUsage,
  recommendations: report.recommendations
});
```

#### Performance Metrics

```typescript
// Record custom metrics
globalPerformanceMonitor.recordMetric({
  name: 'document_processing_rate',
  value: documentsPerSecond,
  unit: 'docs/sec',
  timestamp: new Date(),
  category: 'computation',
  context: { algorithm: 'adaptive' }
});

// Real-time statistics
const stats = globalPerformanceMonitor.getRealTimeStats();
console.log('Current Memory:', stats.currentMemoryUsage, 'MB');
console.log('Active Operations:', stats.activeOperations);
```

### Intelligent Caching

High-performance adaptive caching system with multiple eviction strategies.

#### IntelligentCache

```typescript
import { documentCache, IntelligentCache } from '@context-action/llms-generator/infrastructure';

// Using global document cache
const result = await documentCache.getOrSet(
  'expensive-operation-key',
  async () => {
    // Expensive computation
    return await processDocuments(documents);
  },
  900000 // 15 minutes TTL
);

// Custom cache instance
const customCache = new IntelligentCache({
  maxSize: 1000,
  maxMemory: 100, // MB
  defaultTtl: 3600000, // 1 hour
  evictionStrategy: 'adaptive'
});

// Cache operations
customCache.set('key', value, 600000); // 10 minutes TTL
const cached = customCache.get('key');
const exists = customCache.has('key');

// Cache optimization
const optimizationResult = customCache.optimize();
console.log('Evicted entries:', optimizationResult.evictedCount);
console.log('Memory freed:', optimizationResult.memoryFreed);
console.log('Recommendations:', optimizationResult.recommendations);
```

#### Cache Statistics

```typescript
const stats = customCache.getStats();
console.log('Cache Performance:', {
  hitRate: (stats.hitRate * 100).toFixed(1) + '%',
  totalSize: stats.totalSize + ' bytes',
  entryCount: stats.entryCount
});
```

### Parallel Processing

High-performance parallel processing system for document operations.

#### ParallelProcessor

```typescript
import { globalParallelProcessor, DocumentParallelProcessor } from '@context-action/llms-generator/infrastructure';

// Document-specific parallel processing
const processor = new DocumentParallelProcessor();

// Parallel document selection
const selectionResults = await processor.processDocumentSelection(
  documents,
  async (document) => {
    return await selectDocument(document);
  }
);

// Parallel quality evaluation
const qualityResults = await processor.processQualityEvaluation(
  selections,
  async (selection) => {
    return await evaluateQuality(selection);
  }
);

// Stream processing for large datasets
for await (const result of processor.processStream(tasks)) {
  console.log('Processed:', result.success ? 'Success' : 'Failed');
  if (!result.success) {
    console.error('Error:', result.error);
  }
}
```

#### Task Configuration

```typescript
const tasks = documents.map((doc, index) => ({
  id: `task-${index}`,
  data: doc,
  processor: async (document) => {
    return await processDocument(document);
  },
  priority: doc.priority || 0,
  timeout: 10000, // 10 seconds
  retries: 3
}));

// Process with priority
const results = await processor.processWithPriority(tasks);

// Get processing statistics
const stats = processor.getStats();
console.log('Processing Performance:', {
  throughput: stats.throughput.toFixed(2) + ' tasks/sec',
  averageExecutionTime: stats.averageExecutionTime.toFixed(0) + 'ms',
  failureRate: (stats.failedTasks / stats.totalTasks * 100).toFixed(1) + '%'
});
```

## Advanced Configuration

### Performance Tuning

```typescript
// Configure performance monitoring
const performanceMonitor = new PerformanceMonitor('custom-session', {
  executionTime: { warning: 3000, critical: 10000 },
  memoryUsage: { warning: 150, critical: 300 },
  responseTime: { warning: 500, critical: 2000 }
});

// Configure caching strategy
const cache = new IntelligentCache({
  maxSize: 2000,
  maxMemory: 200, // MB
  defaultTtl: 7200000, // 2 hours
  evictionStrategy: 'adaptive', // lru, lfu, fifo, adaptive
  cleanupInterval: 300000 // 5 minutes
});

// Configure parallel processing
const parallelProcessor = new ParallelProcessor({
  maxWorkers: 8,
  queueTimeout: 60000,
  retryCount: 3,
  retryDelay: 1000,
  batchSize: 20
});
```

## Error Handling

All async methods can throw errors. It's recommended to use try-catch blocks:

```typescript
try {
  const result = await generator.generateSingle('api-spec', 'en');
  if (!result.success) {
    console.error(`Generation failed: ${result.error}`);
  }
} catch (error) {
  console.error(`Unexpected error: ${error.message}`);
}
```

## Performance Guidelines

### Optimization Best Practices

#### Document Selection Performance

```typescript
// ✅ Good: Use caching for repeated selections
const cacheKey = `selection-${JSON.stringify(constraints)}`;
const cachedResult = await documentCache.get(cacheKey);
if (cachedResult) {
  return cachedResult;
}

// ✅ Good: Use appropriate strategy for your use case
const strategy = documents.length > 1000 ? 'greedy' : 'hybrid';
const result = await selector.selectDocuments(documents, constraints, { strategy });

// ✅ Good: Enable parallel processing for large datasets
if (documents.length > 100) {
  const results = await globalParallelProcessor.processDocumentSelection(
    documents,
    selectionFunction
  );
}

// ❌ Bad: Don't disable optimization for large sets
const result = await selector.selectDocuments(documents, constraints, {
  enableOptimization: false // Bad for large document sets
});
```

#### Memory Management

```typescript
// ✅ Good: Monitor memory usage
const memoryStats = globalPerformanceMonitor.getRealTimeStats();
if (memoryStats.currentMemoryUsage > 500) { // MB
  console.warn('High memory usage detected');
  documentCache.optimize(); // Free memory
}

// ✅ Good: Use streaming for large datasets
for await (const result of processor.processStream(largeTasks)) {
  processResult(result);
  // Memory is freed as each task completes
}

// ❌ Bad: Processing all large tasks at once
const allResults = await Promise.all(largeTasks.map(processTask));
```

#### Caching Strategy

```typescript
// ✅ Good: Different TTLs for different data types
documentCache.set('expensive-computation', result, 3600000); // 1 hour
configCache.set('user-preferences', prefs, 86400000); // 24 hours
resultCache.set('quick-lookup', data, 300000); // 5 minutes

// ✅ Good: Cache invalidation on data changes
function updateDocument(id: string, updates: any) {
  const updatedDoc = applyUpdates(id, updates);
  // Invalidate related cache entries
  documentCache.remove(`doc-${id}`);
  documentCache.remove(`selection-${id}`);
  return updatedDoc;
}
```

### Performance Benchmarks

| Operation | Document Count | Processing Time | Memory Usage | Recommended Strategy |
|-----------|----------------|-----------------|--------------|---------------------|
| Simple Selection | 1-50 | < 100ms | < 50MB | balanced |
| Medium Selection | 51-500 | < 500ms | < 200MB | hybrid |
| Large Selection | 501-2000 | < 2s | < 500MB | greedy + parallel |
| Bulk Processing | 2000+ | < 10s | < 1GB | streaming + caching |

### Monitoring and Alerting

```typescript
// Set up performance monitoring
globalPerformanceMonitor.recordMetric({
  name: 'selection_performance',
  value: selectionTime,
  unit: 'ms',
  timestamp: new Date(),
  category: 'execution'
});

// Check for performance issues
const report = globalPerformanceMonitor.generateReport();
if (report.summary.averageResponseTime > 5000) {
  console.warn('Performance degradation detected:', {
    averageTime: report.summary.averageResponseTime,
    recommendations: report.recommendations,
    bottlenecks: report.bottlenecks
  });
}

// Cache performance monitoring
const cacheStats = documentCache.getStats();
if (cacheStats.hitRate < 0.5) {
  console.warn('Low cache hit rate:', cacheStats.hitRate);
  console.log('Consider adjusting TTL or cache size');
}
```

### Scaling Considerations

#### Horizontal Scaling

```typescript
// Distribute work across multiple processes
const workerId = process.env.WORKER_ID || '0';
const workerCount = process.env.WORKER_COUNT || '1';

const processor = new ParallelProcessor({
  maxWorkers: Math.ceil(require('os').cpus().length / parseInt(workerCount)),
  queueTimeout: 30000
});

// Process subset of documents based on worker ID
const documentsSubset = documents.filter((_, index) => 
  index % parseInt(workerCount) === parseInt(workerId)
);
```

#### Resource Limits

```typescript
// Configure for different environments
const config = process.env.NODE_ENV === 'production' 
  ? {
      maxMemory: 2048, // 2GB for production
      maxWorkers: 16,
      cacheSize: 10000
    }
  : {
      maxMemory: 512, // 512MB for development
      maxWorkers: 4,
      cacheSize: 1000
    };

const cache = new IntelligentCache(config);
```

## Error Handling and Recovery

### Comprehensive Error Handling

```typescript
import { 
  PerformanceMonitor, 
  IntelligentCache, 
  ParallelProcessor 
} from '@context-action/llms-generator/infrastructure';

try {
  const result = await selector.selectDocuments(documents, constraints);
  
  // Validate result quality
  if (result.optimization.qualityScore < 0.7) {
    console.warn('Low quality result, consider adjusting constraints');
  }
  
} catch (error) {
  if (error.name === 'TimeoutError') {
    // Retry with simpler strategy
    return await selector.selectDocuments(documents, constraints, {
      strategy: 'greedy',
      maxIterations: 50
    });
  } else if (error.name === 'MemoryError') {
    // Clear cache and retry
    documentCache.clear();
    return await selector.selectDocuments(documents, constraints);
  } else {
    console.error('Selection failed:', error);
    throw error;
  }
}
```

### Circuit Breaker Pattern

```typescript
class SelectionService {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute

  async selectWithCircuitBreaker(documents: Document[], constraints: any) {
    // Check if circuit is open
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open - service temporarily unavailable');
    }

    try {
      const result = await this.performSelection(documents, constraints);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isCircuitOpen(): boolean {
    return this.failureCount >= this.failureThreshold &&
           (Date.now() - this.lastFailureTime) < this.recoveryTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
}
```

For more examples and advanced usage patterns, see the [README](./README.md).