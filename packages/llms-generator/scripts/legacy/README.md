# Legacy Scripts

This directory contains legacy CommonJS scripts that were previously in the project root.

## Scripts Overview

### Demo & Testing
- **`demo-enhanced-generation.cjs`** - Enhanced generation demo script
- **`test-category-minimum-cli.cjs`** - CLI testing for category minimum generation
- **`test-real-llms.cjs`** - Real LLMs testing script
- **`test-real-llms-fixed.cjs`** - Fixed version of real LLMs testing
- **`test-scenario.cjs`** - Test scenario runner
- **`save-test-results.cjs`** - Test results saving utility

### Generation & Processing
- **`generate-individual-files.cjs`** - Individual file generation script
- **`sync-all.cjs`** - Synchronization script for all files
- **`fix-source-paths.cjs`** - Source path fixing utility

## Usage

These scripts are legacy CommonJS files that may be used for:
- Development testing
- File generation workflows
- Legacy compatibility

## Migration Notes

These scripts should be gradually migrated to:
- TypeScript equivalents in `src/cli/`
- NPM scripts in `package.json`
- Modern ES modules when possible

Most functionality should be accessible through the main CLI tool:
```bash
npm run cli -- [command]
```