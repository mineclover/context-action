# Contributing to Context-Action Framework

Thank you for your interest in contributing to the Context-Action framework! This guide will help you get started with contributing to our TypeScript state management library.

## 🚀 Quick Start for Contributors

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

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

```
context-action/
├── packages/
│   ├── core/                   # @context-action/core
│   │   ├── src/
│   │   │   ├── ActionRegister.ts    # Core action pipeline
│   │   │   ├── action-guard.ts      # Action guard system
│   │   │   └── types.ts             # Type definitions
│   │   └── __tests__/              # Unit tests
│   │
│   ├── react/                  # @context-action/react
│   │   ├── src/
│   │   │   ├── actions/             # Action context
│   │   │   ├── stores/              # Store system
│   │   │   │   ├── core/           # Store implementation
│   │   │   │   ├── hooks/          # Store hooks
│   │   │   │   └── patterns/       # Store patterns
│   │   │   └── index.ts
│   │   └── __tests__/              # Integration tests
│   │
│   └── llms-generator/         # Documentation tooling
│
├── example/                    # Example application
├── docs/                      # VitePress documentation
└── scripts/                   # Build scripts
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
- **ESLint configuration** is enforced in CI
- **Prettier** for consistent formatting
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
pnpm test:react

# Run tests in watch mode
cd packages/core && pnpm test:watch

# Run tests with coverage
pnpm test --coverage
```

## 📚 Documentation Guidelines

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
chore(deps): update TypeScript to 5.3.2
```

### Pull Request Process
1. **Create feature branch** from `main`
2. **Make changes** following coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run full test suite** and ensure all checks pass
6. **Create pull request** using the PR template
7. **Address review feedback** promptly

### PR Checklist
- [ ] Tests pass locally (`pnpm test`)
- [ ] Types check without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated if needed
- [ ] Example app works if relevant (`pnpm dev`)

## 🏷️ Release Process

### Version Management
We use **Lerna** for automated versioning and publishing:

```bash
# Version bump (maintainers only)
pnpm version:patch  # 0.0.x
pnpm version:minor  # 0.x.0  
pnpm version:major  # x.0.0

# Publish (maintainers only)
pnpm release
```

### Release Notes
- **Automatically generated** from conventional commits
- **Manual enhancement** for major releases
- **Breaking changes** clearly documented
- **Migration guides** for major versions

## 🤝 Community Guidelines

### Code of Conduct
We are committed to providing a welcoming and inclusive experience for everyone. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

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