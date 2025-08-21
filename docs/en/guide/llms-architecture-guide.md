# LLMS Generator - Architecture & Implementation Guide

## System Architecture

The LLMS Generator is a TypeScript library for processing documentation and generating optimized content for LLM consumption. This guide provides comprehensive architecture details and implementation patterns.

## Core Components

### 1. Document Processing Pipeline

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

### 2. Clean Architecture Implementation

The system follows Clean Architecture principles:

- **Entities**: CoreTypes (Document, WorkItem, Priority metadata)
- **Use Cases**: Commands (WorkNextCommand, LLMSGenerateCommand, PriorityTasksCommand)
- **Interface Adapters**: CLI Adapters
- **Frameworks & Drivers**: CLI entry point, File system

### 3. Directory Structure

```
src/
├── cli/
│   ├── index.ts                         # Main entry point (optimized to ~200 lines)
│   ├── commands/
│   │   ├── WorkNextCommand.ts           # Work queue management
│   │   ├── LLMSGenerateCommand.ts        # LLMS generation
│   │   ├── GenerateTemplatesCommand.ts   # Template generation
│   │   ├── SyncDocsCommand.ts           # Document synchronization
│   │   ├── InitCommand.ts               # Project initialization
│   │   ├── PriorityManagerCommand.ts    # Priority management
│   │   └── PriorityTasksCommand.ts      # Priority file management
│   ├── core/
│   │   ├── HelpDisplay.ts               # Help system
│   │   └── ErrorHandler.ts              # Error handling
│   └── utils/
│       └── ArgumentParser.ts            # CLI argument parsing
├── core/
│   └── EnhancedConfigManager.ts         # Configuration management
├── types/
│   └── config.ts                        # TypeScript definitions
└── shared/
    └── config/
        └── DefaultConfig.ts              # Default configuration
```

## Design Patterns Applied

### 1. Factory Pattern
- **CommandFactory**: Creates command instances based on user input
- Enables easy addition of new commands without modifying core logic

### 2. Adapter Pattern
- Adapts existing command implementations to new interfaces
- Maintains backward compatibility while improving architecture

### 3. Strategy Pattern
- **Document Selection Strategies**: Balanced, Greedy, Hybrid, Quality-focused, Diverse
- Allows runtime algorithm selection based on requirements

### 4. Dependency Injection
- Commands receive configuration through constructor injection
- Improves testability and reduces coupling

## Configuration System

### Enhanced Configuration Management

```typescript
// Configuration Layers
1. Default Configuration    // Base settings
2. User Configuration      // Project-specific overrides  
3. Enhanced Configuration  // Advanced features

// Configuration File: llms-generator.config.json
{
  "paths": {
    "docsDir": "./docs",
    "llmContentDir": "./llmsData",
    "outputDir": "./output"
  },
  "generation": {
    "supportedLanguages": ["en", "ko"],
    "characterLimits": [100, 200, 300, 500, 1000, 2000, 5000],
    "defaultLanguage": "en"
  },
  "categories": {
    "guide": { "priority": 90, "description": "User guides" },
    "concept": { "priority": 85, "description": "Concepts" },
    "api": { "priority": 80, "description": "API docs" }
  }
}
```

## Priority Management System

### Priority Task Types

1. **🔴 missing**: Priority.json files are missing
2. **❌ invalid**: JSON syntax errors or missing required fields
3. **🟡 outdated**: Source documents modified after priority.json
4. **🟠 needs_review**: Priority scores don't align with standards
5. **🔵 needs_update**: Metadata is incomplete

### Priority Calculation Algorithm

```typescript
// Default Priority Weights
{
  "documentSize": { "weight": 0.4, "method": "linear" },
  "category": { "weight": 0.3, "values": {...} },
  "keywordDensity": { "weight": 0.2, "method": "logarithmic" },
  "relationships": { "weight": 0.1, "method": "network" }
}
```

## Performance Optimizations

### Code Optimization Results
- **CLI Entry Point**: 2000 lines → 200 lines (90% reduction)
- **Commands**: 30+ files → 13 core commands (56% reduction)
- **Modular Architecture**: Single responsibility per module
- **Type Safety**: 95% coverage with TypeScript

### Processing Efficiency
- **Change Detection**: Only process modified files
- **Batch Operations**: Group related operations
- **Intelligent Caching**: Reuse analysis results
- **Parallel Processing**: Multiple file processing where possible

## Quality Assurance

### SOLID Principles
- **S**: Each class has single responsibility
- **O**: Open for extension, closed for modification
- **L**: Interface substitution guaranteed
- **I**: Interface segregation prevents unnecessary dependencies
- **D**: Depend on abstractions, not concretions

### Testing Strategy
- **Unit Tests**: Core functionality testing
- **Integration Tests**: Command interaction testing
- **Dry-Run Support**: Preview changes before applying
- **Validation**: Pre-operation validation checks

## Migration & Compatibility

### From Legacy CLI
- All core functionality retained
- Commands remain backward compatible
- Configuration format unchanged
- Output format consistent

### Breaking Changes
- None - full backward compatibility maintained

## Best Practices

### Command Implementation
```typescript
// Example: New command implementation
export class MyCommand {
  constructor(private config: CLIConfig) {}
  
  async execute(options: MyOptions): Promise<void> {
    // 1. Validate options
    this.validateOptions(options);
    
    // 2. Process with error handling
    try {
      await this.process(options);
    } catch (error) {
      this.handleError(error);
    }
    
    // 3. Report results
    this.reportResults();
  }
}
```

### Error Handling
```typescript
// Centralized error handling
export class ErrorHandler {
  handle(error: unknown): void {
    if (error instanceof ValidationError) {
      // Handle validation errors
    } else if (error instanceof FileSystemError) {
      // Handle file system errors
    } else {
      // Generic error handling
    }
  }
}
```

## Integration Patterns

### Git Hook Integration
```bash
#!/bin/sh
# .git/hooks/post-commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep "docs/.*\.md$")
if [ ! -z "$CHANGED_FILES" ]; then
    pnpm llms:sync-docs --changed-files "$CHANGED_FILES" --quiet
fi
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: LLMS Generator
  run: |
    pnpm build:llms-generator
    pnpm llms:priority-health
    pnpm llms:sync-docs --changed-files "${{ steps.files.outputs.all }}"
```

## Future Roadmap

### Short Term
- ✅ Core command implementation (Completed)
- ✅ Priority system with health scoring (Completed)
- ✅ Multi-language support (Completed)
- ✅ Auto-fix capabilities (Completed)

### Medium Term
- 🔄 Web dashboard for priority management
- 🔄 Advanced analytics and reporting
- 🔄 Plugin architecture for extensibility

### Long Term
- 🔄 Multi-project management
- 🔄 Machine learning-based priority suggestions
- 🔄 Real-time collaboration features

---

## Related Documentation

- [CLI Reference](./llms-cli-reference.md) - Command usage guide
- [Comprehensive Reference](./llms-cli-comprehensive-reference.md) - Complete implementation details
- [Features Summary](./llms-cli-features-summary.md) - Implementation status overview