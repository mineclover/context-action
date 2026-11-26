# Contributing to Context-Action Framework

Thank you for your interest in contributing to the Context-Action framework! This guide will help you get started with contributing to our TypeScript state management library.

## 🚀 Quick Start for Contributors

### Prerequisites
- Node.js >= 24.11.0
- pnpm >= 11.28.6
- TypeScript 6.0.3 (provided by the workspace)

### Development Setup
```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/context-action.git
cd context-action

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Run tests to ensure everything works
pnpm test

# 5. Start development server
pnpm dev  # Opens example app at http://localhost:5173
```

## 🎯 How to Contribute

### 1. 🐛 Bug Reports
- **Search existing issues** before creating a new one
- **Use the bug report template** with clear steps to reproduce
- **Include TypeScript version** and package versions
- **Provide minimal reproduction** using CodeSandbox or the example app

### 2. 💡 Feature Requests  
- **Check the roadmap** in discussions first
- **Describe the problem** you're trying to solve
- **Propose a solution** with examples
- **Consider backwards compatibility**

### 3. 🔧 Code Contributions
- **Create an issue** first to discuss the change
- **Fork the repository** and create a feature branch
- **Follow our coding standards** (see below)
- **Add tests** for new functionality
- **Update documentation** if needed

## 🏗️ Project Structure

Package ownership and cross-package dependency rules are defined in the
[Package Boundary and Codebase Management Convention](docs/en/context-layered/package-boundary-convention.md).
Use that guide before adding a package, moving a file across package roots, or
introducing a shared utility. The package README is the discovery entry point;
the linked guide, schema, or API source remains authoritative.

See the [Convention Index](docs/en/context-layered/convention-index.md), [Repository Surface Catalog](docs/en/context-layered/repository-surface-catalog.md), [Store Selection and Usage Guide](docs/en/context-layered/store-selection-and-usage-guide.md), and [Change Management Convention](docs/en/context-layered/change-management-convention.md) before adding packages, routes, or durable docs.

```
context-action/
├── catalog/                  # Integration profiles & repository-surface catalogs (CA-SURFACE-CATALOG-001)
├── packages/                 # 19 workspace packages across 6 layers (see Repository Surface Catalog)
│   ├── core/                 # @context-action/core
│   ├── interactions/         # @context-action/interactions
│   ├── store-core/           # @context-action/store-core
│   ├── mutative-core/        # @context-action/mutative-core
│   ├── mutative/             # @context-action/mutative
│   ├── react/                # @context-action/react
│   ├── xstate/               # @context-action/xstate
│   ├── lit/, lit-ui/         # Lit controllers & Web Components
│   ├── preact/, preact-ui/   # Preact Signals adapters & UI runtime
│   ├── tool-protocol/, tool-durable-operations/, ai-sdk/, webmcp/
│   └── style-testing/, template-react/, ...
├── example/                  # Example application (78 canonical routes)
├── demos/                    # Standalone demos (e.g. bolt-style-editor)
├── skills/                   # Implementation Playbook agent skills
├── releases/                 # Protected release plans & cohorts
├── docs/                     # VitePress documentation
└── scripts/                  # Build, surface-catalog, and verification scripts
```

## 📝 Coding Standards

### TypeScript Guidelines
- **Strict TypeScript** is enabled across all packages
- **Explicit return types** for all public functions
- **JSDoc comments** for all public APIs
- **Generic constraints** should be meaningful and documented

```typescript
// ✅ Good
/**
 * Creates a typed store context with reactive subscriptions
 * @param name - Unique context name for debugging
 * @param stores - Store definitions with initial values
 * @returns Store context with Provider and hooks
 */
export function createStoreContext<T extends StoreMap>(
  name: string,
  stores: T
): StoreContextResult<T> {
  // Implementation
}

// ❌ Avoid
export function createStoreContext(name, stores) {
  // Implementation
}
```

### Code Style
- **Biome** is enforced for linting and formatting across workspace packages and `example/` (`pnpm lint` at root, `pnpm --filter example check` for example)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** where valid

### Naming Conventions
- **camelCase** for functions and variables
- **PascalCase** for types, interfaces, and classes
- **SCREAMING_SNAKE_CASE** for constants
- **Descriptive names** over abbreviations

```typescript
// ✅ Good
interface UserActionPayloadMap extends ActionPayloadMap {
  updateUserProfile: { name: string; email: string };
  deleteUserAccount: { userId: string };
}

const DEFAULT_STORE_OPTIONS: StoreOptions = {
  immutable: true,
  trackChanges: false
};

// ❌ Avoid  
interface UAP {
  upd: { n: string; e: string };
}

const opts = { imm: true };
```

## 🧪 Testing Guidelines

### Test Structure
- **Unit tests** for core functionality (`packages/*/src/**/*.test.ts`)
- **Integration tests** for React components (`packages/react/__tests__/`)
- **E2E tests** using the example application

### Testing Standards
- **100% coverage** for core package critical paths
- **Mock external dependencies** appropriately
- **Test both success and failure cases**
- **Use descriptive test names**

```typescript
// ✅ Good test structure
describe('ActionRegister', () => {
  describe('register()', () => {
    it('should register handler with correct priority', () => {
      // Test implementation
    });
    
    it('should throw error when registering duplicate action', () => {
      // Test implementation
    });
    
    it('should handle async handlers correctly', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test:core
pnpm --filter @context-action/react test

# Run tests in watch mode
cd packages/core && pnpm test:watch

# Run tests with coverage
pnpm test --coverage
```

## 📚 Documentation Guidelines

Documentation ownership, change classification, and required verification are
defined in the [Documentation and Development Management Conventions](docs/en/concept/documentation-development-conventions.md).

### Code Documentation
- **JSDoc comments** for all public APIs
- **Type-first documentation** - types should be self-documenting
- **Examples in JSDoc** for complex functions

### Guide Documentation  
- **Clear examples** with working code
- **Progressive complexity** - start simple, add complexity
- **Real-world use cases** over toy examples
- **Both English and Korean** versions when possible

### API Reference
- **Automatically generated** from TypeScript with TypeDoc
- **Verify examples compile** and run correctly
- **Link to relevant guides** and examples

## 🔄 Development Workflow

### Branch Naming
```bash
feature/add-store-selectors
fix/action-handler-memory-leak
docs/improve-quick-start-guide
chore/update-dependencies
```

### Commit Messages
We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
feat(store): add computed store selector support
fix(react): resolve memory leak in action handlers  
docs(readme): update quick start example
test(core): add action guard integration tests
chore(deps): update TypeScript to 6.0.3
```

### Pull Request Process
1. **Create feature branch** from `main`
2. **Make changes** following coding and Context-Layered standards
3. **Add tests** for new functionality and rebuild lower layers before verifying consumers
4. **Update documentation & catalogs** (`docs/{en,ko}/**`, `catalog/repository-surface/*.v1.json`, and `docs/{en,ko}/llms/llms-*.txt` via `pnpm docs:llms`)
5. **Run Local-First verification** on a clean working tree (`pnpm verify` or `pnpm verify:quick`, then `pnpm verify:receipt`)
6. **Create pull request** using `.github/PULL_REQUEST_TEMPLATE.md` and include `#<issue>` or a `CA-*` ID (`pnpm change:traceability`)
7. **Address review feedback** promptly

### PR Checklist
- [ ] Local-First verification receipt is current on a clean working tree (`pnpm verify` or `pnpm verify:quick` + `pnpm verify:receipt`, per [Local-First Verification Policy](docs/LOCAL_FIRST_VERIFICATION_POLICY.md))
- [ ] Tests, types, and Biome lint pass (`pnpm test`, `pnpm type-check`, `pnpm lint`)
- [ ] Surface catalogs, conventions, and package boundaries pass (`pnpm verify:surface-catalog`, `pnpm convention:check`, `pnpm package-boundary:check`)
- [ ] PR references `#<issue>` or `CA-*` ID (`pnpm change:traceability`)
- [ ] Paired EN/KO docs, `docs/{en,ko}/llms/llms-*.txt`, and VitePress build pass (`pnpm docs:check`)
- [ ] Example app checks/builds pass if relevant (`pnpm --filter example check && pnpm example:build`)

## 🏷️ Release Process

### Protected Release Workflow
Packages use **Lerna** independent versioning. Direct local publishing is disabled (`pnpm release` and `pnpm release:patch` intentionally fail closed). Follow [`releases/RELEASE.md`](./releases/RELEASE.md):

```bash
# Run complete local release preflight on the candidate commit
pnpm release:check

# Inspect changed packages and release inventory
pnpm release:inventory
```

### Release Notes
- **Automatically generated** from conventional commits
- **Manual enhancement** for major releases
- **Breaking changes** clearly documented
- **Migration guides** for major versions

## 🤝 Community Guidelines

### Conduct & Collaboration
We are committed to providing a welcoming, respectful, and constructive collaboration environment across issues, pull requests, and discussions ([Security Policy](./SECURITY.md)).

### Communication
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and community discussion
- **Pull Request Reviews** - Technical discussions about code changes

### Getting Help
- **Check existing issues** and discussions first
- **Use issue templates** for bug reports and features
- **Provide minimal reproduction** for bug reports
- **Be patient and respectful** in all interactions

## 🙏 Recognition

Contributors are automatically recognized in:
- **Release notes** for significant contributions
- **README contributors section** (auto-generated)
- **Package.json contributors** field

Thank you for helping make Context-Action better! 🚀

---

## 📞 Contact

- **Issues**: [GitHub Issues](https://github.com/mineclover/context-action/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mineclover/context-action/discussions)
- **Maintainer**: [@mineclover](https://github.com/mineclover)
