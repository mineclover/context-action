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

## Performance Considerations

- **Large Document Sets**: The system handles 100+ documents efficiently
- **Memory Usage**: Scales linearly with document count
- **Caching**: Results are cached for improved performance
- **Parallel Processing**: Batch operations run in parallel when possible

For more examples and advanced usage patterns, see the [README](./README.md).