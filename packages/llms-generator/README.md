# @context-action/llms-generator

**Document processing and LLM content generation for Context-Action framework**

TypeScript library and CLI tools for generating optimized content from documentation with intelligent categorization and priority-based selection.

[![npm version](https://badge.fury.io/js/@context-action%2Fllms-generator.svg)](https://www.npmjs.com/package/@context-action/llms-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Installation

```bash
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator
```

### Basic Usage

```typescript
import { CategoryMinimumGenerator } from '@context-action/llms-generator';

const generator = new CategoryMinimumGenerator({
  dataDir: './data',
  outputDir: './output'
});

// Generate API documentation summary
const result = await generator.generateSingle('api-spec', 'en');
console.log(`Generated: ${result.filePath} (${result.documentCount} docs)`);

// Batch generation for multiple categories and languages
const results = await generator.generateBatch({
  categories: ['api-spec', 'guide'],
  languages: ['en', 'ko']
});
```

### CLI Usage

```bash
# Generate category-based minimal LLMS files
npx llms-generator category api-spec en
npx llms-generator category guide ko

# Get category information
npx llms-generator categories
npx llms-generator stats api-spec en
```

## 🎯 Key Features

### Category-Based Generation
- **API Documentation**: Extract API references and technical specifications
- **Guide Content**: Generate user guides and tutorials
- **Priority-Based Selection**: Automatically prioritize documents by importance

### Multi-Language Support
- Korean (ko), English (en), Japanese (ja), Chinese (zh)
- Automatic URL generation and folder mapping
- Language-specific document organization

### TypeScript Library Interface
- Type-safe API with full TypeScript support
- Comprehensive error handling and validation
- Statistics and analytics for generated content

## 📁 Project Structure

```
packages/llms-generator/
├── src/
│   ├── core/
│   │   ├── CategoryMinimumGenerator.ts  # Main category generator
│   │   ├── AdaptiveDocumentSelector.ts   # Smart document selection
│   │   ├── ConfigManager.ts              # Configuration management
│   │   └── ...
│   ├── cli/                              # Command-line interface
│   └── types/                            # TypeScript definitions
├── data/                                 # Source documentation
│   ├── en/                              # English content
│   └── ko/                              # Korean content
└── test/                                # Test suites
```

## ⚙️ Configuration

Create `llms-generator.config.json`:

```json
{
  "characterLimits": [100, 300, 1000, 2000],
  "languages": ["ko", "en"],
  "paths": {
    "docsDir": "./docs",
    "dataDir": "./data",
    "outputDir": "./output"
  }
}
```

## 📚 API Reference

### CategoryMinimumGenerator

```typescript
class CategoryMinimumGenerator {
  constructor(options?: CategoryMinimumOptions)
  
  // Generate single category/language combination
  generateSingle(category: string, language: string): Promise<GenerationResult>
  
  // Batch generate multiple combinations
  generateBatch(options?: CategoryMinimumOptions): Promise<GenerationResult[]>
  
  // Get available categories and statistics
  getAvailableCategories(): string[]
  getCategoryStats(category: string, language: string): CategoryStats
  getAvailableDocuments(language: string): DocumentInfo[]
}
```

### Document Selection

```typescript
import { AdaptiveDocumentSelector } from '@context-action/llms-generator';

const selector = new AdaptiveDocumentSelector(config);

const result = await selector.selectDocuments(documents, constraints, {
  strategy: 'balanced', // 'greedy', 'hybrid', 'adaptive'
  maxIterations: 100,
  enableOptimization: true
});
```

## 🛠️ CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `category <category> <lang>` | Generate category-specific content | `npx llms-generator category api-spec en` |
| `categories` | List available categories | `npx llms-generator categories` |
| `stats <category> <lang>` | Show category statistics | `npx llms-generator stats guide ko` |
| `config-init <preset>` | Initialize configuration | `npx llms-generator config-init standard` |

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check

# Development mode
pnpm dev
```

## 📈 Document Categories

### API Documentation (`api-spec`)
- Technical API references
- Interface definitions
- Function signatures and parameters
- Code examples and usage patterns

### User Guides (`guide`)
- Getting started tutorials
- Step-by-step instructions
- Best practices and patterns
- Conceptual explanations

## 🚨 Important Notes

- **Data Directory**: Contains source documentation with `priority.json` metadata
- **Output Files**: Generated `.txt` files with category-specific content
- **TypeScript Support**: Full type safety and IntelliSense support
- **Performance**: Optimized for large documentation sets (100+ files)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

For advanced usage and API documentation, see [API_REFERENCE.md](./API_REFERENCE.md).