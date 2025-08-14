# React Package Test Structure

## Directory Organization

The React package follows a clean separation between implementation, tests, and examples:

```
packages/react/
├── __tests__/              # All test files (outside src)
│   ├── actions/
│   │   └── ActionContext-unified.test.tsx
│   └── stores/
│       └── patterns/
│           ├── declarative-store-pattern-v2.test.tsx
│           └── type-tests.tsx
│
├── examples/               # All example code (outside src)
│   └── stores/
│       └── patterns/
│           ├── declarative-examples.tsx
│           └── unified-pattern-example.tsx
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
- `src/actions/ActionContext.tsx` → `__tests__/actions/ActionContext-unified.test.tsx`
- `src/stores/patterns/declarative-store-pattern-v2.tsx` → `examples/stores/patterns/declarative-examples.tsx`

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test --coverage
```

## Configuration

### Jest Configuration (`jest.config.cjs`)
- Uses `ts-jest` preset for TypeScript support
- `testEnvironment: 'jsdom'` for React testing
- Tests located in `__tests__/` directory
- Type test files (`type-tests.tsx`) are ignored

### Import Path Updates
All test and example files use relative imports from their location:
```typescript
// In __tests__/stores/patterns/declarative-store-pattern-v2.test.tsx
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';

// In examples/stores/patterns/declarative-examples.tsx
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';
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