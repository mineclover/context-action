# @context-action/test-driven-docs

A powerful test-driven documentation generator that extracts examples from test code to create comprehensive, always-up-to-date API documentation.

## Features

🚀 **Test-Driven**: Extracts real examples from your test code
📚 **Always Current**: Documentation stays synchronized with implementation
🎯 **Smart Categorization**: Automatically categorizes examples by usage patterns
🧹 **Clean Examples**: Transforms test artifacts into production-ready code
🌍 **Multi-Language**: Supports multiple documentation languages
⚡ **Fast**: Optimized parsing and generation pipeline
🔧 **Configurable**: Extensive customization options

## Installation

```bash
npm install @context-action/test-driven-docs
# or
yarn add @context-action/test-driven-docs
# or
pnpm add @context-action/test-driven-docs
```

## Quick Start

### CLI Usage

1. **Initialize configuration:**
```bash
npx test-driven-docs init
```

2. **Generate documentation:**
```bash
npx test-driven-docs generate
```

### Programmatic Usage

```typescript
import { createDocumentationGenerator } from '@context-action/test-driven-docs';

const generator = createDocumentationGenerator({
  packagesDir: './packages',
  packages: ['core', 'react'],
  outputDir: './docs',
  languages: ['en', 'ko']
});

const result = await generator.generate();
console.log(`Generated docs for ${result.apisGenerated.length} APIs`);
```

## Configuration

### CLI Options

```bash
test-driven-docs generate [options]

Options:
  -p, --packages-dir <dir>    Directory containing packages (default: "./packages")
  -o, --output-dir <dir>      Output directory for documentation (default: "./docs")
  -l, --languages <langs>     Comma-separated list of languages (default: "en")
  --packages <packages>       Comma-separated list of package names to process
  --clean-mocks              Clean mock implementations from examples (default: true)
  --realistic                Generate realistic examples (default: true)
  --extract-types            Extract TypeScript interfaces (default: true)
  --categorize               Categorize examples by usage pattern (default: true)
  --config <file>            Path to configuration file
```

### Configuration File

Create a `test-driven-docs.config.js` file:

```javascript
export default {
  // Input configuration
  packagesDir: './packages',
  packages: ['core', 'react'],
  testPatterns: ['**/*.test.ts', '**/*.spec.ts'],

  // Output configuration
  outputDir: './docs',
  languages: ['en', 'ko'],

  // Processing options
  cleanMocks: true,
  extractTypes: true,
  categorizeExamples: true,
  includeComments: false,
  realistic: true,

  // Template configuration
  template: {
    type: 'enhanced',
    includeSections: {
      overview: true,
      quickStart: true,
      examples: true,
      advanced: true,
      errorHandling: true,
      performance: true,
      testCoverage: true,
      relatedAPIs: true
    }
  }
};
```

## How It Works

### 1. Test Parsing
The library scans your test files and extracts meaningful examples:

```typescript
// From this test...
it('should register and dispatch action', async () => {
  const actionRegister = new ActionRegister();
  actionRegister.register('updateUser', async (payload) => {
    console.log('User updated:', payload);
  });

  await actionRegister.dispatch('updateUser', { id: 1, name: 'John' });
  expect(mockHandler).toHaveBeenCalled();
});

// Generates this documentation...
```

### 2. Code Cleaning
Test artifacts are automatically cleaned and transformed:

- ✅ Removes `expect()` statements
- ✅ Replaces `jest.fn()` with realistic implementations
- ✅ Cleans up debugging code
- ✅ Formats for readability

### 3. Smart Categorization
Examples are automatically categorized:

- **Basic Usage**: Simple, everyday patterns
- **Advanced Patterns**: Complex scenarios
- **Error Handling**: Error recovery patterns
- **Performance**: Optimization examples
- **Integration**: Multi-system patterns
- **Async Patterns**: Promise and async/await usage

## Example Categories

The generator automatically categorizes your examples based on patterns in test descriptions and code complexity:

### Basic Usage
```typescript
// From: "should create ActionRegister instance"
const actionRegister = new ActionRegister();
```

### Advanced Patterns
```typescript
// From: "should handle complex async operations with multiple handlers"
const register = new ActionRegister({
  executionMode: 'parallel',
  maxConcurrency: 5
});
```

### Error Handling
```typescript
// From: "should handle registration errors gracefully"
try {
  await actionRegister.dispatch('invalidAction');
} catch (error) {
  console.error('Action failed:', error);
}
```

## API Reference

### `createDocumentationGenerator(config)`

Creates a new documentation generator instance.

**Parameters:**
- `config`: Partial configuration object

**Returns:**
- `DocumentationGenerator` instance

### `generateDocs(options)`

Quick start function for simple use cases.

**Parameters:**
- `options.packagesDir`: Directory containing packages
- `options.packages`: Array of package names
- `options.outputDir`: Output directory
- `options.languages`: Array of language codes

**Returns:**
- `Promise<GenerationResult>`

### Configuration Types

```typescript
interface GeneratorConfig {
  packagesDir: string;
  packages: string[];
  testPatterns: string[];
  outputDir: string;
  languages: string[];
  cleanMocks: boolean;
  extractTypes: boolean;
  categorizeExamples: boolean;
  includeComments: boolean;
  realistic: boolean;
  template: TemplateConfig;
}
```

## Integration Examples

### With GitHub Actions

```yaml
name: Generate Docs
on: [push]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx test-driven-docs generate
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### With npm scripts

```json
{
  "scripts": {
    "docs:generate": "test-driven-docs generate",
    "docs:dev": "test-driven-docs generate && vitepress dev docs",
    "docs:build": "test-driven-docs generate && vitepress build docs"
  }
}
```

### Programmatic Integration

```typescript
import { createDocumentationGenerator } from '@context-action/test-driven-docs';

// Custom processing pipeline
async function customDocGeneration() {
  const generator = createDocumentationGenerator({
    packagesDir: './src',
    packages: ['api', 'utils'],
    outputDir: './generated-docs'
  });

  const result = await generator.generate();

  if (!result.success) {
    console.error('Documentation generation failed:', result.errors);
    process.exit(1);
  }

  // Post-process generated documentation
  await postProcessDocs(result);
}
```

## Advanced Usage

### Custom Templates

You can create custom documentation templates:

```typescript
import { DocumentationGenerator } from '@context-action/test-driven-docs';

class CustomGenerator extends DocumentationGenerator {
  protected generateApiDocumentation(apiName, apiData, language) {
    // Your custom template logic
    return customTemplate(apiName, apiData, language);
  }
}
```

### Multi-Language Support

Configure multiple languages with translations:

```javascript
export default {
  languages: ['en', 'ko', 'ja'],
  translations: {
    ko: {
      'Overview': '개요',
      'Usage Examples': '사용 예제',
      'Advanced Patterns': '고급 패턴'
    }
  }
};
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © Context-Action Team

## Related

- [@context-action/core](../core) - Core action pipeline system
- [@context-action/react](../react) - React integration hooks and components