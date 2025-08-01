# @context-action/glossary

Glossary mapping system for Context-Action framework using standard JSDoc annotations.

## Overview

This package provides tools to:
- Parse standard JSDoc comments to extract glossary mappings
- Scan source code to find implementations of glossary terms
- Validate mappings against glossary definitions
- Generate documentation showing where terms are implemented

## Installation

```bash
npm install @context-action/glossary
# or
pnpm add @context-action/glossary
```

## Usage

### Basic Example

```typescript
import { createGlossaryAPI } from '@context-action/glossary';

// Create API instance
const glossary = createGlossaryAPI({
  rootDir: process.cwd(),
  debug: true
});

// Scan source files
const mappings = await glossary.scan();

// Validate against glossary
const validation = await glossary.validate(mappings);

// Or do both at once
const { mappings, validation } = await glossary.scanAndValidate();
```

### JSDoc Annotations

Mark your code with standard JSDoc tags:

```typescript
/**
 * Action execution guard hook
 * 
 * @implements {ActionHandler}
 * @memberof CoreConcepts
 * @example
 * const guard = useActionGuard({ mode: 'debounce' });
 * @since 1.0.0
 */
export function useActionGuard() {
  // implementation
}
```

### Supported Tags

- `@implements {TermName}` - Indicates this code implements a glossary term
- `@memberof CategoryName` - Specifies the glossary category
- `@example` - Provides usage examples (automatically extracted)
- `@since` - Version information

### Configuration Options

```typescript
interface GlossaryParserOptions {
  // Paths to scan for source files
  scanPaths: string[];
  
  // Paths to exclude from scanning
  excludePaths: string[];
  
  // Glossary file paths by category
  glossaryPaths: Record<string, string>;
  
  // Root directory for resolving paths
  rootDir: string;
  
  // Whether to include examples in output
  includeExamples?: boolean;
  
  // Whether to parse function signatures
  parseSignatures?: boolean;
  
  // Enable debug logging
  debug?: boolean;
}
```

### Output Format

The scanner produces mappings in this format:

```typescript
interface GlossaryMappings {
  // Mappings by term slug
  terms: Record<string, CodeImplementation[]>;
  
  // Terms by category
  categories: Record<string, string[]>;
  
  // Files and their mapped terms
  files: Record<string, {
    terms: string[];
    lastScanned: string;
  }>;
  
  // Overall statistics
  statistics: {
    totalTerms: number;
    mappedTerms: number;
    unmappedTerms: number;
    totalFiles: number;
    taggedFiles: number;
    lastUpdate: string;
  };
}
```

## CLI Usage

The package can also be used via command-line tools. See the `/docs/tools` directory for CLI wrappers.

## Integration with CI/CD

Use the validation report to fail builds when glossary mappings have errors:

```javascript
const { validation } = await glossary.scanAndValidate();

if (!validation.success) {
  console.error('Glossary validation failed!');
  process.exit(1);
}
```

## License

Apache-2.0