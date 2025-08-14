# React Package Test Structure

## Directory Organization

The React package follows a clean separation between implementation, tests, and examples:

```
packages/react/
├── __tests__/              # All test files (outside src)
│   ├── actions/           # Action system tests
│   │   ├── createActionContext.test.tsx
│   │   ├── useActionDispatch.test.tsx
│   │   └── useActionHandler.test.tsx
│   └── stores/            # Store system tests
│       ├── hooks/         # Hook tests
│       │   ├── useComputedStore.test.tsx
│       │   ├── useLocalStore.test.tsx
│       │   ├── useStoreSelector.test.tsx
│       │   └── useStoreValue.test.tsx
│       ├── patterns/      # Pattern tests
│       │   └── createDeclarativeStorePattern.test.tsx
│       └── utils/         # Utility tests
│           └── comparison.test.tsx
│
├── examples/               # All example code (outside src)
│   ├── hooks/             # Hook examples by category
│   │   ├── essential/     # Must-learn hooks
│   │   ├── utility/       # Performance and convenience hooks
│   │   └── index.tsx      # Interactive hook explorer
│   └── stores/            # Store pattern examples
│       └── patterns/      # Store pattern examples
│
├── src/                    # Clean implementation code only
│   ├── actions/           # Action system implementation
│   ├── hooks/            # Hook exports
│   ├── patterns/         # Pattern exports
│   └── stores/           # Store system implementation
│       ├── core/         # Core store functionality
│       ├── hooks/        # Store hooks
│       ├── patterns/     # Store patterns (implementation only)
│       └── utils/        # Utilities
│
├── docs/                   # Documentation
│   ├── HOOKS_REFERENCE.md
│   ├── PATTERN_GUIDE.md
│   └── TEST_STRUCTURE.md
│
└── jest.config.cjs         # Jest configuration
```

## Key Principles

### 1. Clean Separation
- **`src/`**: Contains ONLY implementation code
- **`__tests__/`**: Contains all test files
- **`examples/`**: Contains all example code
- **`docs/`**: Contains all documentation

### 2. No Test Code in Source
- No `*.test.ts` or `*.test.tsx` files in `src/`
- No `__tests__` directories in `src/`
- No example files in `src/`

### 3. Parallel Structure
Tests and examples mirror the source structure:
- `src/actions/ActionContext.tsx` → `__tests__/actions/createActionContext.test.tsx`
- `src/stores/hooks/useStoreValue.ts` → `__tests__/stores/hooks/useStoreValue.test.tsx`
- `src/stores/patterns/` → `__tests__/stores/patterns/createDeclarativeStorePattern.test.tsx`

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test --coverage
```

## Current Test Coverage

The framework has comprehensive test coverage with **40+ passing tests** across all core functionality:

### Action System Tests (22 tests)
- **createActionContext** (8 tests): Factory function, provider creation, hook generation
- **useActionDispatch** (6 tests): Action dispatching, error handling, abort support
- **useActionHandler** (8 tests): Handler registration, priority system, cleanup

### Store System Tests (18 tests)
- **useStoreValue** (4 tests): Basic subscription, selector functionality, performance options
- **useLocalStore** (4 tests): Component-local stores, lifecycle management, value updates
- **useStoreSelector** (3 tests): Selective subscriptions, equality functions, optimization
- **useComputedStore** (5 tests): Derived state, memoization, dependency tracking
- **createDeclarativeStorePattern** (2 tests): Pattern creation, type safety

### Utility Tests (13 tests)
- **comparison utilities** (13 tests): Shallow/deep equality, custom comparators, edge cases

### Key Testing Features
- **TypeScript Support**: Full type checking in test environment
- **React Testing Library**: Component testing with proper rendering
- **Jest Mocking**: Clean mocks for dependencies and external packages
- **Performance Testing**: Render count validation and optimization verification
- **Error Testing**: Comprehensive error handling and edge case coverage

## Configuration

### Jest Configuration (`jest.config.cjs`)
- Uses `ts-jest` preset for TypeScript support
- `testEnvironment: 'jsdom'` for React testing
- Tests located in `__tests__/` directory
- Type test files (`type-tests.tsx`) are ignored

### Import Path Updates
All test and example files use relative imports from their location:
```typescript
// In __tests__/stores/hooks/useStoreValue.test.tsx
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

// In __tests__/actions/createActionContext.test.tsx  
import { createActionContext } from '../../../src/actions/ActionContext';

// In examples/hooks/essential/useStoreValue-example.tsx
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';
```

## Benefits

1. **Clean Source Code**: Implementation code is not cluttered with tests
2. **Easy Navigation**: Clear separation makes it easy to find code vs tests
3. **Build Optimization**: Test files are never included in production builds
4. **Maintainability**: Tests and examples can be managed independently
5. **CI/CD Friendly**: Clear test directory for coverage reports and test runners

## Migration Notes

If you have tests in your source code:
1. Move all `*.test.ts(x)` files to `__tests__/` maintaining directory structure
2. Move all example files to `examples/`
3. Update import paths in moved files
4. Remove empty `__tests__` directories from `src/`
5. Update Jest configuration if needed