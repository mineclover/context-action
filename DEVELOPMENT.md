# Development Guide

Comprehensive development setup and workflow guide for the Context-Action framework monorepo.

## 🏗️ Project Architecture

### Monorepo Structure
```
context-action/
├── packages/                          # Main packages
│   ├── core/                         # @context-action/core (Pure TypeScript)
│   │   ├── src/
│   │   │   ├── ActionRegister.ts     # Core action pipeline
│   │   │   ├── action-guard.ts       # Action guard system  
│   │   │   ├── execution-modes.ts    # Execution strategies
│   │   │   ├── types.ts              # Type definitions
│   │   │   └── index.ts              # Public API exports
│   │   ├── __tests__/               # Unit tests
│   │   ├── tsdown.config.ts         # Build configuration
│   │   └── package.json
│   │
│   ├── react/                        # @context-action/react (React integration)
│   │   ├── src/
│   │   │   ├── actions/              # Action system
│   │   │   │   ├── ActionContext.tsx # React action context
│   │   │   │   └── utils/           # Action utilities
│   │   │   ├── stores/               # Store system
│   │   │   │   ├── core/            # Store implementation
│   │   │   │   ├── hooks/           # Store hooks
│   │   │   │   ├── patterns/        # Store patterns
│   │   │   │   └── utils/           # Store utilities  
│   │   │   ├── refs/                # Ref context system
│   │   │   └── index.ts             # Public API exports
│   │   ├── __tests__/              # Integration tests
│   │   └── package.json
│   │
│   ├── llms-generator/              # Documentation tooling
│   │   ├── src/
│   │   │   ├── cli/                 # CLI implementation
│   │   │   ├── core/                # Core functionality
│   │   │   └── types/               # Type definitions
│   │   ├── bin/llms                 # Global CLI binary
│   │   └── package.json
│   │
│   └── typedoc-vitepress-sync/      # Documentation sync tools
│
├── example/                          # Comprehensive example app
├── docs/                            # VitePress documentation
├── llmsData/                        # Generated LLMS content
├── scripts/                         # Build and utility scripts
├── .husky/                          # Git hooks
└── .github/workflows/               # CI/CD pipelines
```

## 🚀 Development Setup

### Prerequisites
- **Node.js**: >= 24.11.0
- **pnpm**: >= 10.30.0 (Package manager)
- **TypeScript**: 6.0.3 (workspace toolchain)
- **Git**: Latest version

### Initial Setup
```bash
# 1. Clone the repository
git clone https://github.com/mineclover/context-action.git
cd context-action

# 2. Install pnpm if not already installed
npm install -g pnpm

# 3. Install all dependencies
pnpm install

# 4. Build all packages
pnpm build

# 5. Run tests to verify setup
pnpm test

# 6. Start development server
pnpm dev  # Opens example app at http://localhost:5173
```

## 📦 Package Management

### Monorepo Tools
- **pnpm Workspaces**: Dependency management and workspace linking
- **Lerna**: Versioning, publishing, and change detection
- **tsdown**: Modern TypeScript bundling (powered by rolldown)

### Package Scripts
```bash
# Install dependencies for all packages
pnpm install

# Install dependency for specific package
pnpm --filter @context-action/core add lodash
pnpm --filter @context-action/react add react

# Remove dependency
pnpm --filter @context-action/core remove lodash
```

### Workspace Dependencies
```json
// Use workspace protocol for internal dependencies
{
  "dependencies": {
    "@context-action/core": "workspace:*"
  }
}
```

## 🔨 Build System

### Build Configuration
Each package uses **tsdown** for optimal TypeScript builds:

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom']
});
```

### Build Commands
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:core
pnpm build:react
pnpm build:llms-generator

# Clean all build artifacts
pnpm clean

# Watch mode for development
cd packages/core && pnpm build --watch
```

### Build Outputs
- **ESM**: `dist/index.js` (ES modules)
- **CJS**: `dist/index.cjs` (CommonJS)
- **Types**: `dist/index.d.ts` (TypeScript declarations)
- **Bundle Analysis**: `reports/bundle-size.json`

## 🧪 Testing Strategy

### Test Structure
- **Unit Tests**: `packages/*/src/**/*.test.ts`
- **Integration Tests**: `packages/react/__tests__/`
- **E2E Tests**: Example app validation

### Testing Tools
- **Jest**: Test runner with TypeScript support
- **@testing-library/react**: React component testing
- **jsdom**: DOM environment for tests

### Test Commands
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test:core
pnpm test:react

# Watch mode for development
cd packages/core && pnpm test:watch

# Test with coverage
pnpm test --coverage

# Run specific test file
pnpm test ActionRegister.test.ts
```

### Test Standards
- **100% coverage** for critical paths in core package
- **Integration tests** for all React components
- **Mock external dependencies** appropriately
- **Test both success and failure scenarios**

## 📋 Code Quality

### Static Analysis
- **ESLint**: Code linting with TypeScript rules
- **TypeScript**: Strict type checking enabled
- **Prettier**: Code formatting (integrated with ESLint)

### Quality Commands
```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type checking
pnpm type-check

# Full quality check
pnpm lint && pnpm type-check && pnpm test
```

### Pre-commit Hooks
```bash
# Automatically configured via .husky/
.husky/pre-commit      # Runs lint-staged
.husky/post-commit     # Runs LLMS Generator
```

## 🚀 Development Workflows

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-store-selectors

# 2. Make changes
# Edit files in packages/react/src/

# 3. Run tests during development  
pnpm test:react --watch

# 4. Build and test
pnpm build && pnpm test

# 5. Commit changes
git add .
git commit -m "feat(react): add store selector support"
```

### Package Development
```bash
# Develop core package
cd packages/core
pnpm test:watch  # Terminal 1
pnpm build --watch  # Terminal 2

# Develop react package with live reload
cd packages/react  
pnpm test:watch  # Terminal 1
cd ../../ && pnpm dev  # Terminal 2 (example app)
```

### Example App Development
```bash
# Start example app with hot reload
pnpm dev

# Build example app
pnpm example:build

# Example app commands
cd example
pnpm dev           # Vite dev server
pnpm build         # Production build
pnpm lint          # Biome linting
pnpm type-check    # TypeScript validation
```

## 📖 Documentation Workflow

### VitePress Documentation
```bash
# Start documentation dev server
pnpm docs:dev

# Build documentation
pnpm docs:build

# Generate API documentation
pnpm docs:api

# Sync API docs to VitePress
pnpm docs:sync

# Full documentation pipeline
pnpm docs:full
```

### LLMS Generator Integration
```bash
# Process documentation changes
pnpm llms:sync-docs

# Generate priority-based content
pnpm llms:priority-stats
pnpm llms:work-next

# Korean/English specific processing
pnpm llms:sync-docs:ko
pnpm llms:sync-docs:en
```

## 🏷️ Release Management

### Version Management with Lerna
```bash
# Check which packages changed
pnpm changed

# View diff of changes
pnpm diff

# Interactive version bump
pnpm version

# Specific version bumps
pnpm version:patch  # 0.0.x
pnpm version:minor  # 0.x.0
pnpm version:major  # x.0.0
```

### Publishing Process
```bash
# Publish changed packages
pnpm release

# Version bump and publish
pnpm release:patch
pnpm release:minor
pnpm release:major
```

### Release Checklist
- [ ] All tests pass (`pnpm test`)
- [ ] Documentation updated
- [ ] Example app works (`pnpm dev`)
- [ ] CHANGELOG entries added
- [ ] Version bumps appropriate
- [ ] No breaking changes without major version

## 🔧 Environment Configuration

### Development Environment
```bash
# Node.js version management (recommended)
# Use .nvmrc file
nvm use

# Environment variables
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

### Build Environment
```typescript
// TypeScript configuration (tsconfig.json)
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Package Configuration
```json
// package.json - Common fields
{
  "type": "module",
  "engines": {
    "node": ">=24.11.0"
  },
  "devDependencies": {
    "typescript": "6.0.3"
  }
}
```

## 🐛 Debugging

### Debug Configuration
```bash
# Debug tests with Node.js inspector
node --inspect node_modules/.bin/jest

# Debug TypeScript compilation
pnpm tsc --noEmit --listFiles

# Debug build process
pnpm build --verbose
```

### Common Issues & Solutions

#### Dependency Resolution
```bash
# Clear node_modules and reinstall
pnpm clean:deps && pnpm install

# Update dependencies
pnpm update

# Check for dependency conflicts
pnpm ls
```

#### Build Issues
```bash
# Clear build cache
pnpm clean

# Rebuild all packages
pnpm build

# Check TypeScript configuration
pnpm type-check
```

#### Test Issues
```bash
# Clear Jest cache
pnpm test --clearCache

# Run tests in verbose mode
pnpm test --verbose

# Debug specific test
pnpm test --runInBand ActionRegister.test.ts
```

## 🚀 Performance Optimization

### Build Performance
- **Incremental Builds**: tsdown supports incremental compilation
- **Parallel Execution**: pnpm runs package scripts in parallel
- **Selective Testing**: Run tests only for changed packages

### Development Performance
```bash
# Use workspace filtering for faster operations
pnpm --filter @context-action/core test
pnpm --filter example dev

# Parallel development
pnpm --parallel dev  # All packages
```

## 📊 Monitoring & Analytics

### Bundle Analysis
```bash
# Generate bundle analysis
pnpm build
cat reports/bundle-size.json
```

### Test Coverage
```bash
# Generate coverage reports
pnpm test --coverage
open coverage/lcov-report/index.html
```

### Performance Metrics
- **Build Time**: Measured per package
- **Test Execution**: Performance regression tracking
- **Bundle Size**: Automated size tracking in CI

## 🤝 Team Development

### Branch Strategy
- **main**: Production-ready code
- **feature/***: New features  
- **fix/***: Bug fixes
- **docs/***: Documentation updates
- **chore/***: Maintenance tasks

### Code Review Process
1. **Create PR** with detailed description
2. **Automated checks** must pass (CI/CD)
3. **Manual review** by maintainers
4. **Address feedback** promptly
5. **Merge** after approval

### Communication
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Architecture discussions
- **PR Comments**: Code-specific discussions

---

This development guide provides everything needed to contribute effectively to the Context-Action framework. For additional help, see [CONTRIBUTING.md](./CONTRIBUTING.md) or create an issue on GitHub.
