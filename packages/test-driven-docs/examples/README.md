# Examples

This directory contains practical examples of using `@context-action/test-driven-docs`.

## Available Examples

### 1. Basic Usage (`basic-usage.js`)
Demonstrates the simplest way to generate documentation from tests.

```bash
node examples/basic-usage.js
```

**Features:**
- Simple documentation generation
- Basic configuration
- Result reporting

### 2. Enhanced Generation (`enhanced-generation.js`)
Shows how to use the enhanced documentation features with annotations.

```bash
node examples/enhanced-generation.js
```

**Features:**
- Annotation-based extraction (`@doc-extract`)
- Enhanced markdown generation
- GitHub repository integration
- Priority-based ordering

### 3. Validation (`validation.js`)
Demonstrates documentation validation and consistency checking.

```bash
node examples/validation.js
```

**Features:**
- Test-documentation consistency validation
- Issue detection and reporting
- Recommendation generation
- Combined generation + validation

## Running Examples

To run these examples in your own project:

1. Install the package:
```bash
npm install @context-action/test-driven-docs
```

2. Copy an example file to your project root

3. Modify the configuration to match your project structure

4. Run the example:
```bash
node basic-usage.js
```

## Configuration Tips

### For TypeScript Projects
Ensure your tests are compiled or use `tsx` to run TypeScript directly:

```bash
npx tsx examples/basic-usage.js
```

### For Custom Package Structures
Modify the `packagesDir` and `packages` configuration:

```javascript
const generator = createDocumentationGenerator({
  packagesDir: './src',           // Your source directory
  packages: ['api', 'utils'],     // Your package/module names
  outputDir: './generated-docs'   // Where to output docs
});
```

### For Monorepo Projects
Point to your monorepo packages directory:

```javascript
const generator = createDocumentationGenerator({
  packagesDir: './packages',
  packages: ['core', 'ui', 'utils'],
  outputDir: './docs'
});
```