# Enhanced LLMS-Generator Architecture Guide

## Overview

The enhanced LLMS-Generator transforms from a basic document summarization tool into an **intelligent content curation system** that considers categories, tags, and dependencies for "appropriate" content selection.

## Core Philosophy

**"적절히" (Appropriately)** = Categories + Dependencies + Intelligence

The system intelligently selects documents by:
- **Category-based strategies**: Each document type has optimized selection logic
- **Tag compatibility**: Ensuring harmonious tag combinations 
- **Dependency resolution**: Automatically including prerequisites and related content
- **Quality evaluation**: Comprehensive 12-dimension quality assessment

## System Architecture

### Layer 1: Configuration & Schema Management

#### EnhancedConfigManager (`src/core/EnhancedConfigManager.ts`)
**Purpose**: Manages enhanced configurations with multiple presets and auto-enhancement

**Key Features**:
- 4 built-in presets: `standard`, `minimal`, `extended`, `blog`
- Auto-enhancement from basic to advanced configuration
- Category-based and tag-based default configurations
- Dependency rules and composition strategies

**Configuration Structure**:
```typescript
interface EnhancedLLMSConfig extends LLMSConfig {
  categories: Record<string, CategoryConfig>;      // Document categories
  tags: Record<string, TagConfig>;                 // Tag definitions
  dependencies: DependencyConfig;                  // Dependency rules
  composition: CompositionConfig;                  // Selection strategies
  extraction: ExtractionConfig;                    // Content extraction
  validation: ValidationConfig;                    // Validation rules
  ui: UIConfig;                                   // UI configuration
}
```

#### EnhancedPrioritySchemaManager (`src/core/EnhancedPrioritySchemaManager.ts`)
**Purpose**: Advanced schema management with smart generation capabilities

**Key Features**:
- Enhanced JSON schema validation with custom AJV validators
- Smart tag generation based on document patterns
- Auto-detection of dependencies and relationships  
- Contextual relevance and user journey stage analysis

### Layer 2: Document Scoring & Filtering

#### DocumentScorer (`src/core/DocumentScorer.ts`)
**Purpose**: Multi-dimensional document scoring system

**Scoring Dimensions**:
- **Category Score**: Based on category priority and affinity
- **Tag Score**: Tag compatibility and affinity calculations
- **Dependency Score**: Prerequisite satisfaction and relationship scoring
- **Priority Score**: Document priority normalization
- **Contextual Score**: Context-specific relevance scoring

**Strategy Integration**:
- Supports 4 composition strategies: `balanced`, `category-focused`, `dependency-driven`, `beginner-friendly`
- Weighted scoring based on strategy configuration
- Tag affinity calculation with compatibility checking

#### TagBasedDocumentFilter (`src/core/TagBasedDocumentFilter.ts`)
**Purpose**: Advanced tag filtering with compatibility analysis

**Key Features**:
- **Tag Compatibility Matrix**: Detects compatible/incompatible tag combinations
- **Tag Grouping**: Groups documents by tag patterns (core, beginner-friendly, advanced, etc.)
- **Synergistic Detection**: Finds documents with synergistic tag combinations
- **Balanced Distribution**: Creates balanced tag distributions within limits

#### CategoryStrategyManager (`src/core/CategoryStrategyManager.ts`)
**Purpose**: Category-specific selection strategies and analysis

**Category Strategies**:
- **Guide**: Tutorial-first, beginner-friendly, step-by-step focus
- **API**: Reference-first, technical accuracy, developer-oriented
- **Concept**: Concept-first, architectural focus, theory-heavy
- **Example**: Example-first, practical application, code-heavy
- **Reference**: Reference-first, comprehensive coverage, lookup-oriented
- **LLMS**: Optimized for LLM processing, concise, structured

### Layer 3: Dependency & Conflict Management

#### DependencyResolver (`src/core/DependencyResolver.ts`)
**Purpose**: Resolves document dependencies using graph algorithms

**Core Algorithms**:
- **Dependency Graph Construction**: Builds directed graph of document relationships
- **Cycle Detection**: DFS-based cycle detection with breaking strategies
- **Topological Sorting**: BFS (Kahn's) and DFS-based ordering
- **Conflict Resolution**: Multiple strategies for handling conflicts

**Dependency Types**:
- **Prerequisites**: Required prior knowledge (auto-include with BFS)
- **References**: Related reference material (selective inclusion)
- **Followups**: Suggested next steps (optional inclusion)
- **Conflicts**: Mutually exclusive content (automatic exclusion)
- **Complements**: Complementary content (space-permitting inclusion)

#### ConflictDetector (`src/core/ConflictDetector.ts`)
**Purpose**: Detects and resolves conflicts between documents

**Conflict Types**:
- **Tag Incompatible**: Documents with incompatible tags
- **Content Duplicate**: Duplicate or highly similar content
- **Audience Mismatch**: Conflicting target audiences
- **Complexity Gap**: Large complexity gaps between related documents
- **Category Exclusive**: Mutually exclusive categories

**Resolution Strategies**:
- **exclude-first/second/both**: Remove conflicting documents
- **modify-first/second**: Apply suggested modifications
- **keep-both**: Allow both with warnings
- **manual-review**: Flag for manual intervention

### Layer 4: Adaptive Selection Algorithms

#### AdaptiveDocumentSelector (`src/core/AdaptiveDocumentSelector.ts`)
**Purpose**: Intelligent document selection using multiple optimization algorithms

**Selection Algorithms**:

1. **Knapsack Algorithm** (Dynamic Programming)
   - Optimal solution for character-constrained selection
   - Considers value-to-space ratio
   - Guaranteed optimal within constraints

2. **Greedy Algorithm**
   - Fast efficiency-based selection
   - Sorts by score/character ratio
   - Applies diversity penalties

3. **Multi-Criteria Decision Analysis** (TOPSIS)
   - Normalizes multiple criteria
   - Calculates distance to ideal solution
   - Balanced multi-objective optimization

4. **Hybrid Algorithm**
   - Combines multiple algorithms
   - Iterative local optimization
   - Convergence-based stopping

**Selection Strategies**:
- **Balanced**: Equal consideration of all factors
- **Quality-focused**: Prioritizes high-quality documents
- **Diverse**: Maximizes category and tag diversity
- **Efficiency**: Maximizes information density

### Layer 5: Quality Evaluation

#### QualityEvaluator (`src/core/QualityEvaluator.ts`)
**Purpose**: Comprehensive quality assessment with 12 quality dimensions

**Quality Metrics Categories**:

1. **Content Quality**
   - Content Relevance: Alignment with target context
   - Content Completeness: Topic coverage adequacy  
   - Content Accuracy: Document quality and correctness

2. **Structure Quality**
   - Logical Flow: Document sequence coherence
   - Dependency Satisfaction: Prerequisite fulfillment

3. **Accessibility**
   - Complexity Appropriateness: Suitable complexity for audience
   - Audience Alignment: Target audience matching

4. **Coherence**
   - Thematic Coherence: Overall theme consistency
   - Tag Consistency: Tag compatibility and usage

5. **Completeness**
   - Category Coverage: Category representation
   - Topic Breadth: Topic diversity coverage

6. **Efficiency**
   - Space Efficiency: Character limit utilization
   - Information Density: Value per character

**Quality Report Features**:
- **Overall Score**: 0-100 with A+ to F grading
- **Detailed Metrics**: Individual metric scores with reasoning
- **Benchmarking**: Performance comparison with thresholds
- **Validation**: Rule-based validation with pass/fail results
- **Recommendations**: Prioritized improvement suggestions

## Data Flow Architecture

```
1. Configuration Load
   EnhancedConfigManager → Load preset/custom config

2. Document Analysis
   Documents → EnhancedPrioritySchemaManager → Enhanced metadata

3. Initial Filtering  
   Documents → TagBasedDocumentFilter → Compatible documents

4. Conflict Resolution
   Documents → ConflictDetector → Conflict-free set

5. Dependency Resolution
   Documents → DependencyResolver → Ordered with dependencies

6. Scoring & Selection
   Documents → DocumentScorer → Scored candidates
           → CategoryStrategyManager → Category strategies
           → AdaptiveDocumentSelector → Optimal selection

7. Quality Evaluation
   Selection → QualityEvaluator → Quality report & recommendations
```

## Integration Points

### With Existing LLMS-Generator
- **Backward Compatible**: Works with existing priority files
- **Auto-Enhancement**: Converts basic configs to enhanced format
- **Gradual Migration**: Can enable enhanced features incrementally

### With External Systems
- **CLI Integration**: Enhanced commands with new flags and options
- **API Extensions**: New endpoints for enhanced selection
- **Monitoring**: Quality metrics for system monitoring
- **Caching**: Intelligent caching of scoring and selection results

## Performance Characteristics

### Algorithmic Complexity
- **Knapsack**: O(n × W) where n = documents, W = character limit
- **Greedy**: O(n log n) for sorting plus O(n) for selection
- **TOPSIS**: O(n × m) where n = documents, m = criteria
- **Dependency Resolution**: O(V + E) where V = documents, E = dependencies

### Memory Usage
- **Configuration**: ~1-5MB depending on categories/tags
- **Dependency Graph**: O(V²) in worst case, typically O(V + E)
- **Scoring Cache**: O(n) per scoring context
- **Quality Metrics**: O(n) per evaluation

### Scalability Limits
- **Documents**: Efficiently handles 1K-10K documents
- **Dependencies**: Up to ~10K dependency relationships
- **Categories/Tags**: Up to ~100 categories, ~500 tags
- **Character Limits**: Supports up to 1M character constraints

## Configuration Examples

### Standard Configuration
```json
{
  "categories": {
    "guide": {
      "name": "가이드",
      "priority": 90,
      "defaultStrategy": "tutorial-first",
      "tags": ["beginner", "step-by-step", "practical"]
    }
  },
  "composition": {
    "strategies": {
      "balanced": {
        "weights": {
          "categoryWeight": 0.4,
          "tagWeight": 0.3,
          "dependencyWeight": 0.2,
          "priorityWeight": 0.1
        }
      }
    },
    "defaultStrategy": "balanced"
  }
}
```

### Enhanced Priority Metadata
```json
{
  "document": {
    "id": "guide-getting-started",
    "category": "guide"
  },
  "tags": {
    "primary": ["beginner", "step-by-step"],
    "audience": ["new-users"],
    "complexity": "basic"
  },
  "dependencies": {
    "prerequisites": [],
    "followups": [
      {
        "documentId": "guide-advanced-patterns",
        "timing": "after-practice"
      }
    ]
  },
  "composition": {
    "categoryAffinity": { "guide": 1.0, "concept": 0.8 },
    "tagAffinity": { "beginner": 1.0, "practical": 0.8 }
  }
}
```

## Extension Points

### Custom Metrics
```typescript
qualityEvaluator.addMetric('custom-metric', {
  name: 'Custom Quality Metric',
  category: 'content',
  weight: 0.5,
  calculate: (selection, constraints, config) => {
    // Custom calculation logic
    return { value: score, confidence: confidence, details: {...} };
  }
});
```

### Custom Conflict Rules
```typescript
conflictDetector.addCustomRule('custom-conflict', {
  type: 'custom-conflict',
  severity: 'moderate',
  description: 'Custom conflict detection',
  detectFunction: (docA, docB, config) => { /* logic */ },
  resolveFunction: (docA, docB, config) => { /* resolution */ }
});
```

### Custom Selection Strategies
```typescript
adaptiveSelector.addStrategy('custom-strategy', {
  name: 'Custom Strategy',
  algorithm: 'hybrid',
  criteria: { /* custom weights */ },
  constraints: { /* custom constraints */ }
});
```

This enhanced architecture provides a comprehensive, extensible, and intelligent document curation system that truly understands what "appropriate" means in the context of document selection.