# @context-action/llms-generator

[![npm version](https://badge.fury.io/js/@context-action/llms-generator.svg)](https://badge.fury.io/js/@context-action/llms-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LLMsTXT format document generator for Context-Action framework with priority-based intelligent summarization.

## Features

- 🎯 **Priority-based generation** - Uses `priority-schema.json` metadata for intelligent document processing
- 📝 **Multiple output formats** - minimum (navigation links), origin (full documents), character-limited summaries
- 🌐 **Multi-language support** - Generate content for different languages (en, ko)
- ⚡ **TypeScript-first** - Full type safety with comprehensive TypeScript definitions
- 🔧 **CLI & Programmatic API** - Use as CLI tool or integrate into your build process
- 📊 **Intelligent summarization** - Strategy-based content extraction (concept-first, api-first, etc.)

## Installation

```bash
npm install @context-action/llms-generator
# or
pnpm add @context-action/llms-generator
```

## Quick Start

### CLI Usage

```bash
# Generate minimum format (navigation links)
npx llms-generator minimum --lang en

# Generate origin format (complete documents)  
npx llms-generator origin --lang ko

# Generate character-limited summary
npx llms-generator chars 1000 --lang en

# Batch generation
npx llms-generator batch --languages en,ko --formats minimum,origin --chars 300,1000

# Show status
npx llms-generator status
```

### Programmatic Usage

```typescript
import { LLMSGenerator } from '@context-action/llms-generator';

const generator = new LLMSGenerator({
  paths: {
    docsDir: './docs',
    llmContentDir: './docs/llm-content',
    outputDir: './docs/llms'
  },
  generation: {
    supportedLanguages: ['en', 'ko'],
    characterLimits: [100, 300, 500, 1000, 2000, 3000, 4000],
    defaultLanguage: 'en',
    outputFormat: 'txt'
  }
});

// Generate specific format
const minimumContent = await generator.generateMinimum('en');
const originContent = await generator.generateOrigin('ko');
const summary = await generator.generateCharacterLimited(1000, 'en');

// Batch generation
const results = await generator.generate({
  languages: ['en', 'ko'],
  formats: ['minimum', 'origin', 'chars'],
  characterLimits: [300, 1000, 2000]
});
```

## Priority-based Intelligence

This generator uses `priority.json` files to intelligently process documents:

```json
{
  "document": {
    "id": "guide-concepts",
    "title": "Core Concepts",
    "source_path": "guide/concepts.md",
    "category": "guide"
  },
  "priority": {
    "score": 95,
    "tier": "critical",
    "rationale": "Essential for understanding the framework"
  },
  "extraction": {
    "strategy": "concept-first",
    "character_limits": {
      "300": {
        "focus": "Core concept definition",
        "must_include": ["action", "store", "context"],
        "avoid": ["implementation details"]
      }
    }
  }
}
```

### Extraction Strategies

- **concept-first**: Prioritize conceptual explanations
- **api-first**: Focus on API documentation and usage
- **example-first**: Emphasize code examples and practical usage
- **tutorial-first**: Step-by-step instructional content
- **reference-first**: Comprehensive reference material

## Output Formats

### Minimum Format
Navigation-focused format with document links organized by priority tiers:

```markdown
# Context-Action Framework - Document Navigation

## Critical Documents (3)
- [Core Concepts](https://example.com/concepts) - Priority: 95
- [Getting Started](https://example.com/getting-started) - Priority: 90

## Essential Documents (5)
- [Pattern Guide](https://example.com/patterns) - Priority: 85
```

### Origin Format
Complete original documents with YAML frontmatter removed, organized by priority:

```markdown
# Context-Action Framework - Complete Documentation

# Core Concepts

**Source**: `guide/concepts.md`
**Priority**: 95 (critical)

[Full original content here...]

---

# Getting Started

**Source**: `guide/getting-started.md` 
**Priority**: 90 (critical)

[Full original content here...]
```

### Character-Limited Format
Intelligently summarized content based on priority metadata and extraction guidelines:

```markdown
# Context-Action Framework - 1000 Character Summary

Context-Action is a revolutionary state management system with document-centric context separation...
[Intelligently summarized based on priority.json guidelines]
```

## Configuration

### LLMSConfig

```typescript
interface LLMSConfig {
  paths: {
    docsDir: string;           // Source documentation directory
    llmContentDir: string;     // Priority metadata directory
    outputDir: string;         // Output directory for generated files
  };
  
  generation: {
    supportedLanguages: string[];  // ['en', 'ko']
    characterLimits: number[];     // [100, 300, 500, 1000, ...]
    defaultLanguage: string;       // 'en'
    outputFormat: 'txt' | 'md';    // Output file format
  };
  
  quality: {
    minCompletenessThreshold: number;  // 0.8
    enableValidation: boolean;         // true
    strictMode: boolean;               // false
  };
}
```

## Integration with Existing Scripts

This package is designed to replace and enhance existing script-based workflows:

| Old Script | New Command |
|------------|-------------|
| `docs:llms:minimum` | `llms-generator minimum` |
| `docs:llms:origin` | `llms-generator origin` |
| `docs:llms:chars 1000` | `llms-generator chars 1000` |
| `docs:llms:status` | Built into batch results |

## Development

```bash
# Clone the repository
git clone https://github.com/mineclover/context-action.git
cd context-action/packages/llms-generator

# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode development
pnpm dev
```

### Package Structure

```
packages/llms-generator/
├── src/
│   ├── core/              # Core processing classes
│   │   ├── LLMSGenerator.ts
│   │   ├── PriorityManager.ts
│   │   └── DocumentProcessor.ts
│   ├── types/             # TypeScript definitions
│   │   ├── priority.ts
│   │   ├── document.ts
│   │   └── config.ts
│   ├── utils/             # Utility functions
│   ├── cli/               # CLI implementation
│   └── index.ts           # Main exports
├── __tests__/             # Test files
├── examples/              # Usage examples
└── README.md
```

## Server Synchronization (Planned)

Future versions will support server synchronization:

- **Priority data sync** - Sync priority.json files with remote server
- **Document content sync** - Real-time document updates
- **Generated content CDN** - Cache and distribute generated summaries
- **Real-time updates** - WebSocket-based live updates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `pnpm test`
5. Build the package: `pnpm build`
6. Submit a pull request

## License

MIT © [mineclover](https://github.com/mineclover)

## Related

- [@context-action/core](../core) - Core action pipeline management
- [@context-action/react](../react) - React integration with hooks and components
- [Context-Action Framework Documentation](https://mineclover.github.io/context-action)