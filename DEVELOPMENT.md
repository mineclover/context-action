# Development Guide

Comprehensive development setup and workflow guide for the Context-Action framework monorepo.

## 🏗️ Project Architecture

### Monorepo Structure
See [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md) (`catalog/repository-surface/api-surface.v1.json`) and [Store Selection and Usage Guide](docs/en/context-layered/store-selection-and-usage-guide.md) for the complete 19-package inventory and Store selection matrix.

```
context-action/
├── catalog/                           # Integration profiles & repository-surface catalogs (CA-SURFACE-CATALOG-001)
├── packages/                          # 19 workspace packages across 6 layers
│   ├── core/, interactions/, store-core/, mutative-core/, tool-protocol/, tool-durable-operations/
│   ├── react/, mutative/, lit/, preact/
│   ├── lit-ui/, preact-ui/
│   ├── xstate/, ai-sdk/, webmcp/
│   ├── style-testing/
│   └── live-code-editor/, openrouter-browser-storage/, template-react/
├── example/                           # Comprehensive example app (78 canonical routes)
├── demos/                             # Standalone demos (e.g., bolt-style-editor)
├── skills/                            # Context-Action Implementation Playbook skills
├── releases/                          # Protected release guide and cohort manifests
├── docs/                              # VitePress documentation & derived llms/*.txt bundles
├── scripts/                           # Build, catalog, and verification scripts
├── .husky/                            # Git hooks (lightweight pre-commit)
└── .github/workflows/                 # CI/CD and protected release pipelines
```

### Workspace Build Order
Lower-level runtime packages (`core`, `store-core`, `mutative-core`, `tool-protocol`, `tool-durable-operations`) must build before higher-level adapters (`mutative`, `react`, `xstate`, `lit`/`lit-ui`, `preact`/`preact-ui`, `ai-sdk`, `webmcp`) and consumers (`example`, `demos/bolt-style-editor`):

```bash
# Build all workspace library packages in topological order
pnpm build
pnpm example:build

# Focused sequence after core or react source changes
pnpm build:core
pnpm build:react
pnpm --filter example type-check
pnpm --filter example check
pnpm example:build
```

## 🚀 Development Setup

### Prerequisites
- **Node.js**: >= 24.11.0
- **pnpm**: >= 11.28.6 (Package manager)
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

# 5. Run tests and local verification to verify setup
pnpm verify:quick  # Fast local smoke verification and receipt check (~15s)
pnpm test          # Run package test suites

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

# Clean all build artifacts
pnpm clean

# Watch mode for development
cd packages/core && pnpm build --watch
```

### Build Outputs
- **ESM**: `dist/index.js` (ES modules)
- **CJS**: `dist/index.cjs` (CommonJS)
- **Types**: `dist/index.d.ts` (TypeScript declarations)
- **Bundle Size Check**: Verified automatically in CI (`size-check` job on `packages/*/dist/index.js`)

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
pnpm --filter @context-action/react test

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
- **Biome**: Linting across workspace (`pnpm lint`) and formatting + checks in `example/` (`pnpm --filter example check`)
- **TypeScript**: Strict compilation (`pnpm type-check`) across source and tests
- **Governance & Boundary Gates**: `pnpm verify:surface-catalog`, `pnpm convention:check`, `pnpm package-boundary:check`, `pnpm docs:check`

### Quality Commands
```bash
# Local-First verification (Issue #50, #53)
pnpm verify:quick           # Fast smoke verification (~15-35s) & receipt generation
pnpm verify                 # Full 17-step repository verification & receipt generation
pnpm verify:receipt         # Audit local verification receipt (<0.1s, fail-closed)

# Run linting, type checking, surface catalogs, and boundary gates
pnpm lint
pnpm exec biome check --write <paths>
pnpm type-check
pnpm verify:surface-catalog
pnpm convention:check
pnpm package-boundary:check

# Full quality check
pnpm lint && pnpm type-check && pnpm test
```

### Git Hooks
```bash
# Configured via .husky/
.husky/pre-commit      # Lightweight no-op (verification runs explicitly via pnpm verify / pnpm docs:check)
```

## 🚀 Development Workflows

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-store-selectors

# 2. Make changes
# Edit files in packages/react/src/

# 3. Run tests during development  
pnpm --filter @context-action/react test -- --watch

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

The source-of-truth rules for hand-authored guides, package API references,
LLMS bundles, and proportional verification are in [Documentation and
Development Management Conventions](docs/en/concept/documentation-development-conventions.md).

### VitePress Documentation & Verification
```bash
# Start documentation dev server
pnpm docs:dev

# Verify documentation management, surface catalog parity, LLMS freshness, and VitePress build
pnpm docs:management
pnpm verify:surface-catalog
pnpm llms:check
pnpm docs:build
pnpm docs:check        # Canonical combined docs gate

# Verify Context-Layered conventions and compiled doc snippets
pnpm convention:check
pnpm verify:doc-snippets
```

### LLMS Bundle Generation
```bash
# Regenerate docs/{en,ko}/llms/llms-{minimal,500chars,origin}.txt from docs/{en,ko}/**
pnpm docs:llms
```

## 🏷️ Release Management

Packages are versioned independently. Direct local publishing is disabled;
`pnpm release` and `pnpm release:patch` intentionally fail closed. Prepare an
approved package/version cohort, then use the protected GitHub workflows
described in [`releases/RELEASE.md`](./releases/RELEASE.md).

Run the complete preflight before authorizing a release commit:

```bash
pnpm release:check
```

The Lerna `version:*` commands can modify manifests, the lockfile, Git commits,
and tags. They are release-preparation tools, not publishing commands, and must
only be used as part of an approved release plan.

### Release Checklist
- [ ] `pnpm release:check` passes from the immutable release commit
- [ ] Package versions and dated CHANGELOG entries match packed artifacts
- [ ] Runtime dependency floors and packed/published consumer matrices match
- [ ] Stable-surface breaking changes use a major version
- [ ] Pre-1, non-stable breaking changes use a new minor compatibility boundary
- [ ] A protected workflow exists for the requested candidate and promotion path
- [ ] Provenance, registry evidence, and rollback behavior are recorded

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
# Clean build artifacts and reinstall
pnpm clean && pnpm install --frozen-lockfile

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
# Build all packages and inspect raw/gzipped bundle sizes
pnpm build
ls -lh packages/*/dist/index.js
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
