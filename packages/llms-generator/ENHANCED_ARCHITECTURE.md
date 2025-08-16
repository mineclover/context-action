# Architecture Guide

## System Overview

The LLMS-Generator is a TypeScript library for processing documentation and generating optimized content for LLM consumption. It provides category-based generation, adaptive document selection, and comprehensive configuration management.

## Core Components

### 1. Category-Based Generation

#### CategoryMinimumGenerator
**Purpose**: Generate minimal LLMS content for specific categories

**Key Features**:
- Category patterns: `api-spec`, `guide`
- Multi-language support: `ko`, `en`, `ja`, `zh`
- Priority-based document sorting
- Automatic URL generation and metadata processing

**Architecture**:
```typescript
CategoryMinimumGenerator
├── Pattern Matching → Document Discovery
├── Priority Sorting → Document Ranking  
├── Content Generation → LLMS Text Output
└── Statistics & Analytics → Usage Insights
```

### 2. Adaptive Document Selection

#### AdaptiveDocumentSelector
**Purpose**: Intelligent document selection with multiple algorithms

**Selection Strategies**:
- **Balanced**: Equal weight to all factors
- **Greedy**: Fast efficiency-focused selection
- **Hybrid**: Combines multiple algorithms
- **Quality-focused**: Prioritizes high-quality documents
- **Diverse**: Maximizes category and tag diversity

**Algorithm Flow**:
```
Input Documents → Strategy Selection → Algorithm Execution → Optimization → Results
```

### 3. Configuration Management

#### ConfigManager & EnhancedConfigManager
**Purpose**: Hierarchical configuration with preset support

**Configuration Layers**:
1. **Default Configuration**: Base settings and character limits
2. **User Configuration**: Project-specific overrides
3. **Enhanced Configuration**: Advanced features and presets

### 4. Document Processing Pipeline

```
Source Documents
    ↓
Priority Metadata Generation
    ↓
Category-Based Filtering
    ↓
Document Selection Algorithm
    ↓
Content Extraction & Summarization
    ↓
Output Generation
```

## Directory Structure

```
src/
├── core/
│   ├── CategoryMinimumGenerator.ts      # Main category generator
│   ├── AdaptiveDocumentSelector.ts      # Selection algorithms
│   ├── ConfigManager.ts                 # Basic configuration
│   ├── EnhancedConfigManager.ts         # Advanced configuration
│   ├── DocumentScorer.ts                # Document quality scoring
│   ├── ConflictDetector.ts              # Dependency conflict resolution
│   └── ...
├── cli/                                 # Command-line interface
├── types/                               # TypeScript definitions
└── utils/                               # Utility functions

data/
├── {language}/                          # Language-specific content
│   └── {document-id}/
│       ├── priority.json                # Document metadata
│       └── {document-id}-{chars}.md     # Generated summaries
└── config-schema.json                   # Configuration validation

test/
├── unit/                                # Unit tests
├── integration/                         # Integration tests
├── e2e/                                 # End-to-end tests
└── fixtures/                            # Test data
```

## Data Flow

### 1. Document Discovery
```
File System Scan → priority.json Files → Category Pattern Matching → Document Registry
```

### 2. Content Generation
```
Document Registry → Priority Sorting → Template Application → Content Generation → File Output
```

### 3. Selection Process
```
Input Constraints → Strategy Selection → Algorithm Execution → Optimization → Result Validation
```

## Key Design Patterns

### 1. Strategy Pattern
Used in `AdaptiveDocumentSelector` for multiple selection algorithms:
```typescript
interface SelectionStrategy {
  name: string;
  algorithm: 'greedy' | 'hybrid' | 'multi-criteria';
  criteria: SelectionCriteria;
  constraints: SelectionConstraints;
}
```

### 2. Factory Pattern
Used in configuration management for preset creation:
```typescript
class EnhancedConfigManager {
  getConfigPreset(presetName: string): ConfigPreset
  createConfigFromPreset(preset: ConfigPreset): EnhancedLLMSConfig
}
```

### 3. Builder Pattern
Used in document selection for complex constraint building:
```typescript
const result = await selector.selectDocuments(documents, constraints, {
  strategy: 'balanced',
  enableOptimization: true,
  maxIterations: 100
});
```

## Configuration Schema

### Basic Configuration
```typescript
interface CategoryMinimumOptions {
  dataDir?: string;
  outputDir?: string;
  languages?: string[];
  categories?: string[];
  baseUrl?: string;
}
```

### Enhanced Configuration
```typescript
interface EnhancedLLMSConfig {
  paths: PathConfig;
  generation: GenerationConfig;
  quality: QualityConfig;
  categories: Record<string, CategoryConfig>;
  tags: Record<string, TagConfig>;
  dependencies: DependencyConfig;
  composition: CompositionConfig;
}
```

## Performance Characteristics

### Scalability
- **Document Count**: Linear scaling up to 1000+ documents
- **Memory Usage**: ~1MB per 100 documents
- **Processing Time**: <100ms for typical operations

### Optimization Features
- **Caching**: Configuration and metadata caching
- **Parallel Processing**: Batch operations run concurrently
- **Lazy Loading**: Documents loaded on-demand
- **Smart Filtering**: Early elimination of irrelevant documents

## Error Handling Strategy

### 1. Graceful Degradation
- Continue operation with reduced functionality when possible
- Provide meaningful error messages with context
- Return partial results when complete processing fails

### 2. Validation Layers
- **Input Validation**: Parameter and option validation
- **Configuration Validation**: Schema-based config validation
- **Output Validation**: Result integrity checks

### 3. Error Recovery
- Automatic retry for transient failures
- Fallback strategies for missing dependencies
- Clean state restoration after errors

## Testing Strategy

### 1. Unit Tests
- Individual component functionality
- Mock external dependencies
- Test error conditions and edge cases

### 2. Integration Tests
- Component interaction testing
- Configuration loading and validation
- End-to-end workflow testing

### 3. Performance Tests
- Load testing with large document sets
- Memory usage profiling
- Algorithm performance benchmarks

## Security Considerations

### 1. Input Sanitization
- Path traversal prevention
- File access validation
- Configuration parameter validation

### 2. Output Security
- Safe file writing operations
- Controlled directory access
- Metadata sanitization

## Extensibility Points

### 1. Custom Selection Strategies
Add new strategies by implementing the `SelectionStrategy` interface:
```typescript
const customStrategy: SelectionStrategy = {
  name: 'Custom Strategy',
  algorithm: 'multi-criteria',
  criteria: { /* custom weights */ },
  constraints: { /* custom constraints */ }
};

selector.addStrategy('custom', customStrategy);
```

### 2. Category Extensions
Add new document categories by extending pattern matching:
```typescript
const CATEGORY_PATTERNS = {
  'api-spec': ['api--*', 'api/*'],
  'guide': ['guide--*', 'guide/*'],
  'custom': ['custom--*', 'custom/*']  // New category
};
```

### 3. Configuration Presets
Create custom presets for specific use cases:
```typescript
const customPreset: ConfigPreset = {
  name: 'Custom Preset',
  description: 'Specialized configuration',
  characterLimits: [100, 500, 2000],
  languages: ['en'],
  categories: { /* custom categories */ },
  tags: { /* custom tags */ }
};
```

This architecture provides a solid foundation for document processing while maintaining flexibility for future enhancements and customizations.