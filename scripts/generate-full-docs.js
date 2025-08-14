#!/usr/bin/env node

/**
 * Full LLM Document Generator
 * 
 * Generates comprehensive LLM integration documents by combining all available sources:
 * - All concept documentation
 * - All API documentation  
 * - All examples
 * - Development commands and setup information
 * 
 * Creates language-specific full documentation files:
 * - docs/llm-content/en/llms-full.txt
 * - docs/llm-content/ko/llms-full.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../docs/en');
const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];

class FullDocGenerator {
  constructor(language) {
    this.language = language;
    this.outputDir = path.join(LLM_CONTENT_DIR, language);
  }

  readFileIfExists(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Warning: Could not read ${filePath}`);
      return null;
    }
  }

  cleanMarkdown(content) {
    if (!content) return '';
    
    // Remove VitePress-specific syntax
    content = content.replace(/:::\s*\w+[\s\S]*?:::/g, '');
    
    // Remove excessive whitespace
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Remove navigation links at the end
    content = content.replace(/## Related[\s\S]*$/, '');
    
    return content.trim();
  }

  generateHeader() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
    );

    if (this.language === 'ko') {
      return `# Context-Action 프레임워크 - 완전한 LLM 통합 가이드 v${packageJson.version}

생성일: ${new Date().toISOString().split('T')[0]}

## 프레임워크 개요

Context-Action은 문서 중심 컨텍스트 분리와 MVVM 아키텍처를 통해 기존 상태 관리 라이브러리의 근본적 한계를 해결하는 혁신적인 TypeScript 상태 관리 프레임워크입니다.

### 핵심 철학
- **문서 중심 컨텍스트 분리**: 각 컨텍스트가 특정 문서 도메인을 나타냄 (디자인, 아키텍처, 비즈니스, 검증)
- **완벽한 관심사 분리**: 뷰 디자인, 개발 아키텍처, 비즈니스 로직, 데이터 검증의 격리
- **MVVM 아키텍처**: View(컴포넌트), ViewModel(액션), Model(스토어) 간의 명확한 분리
- **타입 안전성 우선**: 엄격한 타입 검사를 통한 완전한 TypeScript 지원

### 해결하는 문제점
- **높은 React 결합도**: 기존 라이브러리의 강한 결합으로 인한 컴포넌트 모듈화 어려움
- **이분법적 상태 접근**: 단순한 전역/지역 상태 이분법으로는 범위 기반 분리 처리 불가
- **불충분한 핸들러/트리거 관리**: 복잡한 상호작용과 비즈니스 로직 처리에 대한 부실한 지원

### 패키지 구조
- \`@context-action/core\` - 핵심 액션 파이프라인 관리 (React 의존성 없음)
- \`@context-action/react\` - Context API 및 훅을 통한 React 통합

### 설치
\`\`\`bash
npm install @context-action/core @context-action/react
# 또는
pnpm add @context-action/core @context-action/react
# 또는
yarn add @context-action/core @context-action/react
\`\`\`

### 요구사항
- TypeScript 4.5+
- React 16.8+ (React 패키지용)
- ES2018+ 브라우저 지원

### 번들 크기
- 코어 패키지: ~15KB 압축
- React 패키지: ~25KB 압축
- 통합: ~35KB 총 크기 (트리 쉐이킹 가능)

---

`;
    } else {
      return `# Context-Action Framework - Complete LLM Integration Guide v${packageJson.version}

Generated from documentation sources on ${new Date().toISOString().split('T')[0]}

## Framework Overview

Context-Action is a revolutionary TypeScript state management framework that solves fundamental limitations through document-centric context separation and MVVM architecture.

### Core Philosophy
- **Document-Centric Context Separation**: Each context represents specific document domains (design, architecture, business, validation)
- **Perfect Separation of Concerns**: Isolated view design, development architecture, business logic, data validation
- **MVVM Architecture**: Clear separation between View (components), ViewModel (actions), Model (stores)
- **Type Safety First**: Full TypeScript support with strict type checking

### Problems Solved
- **High React Coupling**: Existing libraries create tight integration making component modularization difficult
- **Binary State Approach**: Simple global/local dichotomy fails to handle scope-based separation
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic

### Package Structure
- \`@context-action/core\` - Core action pipeline management (no React dependency)
- \`@context-action/react\` - React integration with Context API and hooks

### Installation
\`\`\`bash
npm install @context-action/core @context-action/react
# or
pnpm add @context-action/core @context-action/react
# or
yarn add @context-action/core @context-action/react
\`\`\`

### Requirements
- TypeScript 4.5+
- React 16.8+ (for React package)
- ES2018+ browser support

### Bundle Sizes
- Core package: ~15KB minified
- React package: ~25KB minified
- Combined: ~35KB total (tree-shakeable)

---

`;
    }
  }

  generateKoreanContent() {
    return `
## 두 가지 주요 패턴

Context-Action 프레임워크는 사용 사례에 따라 선택할 수 있는 두 가지 주요 패턴을 제공합니다:

### 🎯 Action Only 패턴
**사용 시기**: 상태 관리 없이 순수 액션 디스패칭 (이벤트 시스템, 명령 패턴)

**특징**:
- ✅ 타입 안전한 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

**기본 사용법**:
\`\`\`typescript
// 1. 액션 정의
interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

// 2. 컨텍스트 생성 (도메인별 리네이밍 패턴)
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

// 3. Provider 설정
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. 컴포넌트에서 사용
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  // 액션 핸들러 등록 (리네이밍된 훅 사용)
  useEventActionHandler('userClick', (payload, controller) => {
    console.log('사용자가 클릭한 위치:', payload.x, payload.y);
    // 순수 부수 효과, 상태 관리 없음
  });
  
  useEventActionHandler('analytics', async (payload) => {
    await fetch('/analytics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
    dispatch('analytics', { event: 'click', data: { timestamp: Date.now() } });
  };
  
  return <button onClick={handleClick}>클릭하세요</button>;
}
\`\`\`

### 🏪 Store Only 패턴 (권장)
**사용 시기**: 액션 디스패칭 없이 순수 상태 관리 (데이터 레이어, 단순 상태)

**주요 특징**:
- ✅ 수동 타입 어노테이션 없이 우수한 타입 추론
- ✅ 스토어 관리에 집중된 단순화된 API
- ✅ 직접 값 또는 구성 객체 지원
- ✅ 별도의 \`createStore\` 호출 불필요

**기본 사용법**:
\`\`\`typescript
// 1. 타입 추론을 사용한 스토어 정의 (도메인별 리네이밍 패턴)
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  // 단순 직접 값 - 가장 깔끔한 문법
  counter: 0,
  userName: '',
  isLoggedIn: false,
  
  // 복잡한 타입을 위한 구성 객체
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow',
    description: '사용자 프로필 데이터'
  },
  
  // 타입 안전성을 가진 중첩 구조
  settings: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      language: 'ko',
      notifications: true
    },
    strategy: 'shallow'
  }
});

// 2. Provider 설정 (최소한의 보일러플레이트)
function App() {
  return (
    <AppStoreProvider>
      <UserProfile />
      <Settings />
    </AppStoreProvider>
  );
}

// 3. 우수한 타입 추론을 가진 컴포넌트 사용
function UserProfile() {
  // 완벽한 타입 추론 - 수동 타입 어노테이션 불필요!
  const counterStore = useAppStore('counter');      // Store<number>
  const userStore = useAppStore('user');           // Store<{id: string, name: string, email: string}>
  const settingsStore = useAppStore('settings');   // Store<{theme: 'light' | 'dark', language: string, notifications: boolean}>
  
  // 값 구독
  const counter = useStoreValue(counterStore);
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  const incrementCounter = () => {
    counterStore.setValue(counter + 1);
  };
  
  const updateUser = () => {
    userStore.setValue({
      ...user,
      name: '홍길동',
      email: 'hong@example.com'
    });
  };
  
  const toggleTheme = () => {
    settingsStore.setValue({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light'
    });
  };
  
  return (
    <div data-theme={settings.theme}>
      <div>카운터: {counter}</div>
      <div>사용자: {user.name} ({user.email})</div>
      <div>테마: {settings.theme}</div>
      
      <button onClick={incrementCounter}>+1</button>
      <button onClick={updateUser}>사용자 업데이트</button>
      <button onClick={toggleTheme}>테마 전환</button>
    </div>
  );
}
\`\`\`

## 핵심 컨벤션

### 🏷️ 네이밍 규칙
- **도메인별 리네이밍**: \`Provider: AppStoreProvider\` 형태로 의미있는 이름 사용
- **컨텍스트 이름**: 명확하고 도메인을 나타내는 이름 ('App', 'User', 'Events' 등)
- **액션 이름**: 동사형 camelCase (\`updateUser\`, \`deleteItem\`)
- **스토어 이름**: 명사형 camelCase (\`user\`, \`settings\`, \`products\`)

### 📋 패턴 규칙
- **단일 책임**: 각 패턴은 하나의 목적만 담당
- **컨텍스트 격리**: 도메인별로 독립적인 컨텍스트 관리
- **타입 안전성**: 모든 상호작용에서 TypeScript 타입 활용

### 🎯 모범 사례
- **useCallback 사용**: 액션 핸들러 등록 시 성능 최적화
- **도메인 분리**: 비즈니스, UI, 검증 등 명확한 도메인 경계
- **Provider 계층**: 필요한 범위에만 Provider 적용

## Store Integration 3-Step Process

액션 핸들러에서 스토어와 통합할 때 다음 3단계 프로세스를 따릅니다:

1. **현재 상태 읽기**: \`store.getValue()\`를 사용하여 스토어에서 현재 상태 읽기
2. **비즈니스 로직 실행**: 페이로드와 현재 상태를 사용하여 비즈니스 로직 실행
3. **스토어 업데이트**: \`store.setValue()\` 또는 \`store.update()\`를 사용하여 스토어 업데이트

\`\`\`typescript
// Store Integration 3-Step Process 예제
useActionHandler('updateProfile', useCallback(async (payload, controller) => {
  try {
    // 1단계: 현재 상태 읽기
    const profileStore = storeManager.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 2단계: 비즈니스 로직 실행
    const updatedProfile = await updateUserProfile(payload.data);
    
    // 3단계: 스토어 업데이트
    profileStore.setValue({ ...currentProfile, ...updatedProfile });
    
    // 성공 알림
    dispatch('showNotification', { 
      type: 'success', 
      message: '프로필이 업데이트되었습니다.' 
    });
  } catch (error) {
    controller.abort('프로필 업데이트 실패', error);
  }
}, [dispatch, storeManager]));
\`\`\`

## 필수 개발 명령어

### 기본 명령어
\`\`\`bash
# 설정
pnpm install                # 의존성 설치
pnpm build                  # 모든 패키지 빌드

# 개발
pnpm dev                    # 예제 앱 개발 서버
pnpm test                   # 테스트 실행
pnpm lint                   # ESLint 검사
pnpm type-check             # TypeScript 컴파일 검사

# 패키지별
pnpm build:core             # 코어 패키지 빌드
pnpm build:react            # React 패키지 빌드
pnpm test:core              # 코어 패키지 테스트

# 문서
pnpm docs:dev               # VitePress 개발 서버
pnpm docs:build             # 문서 빌드
pnpm docs:api               # API 문서 생성
\`\`\`

### 버전 관리
\`\`\`bash
pnpm version:patch          # 패치 버전 증가
pnpm version:minor          # 마이너 버전 증가
pnpm version:major          # 메이저 버전 증가
pnpm release                # 변경된 패키지 게시
\`\`\`

## 빠른 구현 체크리스트

### Action Only 패턴용:
- [ ] \`ActionPayloadMap\`을 확장하는 액션 인터페이스 정의
- [ ] 도메인별 리네이밍과 함께 \`createActionContext<T>()\` 사용
- [ ] \`useCallback\`과 적절한 옵션으로 핸들러 등록
- [ ] \`controller.abort()\` 또는 결과 공유를 통한 오류 처리 구현
- [ ] 실행 순서를 위한 적절한 우선순위 사용

### Store Only 패턴용:
- [ ] 타입 추론을 가진 스토어 구성 설계
- [ ] 도메인별 리네이밍과 함께 \`createDeclarativeStorePattern()\` 사용
- [ ] \`useStoreValue()\`로 반응적 구독
- [ ] 스토어 메서드(\`setValue\`, \`update\`) 적절히 사용
- [ ] 복잡한 스토어 타입에 대한 검증 구현

### 패턴 구성용:
- [ ] 관심사 분리: 로직용 액션, 상태용 스토어
- [ ] 적절한 Provider 계층 구조 사용
- [ ] 핸들러에서 Store Integration 3-Step Process 구현
- [ ] 더 깔끔한 Provider 래핑을 위한 HOC 패턴 사용 고려

---

이 가이드는 LLM이 Context-Action 프레임워크를 효과적으로 이해하고 작업할 수 있도록 모든 필수 패턴, API, 컨벤션, 모범 사례를 포괄적으로 다루고 있습니다.

문서 소스에서 자동 생성됨. 직접 편집하지 마세요.
`;
  }

  generateEnglishContent() {
    const sourceFiles = [
      // Core concepts
      { file: 'concept/conventions.md', section: 'Framework Conventions and Best Practices' },
      { file: 'concept/pattern-guide.md', section: 'Pattern Implementation Guide' },
      { file: 'concept/architecture-guide.md', section: 'MVVM Architecture Guide' },
      { file: 'concept/action-pipeline-guide.md', section: 'Action Pipeline System Guide' },
      { file: 'concept/hooks-reference.md', section: 'Hooks Reference Documentation' },
      
      // API specifications 
      { file: 'api/store-only.md', section: 'Store Only Pattern API' },
      { file: 'api/action-only.md', section: 'Action Only Pattern API' },
      { file: 'api/store-manager.md', section: 'Store Manager API' },
      { file: 'api/action-registry.md', section: 'Action Registry API' },
      { file: 'api/pipeline-controller.md', section: 'Pipeline Controller API' },
      { file: 'api/declarative-store-pattern.md', section: 'Declarative Store Pattern API' },
      
      // Example references
      { file: 'examples/basic-setup.md', section: 'Basic Setup Example', includeCodeOnly: true },
    ];

    let content = '';
    
    for (const { file, section, includeCodeOnly } of sourceFiles) {
      const filePath = path.join(DOCS_DIR, file);
      const fileContent = this.readFileIfExists(filePath);
      
      if (fileContent) {
        console.log(`📄 Processing ${file}...`);
        
        content += `# ${section}\n\n`;
        
        if (includeCodeOnly) {
          // For examples, only include code blocks
          const codeBlockRegex = /```(?:typescript|tsx|javascript|jsx)\n([\s\S]*?)\n```/g;
          const codeBlocks = [];
          let match;
          
          while ((match = codeBlockRegex.exec(fileContent)) !== null) {
            codeBlocks.push('```typescript\n' + match[1] + '\n```');
          }
          
          if (codeBlocks.length > 0) {
            content += codeBlocks.join('\n\n') + '\n\n';
          }
        } else {
          // Include full content but clean it
          const cleanedContent = this.cleanMarkdown(fileContent);
          content += cleanedContent + '\n\n';
        }
        
        content += '---\n\n';
      } else {
        console.warn(`⚠️  Skipping ${file} (file not found)`);
      }
    }

    return content;
  }

  generateFooter() {
    if (this.language === 'ko') {
      return `
## 개발 명령어

### 필수 명령어
\`\`\`bash
# 설정
pnpm install                # 의존성 설치
pnpm build                  # 모든 패키지 빌드

# 개발
pnpm dev                    # 예제 앱 개발 서버
pnpm test                   # 테스트 실행
pnpm lint                   # ESLint 검사
pnpm type-check             # TypeScript 컴파일 검사

# 패키지별
pnpm build:core             # 코어 패키지 빌드
pnpm build:react            # React 패키지 빌드
pnpm test:core              # 코어 패키지 테스트

# 문서
pnpm docs:dev               # VitePress 개발 서버
pnpm docs:build             # 문서 빌드
pnpm docs:api               # API 문서 생성
\`\`\`

### 버전 관리
\`\`\`bash
pnpm version:patch          # 패치 버전 증가
pnpm version:minor          # 마이너 버전 증가
pnpm version:major          # 메이저 버전 증가
pnpm release                # 변경된 패키지 게시
\`\`\`

## 빠른 구현 체크리스트

### Action Only 패턴용:
- [ ] \`ActionPayloadMap\`을 확장하는 액션 인터페이스 정의
- [ ] 도메인별 리네이밍과 함께 \`createActionContext<T>()\` 사용
- [ ] \`useCallback\`과 적절한 옵션으로 핸들러 등록
- [ ] \`controller.abort()\` 또는 결과 공유를 통한 오류 처리 구현
- [ ] 실행 순서를 위한 적절한 우선순위 사용

### Store Only 패턴용:
- [ ] 타입 추론을 가진 스토어 구성 설계
- [ ] 도메인별 리네이밍과 함께 \`createDeclarativeStorePattern()\` 사용
- [ ] \`useStoreValue()\`로 반응적 구독
- [ ] 스토어 메서드(\`setValue\`, \`update\`) 적절히 사용
- [ ] 복잡한 스토어 타입에 대한 검증 구현

### 패턴 구성용:
- [ ] 관심사 분리: 로직용 액션, 상태용 스토어
- [ ] 적절한 Provider 계층 구조 사용
- [ ] 핸들러에서 Store Integration 3-Step Process 구현
- [ ] 더 깔끔한 Provider 래핑을 위한 HOC 패턴 사용 고려

---

이 가이드는 LLM이 Context-Action 프레임워크를 효과적으로 이해하고 작업할 수 있도록 모든 필수 패턴, API, 컨벤션, 모범 사례를 포괄적으로 다루고 있습니다.

문서 소스에서 자동 생성됨. 직접 편집하지 마세요.
`;
    } else {
      return `
## Development Commands

### Essential Commands
\`\`\`bash
# Setup
pnpm install                # Install dependencies
pnpm build                  # Build all packages

# Development
pnpm dev                    # Example app dev server
pnpm test                   # Run tests
pnpm lint                   # ESLint check
pnpm type-check             # TypeScript compilation

# Package-specific
pnpm build:core             # Build core package
pnpm build:react            # Build React package
pnpm test:core              # Test core package

# Documentation
pnpm docs:dev               # VitePress dev server
pnpm docs:build             # Build documentation
pnpm docs:api               # Generate API docs
\`\`\`

### Version Management
\`\`\`bash
pnpm version:patch          # Patch version bump
pnpm version:minor          # Minor version bump
pnpm version:major          # Major version bump
pnpm release                # Publish changed packages
\`\`\`

## Quick Implementation Checklist

### For Action Only Pattern:
- [ ] Define action interface extending \`ActionPayloadMap\`
- [ ] Use \`createActionContext<T>()\` with domain-specific renaming
- [ ] Register handlers with \`useCallback\` and proper options
- [ ] Implement error handling with \`controller.abort()\` or result sharing
- [ ] Use appropriate priorities for execution order

### For Store Only Pattern:
- [ ] Design store configuration with type inference
- [ ] Use \`createDeclarativeStorePattern()\` with domain-specific renaming
- [ ] Subscribe reactively with \`useStoreValue()\`
- [ ] Use store methods (\`setValue\`, \`update\`) appropriately
- [ ] Implement validation for complex store types

### For Pattern Composition:
- [ ] Separate concerns: actions for logic, stores for state
- [ ] Use proper provider hierarchy
- [ ] Implement Store Integration 3-Step Process in handlers
- [ ] Consider using HOC pattern for cleaner provider wrapping

---

This guide provides comprehensive information for LLMs to understand and effectively work with the Context-Action framework, covering all essential patterns, APIs, conventions, and best practices.

Generated automatically from documentation sources. Do not edit directly.
`;
    }
  }

  generateFullDocument() {
    console.log(`🚀 Generating full LLM document for ${this.language.toUpperCase()}...`);
    
    let content = this.generateHeader();
    
    if (this.language === 'ko') {
      content += this.generateKoreanContent();
    } else {
      content += this.generateEnglishContent();
    }
    
    content += this.generateFooter();
    
    // Write the document
    const outputPath = path.join(this.outputDir, 'llms-full.txt');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content, 'utf-8');
    
    console.log(`✅ Generated ${outputPath}`);
    console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB`);
    console.log(`📄 Character count: ${content.length.toLocaleString()}\n`);
    
    return {
      path: outputPath,
      size: fs.statSync(outputPath).size,
      characters: content.length,
      language: this.language
    };
  }
}

// Generate full documents for all languages
function generateAllFullDocs() {
  console.log('🌍 Starting full document generation for all languages...\n');
  
  const results = [];
  
  for (const language of SUPPORTED_LANGUAGES) {
    const generator = new FullDocGenerator(language);
    const result = generator.generateFullDocument();
    results.push(result);
  }
  
  console.log('📈 Full Document Generation Summary:');
  console.log('┌──────┬─────────┬──────────┬─────────────┐');
  console.log('│ Lang │ Size KB │ Chars    │ File Path   │');
  console.log('├──────┼─────────┼──────────┼─────────────┤');
  
  for (const result of results) {
    const sizeKB = (result.size / 1024).toFixed(1);
    const chars = result.characters.toLocaleString();
    console.log(`│ ${result.language.padEnd(4)} │ ${sizeKB.padStart(7)} │ ${chars.padStart(8)} │ ${path.basename(result.path).padEnd(11)} │`);
  }
  
  console.log('└──────┴─────────┴──────────┴─────────────┘');
  console.log(`\n✅ Generated ${results.length} full documents successfully!`);
  
  return results;
}

// Run the generator
generateAllFullDocs();