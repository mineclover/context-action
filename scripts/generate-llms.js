#!/usr/bin/env node

/**
 * LLMs.txt Generator
 * 
 * Generates the complete LLM integration guide by combining:
 * - Framework overview and conventions
 * - API specifications 
 * - Best practices and patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs/en');
const OUTPUT_FILE = path.join(DOCS_DIR, 'llms/llms.txt');

// Source files to combine (full.md 내용이 concept 파일들로 분산됨)
const SOURCE_FILES = [
  // Core concepts (full.md 내용을 대체)
  { file: 'concept/conventions.md', section: 'Framework Conventions and Best Practices' },
  { file: 'concept/pattern-guide.md', section: 'Pattern Implementation Guide' },
  { file: 'concept/architecture-guide.md', section: 'MVVM Architecture Guide' },
  { file: 'concept/action-pipeline-guide.md', section: 'Action Pipeline System Guide' },
  { file: 'concept/hooks-reference.md', section: 'Hooks Reference Documentation' },
  
  // API specifications 
  { file: 'api/store-only.md', section: 'Store Only Pattern API' },
  { file: 'api/action-only.md', section: 'Action Only Pattern API' },
  { file: 'api/store-manager.md', section: 'Store Manager API' },
  { file: 'api/action-registry.md', section: 'Action Registry API' },
  { file: 'api/pipeline-controller.md', section: 'Pipeline Controller API' },
  { file: 'api/declarative-store-pattern.md', section: 'Declarative Store Pattern API' },
  
  // Example references
  { file: 'examples/basic-setup.md', section: 'Basic Setup Example', includeCodeOnly: true },
];

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}`);
    return null;
  }
}

function extractCodeBlocks(content) {
  // Extract only TypeScript/JavaScript code blocks and key patterns
  const codeBlockRegex = /```(?:typescript|tsx|javascript|jsx)\n([\s\S]*?)\n```/g;
  const codeBlocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push(match[1]);
  }
  
  return codeBlocks.join('\n\n---\n\n');
}

function cleanMarkdown(content) {
  if (!content) return '';
  
  // Remove VitePress-specific syntax
  content = content.replace(/:::\s*\w+[\s\S]*?:::/g, '');
  
  // Remove excessive whitespace
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Remove navigation links at the end
  content = content.replace(/## Related[\s\S]*$/, '');
  
  return content.trim();
}

function generateHeader() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
  );
  
  return `# Context-Action Framework - Complete LLM Integration Guide v${packageJson.version}

Generated from documentation sources on ${new Date().toISOString().split('T')[0]}

## Framework Overview

Context-Action is a revolutionary TypeScript state management framework that solves fundamental limitations through document-centric context separation and MVVM architecture.

### Core Philosophy
- **Document-Centric Context Separation**: Each context represents specific document domains (design, architecture, business, validation)
- **Perfect Separation of Concerns**: Isolated view design, development architecture, business logic, data validation
- **MVVM Architecture**: Clear separation between View (components), ViewModel (actions), Model (stores)
- **Type Safety First**: Full TypeScript support with strict type checking

### Problems Solved
- **High React Coupling**: Existing libraries create tight integration making component modularization difficult
- **Binary State Approach**: Simple global/local dichotomy fails to handle scope-based separation
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic

### Package Structure
- \`@context-action/core\` - Core action pipeline management (no React dependency)
- \`@context-action/react\` - React integration with Context API and hooks

### Installation
\`\`\`bash
npm install @context-action/core @context-action/react
# or
pnpm add @context-action/core @context-action/react
# or
yarn add @context-action/core @context-action/react
\`\`\`

### Requirements
- TypeScript 4.5+
- React 16.8+ (for React package)
- ES2018+ browser support

### Bundle Sizes
- Core package: ~15KB minified
- React package: ~25KB minified
- Combined: ~35KB total (tree-shakeable)

---

`;
}

function generateFooter() {
  return `

---

## Development Commands

### Essential Commands
\`\`\`bash
# Setup
pnpm install                # Install dependencies
pnpm build                  # Build all packages

# Development
pnpm dev                    # Example app dev server
pnpm test                   # Run tests
pnpm lint                   # ESLint check
pnpm type-check             # TypeScript compilation

# Package-specific
pnpm build:core             # Build core package
pnpm build:react            # Build React package
pnpm test:core              # Test core package

# Documentation
pnpm docs:dev               # VitePress dev server
pnpm docs:build             # Build documentation
pnpm docs:api               # Generate API docs
\`\`\`

### Version Management
\`\`\`bash
pnpm version:patch          # Patch version bump
pnpm version:minor          # Minor version bump
pnpm version:major          # Major version bump
pnpm release                # Publish changed packages
\`\`\`

## Quick Implementation Checklist

### For Action Only Pattern:
- [ ] Define action interface extending \`ActionPayloadMap\`
- [ ] Use \`createActionContext<T>()\` with domain-specific renaming
- [ ] Register handlers with \`useCallback\` and proper options
- [ ] Implement error handling with \`controller.abort()\` or result sharing
- [ ] Use appropriate priorities for execution order

### For Store Only Pattern:
- [ ] Design store configuration with type inference
- [ ] Use \`createDeclarativeStorePattern()\` with domain-specific renaming
- [ ] Subscribe reactively with \`useStoreValue()\`
- [ ] Use store methods (\`setValue\`, \`update\`) appropriately
- [ ] Implement validation for complex store types

### For Pattern Composition:
- [ ] Separate concerns: actions for logic, stores for state
- [ ] Use proper provider hierarchy
- [ ] Implement Store Integration 3-Step Process in handlers
- [ ] Consider using HOC pattern for cleaner provider wrapping

---

This guide provides comprehensive information for LLMs to understand and effectively work with the Context-Action framework, covering all essential patterns, APIs, conventions, and best practices.

Generated automatically from documentation sources. Do not edit directly.
`;
}

function generateLLMsGuide() {
  console.log('🚀 Generating LLMs integration guide...');
  
  let content = generateHeader();
  
  for (const { file, section, includeCodeOnly } of SOURCE_FILES) {
    const filePath = path.join(DOCS_DIR, file);
    const fileContent = readFileIfExists(filePath);
    
    if (fileContent) {
      console.log(`📄 Processing ${file}...`);
      
      content += `# ${section}\n\n`;
      
      if (includeCodeOnly) {
        // For examples, only include code blocks
        const codeBlocks = extractCodeBlocks(fileContent);
        if (codeBlocks) {
          content += codeBlocks + '\n\n';
        }
      } else {
        // Include full content but clean it
        const cleanedContent = cleanMarkdown(fileContent);
        content += cleanedContent + '\n\n';
      }
      
      content += '---\n\n';
    } else {
      console.warn(`⚠️  Skipping ${file} (file not found)`);
    }
  }
  
  content += generateFooter();
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the combined file
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  
  console.log(`✅ Generated ${OUTPUT_FILE}`);
  console.log(`📊 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)}KB`);
}

// Run the generator
generateLLMsGuide();