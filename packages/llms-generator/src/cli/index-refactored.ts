#!/usr/bin/env node

/**
 * Refactored CLI Entry Point for LLMS Generator
 * 
 * Clean, modular architecture with:
 * - Dependency injection
 * - Clear separation of concerns
 * - Easy testing and maintenance
 * - Type safety throughout
 */

import { CLIApplication } from './core/CLIApplication.js';

async function main(): Promise<void> {
  const app = new CLIApplication();
  const args = process.argv.slice(2);
  
  await app.run(args);
}

// Run CLI only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };