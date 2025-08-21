# Context-Action Framework

A revolutionary TypeScript state management system designed to overcome the fundamental limitations of existing libraries through **document-centric context separation** and **effective artifact management**.

## 🎯 Core Philosophy

The Context-Action framework addresses critical issues in modern state management:

### Problems with Existing Libraries
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation  
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

### Context-Action's Solution
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**: 
  - View design in isolation → Design Context
  - Development architecture in isolation → Architecture Context  
  - Business logic in isolation → Business Context
  - Data validation in isolation → Validation Context
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

The framework implements an **MVVM-inspired architecture** with clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system) layers, all organized around **context-driven domain isolation**.

## 📦 Packages

### [@context-action/core](./packages/core)

Core action pipeline management with no React dependencies.

```bash
npm install @context-action/core
```

**Features:**
- 🔒 **Type-safe**: Full TypeScript support with strict type checking
- ⚡ **Action Pipeline System**: Centralized action processing with priority-based handler execution
- 🔄 **Async Support**: Handle both sync and async operations seamlessly
- 🛡️ **Action Guard System**: Advanced action filtering, throttling, and execution control
- 🚫 **Error Handling**: Built-in error handling and abort mechanisms with pipeline controller
- 📊 **Execution Modes**: Multiple execution strategies (immediate, throttled, debounced, queued)

### [@context-action/react](./packages/react)

React integration with Context API, hooks, and advanced store system for complete MVVM architecture.

```bash
npm install @context-action/react
```

**Features:**
- 🏪 **Declarative Store Pattern**: Type-safe store management with automatic provider handling
- 🎯 **Action Context Pattern**: Pure action dispatching with centralized pipeline processing
- 🔗 **Pattern Composition**: Combine different patterns for complex state management needs
- 🪝 **Advanced Store Hooks**: `useStoreValue`, `useComputedStore`, `useStoreSelector` with reactive subscriptions
- 🏗️ **HOC Support**: `withProvider()` for automatic component wrapping and context isolation
- 📊 **Store Registry**: Centralized store management with lifecycle handling and cleanup

### [@context-action/llms-generator](./packages/llms-generator)

Advanced documentation management system with AI-ready content generation and priority-driven workflows.

```bash
# Install globally for CLI usage
npm install -g @context-action/llms-generator
```

**Features:**
- 🤖 **LLMS-Ready Content**: Generate character-limited summaries with proper YAML frontmatter
- 📊 **Priority Management**: Automated priority analysis with health scoring and recommendations  
- 🌐 **Multilingual Support**: Advanced English/Korean processing with intelligent language detection
- ⚡ **CLI Tools**: Complete command-line interface with `llms` global command
- 🔄 **Auto-Sync**: Post-commit hooks for seamless documentation workflow
- 🎯 **Work Management**: Priority-driven task discovery with `work-next` command


## 🏗️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install dependencies
pnpm install
```

### Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm build:core    # Build @context-action/core
pnpm build:react   # Build @context-action/react

# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm test:core     # Test @context-action/core

# Run linting
pnpm lint

# Type checking
pnpm type-check

# Clean build artifacts
pnpm clean

# Check what packages have changed
pnpm changed

# See diff of changes
pnpm diff

# LLMS Generator commands (using global CLI)
llms priority-stats          # Priority analysis  
llms priority-health         # Health check
llms work-next              # Find next documentation work
llms clean-llms-generate 500 # Generate 500-char LLMS files

# Local development commands  
pnpm llms:priority-stats     # Priority analysis
pnpm llms:priority-health    # Health check
pnpm llms:sync-docs:ko      # Korean docs only
pnpm llms:sync-docs:en      # English docs only
```

### Version Management

```bash
# Version all changed packages
pnpm version

# Version with specific bump
pnpm version:patch  # Patch release (0.0.x)
pnpm version:minor  # Minor release (0.x.0)
pnpm version:major  # Major release (x.0.0)
```

### Publishing

```bash
# Publish all changed packages
pnpm release

# Publish with version bump
pnpm release:patch  # Bump patch version and publish
pnpm release:minor  # Bump minor version and publish
pnpm release:major  # Bump major version and publish
```

## 🚀 Quick Start

### 🏪 Store Only Pattern (Core Pattern)

For pure state management without action dispatching:

```typescript
import { createDeclarativeStorePattern } from '@context-action/react';

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } }
});

function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  return <div>User: {user.name}</div>;
}
```

### 🎯 Action Only Pattern (Core Pattern)

For pure action dispatching without state management:

```typescript
import { createActionContext } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

interface EventActions extends ActionPayloadMap {
  trackEvent: { event: string; data: any };
}

const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

function App() {
  return (
    <EventActionProvider>
      <EventComponent />
    </EventActionProvider>
  );
}

function EventComponent() {
  const dispatch = useEventAction();
  
  useEventActionHandler('trackEvent', async (payload) => {
    await analytics.track(payload.event, payload.data);
  });
  
  return <button onClick={() => dispatch('trackEvent', { event: 'click', data: {} })}>
    Track Event
  </button>;
}
```

### 🔗 Pattern Composition

For complex applications needing both actions and state management, compose the patterns:

```typescript
import { createActionContext, createDeclarativeStorePattern } from '@context-action/react';
import { ActionPayloadMap } from '@context-action/core';

// Define separate contexts
interface UserActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetUser: void;
}

const { 
  Provider: UserActionProvider, 
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

const UserStores = createDeclarativeStorePattern('UserStores', {
  profile: { id: '', name: '', email: '' },
  preferences: { theme: 'light' as const }
});

// Compose providers and use both patterns
function App() {
  return (
    <UserActionProvider>
      <UserStores.Provider>
        <UserProfile />
      </UserStores.Provider>
    </UserActionProvider>
  );
}

function UserProfile() {
  const profileStore = UserStores.useStore('profile');
  const profile = useStoreValue(profileStore);
  const dispatch = useUserAction();
  
  useUserActionHandler('updateUser', useCallback(async (payload) => {
    profileStore.setValue({ ...profile, ...payload });
  }, [profile, profileStore]));
  
  return <div>Welcome, {profile.name}!</div>;
}
```

## 🏗️ Architecture

### Context Separation Strategy

#### Domain-Based Context Architecture
- **Business Context**: Business logic, data processing, and domain rules
- **UI Context**: Screen state, user interactions, and component behavior
- **Validation Context**: Data validation, form processing, and error handling
- **Design Context**: Theme management, styling, layout, and visual states
- **Architecture Context**: System configuration, infrastructure, and technical decisions

#### Document-Based Context Design
Each context manages its corresponding documentation and deliverables:
- **Design Documentation** → Design Context (themes, component specifications, style guides)
- **Business Requirements** → Business Context (workflows, rules, domain logic)
- **Architecture Documents** → Architecture Context (system design, technical decisions)
- **Validation Specifications** → Validation Context (rules, schemas, error handling)
- **UI Specifications** → UI Context (interactions, state management, user flows)

### Key Architectural Patterns

- **Store Only Pattern**: Pure state management with reactive subscriptions and domain isolation
- **Action Only Pattern**: Pure action dispatching with centralized pipeline processing
- **Action Pipeline System**: All user interactions dispatch actions to a central `ActionRegister` which processes handlers by priority
- **Store Integration Pattern**: 3-step process (read current state → execute business logic → update stores)
- **MVVM Architecture**: Clear separation between View (React components), ViewModel (Action pipeline), and Model (Store system)
- **Domain Isolation**: Complete context boundaries with controlled cross-context communication

## 📁 Project Structure

```
context-action/
├── packages/
│   ├── core/                               # Core action pipeline management
│   │   └── src/
│   │       ├── ActionRegister.ts           # Central action processing
│   │       ├── action-guard.ts             # Action guard system
│   │       ├── execution-modes.ts          # Execution mode management
│   │       ├── types.ts                    # Type definitions
│   │       └── index.ts
│   ├── react/                              # React integration with MVVM architecture
│   │   └── src/
│   │       ├── actions/                    # Action system
│   │       │   ├── ActionContext.tsx       # React action context
│   │       │   └── utils/                  # Action utilities (reserved)
│   │       ├── stores/                     # Advanced store system
│   │       │   ├── core/                   # Core store implementation
│   │       │   │   ├── Store.ts            # Store implementation
│   │       │   │   ├── StoreContext.tsx    # Store context
│   │       │   │   └── StoreRegistry.ts    # Store registry
│   │       │   ├── hooks/                  # Store management hooks
│   │       │   │   ├── useStoreValue.ts    # Store value hook
│   │       │   │   ├── useComputedStore.ts # Computed store hook
│   │       │   │   └── useStoreSelector.ts # Store selector hook
│   │       │   ├── patterns/               # Store patterns
│   │       │   │   └── declarative-store-pattern-v2.tsx # Declarative pattern
│   │       │   └── utils/                  # Store utilities
│   │       └── index.ts
│   ├── llms-generator/                     # 🆕 LLMS Generator CLI & System
│   │   ├── src/
│   │   │   ├── cli/                        # CLI implementation
│   │   │   │   ├── commands/               # Command implementations
│   │   │   │   │   ├── SimpleLLMSCommand.ts      # LLMS content generation
│   │   │   │   │   ├── PriorityManagerCommand.ts # Priority management
│   │   │   │   │   ├── SyncDocsCommand.ts        # Document synchronization
│   │   │   │   │   └── WorkNextCommand.ts        # Work discovery
│   │   │   │   └── index.ts                # CLI entry point
│   │   │   ├── core/                       # Core LLMS functionality
│   │   │   │   ├── EnhancedConfigManager.ts      # Configuration management
│   │   │   │   └── LLMSOutputPathManager.ts      # Path and output management
│   │   │   └── types/                      # Type definitions
│   │   ├── data/                           # JSON schemas and config
│   │   └── bin/llms                        # Global CLI binary
│   └── typedoc-vitepress-sync/             # Documentation tooling
├── example/                                # Comprehensive example application
├── docs/                                   # VitePress documentation site
├── llmsData/                               # 🆕 Generated LLMS content
├── .github/workflows/                      # CI/CD and GitHub Pages deployment
├── .husky/                                 # 🆕 Git hooks for LLMS auto-sync
└── scripts/                                # Build and utility scripts
```

## 📚 Documentation & Conventions

### 📖 Complete Documentation
The Context-Action framework provides comprehensive documentation in multiple languages:

**[📚 Official Documentation](https://mineclover.github.io/context-action/)**

#### English Documentation
- **[Quick Start](https://mineclover.github.io/context-action/en/guide/quick-start)** - Get started in 5 minutes
- **[Complete Guide](https://mineclover.github.io/context-action/en/guide/full)** - MVVM architecture with Context Store Pattern
- **[Best Practices](https://mineclover.github.io/context-action/en/guide/best-practices)** - Production-ready patterns
- **[Performance Guide](https://mineclover.github.io/context-action/en/guide/performance)** - Optimization techniques
- **[Error Handling](https://mineclover.github.io/context-action/en/guide/error-handling)** - Robust error management

#### 한국어 문서
- **[빠른 시작](https://mineclover.github.io/context-action/ko/guide/quick-start)** - 5분만에 시작하기
- **[완전한 가이드](https://mineclover.github.io/context-action/ko/guide/overview)** - MVVM 아키텍처 완벽 가이드
- **[베스트 프랙티스](https://mineclover.github.io/context-action/ko/guide/best-practices)** - 프로덕션 준비된 패턴들

### 📋 Development Guidelines

**[📋 Coding Conventions](./docs/CONVENTIONS.md)** - 종합적인 코딩 컨벤션과 베스트 프랙티스
- **리네이밍 패턴**: 도메인별 명확한 네이밍 전략
- **파일 구조**: 프로젝트 조직화 가이드라인
- **패턴 사용법**: Store Pattern과 Action Pattern 활용법
- **타입 정의**: TypeScript 타입 안전성 보장
- **성능 가이드라인**: 최적화 기법과 성능 측정

**[📖 Pattern Guide](./packages/react/docs/PATTERN_GUIDE.md)** - React 통합 패턴 완전 가이드
- **Store Only Pattern**: 순수한 상태 관리 패턴
- **Action Only Pattern**: 액션 디스패칭 패턴  
- **Pattern Composition**: 복합 패턴 활용법
- **HOC Pattern**: Higher-Order Component 패턴
- **Provider Isolation**: 독립적인 컨텍스트 관리

**[📐 Documentation Guidelines](./docs/DOCUMENTATION_GUIDELINES.md)** - 문서화 표준 및 가이드라인

### 🤖 LLMS Generator v0.3.1 - Advanced Documentation Management

The Context-Action framework includes a sophisticated **LLMS Generator** system for comprehensive documentation management and priority-driven development workflows.

#### **🚀 New in v0.3.1**
- ✅ **Global CLI Installation**: Install with `npm install -g @context-action/llms-generator`
- ✅ **Improved YAML Frontmatter**: All LLMS files now include complete metadata
- ✅ **Fixed File Naming**: Consistent `priority.json` naming across all templates
- ✅ **Manual Commit Workflow**: Auto-commit disabled, manual control over LLMS updates
- ✅ **Enhanced Link Generation**: Proper original document paths in generated content

#### **Priority Management System**

Automated tools for analyzing, maintaining, and optimizing documentation priorities:

```bash
# Global CLI usage (recommended)
llms priority-stats         # Statistical analysis
llms priority-health        # Consistency checks
llms priority-suggest       # Actionable recommendations
llms priority-auto          # Auto-recalculate priorities
llms work-next             # Find next priority work

# Local development commands
pnpm llms:priority-stats    # Statistical analysis
pnpm llms:priority-health   # Consistency checks
pnpm llms:priority-suggest  # Actionable recommendations
pnpm llms:priority-auto     # Auto-recalculate priorities

# Manage priority.json files themselves
llms priority-tasks         # Find missing/outdated/invalid priority files
llms priority-tasks --fix   # Auto-fix detected issues
```

**Features:**
- **Health Scoring**: 0-100 health scores with automatic issue detection
- **Priority Task Management**: Detect and fix missing, outdated, or invalid priority.json files
- **Top N Priority Lists**: View top priority documents with `pnpm llms:work-top10`
- **Statistical Analysis**: Distribution analysis across categories and languages
- **Smart Suggestions**: Data-driven recommendations for improvement
- **Automated Calculation**: Configurable criteria-based priority assignment

#### **LLMS Content Generation**

Generate AI-ready content with proper metadata and character limits:

```bash
# Global CLI usage (recommended)
llms clean-llms-generate 500 --language en    # Generate 500-char English files
llms clean-llms-generate 1000 --language ko   # Generate 1000-char Korean files  
llms clean-llms-generate --pattern minimal    # Generate minimal pattern files
llms generate-templates --category guide      # Generate guide templates

# Check generated content
llms work-next --show-completed               # View completed documentation
```

#### **Multilingual Document Processing**

Advanced language filtering and processing capabilities for English and Korean documentation:

```bash
# Language-specific processing (local development)
pnpm llms:sync-docs:ko     # Korean documents only 🇰🇷
pnpm llms:sync-docs:en     # English documents only 🇺🇸
pnpm llms:sync-docs:dry    # Preview mode

# Advanced filtering (global CLI)
llms sync-docs --languages ko,en --changed-files files...
llms sync-docs --only-korean --changed-files files...
```

**v0.3.1 Automated Workflow:**
- **Post-commit Hook**: Automatically detects `docs/(en|ko)/**/*.md` changes
- **Template Generation**: Creates 7 character-limited summaries (100-5000 chars) with YAML frontmatter
- **Priority Metadata**: Generates `priority.json` with enhanced metadata and proper naming
- **Manual Commit Control**: Files are staged but require manual commit for better control

#### **Generated Documentation Structure (v0.3.1)**

```
llmsData/
├── en/
│   ├── guide--example/              # Document directory
│   │   ├── priority.json           # ✅ Fixed naming (no prefix)
│   │   ├── guide--example-100.md   # 100 character summary
│   │   ├── guide--example-500.md   # 500 character summary
│   │   ├── guide--example-1000.md  # 1000 character summary
│   │   └── guide--example-5000.md  # 5000 character summary
│   └── guide/                       # Alternative structure  
│       ├── example-100.md          # 100 character summary
│       ├── example-500.md          # 500 character summary
│       └── example-5000.md         # 5000 character summary
└── ko/guide--example/              # Korean templates
    ├── priority.json               # 우선순위 메타데이터
    ├── guide--example-100.md       # 100자 요약 (YAML 포함)
    ├── guide--example-500.md       # 500자 요약 (YAML 포함)
    └── guide--example-5000.md      # 5000자 요약 (YAML 포함)
```

**v0.3.1 File Format Improvements:**
- ✅ **YAML Frontmatter**: All `.md` files include complete metadata
- ✅ **Consistent Naming**: `priority.json` without document prefix
- ✅ **Proper Source Paths**: Links reference original documents (`en/guide/example.md`)
- ✅ **Enhanced Metadata**: Priority scores, completion status, workflow stage

#### **Complete CLI Reference**

**[📋 LLMS CLI Reference](./docs/en/guide/llms-cli-reference.md)** - Complete command documentation
**[📋 LLMS CLI 참조](./docs/ko/guide/llms-cli-reference.md)** - 완전한 명령어 문서

**Core Commands:**
- `sync-docs`: Process changed documentation with language filtering
- `priority-*`: Priority management and health monitoring  
- `priority-tasks`: Manage priority.json files (missing, outdated, invalid)
- `generate-templates`: Create character-limited templates
- `work-next`: Find next documentation work or show top N priority items
- `init`: Initialize LLMS Generator in new projects

> **Note**: LLMS files are automatically generated and managed by the post-commit hook system. The system supports both English and Korean documentation with intelligent language detection and processing.

## 🛠️ Technology Stack

- **Package Manager**: pnpm with workspaces + Lerna
- **Monorepo Tool**: Lerna 8.x for versioning and publishing
- **Language**: TypeScript 5.3+
- **Bundler**: tsdown (powered by rolldown)
- **Documentation**: VitePress with dual-language support (English/Korean)
- **Code Quality**: ESLint + TypeScript strict mode
- **Testing**: Jest + TypeScript

## 📝 Contributing

We welcome contributions to the Context-Action framework! Please follow these guidelines:

### Development Workflow
1. **Setup**: Clone the repository and run `pnpm install`
2. **Development**: Use `pnpm dev` for live example app development
3. **Changes**: Make changes following our [coding conventions](./docs/CONVENTIONS.md)
4. **Testing**: Run `pnpm test` and `pnpm type-check`
5. **Building**: Run `pnpm build` before committing
6. **Documentation**: Update docs for public API changes
7. **Commit**: Follow conventional commit messages
8. **Pull Request**: Submit a well-documented PR

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow project ESLint configuration
- **Testing**: Maintain or improve test coverage
- **Documentation**: Update relevant documentation files
- **Conventions**: Follow [CONVENTIONS.md](./docs/CONVENTIONS.md) guidelines

## 📄 License

Apache-2.0 © [mineclover](https://github.com/mineclover)

## 🎮 Interactive Examples

Explore the Context-Action framework through our comprehensive live examples:

**[🚀 Live Example Application](https://mineclover.github.io/context-action/example/)**

### Featured Demonstrations

#### 🏪 **Store System Examples**
- **Store Basics** - Fundamental store operations and reactive subscriptions
- **Store Full Demo** - Complete store integration with complex state management
- **Immutability Test** - Deep immutability verification and performance testing
- **Declarative Store Pattern** - Type-safe store patterns with automatic provider handling

#### 🎯 **Action System Examples**
- **Core Basics & Advanced** - Action pipeline fundamentals and advanced patterns
- **Core Features** - Comprehensive action system capabilities
- **Action Guard System** - Advanced action filtering and execution control
- **Priority Performance** - Priority-based action execution and performance optimization

#### 🛡️ **Action Guard Demonstrations**
- **Search Demo** - Debounced search with intelligent action filtering
- **Scroll Demo** - Throttled scroll events with performance optimization
- **API Blocking Demo** - Duplicate API call prevention and request management
- **Mouse Events Demo** - Real-time mouse tracking with Context Store Pattern
- **Throttle Comparison** - Performance comparison between different throttling strategies

#### 🔗 **React Integration Examples**
- **React Context** - Context API integration and provider patterns
- **React Hooks** - Advanced hook usage and store subscriptions
- **React Provider** - Unified provider setup and management
- **useActionWithResult** - Action dispatching with result handling

#### 🌟 **Advanced Patterns**
- **Unified Pattern Demo** - Complete MVVM architecture demonstration
- **Enhanced Context Store** - Individual store access with selective subscriptions
- **Concurrent Actions** - Multiple action coordination and synchronization
- **Enhanced Abortable Search** - Advanced search with abort capabilities
- **Toast Config Example** - Real-world notification system implementation

#### 📊 **Performance & Monitoring**
- **Logger System** - Built-in logging and debugging capabilities
- **Dispatch Options Test** - Action dispatch configuration testing
- **Real-time Analytics** - Live performance metrics and computed value tracking

## 🔗 Links

### 📚 Documentation & Examples
- [📚 Complete Documentation](https://mineclover.github.io/context-action/) - Official documentation with API reference
- [🎮 Live Interactive Examples](https://mineclover.github.io/context-action/example/) - 20+ working demonstrations
- [📋 Coding Conventions](./docs/CONVENTIONS.md) - Development standards and best practices
- [📖 Pattern Guide](./packages/react/docs/PATTERN_GUIDE.md) - React integration patterns

### 📦 Package Information
- [Core Package](./packages/core) - @context-action/core (Pure TypeScript)
- [React Package](./packages/react) - @context-action/react (React integration)
- [API Reference](https://mineclover.github.io/context-action/api/) - Generated TypeScript API docs

### 🤝 Community & Support
- [Issues](https://github.com/mineclover/context-action/issues) - Bug reports and feature requests
- [Discussions](https://github.com/mineclover/context-action/discussions) - Community discussions and Q&A
- [Release Notes](./RELEASE.md) - Version history and publishing guide
- [한국어 README](./README.ko.md) - Korean version