# Enhanced LLMS-Generator User Guide

## Getting Started

The Enhanced LLMS-Generator transforms basic document summarization into an intelligent content curation system. It understands what "적절히" (appropriately) means by considering categories, tags, and dependencies to select the most relevant documents within your character limits.

## Quick Start

### 1. Installation

```bash
# Install the enhanced LLMS-Generator
cd packages/llms-generator
pnpm install
```

### 2. Initialize Configuration

Choose from pre-built configurations:

```bash
# Standard configuration (recommended for most projects)
pnpm llms-generator init --preset standard

# Minimal configuration (for small projects)  
pnpm llms-generator init --preset minimal

# Extended configuration (includes LLM category)
pnpm llms-generator init --preset extended

# Blog configuration (optimized for blog content)
pnpm llms-generator init --preset blog
```

This creates `llms-generator.config.json` in your project root.

### 3. Basic Usage

```bash
# Generate intelligent document selection
pnpm llms-generator generate --strategy balanced --limit 5000

# Use dependency-driven selection
pnpm llms-generator generate --strategy dependency-driven --limit 3000

# Focus on beginners with quality evaluation
pnpm llms-generator generate --strategy beginner-friendly --limit 4000 --evaluate-quality
```

## Understanding the Enhanced System

### What Makes It "적절히" (Appropriate)?

The system considers three key factors:

1. **Categories**: Each document type (guide, API, concept, example, reference, LLMs) has optimized selection strategies
2. **Dependencies**: Automatically includes prerequisites and related content
3. **Tags**: Ensures harmonious tag combinations and audience alignment

### Core Concepts

#### 1. Document Categories
- **Guide** 📖: Step-by-step tutorials and user guides
- **API** 🔧: API references and technical documentation  
- **Concept** 💡: Architectural concepts and design principles
- **Example** 💻: Code examples and practical samples
- **Reference** 📚: Detailed reference documentation
- **LLMs** 🤖: LLM-optimized concise content

#### 2. Tag System
Tags work together to create coherent selections:
- **Compatible Tags**: `beginner` + `step-by-step` + `practical`
- **Incompatible Tags**: `beginner` + `advanced`
- **Synergistic Tags**: `practical` + `example` (work better together)

#### 3. Dependency Types
- **Prerequisites**: Must be included first (e.g., "getting started" before "advanced patterns")
- **References**: Related helpful content
- **Followups**: Suggested next steps  
- **Conflicts**: Mutually exclusive content
- **Complements**: Content that works well together

## Configuration Guide

### Standard Configuration Structure

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
  "tags": {
    "beginner": {
      "name": "초보자",
      "weight": 1.2,
      "compatibleWith": ["step-by-step", "practical", "tutorial"],
      "audience": ["new-users", "learners"]
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

### Customizing Categories

Add or modify document categories:

```json
{
  "categories": {
    "tutorial": {
      "name": "튜토리얼",
      "description": "단계별 실습 가이드",
      "priority": 95,
      "defaultStrategy": "tutorial-first",
      "tags": ["hands-on", "step-by-step", "practical"],
      "color": "#28a745",
      "icon": "🎓"
    }
  }
}
```

### Defining Tag Relationships

Create coherent tag combinations:

```json
{
  "tags": {
    "beginner": {
      "compatibleWith": ["step-by-step", "practical", "tutorial", "quick-start"],
      "weight": 1.2,
      "audience": ["new-users"]
    },
    "advanced": {
      "compatibleWith": ["optimization", "architecture", "expert"],
      "weight": 0.9,
      "audience": ["experts", "contributors"]
    }
  }
}
```

## Selection Strategies

### Built-in Strategies

#### Balanced (Default)
```bash
pnpm llms-generator generate --strategy balanced
```
- Considers all factors equally
- Good for general-purpose selections
- Balances quality, diversity, and dependencies

#### Quality-Focused  
```bash
pnpm llms-generator generate --strategy quality-focused
```
- Prioritizes high-priority documents
- Minimum quality threshold: 80/100
- Best for authoritative content

#### Diverse
```bash
pnpm llms-generator generate --strategy diverse
```
- Maximizes category and tag diversity
- Ensures balanced representation
- Good for comprehensive overviews

#### Dependency-Driven
```bash
pnpm llms-generator generate --strategy dependency-driven
```
- Follows document relationships
- Includes prerequisite chains
- Creates logical learning paths

#### Beginner-Friendly
```bash
pnpm llms-generator generate --strategy beginner-friendly
```
- Optimized for new users
- Progressive complexity
- Step-by-step learning path

### Creating Custom Strategies

```typescript
// In your configuration
{
  "composition": {
    "strategies": {
      "my-strategy": {
        "name": "Domain Focused",
        "algorithm": "hybrid",
        "criteria": {
          "priorityWeight": 0.5,
          "categoryWeight": 0.3,
          "tagWeight": 0.2
        },
        "constraints": {
          "requiredCategories": ["guide", "example"],
          "preferredTags": ["practical", "domain-specific"]
        }
      }
    }
  }
}
```

## Working with Priority Files

### Enhanced Priority Metadata

The system extends basic priority files with enhanced metadata:

```json
{
  "document": {
    "id": "guide-getting-started",
    "title": "Getting Started Guide",
    "category": "guide",
    "lastModified": "2024-01-15T10:30:00Z"
  },
  "priority": {
    "score": 95,
    "tier": "critical",
    "rationale": "Essential first document for new users"
  },
  "tags": {
    "primary": ["beginner", "step-by-step", "practical"],
    "secondary": ["setup", "installation"],
    "audience": ["new-users", "beginners"],
    "complexity": "basic",
    "estimatedReadingTime": "10-15분"
  },
  "dependencies": {
    "prerequisites": [],
    "followups": [
      {
        "documentId": "guide-basic-concepts",
        "reason": "Natural progression after setup",
        "timing": "immediate"
      }
    ]
  },
  "composition": {
    "categoryAffinity": {
      "guide": 1.0,
      "concept": 0.8,
      "example": 0.9
    },
    "tagAffinity": {
      "beginner": 1.0,
      "practical": 0.8
    }
  }
}
```

### Auto-Generating Enhanced Metadata

```bash
# Generate enhanced priority file
pnpm llms-generator priority generate docs/guide/getting-started.md --enhance

# Batch enhance existing priority files  
pnpm llms-generator priority enhance --directory ./docs --category guide
```

## Quality Evaluation

### Understanding Quality Metrics

The system evaluates 12 quality dimensions:

#### Content Quality (30% weight)
- **Content Relevance**: How well documents match target context
- **Content Completeness**: Coverage of required topics
- **Content Accuracy**: Document quality and correctness

#### Structure Quality (25% weight)  
- **Logical Flow**: Document sequence coherence
- **Dependency Satisfaction**: Prerequisites fulfillment

#### Accessibility (20% weight)
- **Complexity Appropriateness**: Suitable for target audience
- **Audience Alignment**: Target audience matching

#### Coherence (15% weight)
- **Thematic Coherence**: Overall theme consistency
- **Tag Consistency**: Tag compatibility

#### Completeness (7% weight)
- **Category Coverage**: Category representation
- **Topic Breadth**: Topic diversity

#### Efficiency (3% weight)
- **Space Efficiency**: Character limit utilization
- **Information Density**: Value per character

### Quality Reports

```bash
# Generate selection with quality evaluation
pnpm llms-generator generate --strategy balanced --evaluate-quality --output-format json

# Quality-only evaluation of existing selection
pnpm llms-generator evaluate --input ./selected-documents.json
```

Example quality report:
```json
{
  "overallScore": 87,
  "grade": "B+",
  "confidence": 0.82,
  "summary": {
    "strengths": [
      "Excellent content relevance",
      "Good dependency satisfaction",
      "Appropriate complexity distribution"
    ],
    "weaknesses": [
      "Limited category coverage",
      "Suboptimal space efficiency"
    ],
    "recommendations": [
      {
        "priority": "high",
        "action": "Include documents from missing categories",
        "impact": 0.15
      }
    ]
  }
}
```

## Advanced Features

### Dependency Resolution

#### Automatic Prerequisite Inclusion
```bash
# Include prerequisites up to 2 levels deep
pnpm llms-generator generate --include-dependencies --max-depth 2

# Include optional dependencies if space permits
pnpm llms-generator generate --include-optional-dependencies
```

#### Conflict Detection and Resolution
```bash
# Automatically resolve conflicts (default)
pnpm llms-generator generate --resolve-conflicts

# Manual conflict review
pnpm llms-generator generate --conflict-resolution manual-review

# Exclude conflicting documents
pnpm llms-generator generate --conflict-resolution exclude-conflicts
```

### Tag-Based Selection

#### Target Specific Tags
```bash
# Focus on beginner-friendly content
pnpm llms-generator generate --target-tags beginner,step-by-step,practical

# Advanced users with technical focus
pnpm llms-generator generate --target-tags advanced,technical,optimization
```

#### Tag Weights
```bash
# Prioritize practical content
pnpm llms-generator generate --tag-weights practical:1.5,example:1.3,beginner:1.2
```

### Category-Focused Selection

```bash
# Focus on specific categories
pnpm llms-generator generate --categories guide,example --max-per-category 3

# Ensure minimum category representation
pnpm llms-generator generate --min-categories 3 --balance-categories
```

## CLI Reference

### Core Commands

#### `generate`
```bash
pnpm llms-generator generate [options]

Options:
  --strategy <name>           Selection strategy (balanced, quality-focused, diverse, dependency-driven, beginner-friendly)
  --limit <chars>             Character limit (default: 5000)
  --target-tags <tags>        Comma-separated target tags
  --tag-weights <weights>     Tag weights (tag:weight,tag:weight)
  --categories <cats>         Target categories
  --language <lang>           Output language (ko, en)
  --output-format <format>    Output format (txt, json, markdown)
  --evaluate-quality          Include quality evaluation
  --resolve-conflicts         Enable conflict resolution  
  --include-dependencies      Include document dependencies
  --max-depth <depth>         Maximum dependency depth (default: 3)
```

#### `init`
```bash
pnpm llms-generator init [options]

Options:
  --preset <name>             Configuration preset (standard, minimal, extended, blog)
  --output <path>             Configuration file path
  --force                     Overwrite existing configuration
```

#### `priority`
```bash
# Generate priority file
pnpm llms-generator priority generate <file> [options]

# Enhance existing priority files
pnpm llms-generator priority enhance [options]

Options:
  --category <cat>            Document category
  --tags <tags>               Primary tags
  --strategy <strategy>       Extraction strategy
  --enhance                   Generate enhanced metadata
```

#### `evaluate`
```bash
pnpm llms-generator evaluate [options]

Options:
  --input <path>              Input document list
  --output <path>             Quality report output
  --format <format>           Report format (json, html, text)
```

### Advanced Commands

#### `analyze`
```bash
# Analyze document collection
pnpm llms-generator analyze [options]

Options:
  --directory <path>          Directory to analyze
  --output <path>             Analysis report path
  --include-dependencies      Analyze dependencies
  --include-conflicts         Detect conflicts
```

#### `validate`  
```bash
# Validate configuration and priority files
pnpm llms-generator validate [options]

Options:
  --config <path>             Configuration file path
  --priority-dir <path>       Priority files directory
  --strict                    Strict validation mode
```

## Best Practices

### Configuration Best Practices

1. **Start with Standard Preset**
   ```bash
   pnmp llms-generator init --preset standard
   ```

2. **Customize Gradually**
   - Add your domain-specific categories
   - Define tag relationships for your content
   - Adjust strategy weights based on results

3. **Test Different Strategies**
   ```bash
   # Test multiple strategies and compare quality
   pnpm llms-generator generate --strategy balanced --evaluate-quality
   pnpm llms-generator generate --strategy quality-focused --evaluate-quality
   pnpm llms-generator generate --strategy diverse --evaluate-quality
   ```

### Content Organization Best Practices

1. **Consistent Category Assignment**
   - Use clear category boundaries
   - Assign each document to exactly one category
   - Follow category naming conventions

2. **Strategic Tag Usage**  
   - Use 2-5 primary tags per document
   - Ensure tag compatibility
   - Include audience and complexity tags

3. **Document Dependencies**
   - Define clear prerequisite relationships
   - Avoid circular dependencies
   - Use followup relationships for learning paths

### Quality Optimization

1. **Regular Quality Evaluation**
   ```bash
   # Monthly quality assessment
   pnpm llms-generator generate --evaluate-quality --strategy balanced
   ```

2. **Monitor Quality Metrics**
   - Aim for overall scores > 80
   - Address critical issues immediately
   - Focus on weakest metrics first

3. **Iterative Improvement**
   - Update priority scores based on usage
   - Refine tag assignments based on conflicts
   - Adjust category priorities based on user needs

## Troubleshooting

### Common Issues

#### Poor Selection Quality
```bash
# Check quality evaluation
pnpm llms-generator generate --evaluate-quality --output-format json

# Common causes:
# - Inconsistent priority scores
# - Poor tag assignments  
# - Missing dependencies
# - Character limit too restrictive
```

#### Dependency Conflicts
```bash
# Analyze conflicts
pnpm llms-generator analyze --include-conflicts

# Solutions:
# - Review conflicting documents
# - Update dependency relationships
# - Use conflict resolution strategies
```

#### Configuration Errors
```bash
# Validate configuration
pnpm llms-generator validate --config ./llms-generator.config.json

# Common issues:
# - Invalid JSON syntax
# - Missing required fields
# - Circular tag dependencies
# - Invalid strategy weights
```

### Performance Issues

#### Large Document Collections
```bash
# Use simpler strategies for speed
pnpm llms-generator generate --strategy greedy

# Batch process large collections
pnpm llms-generator generate --batch-size 1000
```

#### Memory Usage
- Use streaming mode for very large collections
- Clear cache periodically
- Limit dependency depth for complex graphs

### Getting Help

```bash
# Get help for any command
pnmp llms-generator help generate
pnpm llms-generator help init
pnpm llms-generator help priority

# Check system status
pnpm llms-generator status

# Enable debug mode
DEBUG=llms-generator:* pnpm llms-generator generate --strategy balanced
```

## Migration Guide

### From Basic to Enhanced

1. **Backup Current Setup**
   ```bash
   cp llms-generator.config.json llms-generator.config.json.backup
   ```

2. **Initialize Enhanced Configuration**
   ```bash
   pnpm llms-generator init --preset standard
   ```

3. **Enhance Existing Priority Files**
   ```bash
   pnpm llms-generator priority enhance --directory ./docs
   ```

4. **Test Enhanced Selection**
   ```bash
   pnpm llms-generator generate --strategy balanced --evaluate-quality
   ```

### Configuration Migration

The system automatically enhances basic configurations:

```typescript
// Basic config is automatically enhanced
const basicConfig = {
  paths: { /* basic paths */ },
  generation: { /* basic generation */ }
};

// System adds enhanced features:
const enhancedConfig = {
  ...basicConfig,
  categories: { /* default categories */ },
  tags: { /* default tags */ },
  dependencies: { /* default rules */ },
  composition: { /* default strategies */ }
};
```

This enhanced system provides intelligent, context-aware document selection that truly understands what "appropriate" means for your documentation needs.