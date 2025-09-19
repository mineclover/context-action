# IDE Setup and Tips

Configure your development environment for optimal TypeScript experience with Context-Action.

## 🛠️ VS Code Configuration

### Essential Extensions

Install these VS Code extensions for the best TypeScript experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",    // Latest TypeScript features
    "bradlc.vscode-tailwindcss",           // If using Tailwind CSS
    "esbenp.prettier-vscode",              // Code formatting
    "ms-vscode.vscode-eslint",             // Linting
    "usernamehw.errorlens",                // Inline error display
    "ms-vscode.vscode-json",               // JSON support
    "formulahendry.auto-rename-tag",       // JSX tag renaming
    "christian-kohler.path-intellisense",  // Path autocompletion
    "ms-vscode.vscode-typescript-hero"     // TypeScript refactoring
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json` in your project root:

```json
{
  // TypeScript settings
  "typescript.preferences.quoteStyle": "single",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.completeFunctionCalls": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.inlayHints.parameterNames.enabled": "literals",
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,

  // Editor settings for better type experience
  "editor.quickSuggestions": {
    "strings": true
  },
  "editor.suggest.insertMode": "replace",
  "editor.acceptSuggestionOnCommitCharacter": false,
  "editor.wordBasedSuggestions": false,
  "editor.parameterHints.enabled": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },

  // IntelliSense settings
  "editor.suggestSelection": "first",
  "editor.tabCompletion": "on",
  "editor.snippetSuggestions": "top",

  // Files to exclude from suggestions
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/*.map": true
  },

  // Search settings
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

### Project-specific Tasks

Create `.vscode/tasks.json` for common development tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "TypeScript: Check All",
      "type": "shell",
      "command": "pnpm",
      "args": ["type-check"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": "$tsc"
    },
    {
      "label": "Build All Packages",
      "type": "shell",
      "command": "pnpm",
      "args": ["build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## 🔧 TypeScript Configuration

### Recommended tsconfig.json

```json
{
  "compilerOptions": {
    // Type checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Module resolution
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    // Interop
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,

    // Language features
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,

    // JSX
    "jsx": "react-jsx",

    // Advanced
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/actions/*": ["./src/actions/*"]
    }
  },
  "include": [
    "src/**/*",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.*",
    "**/*.spec.*"
  ]
}
```

### ESLint Configuration for TypeScript

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Context-Action specific recommendations
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

## 🎯 IntelliSense Optimization

### Import Auto-completion

Configure VS Code for better import suggestions:

```json
// .vscode/settings.json
{
  "typescript.suggest.includeCompletionsForImportStatements": true,
  "typescript.suggest.includeCompletionsWithSnippetText": true,
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.preferences.quoteStyle": "single",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Custom Snippets

Create `.vscode/snippets/typescript-context-action.json`:

```json
{
  "Create Store Context": {
    "prefix": "createStoreContext",
    "body": [
      "const { Provider: ${1:Name}StoreProvider, useStore: use${1:Name}Store } = createStoreContext('${1:Name}', {",
      "  ${2:storeName}: ${3:initialValue}$0",
      "});"
    ],
    "description": "Create a store context with proper naming"
  },
  "Create Action Context": {
    "prefix": "createActionContext",
    "body": [
      "const {",
      "  Provider: ${1:Name}ActionProvider,",
      "  useActionDispatch: use${1:Name}Action,",
      "  useActionHandler: use${1:Name}ActionHandler",
      "} = createActionContext<${1:Name}Actions>('${1:Name}Actions');"
    ],
    "description": "Create an action context with proper naming"
  },
  "Action Handler": {
    "prefix": "useActionHandler",
    "body": [
      "use${1:Context}ActionHandler('${2:actionName}', useCallback(async (payload${3:, controller}) => {",
      "  ${4:// Handler logic}",
      "}, [${5:dependencies}]));"
    ],
    "description": "Create an action handler with useCallback"
  },
  "Store Subscription": {
    "prefix": "useStoreValue",
    "body": [
      "const ${1:varName}Store = use${2:Context}Store('${3:storeName}');",
      "const ${1:varName} = useStoreValue(${1:varName}Store);"
    ],
    "description": "Subscribe to store value"
  }
}
```

## 🔍 Debugging TypeScript Issues

### Type Information Commands

Use these VS Code commands for type debugging:

1. **Go to Type Definition** (`Ctrl+Click` on types)
2. **Show All References** (`Shift+F12`)
3. **Rename Symbol** (`F2`)
4. **Quick Fix** (`Ctrl+.`)

### TypeScript Commands in Command Palette

- `TypeScript: Restart TS Server` - Restart when types get confused
- `TypeScript: Reload Projects` - Reload project configuration
- `TypeScript: Go to Source Definition` - Navigate to implementation
- `TypeScript: Find All References` - Find usage across project

### Debugging Type Errors

```typescript
// ✅ Use type assertions temporarily for debugging
const debugValue = someComplexValue as any;
console.log('Type:', typeof debugValue);

// ✅ Check inferred types with utility types
type DebugType = typeof someValue; // Hover to see inferred type

// ✅ Use satisfies for type validation
const config = {
  theme: 'dark',
  size: 'large'
} satisfies ConfigType; // Validates type without widening

// ✅ Isolate type issues
type TestType<T> = T extends string ? 'string' : 'other';
type Result = TestType<MyComplexType>; // Test conditional types
```

## ⚡ Performance Optimization

### TypeScript Performance Settings

```json
// tsconfig.json
{
  "compilerOptions": {
    // Performance optimizations
    "skipLibCheck": true,              // Skip type checking of declaration files
    "incremental": true,               // Enable incremental compilation
    "tsBuildInfoFile": ".tsbuildinfo", // Cache build information
    "composite": true                  // Enable project references
  },
  "ts-node": {
    "transpileOnly": true,             // Faster compilation for development
    "experimentalSpecifierResolution": "node"
  }
}
```

### VS Code Performance

```json
// .vscode/settings.json
{
  // Limit TypeScript memory usage
  "typescript.tsserver.maxTsServerMemory": 4096,

  // Disable expensive features in large projects
  "typescript.disableAutomaticTypeAcquisition": false,
  "typescript.suggest.autoImports": true,

  // File watching optimization
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/.git/**": true
  }
}
```

## 🎨 Advanced IDE Features

### Custom Type Hover Information

Add JSDoc comments for better hover information:

```typescript
/**
 * Creates a type-safe store context for managing application state
 *
 * @template T - Record of store names to their value types
 * @param contextName - Unique identifier for the store context
 * @param initialStores - Initial store configurations or values
 * @returns Object containing Provider, useStore, and utility hooks
 *
 * @example
 * ```typescript
 * const { Provider, useStore } = createStoreContext('MyApp', {
 *   user: { name: '', email: '' },
 *   count: 0
 * });
 * ```
 */
export function createStoreContext<T extends Record<string, any>>(
  contextName: string,
  initialStores: InitialStores<T>
) {
  // Implementation
}
```

### Error Lens Integration

Install Error Lens extension for inline error display and configure:

```json
// .vscode/settings.json
{
  "errorLens.enabledDiagnosticLevels": ["error", "warning", "info"],
  "errorLens.excludeBySource": ["cSpell", "Grammarly"],
  "errorLens.messageTemplate": "$message - $source",
  "errorLens.delay": 500
}
```

### Quick Actions

Set up keyboard shortcuts in `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+i",
    "command": "editor.action.organizeImports",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+shift+r",
    "command": "typescript.restartTsServer",
    "when": "editorTextFocus"
  },
  {
    "key": "alt+shift+f",
    "command": "editor.action.formatDocument",
    "when": "editorTextFocus"
  }
]
```

## 🔗 Integration with Build Tools

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/actions': path.resolve(__dirname, './src/actions')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'context-action': ['@context-action/react', '@context-action/core']
        }
      }
    }
  }
});
```

### Webpack Configuration

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/stores': path.resolve(__dirname, 'src/stores'),
      '@/actions': path.resolve(__dirname, 'src/actions')
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
```

## 🔗 Related Sections

- [Store Type Inference](./stores.md) - Store typing fundamentals
- [Action Type Inference](./actions.md) - Action payload typing
- [Best Practices](./best-practices.md) - Type safety recommendations

---

**Next**: Learn about [Practical Examples](./examples.md)