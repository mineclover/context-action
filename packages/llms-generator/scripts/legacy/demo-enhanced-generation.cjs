#!/usr/bin/env node

/**
 * Demo script to showcase the Enhanced LLMS Generator
 * Generates files with character limit suffixes like -100, -200 as originally planned
 */

const fs = require('fs');
const path = require('path');

// Create a simple demo configuration
const demoConfig = {
  paths: {
    docs: path.join(__dirname, 'demo-docs'),
    output: path.join(__dirname, 'demo-output'),
    priority: path.join(__dirname, 'demo-docs', 'priority.json')
  },
  generation: {
    defaultCharacterLimits: [100, 200, 500, 1000, 2000],
    qualityThreshold: 75,
    defaultStrategy: 'balanced'
  },
  categories: {
    guide: {
      name: 'Guides',
      description: 'Step-by-step guides',
      priority: 90,
      defaultStrategy: 'tutorial-first',
      tags: ['beginner', 'tutorial', 'practical']
    },
    api: {
      name: 'API Reference',
      description: 'API documentation',
      priority: 85,
      defaultStrategy: 'reference-first',
      tags: ['reference', 'api', 'technical']
    }
  },
  tags: {
    beginner: {
      name: 'Beginner',
      description: 'Beginner-friendly content',
      weight: 1.2,
      compatibleWith: ['tutorial', 'practical'],
      audience: ['new-users']
    },
    advanced: {
      name: 'Advanced',
      description: 'Advanced content',
      weight: 0.9,
      compatibleWith: ['technical', 'patterns'],
      audience: ['experts']
    }
  }
};

// Create demo documents
const demoDocuments = [
  {
    path: 'getting-started.md',
    content: `# Getting Started

This is a comprehensive guide for beginners to get started with the Context-Action framework.

## Installation

\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

## Basic Setup

Here's how to set up your first context-action application with proper action handling and store management.

### Creating Your First Action

Actions are the core of the Context-Action framework. They represent user intentions and business logic.

### Setting Up Stores

Stores hold your application state and react to actions automatically.

## Next Steps

Continue with the advanced patterns guide to learn more sophisticated techniques.
`,
    metadata: {
      category: 'guide',
      tags: ['beginner', 'tutorial', 'setup'],
      priority: 95
    }
  },
  {
    path: 'api/actions.md',
    content: `# Action API Reference

Complete reference for the Action API in Context-Action framework.

## useActionDispatch

The \`useActionDispatch\` hook provides access to the action dispatch function.

\`\`\`typescript
const dispatch = useActionDispatch<MyActions>();
dispatch('updateUser', { id: '123', name: 'John' });
\`\`\`

## useActionHandler

Register action handlers using the \`useActionHandler\` hook.

\`\`\`typescript
useActionHandler('updateUser', async (payload, controller) => {
  // Handle the user update action
  try {
    await userService.updateUser(payload);
  } catch (error) {
    controller.abort('Update failed', error);
  }
});
\`\`\`

## ActionController

The controller provides utilities for action handling including abort, retry, and delay methods.

## Type Safety

All actions must extend ActionPayloadMap for proper TypeScript integration.
`,
    metadata: {
      category: 'api',
      tags: ['reference', 'api', 'actions'],
      priority: 85
    }
  },
  {
    path: 'advanced/patterns.md',
    content: `# Advanced Usage Patterns

Advanced patterns and optimization techniques for experienced developers.

## Performance Optimization

### Memoization Strategies

Use React.memo and useMemo for expensive calculations to improve rendering performance.

### Custom Middleware

Create custom middleware for complex workflows and cross-cutting concerns.

### Async Action Patterns

Handle complex asynchronous operations with proper error handling and loading states.

## Architecture Patterns

### Domain-Driven Design

Organize your actions and stores around business domains for better maintainability.

### Event Sourcing

Implement event sourcing patterns using action history and replay capabilities.

## Testing Strategies

Learn how to effectively test your Context-Action applications with mocking and integration tests.
`,
    metadata: {
      category: 'guide',
      tags: ['advanced', 'performance', 'patterns'],
      priority: 75
    }
  }
];

async function createDemoEnvironment() {
  console.log('📁 Creating demo environment...');
  
  // Create directories
  const dirs = [
    path.join(__dirname, 'demo-docs'),
    path.join(__dirname, 'demo-docs', 'api'),
    path.join(__dirname, 'demo-docs', 'advanced'),
    path.join(__dirname, 'demo-output')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create demo documents
  for (const doc of demoDocuments) {
    const fullPath = path.join(__dirname, 'demo-docs', doc.path);
    fs.writeFileSync(fullPath, doc.content);
  }
  
  // Create configuration file
  fs.writeFileSync(
    path.join(__dirname, 'demo-config.json'),
    JSON.stringify(demoConfig, null, 2)
  );
  
  console.log('✅ Demo environment created');
}

async function generateEnhancedSummaries() {
  console.log('🚀 Generating Enhanced LLMS summaries with character limit suffixes...');
  
  const characterLimits = [100, 200, 500, 1000, 2000];
  const outputDir = path.join(__dirname, 'demo-output');
  
  // Simulate the Enhanced LLMS Generator functionality
  for (const limit of characterLimits) {
    const filename = `summary-${limit}.md`;
    const filepath = path.join(outputDir, filename);
    
    let content = `# Documentation Summary (${limit} characters)\n\n`;
    content += `Generated with Enhanced LLMS Generator\n`;
    content += `Character limit: ${limit}\n`;
    content += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    // Add appropriate amount of content based on limit
    if (limit >= 200) {
      content += `## Getting Started\n\nQuick introduction to Context-Action framework with installation and basic setup.\n\n`;
    }
    if (limit >= 500) {
      content += `## API Reference\n\nComplete action API with useActionDispatch and useActionHandler hooks.\n\n`;
    }
    if (limit >= 1000) {
      content += `## Advanced Patterns\n\nPerformance optimization, custom middleware, and architectural patterns for experienced developers.\n\n`;
    }
    if (limit >= 2000) {
      content += `## Detailed Examples\n\nComprehensive examples showing real-world usage patterns, testing strategies, and best practices for production applications.\n\n`;
    }
    
    // Ensure we don't exceed the character limit (roughly)
    if (content.length > limit) {
      content = content.substring(0, limit - 20) + '...\n';
    }
    
    fs.writeFileSync(filepath, content);
    console.log(`✅ Generated ${filename} (${content.length} chars, limit: ${limit})`);
  }
  
  // Also generate the enhanced version names
  const versionNames = ['short', 'medium', 'long', 'comprehensive', 'detailed'];
  for (let i = 0; i < characterLimits.length; i++) {
    const limit = characterLimits[i];
    const versionName = versionNames[i];
    const filename = `summary-${versionName}-${limit}.md`;
    const filepath = path.join(outputDir, filename);
    
    // Same content but with version name in the header
    let content = `# Documentation Summary - ${versionName.charAt(0).toUpperCase() + versionName.slice(1)} (${limit} characters)\n\n`;
    content += `Generated with Enhanced LLMS Generator\n`;
    content += `Version: ${versionName}\n`;
    content += `Character limit: ${limit}\n`;
    content += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    // Add content based on limit (same logic as above)
    if (limit >= 200) {
      content += `## Getting Started\n\nQuick introduction to Context-Action framework.\n\n`;
    }
    if (limit >= 500) {
      content += `## API Reference\n\nAction API documentation.\n\n`;
    }
    if (limit >= 1000) {
      content += `## Advanced Patterns\n\nOptimization and architectural patterns.\n\n`;
    }
    if (limit >= 2000) {
      content += `## Detailed Examples\n\nComprehensive usage examples.\n\n`;
    }
    
    if (content.length > limit) {
      content = content.substring(0, limit - 20) + '...\n';
    }
    
    fs.writeFileSync(filepath, content);
    console.log(`✅ Generated ${filename} (${content.length} chars, ${versionName} version)`);
  }
}

async function demonstrateFeatures() {
  console.log('🎯 Demonstrating Enhanced LLMS Generator features...\n');
  
  console.log('🔧 Configuration:');
  console.log(`  Character limits: ${demoConfig.generation.defaultCharacterLimits.join(', ')}`);
  console.log(`  Quality threshold: ${demoConfig.generation.qualityThreshold}%`);
  console.log(`  Default strategy: ${demoConfig.generation.defaultStrategy}`);
  console.log(`  Categories: ${Object.keys(demoConfig.categories).join(', ')}`);
  console.log(`  Tags: ${Object.keys(demoConfig.tags).join(', ')}\n`);
  
  console.log('📄 Demo documents:');
  demoDocuments.forEach(doc => {
    console.log(`  - ${doc.path} (${doc.metadata.category}, tags: ${doc.metadata.tags.join(', ')})`);
  });
  console.log();
  
  await generateEnhancedSummaries();
  
  console.log('\n📊 Generated files:');
  const outputDir = path.join(__dirname, 'demo-output');
  const files = fs.readdirSync(outputDir);
  files.sort().forEach(file => {
    const filepath = path.join(outputDir, file);
    const stats = fs.statSync(filepath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  });
  
  console.log('\n🎉 Demo completed! Check the demo-output directory for generated files.');
  console.log('\n💡 This demonstrates the original planning scenario where files like:');
  console.log('     summary-100.md, summary-200.md, summary-500.md, etc. are generated');
  console.log('     as well as named versions like summary-short-100.md, summary-medium-200.md');
}

async function main() {
  try {
    await createDemoEnvironment();
    await demonstrateFeatures();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up demo files...');
  
  const pathsToClean = [
    path.join(__dirname, 'demo-docs'),
    path.join(__dirname, 'demo-output'),
    path.join(__dirname, 'demo-config.json')
  ];
  
  pathsToClean.forEach(p => {
    if (fs.existsSync(p)) {
      if (fs.statSync(p).isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
      } else {
        fs.unlinkSync(p);
      }
      console.log(`  🗑️  Removed ${p}`);
    }
  });
  
  console.log('✅ Cleanup completed');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted by user');
  cleanup();
  process.exit(0);
});

// Add cleanup argument
if (process.argv.includes('--cleanup')) {
  cleanup();
} else {
  main();
}