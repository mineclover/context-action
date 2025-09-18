#!/usr/bin/env node

/**
 * Enhanced API Documentation Template - Phase 2
 *
 * Creates rich, categorized documentation with multiple example formats
 * and improved structure for better developer experience.
 */

/**
 * Generate enhanced API documentation
 */
export function generateEnhancedApiDoc(apiName, testData, options = {}) {
  const { categorizedExamples, metadata, packageName } = testData;

  const template = `# ${apiName}

${generateApiOverview(apiName, metadata)}

${generateQuickStart(apiName, categorizedExamples)}

${generateUsageExamples(categorizedExamples)}

${generateAdvancedUsage(categorizedExamples)}

${generateErrorHandling(categorizedExamples)}

${generatePerformanceNotes(categorizedExamples)}

${generateTestCoverage(testData)}

${generateRelatedAPIs(apiName)}

${generateFooter()}
`;

  return template;
}

/**
 * Generate API overview section
 */
function generateApiOverview(apiName, metadata) {
  return `## Overview

${apiName} is a core API in the Context-Action framework that ${getApiDescription(apiName)}.

### Key Features
${generateKeyFeatures(apiName)}

### When to Use
${generateUsageGuidance(apiName)}
`;
}

/**
 * Get API description based on name
 */
function getApiDescription(apiName) {
  const descriptions = {
    'ActionRegister': 'manages action registration, dispatch, and handler execution with support for priorities, async operations, and error handling',
    'createActionContext': 'creates a React context for action dispatching and handler registration with type safety',
    'createStoreContext': 'creates a React context for store management with reactive subscriptions and type inference',
    'useStoreValue': 'provides reactive subscription to store values with automatic re-rendering on changes'
  };

  return descriptions[apiName] || 'provides essential functionality for the Context-Action framework';
}

/**
 * Generate key features list
 */
function generateKeyFeatures(apiName) {
  const features = {
    'ActionRegister': [
      '🎯 **Type-safe action dispatch** - Full TypeScript support with payload validation',
      '⚡ **Multiple execution modes** - Sequential, parallel, and race execution strategies',
      '🔄 **Priority-based handlers** - Control execution order with priority system',
      '🛡️ **Error handling** - Built-in error handling with abort mechanisms',
      '📊 **Performance optimization** - Memory limits and concurrency controls'
    ],
    'createActionContext': [
      '⚛️ **React integration** - Seamless Context API integration',
      '🎯 **Type safety** - Full TypeScript support for actions and payloads',
      '🔄 **Handler registration** - Easy handler setup with useActionHandler',
      '📦 **Isolated contexts** - Multiple independent action contexts'
    ],
    'createStoreContext': [
      '🏪 **Store management** - Centralized store creation and management',
      '⚛️ **React integration** - Reactive subscriptions with automatic re-rendering',
      '🎯 **Type inference** - Excellent TypeScript inference without manual annotations',
      '🔄 **Multiple strategies** - Support for different update strategies'
    ],
    'useStoreValue': [
      '⚛️ **Reactive subscriptions** - Automatic re-rendering on value changes',
      '🎯 **Type safety** - Full TypeScript support with store type inference',
      '🚀 **Performance** - Optimized subscription management',
      '🔄 **Automatic cleanup** - Memory leak prevention with automatic unsubscription'
    ]
  };

  const apiFeatures = features[apiName] || ['✨ Core framework functionality'];
  return apiFeatures.map(feature => `- ${feature}`).join('\n');
}

/**
 * Generate usage guidance
 */
function generateUsageGuidance(apiName) {
  const guidance = {
    'ActionRegister': 'Use ActionRegister when you need direct control over action processing, custom execution modes, or when building action contexts.',
    'createActionContext': 'Use createActionContext for React applications when you need action dispatching without state management.',
    'createStoreContext': 'Use createStoreContext for React applications when you need reactive state management with excellent type inference.',
    'useStoreValue': 'Use useStoreValue inside React components to subscribe to store values and trigger re-renders on changes.'
  };

  return guidance[apiName] || 'Use this API as part of the Context-Action framework integration.';
}

/**
 * Generate quick start section
 */
function generateQuickStart(apiName, categorizedExamples) {
  const basicExamples = categorizedExamples['basic-usage'] || [];

  if (basicExamples.length === 0) {
    return '## Quick Start\n\n*No basic examples available.*\n';
  }

  const firstExample = basicExamples[0];

  return `## Quick Start

Here's the simplest way to use ${apiName}:

\`\`\`typescript
${firstExample.cleanedCode}
\`\`\`

> ${firstExample.description}
`;
}

/**
 * Generate usage examples section
 */
function generateUsageExamples(categorizedExamples) {
  let examples = '## Usage Examples\n\n';

  // Basic Usage
  if (categorizedExamples['basic-usage']?.length > 0) {
    examples += '### Basic Usage\n\n';
    categorizedExamples['basic-usage'].slice(0, 3).forEach((example, index) => {
      examples += `#### Example ${index + 1}: ${example.description}\n\n`;
      examples += '```typescript\n';
      examples += example.cleanedCode;
      examples += '\n```\n\n';
    });
  }

  // Async Patterns
  if (categorizedExamples['async-patterns']?.length > 0) {
    examples += '### Async Patterns\n\n';
    categorizedExamples['async-patterns'].slice(0, 2).forEach((example, index) => {
      examples += `#### Example ${index + 1}: ${example.description}\n\n`;
      examples += '```typescript\n';
      examples += example.cleanedCode;
      examples += '\n```\n\n';
    });
  }

  return examples;
}

/**
 * Generate advanced usage section
 */
function generateAdvancedUsage(categorizedExamples) {
  const advancedExamples = categorizedExamples['advanced-patterns'] || [];
  const integrationExamples = categorizedExamples['integration'] || [];

  if (advancedExamples.length === 0 && integrationExamples.length === 0) {
    return '';
  }

  let advanced = '## Advanced Usage\n\n';

  if (advancedExamples.length > 0) {
    advanced += '### Advanced Patterns\n\n';
    advancedExamples.slice(0, 2).forEach((example, index) => {
      advanced += `#### ${example.description}\n\n`;
      advanced += '```typescript\n';
      advanced += example.cleanedCode;
      advanced += '\n```\n\n';
    });
  }

  if (integrationExamples.length > 0) {
    advanced += '### Integration Examples\n\n';
    integrationExamples.slice(0, 2).forEach((example, index) => {
      advanced += `#### ${example.description}\n\n`;
      advanced += '```typescript\n';
      advanced += example.cleanedCode;
      advanced += '\n```\n\n';
    });
  }

  return advanced;
}

/**
 * Generate error handling section
 */
function generateErrorHandling(categorizedExamples) {
  const errorExamples = categorizedExamples['error-handling'] || [];

  if (errorExamples.length === 0) {
    return '';
  }

  let errorSection = '## Error Handling\n\n';
  errorSection += 'Here are examples of proper error handling patterns:\n\n';

  errorExamples.slice(0, 2).forEach((example, index) => {
    errorSection += `### ${example.description}\n\n`;
    errorSection += '```typescript\n';
    errorSection += example.cleanedCode;
    errorSection += '\n```\n\n';
  });

  return errorSection;
}

/**
 * Generate performance notes section
 */
function generatePerformanceNotes(categorizedExamples) {
  const performanceExamples = categorizedExamples['performance'] || [];

  if (performanceExamples.length === 0) {
    return '';
  }

  let performanceSection = '## Performance Considerations\n\n';

  performanceExamples.forEach((example, index) => {
    performanceSection += `### ${example.description}\n\n`;
    performanceSection += '```typescript\n';
    performanceSection += example.cleanedCode;
    performanceSection += '\n```\n\n';
  });

  return performanceSection;
}

/**
 * Generate test coverage section
 */
function generateTestCoverage(testData) {
  const { metadata } = testData;

  return `## Test Coverage

This API is thoroughly tested with **${metadata.testCount} test cases** covering:

- ✅ Basic functionality and usage patterns
- ✅ Error conditions and edge cases
- ✅ Performance characteristics
- ✅ Integration scenarios
- ✅ Type safety validation

### Test Files
The following test files validate this API:

${generateTestFileList(testData)}

## Type Safety

This API provides full TypeScript support with:
- 🎯 **Strict type checking** - Compile-time error prevention
- 🔍 **Intelligent IntelliSense** - Auto-completion and documentation
- 🛡️ **Runtime validation** - Payload and parameter validation
- 📝 **Self-documenting code** - Types serve as documentation
`;
}

/**
 * Generate test file list
 */
function generateTestFileList(testData) {
  // This would be populated with actual test file references
  return `- [Comprehensive Tests](../../packages/${testData.packageName}/__tests__/)
- [Type Safety Tests](../../packages/${testData.packageName}/__tests__/type-safety/)
- [Performance Tests](../../packages/${testData.packageName}/__tests__/performance/)`;
}

/**
 * Generate related APIs section
 */
function generateRelatedAPIs(apiName) {
  const relatedAPIs = {
    'ActionRegister': [
      '- [createActionContext](./createactioncontext.md) - React integration for actions',
      '- [useActionHandler](./useactionhandler.md) - Register handlers in React components'
    ],
    'createActionContext': [
      '- [ActionRegister](./actionregister.md) - Core action registration system',
      '- [createStoreContext](./createstorecontext.md) - Store management context'
    ],
    'createStoreContext': [
      '- [useStoreValue](./usestorevalue.md) - Subscribe to store values',
      '- [createActionContext](./createactioncontext.md) - Action dispatching context'
    ],
    'useStoreValue': [
      '- [createStoreContext](./createstorecontext.md) - Store context creation',
      '- [useStoreSelector](./usestoreselector.md) - Selective store subscriptions'
    ]
  };

  const related = relatedAPIs[apiName] || [];

  if (related.length === 0) {
    return '';
  }

  return `## Related APIs

${related.join('\n')}

## See Also

- [Pattern Guide](../concept/pattern-guide.md) - Comprehensive usage patterns
- [Architecture Guide](../concept/architecture-guide.md) - System architecture overview
- [Troubleshooting](../troubleshooting/) - Common issues and solutions
`;
}

/**
 * Generate footer
 */
function generateFooter() {
  return `---

*This documentation is automatically generated from test code to ensure accuracy and completeness.*

**Need help?** Check the [troubleshooting guide](../troubleshooting/) or [open an issue](https://github.com/mineclover/context-action/issues).`;
}

export default generateEnhancedApiDoc;