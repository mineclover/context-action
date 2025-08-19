# Contributing Guide

Thank you for your interest in contributing to TypeDoc VitePress Sync! This guide will help you get started with development.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- pnpm (recommended) or yarn
- Git
- TypeScript knowledge
- Familiarity with TypeDoc and VitePress

### Initial Setup

1. **Fork and clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/context-action.git
cd context-action/packages/typedoc-vitepress-sync
```

2. **Install dependencies:**
```bash
# From monorepo root
pnpm install

# Or from package directory
cd packages/typedoc-vitepress-sync
pnpm install
```

3. **Build the package:**
```bash
pnpm build
```

4. **Run tests:**
```bash
pnpm test
```

5. **Set up pre-commit hooks:**
```bash
# From monorepo root
pnpm prepare
```

### Development Environment

Recommended VS Code extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- GitLens

VS Code settings:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Project Structure

```
typedoc-vitepress-sync/
├── src/
│   ├── core/                 # Core functionality
│   │   ├── CacheManager.ts   # Caching system
│   │   ├── ErrorHandler.ts   # Error handling
│   │   ├── FileProcessor.ts  # File processing
│   │   ├── MetricsCollector.ts # Metrics collection
│   │   └── QualityValidator.ts # Quality validation
│   ├── processors/           # Processing modules
│   │   ├── MarkdownProcessor.ts # Markdown processing
│   │   └── SidebarGenerator.ts  # Sidebar generation
│   ├── types/               # TypeScript types
│   │   └── index.ts        # Type definitions
│   ├── utils/              # Utilities
│   │   └── ConsoleLogger.ts # Logging utility
│   └── index.ts           # Main entry point
├── bin/
│   └── cli.js            # CLI entry point
├── __tests__/            # Test files
├── examples/             # Example usage
├── docs/                 # Documentation
└── package.json         # Package configuration
```

### Key Components

#### Core Module Responsibilities

**CacheManager**: 
- SHA256 hash computation
- Cache manifest management
- TTL-based expiration
- File change detection

**FileProcessor**:
- Parallel processing orchestration
- Batch management
- Worker thread coordination
- Progress tracking

**QualityValidator**:
- Markdown syntax validation
- Link integrity checking
- Accessibility compliance
- Custom rule support

**MetricsCollector**:
- Performance metrics
- Quality statistics
- Resource usage tracking
- Report generation

**ErrorHandler**:
- Error categorization
- Recovery strategies
- Logging coordination
- User-friendly messages

---

## Development Workflow

### Creating a New Feature

1. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement the feature:**
```typescript
// src/core/NewFeature.ts
export class NewFeature {
  constructor(private config: FeatureConfig) {}
  
  async execute(): Promise<Result> {
    // Implementation
  }
}
```

3. **Add tests:**
```typescript
// __tests__/NewFeature.test.ts
describe('NewFeature', () => {
  it('should execute successfully', async () => {
    const feature = new NewFeature(config)
    const result = await feature.execute()
    expect(result).toBeDefined()
  })
})
```

4. **Update documentation:**
- Add to API reference
- Update README if needed
- Add usage examples

5. **Test your changes:**
```bash
# Run tests
pnpm test

# Test with example
pnpm example:basic

# Build and check
pnpm build
pnpm type-check
```

### Working with the Monorepo

This package is part of the Context-Action monorepo:

```bash
# From monorepo root
pnpm build              # Build all packages
pnpm test              # Test all packages
pnpm lint              # Lint all packages

# Package-specific commands
pnpm --filter @context-action/typedoc-vitepress-sync build
pnpm --filter @context-action/typedoc-vitepress-sync test
```

### Local Testing

Test your changes locally before submitting:

1. **Link the package:**
```bash
# In package directory
pnpm link

# In test project
pnpm link @context-action/typedoc-vitepress-sync
```

2. **Create test project:**
```bash
mkdir test-project
cd test-project
npm init -y
npm install typedoc vitepress
```

3. **Test the CLI:**
```bash
npx typedoc-vitepress-sync init
npx typedoc-vitepress-sync sync --verbose
```

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test CacheManager

# Run with debugging
node --inspect-brk node_modules/.bin/jest
```

### Writing Tests

Follow these patterns for tests:

```typescript
// __tests__/feature.test.ts
import { Feature } from '../src/core/Feature'

describe('Feature', () => {
  let feature: Feature
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }
    feature = new Feature(config, mockLogger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('method', () => {
    it('should handle normal case', async () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = await feature.method(input)
      
      // Assert
      expect(result).toBeDefined()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('processed')
      )
    })

    it('should handle error case', async () => {
      // Test error handling
      await expect(feature.method(null)).rejects.toThrow()
    })
  })
})
```

### Test Coverage Requirements

- Minimum 80% code coverage
- Critical paths must have 100% coverage
- All public APIs must be tested
- Error cases must be covered

---

## Code Style

### TypeScript Guidelines

```typescript
// Use explicit types for public APIs
export interface Config {
  sourceDir: string
  targetDir: string
  options?: Options
}

// Use type guards
function isValidConfig(config: unknown): config is Config {
  return typeof config === 'object' && 
         config !== null &&
         'sourceDir' in config
}

// Prefer async/await over promises
// Good
async function process(): Promise<void> {
  const data = await readFile('path')
  await writeFile('output', data)
}

// Avoid
function process(): Promise<void> {
  return readFile('path')
    .then(data => writeFile('output', data))
}

// Use const assertions for literals
const DEFAULTS = {
  cacheDir: '.cache',
  ttl: 86400000
} as const
```

### Error Handling

```typescript
// Create descriptive error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly issues: Issue[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Provide context in errors
throw new ValidationError(
  `Validation failed for ${filePath}`,
  filePath,
  issues
)

// Handle errors gracefully
try {
  await processor.process(file)
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn(`Validation issues in ${error.filePath}`)
    // Continue processing other files
  } else {
    logger.error('Unexpected error', error)
    throw error // Re-throw unexpected errors
  }
}
```

### Documentation

```typescript
/**
 * Processes TypeDoc output and converts to VitePress format
 * 
 * @param config - Sync configuration
 * @param logger - Optional logger instance
 * @returns Promise resolving to sync result
 * 
 * @example
 * ```typescript
 * const sync = new TypeDocVitePressSync({
 *   sourceDir: './api',
 *   targetDir: './docs'
 * })
 * const result = await sync.sync()
 * ```
 */
export class TypeDocVitePressSync {
  // Implementation
}
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch:**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run all checks:**
```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

3. **Update documentation:**
- Update README if needed
- Add/update API docs
- Include examples

4. **Write clear commit messages:**
```bash
# Good
git commit -m "feat: add parallel processing for large projects"
git commit -m "fix: resolve cache invalidation issue"
git commit -m "docs: update troubleshooting guide"

# Bad
git commit -m "fix stuff"
git commit -m "updates"
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Coverage maintained/improved

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks must pass
2. Code review by maintainer
3. Address feedback
4. Squash commits if requested
5. Merge when approved

---

## Release Process

### Version Management

We follow semantic versioning (semver):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Steps

1. **Update version:**
```bash
# From monorepo root
pnpm version:patch  # or minor/major
```

2. **Update CHANGELOG:**
```markdown
## [0.2.4] - 2024-01-15

### Added
- Parallel processing support

### Fixed
- Cache invalidation issue

### Changed
- Improved error messages
```

3. **Create release PR:**
```bash
git checkout -b release/v0.2.4
git commit -m "chore: release v0.2.4"
git push origin release/v0.2.4
```

4. **After merge, tag release:**
```bash
git tag v0.2.4
git push origin v0.2.4
```

5. **Publish to npm:**
```bash
pnpm release
```

### Beta Releases

For testing new features:
```bash
pnpm version prepatch --preid=beta
# Results in: 0.2.4-beta.0

pnpm publish --tag beta
```

---

## Getting Help

### Resources

- [Project README](../README.md)
- [API Documentation](./api-reference.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Communication

- **Issues**: [GitHub Issues](https://github.com/mineclover/context-action/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mineclover/context-action/discussions)
- **Email**: Contact maintainers

### Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](https://www.contributor-covenant.org/). By participating in this project you agree to abide by its terms.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

Thank you for contributing to TypeDoc VitePress Sync! 🎉