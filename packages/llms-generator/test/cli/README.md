# CLI Command Tests

Comprehensive test suite for all LLMS Generator CLI commands.

## Test Structure

### Core Commands
- **`InitCommand.test.ts`** - Tests for `llms init` command
  - Document discovery and priority generation
  - Template creation and file system operations
  - Configuration handling and validation

- **`WorkNextCommand.test.ts`** - Tests for `llms work-next` command
  - Priority-based work item analysis
  - Language and category filtering
  - Status detection and recommendations

### Priority Management Commands
- **`PriorityManagerCommand.test.ts`** - Tests for priority management modes
  - Statistics calculation (`priority-stats`)
  - Health checks (`priority-health`)  
  - Auto-calculation (`priority-auto`)
  - Format upgrade (`priority-upgrade`)
  - Suggestion generation (`priority-suggest`)

- **`PriorityTasksCommand.test.ts`** - Tests for `priority-tasks` command
  - Missing priority.json detection
  - Invalid file detection
  - Outdated file detection
  - Auto-fix functionality

### Generation Commands
- **`GenerateTemplatesCommand.test.ts`** - Tests for `generate-templates` command
  - Template file creation for all character limits
  - Language and category filtering
  - Overwrite behavior and dry-run mode

- **`LLMSGenerateCommand.test.ts`** - Tests for `llms-generate` command
  - LLMS file generation from templates
  - Different output patterns (standard, minimum, origin)
  - Content processing and metadata handling

### Sync and Detection Commands
- **`SyncDocsCommand.test.ts`** - Tests for `sync-docs` command
  - Document synchronization workflows
  - Language filtering and exclusion patterns
  - Multi-file processing and progress reporting

- **`MismatchDetectionCommand.test.ts`** - Tests for `detect-mismatches` command
  - Missing LLMS directory detection
  - Orphaned directory detection
  - Inconsistent structure detection
  - Template file pattern matching

## Test Patterns

### Common Test Scenarios
1. **Happy Path** - Normal operation with valid inputs
2. **Error Handling** - Invalid inputs, missing files, permission errors
3. **Edge Cases** - Complex file names, unusual directory structures
4. **Configuration Variations** - Different config options and languages
5. **Dry Run Mode** - Preview functionality without file changes
6. **Verbose Mode** - Detailed output verification

### Test Data Management
- Each test creates isolated temporary directories
- Automatic cleanup after each test
- Mock file system structures
- Realistic test documents and configurations

### Mocking Strategy
- Console output capture for verification
- File system operations in temporary directories
- No external service dependencies
- Pure unit testing approach

## Running Tests

### All CLI Tests
```bash
pnpm test:cli
```

### Specific Command Tests
```bash
pnpm test:cli:init           # Init command tests
pnpm test:cli:work-next      # Work-next command tests
pnpm test:cli:priority       # Priority management tests
pnpm test:cli:generate       # Template and LLMS generation tests
pnpm test:cli:sync           # Sync and detection tests
```

### Watch Mode
```bash
pnpm test:cli:watch          # Run tests in watch mode
```

### Coverage Report
```bash
pnpm test:cli                # Includes coverage report
```

## Test Utilities

### Shared Test Setup
- **`test-utils.ts`** - Common test utilities and helpers
- **`setup.ts`** - Jest setup configuration
- Consistent directory structure creation
- Mock data generation helpers

### Configuration Management
- Default test configurations
- Language-specific test scenarios
- Category and priority variations
- Exclude pattern testing

## Coverage Goals

- **Command Logic**: 90%+ coverage of core command functionality
- **Error Handling**: All error paths tested
- **Configuration**: All config options and combinations
- **File Operations**: Create, read, update, delete operations
- **Output Verification**: Console output and file content validation

## Best Practices

### Test Organization
- One test file per command class
- Descriptive test names that explain the scenario
- Grouped test cases by functionality
- Clear setup and teardown procedures

### Assertion Strategy
- Verify both positive and negative outcomes
- Check file creation and content
- Validate console output messages
- Test error conditions and recovery

### Performance Considerations
- Parallel test execution where possible
- Efficient temporary directory management
- Minimal file system operations
- Fast test execution for development workflow

## Debugging Tests

### Failed Test Investigation
1. Check temporary directory contents
2. Verify console output capture
3. Review file permission issues
4. Validate configuration setup

### Common Issues
- **Path Separators**: Cross-platform path handling
- **File Permissions**: Read-only directory tests
- **Timing Issues**: Async operation completion
- **Cleanup Failures**: Temporary directory removal