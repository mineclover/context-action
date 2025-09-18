#!/usr/bin/env node

/**
 * Code Cleaner - Phase 2 Implementation
 *
 * Advanced code cleaning and formatting for documentation examples.
 * Transforms test code into clean, production-ready examples.
 */

/**
 * Advanced code cleaner for test examples
 */
export class CodeCleaner {
  constructor(options = {}) {
    this.options = {
      removeComments: true,
      removeTestArtifacts: true,
      formatCode: true,
      addTypeAnnotations: true,
      realistic: true,
      ...options
    };
  }

  /**
   * Clean and format code example
   */
  cleanCode(code, context = {}) {
    let cleaned = code;

    // Step 1: Remove test-specific artifacts
    if (this.options.removeTestArtifacts) {
      cleaned = this.removeTestArtifacts(cleaned);
    }

    // Step 2: Replace mocks with realistic implementations
    if (this.options.realistic) {
      cleaned = this.makeRealistic(cleaned);
    }

    // Step 3: Format and structure
    if (this.options.formatCode) {
      cleaned = this.formatCode(cleaned);
    }

    // Step 4: Add helpful comments
    cleaned = this.addHelpfulComments(cleaned, context);

    return cleaned;
  }

  /**
   * Remove test-specific artifacts
   */
  removeTestArtifacts(code) {
    let cleaned = code;

    // Remove expect statements
    cleaned = cleaned.replace(
      /expect\([^)]*\)(?:\.[^;]+)?;?\s*/g,
      ''
    );

    // Remove test framework imports and utilities
    cleaned = cleaned.replace(
      /import.*(?:jest|@testing-library|vitest).*;\s*/g,
      ''
    );

    // Remove describe/it blocks but keep content
    cleaned = cleaned.replace(
      /(?:describe|it|test)\s*\([^{]*{\s*/g,
      ''
    );

    // Remove debugging statements
    cleaned = cleaned.replace(
      /(console\.log|console\.debug|debugger)[^;]*;?\s*/g,
      ''
    );

    // Remove test-specific variables
    cleaned = cleaned.replace(
      /const\s+(?:spy|mock|stub)\w*\s*=\s*[^;]+;\s*/g,
      ''
    );

    return cleaned;
  }

  /**
   * Replace mocks with realistic implementations
   */
  makeRealistic(code) {
    let realistic = code;

    // Replace jest.fn() with actual function implementations
    realistic = realistic.replace(
      /jest\.fn\(\)/g,
      'async (payload) => {\n  // Your handler implementation here\n  console.log("Action triggered:", payload);\n}'
    );

    // Replace jest.fn with implementation
    realistic = realistic.replace(
      /jest\.fn\(\s*([^)]+)\s*\)/g,
      '$1'
    );

    // Replace mock values with realistic ones
    realistic = realistic.replace(
      /'test-\w+'/g,
      "'user-action'"
    );

    realistic = realistic.replace(
      /'TestComponent'/g,
      "'MyComponent'"
    );

    // Replace test data with realistic data
    realistic = realistic.replace(
      /testAction/g,
      'updateUser'
    );

    realistic = realistic.replace(
      /TestActions/g,
      'UserActions'
    );

    return realistic;
  }

  /**
   * Format code for better readability
   */
  formatCode(code) {
    let formatted = code;

    // Remove excessive empty lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Fix indentation
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = 2;

    const formattedLines = lines.map(line => {
      const trimmed = line.trim();

      if (trimmed === '') return '';

      // Decrease indent for closing braces
      if (trimmed.match(/^[}\]]/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = ' '.repeat(indentLevel * indentSize) + trimmed;

      // Increase indent for opening braces
      if (trimmed.match(/[{\[]$/)) {
        indentLevel++;
      }

      return formattedLine;
    });

    formatted = formattedLines.join('\n');

    // Remove trailing whitespace
    formatted = formatted.replace(/[ \t]+$/gm, '');

    return formatted;
  }

  /**
   * Add helpful comments to code
   */
  addHelpfulComments(code, context) {
    let commented = code;

    // Add section comments based on code patterns
    if (code.includes('ActionRegister')) {
      commented = commented.replace(
        /(new ActionRegister[^;]+;)/,
        '// Create action register instance\n$1'
      );
    }

    if (code.includes('register(')) {
      commented = commented.replace(
        /(\.register\([^}]+}\);)/,
        '// Register action handler\n$1'
      );
    }

    if (code.includes('dispatch(')) {
      commented = commented.replace(
        /(\.dispatch\([^)]+\))/,
        '// Dispatch action\n$1'
      );
    }

    if (code.includes('useStoreValue')) {
      commented = commented.replace(
        /(const\s+\w+\s*=\s*useStoreValue[^;]+;)/,
        '// Subscribe to store value\n$1'
      );
    }

    return commented;
  }

  /**
   * Create complete example from test parts
   */
  createCompleteExample(testData) {
    const { interfaces, imports, setup, examples } = testData;

    let completeExample = '';

    // Add imports (filtered)
    const relevantImports = imports.filter(imp =>
      !imp.isTestUtility && imp.isLocal
    );

    if (relevantImports.length > 0) {
      completeExample += '// Imports\n';
      relevantImports.forEach(imp => {
        completeExample += `${imp.statement}\n`;
      });
      completeExample += '\n';
    }

    // Add interfaces
    if (interfaces.length > 0) {
      completeExample += '// Type definitions\n';
      interfaces.forEach(interface_ => {
        completeExample += `${interface_.fullDefinition}\n\n`;
      });
    }

    // Add setup code
    if (setup.length > 0) {
      completeExample += '// Setup\n';
      setup.forEach(s => {
        if (s.type === 'beforeEach') {
          completeExample += `// Initialize before use\n${s.code}\n\n`;
        }
      });
    }

    // Add main example
    if (examples.length > 0) {
      const mainExample = examples[0]; // Use first example
      completeExample += '// Usage example\n';
      completeExample += this.cleanCode(mainExample.cleanedCode);
    }

    return completeExample;
  }

  /**
   * Generate multiple format variations
   */
  generateVariations(code, context) {
    return {
      minimal: this.createMinimalExample(code),
      complete: this.createCompleteExample(context),
      interactive: this.createInteractiveExample(code),
      copyPaste: this.createCopyPasteExample(code)
    };
  }

  /**
   * Create minimal example - just the essential code
   */
  createMinimalExample(code) {
    let minimal = this.cleanCode(code);

    // Remove all comments
    minimal = minimal.replace(/\/\/.*$/gm, '');
    minimal = minimal.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove empty lines
    minimal = minimal.replace(/^\s*$/gm, '');

    // Keep only essential lines
    const lines = minimal.split('\n').filter(line => line.trim());
    return lines.join('\n');
  }

  /**
   * Create interactive example with placeholders
   */
  createInteractiveExample(code) {
    let interactive = this.cleanCode(code);

    // Add interactive placeholders
    interactive = interactive.replace(
      /'[^']*'/g,
      "'{{ your_value_here }}'"
    );

    interactive = interactive.replace(
      /\d+/g,
      '{{ number }}'
    );

    return interactive;
  }

  /**
   * Create copy-paste ready example
   */
  createCopyPasteExample(code) {
    let copyPaste = this.cleanCode(code, { realistic: true });

    // Add helpful variable names
    copyPaste = copyPaste.replace(/actionRegister/g, 'myActionRegister');
    copyPaste = copyPaste.replace(/store/g, 'myStore');

    // Add execution comment
    copyPaste = `// Copy and paste this into your component\n${copyPaste}`;

    return copyPaste;
  }
}

export default CodeCleaner;