# Core Package Tests

High-quality, comprehensive test suite for `@context-action/core` package.

## Test Structure

```
__tests__/
├── simple-working.test.ts          # Basic functionality verification
├── production/                     # Production-ready comprehensive tests
│   └── ActionRegister.production.test.ts       # Complete feature coverage
├── working/                        # Developmental tests (some may fail)
├── comprehensive/                  # Advanced feature tests (experimental)
├── final/                          # Final integration tests
├── types/                          # TypeScript configuration tests
└── tsconfig.json                   # TypeScript configuration for tests
```

## Test Categories

### ✅ Production Test Suite (`production/ActionRegister.production.test.ts`)

**22 comprehensive tests covering all major features:**

#### 🏗️ Core Registration & Management (5 tests)
- **Handler Registration**: Proper payload and controller binding
- **Unregistration**: Clean handler removal and memory management
- **Priority Execution**: Handlers execute in correct priority order (highest first)
- **Registry Statistics**: Accurate action and handler counting
- **Cleanup**: Complete registry clearing

#### ⚙️ Handler Configuration (3 tests)  
- **Once Handlers**: Execute once then auto-unregister
- **Conditional Execution**: Using pipeline controller for conditions
- **Handler Identification**: Support for handler IDs and tracking

#### 🎛️ Pipeline Controller Features (3 tests)
- **Payload Modification**: Modify payloads for subsequent handlers
- **Pipeline Abort**: Terminate pipeline execution with reasons
- **Payload Access**: Get current payload via controller

#### 📊 Result Collection & Management (2 tests)
- **Result Collection**: Collect results from all handlers
- **Controller Methods**: `setResult()` and `getResults()` functionality

#### 🚨 Error Handling & Recovery (2 tests)
- **Graceful Error Handling**: Continue execution despite handler failures
- **Execution Statistics**: Detailed timing and execution metadata

#### 🔧 Execution Mode Configuration (2 tests)
- **Mode Management**: Configure sequential/parallel/race modes per action
- **Mode Verification**: Confirm correct execution mode behavior

#### ⚡ Performance & Async Support (3 tests)
- **Void Actions**: Handle actions without payloads correctly
- **Synchronous Handlers**: Process sync handlers properly
- **Promise Handlers**: Support for Promise-returning handlers

#### 🔄 Real-world Integration Scenarios (2 tests)
- **Authentication Workflow**: Complete user auth pipeline with validation, rate limiting, authentication, and audit logging
- **File Processing Pipeline**: File upload with validation, scanning, storage, and metadata extraction

### 🧪 Simple Working Tests (`simple-working.test.ts`)

**5 basic verification tests:**
- ActionRegister instance creation
- Basic handler registration and dispatch
- Void action handling  
- Number payload handling
- Handler return value collection

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