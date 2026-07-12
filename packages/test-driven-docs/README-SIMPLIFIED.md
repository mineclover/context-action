# @context-action/test-driven-docs

A **stable, repeatable, and versatile** test metadata extraction library that outputs structured JSON data from test files. Focuses on reliable syntax analysis without complex processing for maximum versatility.

## Overview

This simplified library extracts structured metadata from TypeScript/JavaScript test files and outputs JSON data. It's designed to be:

- **Stable**: Reliable regex-based parsing that works consistently
- **Repeatable**: Same input always produces same output
- **Versatile**: JSON output can be used by any tool or system
- **Simple**: Focused on data extraction, not document generation

## Repository-internal setup

This package is `private: true` and is not published to the npm registry. From the Context-Action repository root, install and build its standalone package before using it:

```bash
npm --prefix packages/test-driven-docs ci
npm --prefix packages/test-driven-docs run build
```

For a sibling repository package, link it with `"@context-action/test-driven-docs": "file:../test-driven-docs"` rather than requesting a registry version. The package-name imports below assume that local link (or package self-reference).

## Usage

### Programmatic API

```typescript
import { TestMetadataExtractor, extractFileMetadata, extractDirectoryMetadata } from '@context-action/test-driven-docs';

// Extract from single file
const fileMetadata = await extractFileMetadata('./my-test.test.ts');
console.log(fileMetadata);

// Extract from directory
const projectMetadata = await extractDirectoryMetadata('./tests/', /\.test\.(ts|js)$/);
console.log(projectMetadata);

// Using class directly
const extractor = new TestMetadataExtractor();
const metadata = await extractor.extractFromFile('./example.test.ts');
```

### CLI boundary

Metadata extraction in this simplified guide is exposed through the programmatic API above. The package's built CLI currently covers documentation generation and consistency validation:

```bash
# Generate documentation from repository tests
node packages/test-driven-docs/dist/cli/index.js generate

# Generate enhanced documentation with validation
node packages/test-driven-docs/dist/cli/index.js generate --enhanced --with-validation

# Validate documentation consistency
node packages/test-driven-docs/dist/cli/index.js validate --consistency
```

## Output Format

### Single File Metadata

```typescript
interface TestFileMetadata {
  filePath: string;           // Absolute path to the test file
  fileName: string;           // Base name of the file
  extractedAt: string;        // ISO timestamp of extraction

  imports: ImportInfo[];      // Import statements
  interfaces: TypeDefinition[]; // Type definitions
  testSuites: TestSuite[];    // describe() blocks
  testCases: TestCase[];      // it()/test() blocks
  apiUsage: ApiUsage[];       // Detected API usage patterns
  metrics: FileMetrics;       // Basic metrics
}
```

### Project Metadata

```typescript
interface ProjectTestMetadata {
  projectPath: string;        // Absolute path to project directory
  extractedAt: string;        // ISO timestamp of extraction
  totalFiles: number;         // Number of test files processed
  files: TestFileMetadata[];  // Array of individual file metadata
  summary: ProjectSummary;    // Aggregated statistics
}
```

## Real-World Example

Given this test file:

```typescript
// user.test.ts
import { createStore } from '../src/store';
import { render, screen } from '@testing-library/react';

describe('User Management', () => {
  it('should create user store', async () => {
    const store = createStore('user', { name: 'John' });
    expect(store.getValue()).toEqual({ name: 'John' });
  });
});
```

The extractor outputs:

```json
{
  "filePath": "/path/to/user.test.ts",
  "fileName": "user.test.ts",
  "extractedAt": "2024-01-15T10:30:00.000Z",
  "imports": [
    {
      "module": "../src/store",
      "isLocal": true,
      "isTestFramework": false,
      "statement": "import { createStore } from '../src/store'"
    },
    {
      "module": "@testing-library/react",
      "isLocal": false,
      "isTestFramework": true,
      "statement": "import { render, screen } from '@testing-library/react'"
    }
  ],
  "interfaces": [],
  "testSuites": [
    {
      "name": "User Management",
      "startIndex": 156
    }
  ],
  "testCases": [
    {
      "description": "should create user store",
      "startIndex": 189,
      "isAsync": true,
      "bodyLength": 142,
      "apiCalls": ["createStore"],
      "hasAssertions": true
    }
  ],
  "apiUsage": [
    {
      "apiName": "createStore",
      "occurrences": 1,
      "pattern": "createStore\\s*\\("
    }
  ],
  "metrics": {
    "totalLines": 12,
    "nonEmptyLines": 8,
    "testCount": 1,
    "suiteCount": 1,
    "importCount": 2,
    "typeDefinitionCount": 0
  }
}
```

## Extracted Data Types

### Import Information
- **Module path**: Local vs external imports
- **Test framework detection**: Jest, Vitest, Testing Library
- **Complete import statement**

### Test Structure
- **Test suites**: `describe()` blocks with names and positions
- **Test cases**: `it()`/`test()` blocks with descriptions and metadata
- **Async detection**: Whether tests are async functions
- **Assertion detection**: Whether tests contain expect/assert calls

### API Usage Detection
- **Context-Action APIs**: `createStore`, `useStoreValue`, etc.
- **Custom patterns**: Configurable regex patterns
- **Occurrence counting**: How many times each API is used

### Code Metrics
- **Line counts**: Total lines, non-empty lines
- **Test structure**: Number of suites and test cases
- **Import analysis**: Count and categorization of imports
- **Type definitions**: Interfaces and type aliases

## Configuration

### Common Test Patterns

```typescript
import { COMMON_TEST_PATTERNS } from '@context-action/test-driven-docs';

// Use predefined patterns
await extractDirectoryMetadata('./tests/', COMMON_TEST_PATTERNS.allTests);
await extractDirectoryMetadata('./tests/', COMMON_TEST_PATTERNS.typescript);
await extractDirectoryMetadata('./tests/', COMMON_TEST_PATTERNS.jest);
```

### API Detection Patterns

```typescript
import { CONTEXT_ACTION_API_PATTERNS } from '@context-action/test-driven-docs';

console.log(CONTEXT_ACTION_API_PATTERNS.core);    // ['ActionRegister', 'createStore', ...]
console.log(CONTEXT_ACTION_API_PATTERNS.react);   // ['createActionContext', 'useStoreValue', ...]
```

## JSON Schema & Validation

```typescript
import { MetadataValidator, MetadataJsonSchemas } from '@context-action/test-driven-docs';

// Runtime validation
const isValid = MetadataValidator.isValidTestFileMetadata(data);
const isValidProject = MetadataValidator.isValidProjectTestMetadata(data);

// Throw on invalid data
MetadataValidator.validateAndThrow(data);

// Type guards
if (isTestFileMetadata(data)) {
  // TypeScript knows this is TestFileMetadata
}

// JSON Schema for external tools
const schema = MetadataJsonSchemas.TestFileMetadata;
```

## Use Cases

### Documentation Generation
Use extracted metadata to generate API documentation from actual test usage patterns.

### Test Analysis
Analyze test coverage, complexity, and patterns across large codebases.

### Code Quality Metrics
Track test metrics, API usage, and testing patterns over time.

### Build Tool Integration
Integrate with build systems to generate reports or validate test structure.

### LLM Training Data
Clean, structured test data for training language models on code patterns.

## Performance

- **Fast extraction**: Regex-based parsing is significantly faster than AST parsing
- **Memory efficient**: Processes files one at a time
- **Scalable**: Handles large codebases with hundreds of test files
- **No dependencies**: Core functionality has minimal external dependencies

## Design Principles

1. **Stability over Features**: Simple, reliable parsing that works consistently
2. **Data over Documents**: Output structured data, let consumers generate documents
3. **Syntax Analysis**: Focus on reliable pattern matching rather than complex AST parsing
4. **JSON Output**: Machine-readable format that any tool can consume
5. **Zero Configuration**: Works out of the box with sensible defaults

## Comparison with Full Library

| Feature | Simplified Library | Full Library |
|---------|-------------------|--------------|
| **Metadata Extraction** | ✅ Complete | ✅ Complete |
| **JSON Output** | ✅ Primary focus | ⚠️ Secondary |
| **Document Generation** | ❌ Not included | ✅ Full featured |
| **Template System** | ❌ Not included | ✅ Advanced |
| **Code Cleaning** | ❌ Not included | ✅ Multiple formats |
| **Multi-language** | ❌ Not included | ✅ i18n support |
| **Complexity** | 🟢 Simple | 🟡 Complex |
| **Bundle Size** | 🟢 ~96KB | 🟡 ~300KB+ |
| **Dependencies** | 🟢 Minimal | 🟡 Many |

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.

---

**Built for the Context-Action Framework** - A stable, repeatable tool focused on data extraction rather than complex document generation.
