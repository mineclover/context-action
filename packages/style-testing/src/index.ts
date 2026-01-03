/**
 * @context-action/style-testing
 *
 * Automated style testing tool for verifying CSS application
 */

export { BrowserRunner } from './runtime/browser-runner.js';
export { StyleExtractor } from './runtime/style-extractor.js';
export { DiffEngine, type ComparisonResult, type StyleDifference } from './comparison/diff-engine.js';
export { Reporter } from './comparison/reporter.js';
export { resolveTailwindClasses } from './analyzers/class-resolver.js';

// Re-export Babel plugin
export { default as styleTestPlugin } from './analyzers/babel-plugin.js';
