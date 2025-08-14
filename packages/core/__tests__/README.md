# Core Package Tests

Comprehensive test suite for `@context-action/core` package.

## Test Structure

```
__tests__/
├── core/                           # Core ActionRegister tests
│   ├── ActionRegister.test.ts                    # Basic functionality
│   └── ActionRegister.result-handling.test.ts   # Result collection & advanced features
├── execution-modes/                # Execution mode tests
│   └── execution-modes.test.ts                  # Sequential, parallel, race modes
├── types/                          # Type safety tests
│   └── type-tests.ts                            # Compile-time type checking
└── utils/                          # Utility tests
    └── (future utility tests)
```

## Test Categories

### Core Functionality Tests (`core/`)

#### ActionRegister.test.ts
- ✅ **Constructor and Configuration**: Registry creation with various configs
- ✅ **Handler Registration**: Basic and advanced handler registration patterns
- ✅ **Handler Unregistration**: Safe cleanup and memory management
- ✅ **Action Dispatch**: Type-safe action dispatching with payloads
- ✅ **Pipeline Controller**: Controller methods and flow control
- ✅ **Handler Discovery**: Statistics and handler lookup methods
- ✅ **Error Handling**: Graceful error handling in handlers
- ✅ **Debug Utilities**: Debug mode and utility methods

#### ActionRegister.result-handling.test.ts
- ✅ **Result Collection**: `dispatchWithResult()` comprehensive testing
- ✅ **Early Termination**: `controller.return()` pipeline termination
- ✅ **Pipeline Abort**: `controller.abort()` with detailed error info
- ✅ **Result Merging**: Custom merger functions and strategies
- ✅ **Execution Details**: Timing, handler info, error tracking
- ✅ **Advanced Options**: Filtering, limits, timeouts
- ✅ **Result Strategies**: First, last, all, merge, custom strategies
- ✅ **Controller Methods**: `getResults()`, `mergeResult()`, `setResult()`

### Execution Mode Tests (`execution-modes/`)

#### execution-modes.test.ts
- ✅ **Sequential Mode**: Priority-ordered sequential execution
- ✅ **Parallel Mode**: Concurrent handler execution
- ✅ **Race Mode**: First-complete-wins execution
- ✅ **Mode Management**: Setting, getting, removing execution modes
- ✅ **Override Options**: Execution mode overrides via dispatch options
- ✅ **Edge Cases**: Empty handlers, single handlers, mixed sync/async

### Type Safety Tests (`types/`)

#### type-tests.ts
- ✅ **ActionPayloadMap**: Compile-time type enforcement
- ✅ **Dispatch Methods**: Type-safe dispatch and dispatchWithResult
- ✅ **PipelineController**: Properly typed controller methods
- ✅ **HandlerConfig**: Configuration option type safety
- ✅ **DispatchOptions**: Advanced dispatch option types
- ✅ **ExecutionResult**: Result type safety and generics
- ✅ **Generic Constraints**: Generic action types and CRUD patterns
- ✅ **Error Prevention**: Compile-time error detection

## Test Features

### Comprehensive Coverage
- **Core Functionality**: 100% coverage of ActionRegister methods
- **Edge Cases**: Error conditions, empty states, invalid inputs
- **Type Safety**: Compile-time and runtime type validation
- **Performance**: Timing-sensitive tests for execution modes
- **Memory Safety**: Cleanup and leak prevention testing

### Modern Testing Patterns
- **Jest + TypeScript**: Full TypeScript support with ts-jest
- **Async Testing**: Proper async/await testing patterns
- **Mock Management**: Clean mock setup and teardown
- **Timer Mocking**: Fake timers for debounce/throttle testing
- **Error Simulation**: Controlled error scenarios

### Test Quality Standards
- **Descriptive Names**: Clear test descriptions and grouping
- **Setup/Teardown**: Proper test isolation and cleanup
- **Assertions**: Comprehensive assertions with clear expectations
- **Documentation**: Well-documented test purposes and patterns

## Running Tests

### Basic Test Commands
```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# CI mode with coverage
pnpm test:ci
```

### Test Development
```bash
# Run specific test file
pnpm test ActionRegister.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="Pipeline Controller"

# Debug mode
pnpm test --verbose

# Update snapshots (if any)
pnpm test --updateSnapshot
```

### Coverage Targets
- **Lines**: ≥95%
- **Functions**: ≥95%
- **Branches**: ≥90%
- **Statements**: ≥95%

## Test Guidelines

### Writing New Tests
1. **Follow Structure**: Place tests in appropriate directories
2. **Descriptive Names**: Use clear, descriptive test names
3. **Setup/Cleanup**: Always clean up after tests
4. **Type Safety**: Include both runtime and compile-time tests
5. **Edge Cases**: Test error conditions and edge cases
6. **Documentation**: Document complex test scenarios

### Test Categories
- **Unit Tests**: Individual method and function testing
- **Integration Tests**: Component interaction testing
- **Type Tests**: Compile-time type safety verification
- **Performance Tests**: Timing and execution order validation
- **Error Tests**: Error handling and recovery testing

### Best Practices
- ✅ **Isolated Tests**: Each test should be independent
- ✅ **Clear Assertions**: Use specific, meaningful assertions
- ✅ **Mock Management**: Clean up mocks between tests
- ✅ **Async Handling**: Proper async/await usage
- ✅ **Error Testing**: Test both success and failure paths

## Test Maintenance

### Regular Updates
- Update tests when adding new features
- Maintain type tests for API changes
- Review and update coverage targets
- Keep test documentation current

### Performance Monitoring
- Monitor test execution time
- Optimize slow tests
- Maintain CI pipeline efficiency
- Regular cleanup of obsolete tests

## Integration with CI/CD

The test suite is designed to integrate seamlessly with continuous integration:

- **Fast Execution**: Optimized for CI environments
- **Parallel Testing**: Supports parallel test execution
- **Coverage Reporting**: Generates coverage reports for CI
- **Type Checking**: Includes compile-time type verification
- **Error Reporting**: Clear error messages and stack traces

## Future Enhancements

### Planned Test Additions
- **Benchmark Tests**: Performance regression testing
- **Memory Tests**: Memory leak detection and monitoring
- **Stress Tests**: High-load scenario testing
- **Browser Tests**: Cross-environment compatibility testing
- **Property-Based Tests**: Generative testing with random inputs