/**
 * @fileoverview Mock data generators for Priority Management System
 */

import type { Document, PriorityCalculationCriteria, CalculationPreset } from '../types';

// Sample document data
export const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: 'getting-started-en',
    title: 'Getting Started with Context-Action',
    category: 'guide',
    language: 'en',
    size: 2500,
    priority: 95,
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    keywordDensity: 0.12,
    crossReferences: 8,
    status: 'completed',
    assignee: 'John'
  },
  {
    id: 'getting-started-ko',
    title: 'Context-Action 시작하기',
    category: 'guide',
    language: 'ko',
    size: 2400,
    priority: 92,
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    keywordDensity: 0.11,
    crossReferences: 7,
    status: 'completed',
    assignee: 'Sarah'
  },
  {
    id: 'action-pipeline-en',
    title: 'Action Pipeline System',
    category: 'concept',
    language: 'en',
    size: 3200,
    priority: 88,
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    keywordDensity: 0.15,
    crossReferences: 12,
    status: 'review',
    assignee: 'Mike'
  },
  {
    id: 'action-pipeline-ko',
    title: '액션 파이프라인 시스템',
    category: 'concept',
    language: 'ko',
    size: 3100,
    priority: 85,
    lastModified: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    keywordDensity: 0.14,
    crossReferences: 11,
    status: 'review',
    assignee: 'Sarah'
  },
  {
    id: 'todo-example-en',
    title: 'Todo List Example',
    category: 'examples',
    language: 'en',
    size: 1800,
    priority: 72,
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    keywordDensity: 0.08,
    crossReferences: 5,
    status: 'draft',
    assignee: 'John'
  },
  {
    id: 'api-reference-en',
    title: 'API Reference',
    category: 'reference',
    language: 'en',
    size: 4500,
    priority: 78,
    lastModified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    keywordDensity: 0.18,
    crossReferences: 20,
    status: 'completed',
    assignee: 'Mike'
  },
  {
    id: 'store-patterns-ko',
    title: '스토어 패턴 가이드',
    category: 'concept',
    language: 'ko',
    size: 2800,
    priority: 80,
    lastModified: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    keywordDensity: 0.13,
    crossReferences: 9,
    status: 'draft',
    assignee: 'Sarah'
  },
  {
    id: 'shopping-cart-example-ko',
    title: '쇼핑카트 예제',
    category: 'examples',
    language: 'ko',
    size: 2200,
    priority: 65,
    lastModified: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    keywordDensity: 0.09,
    crossReferences: 6,
    status: 'draft',
    assignee: 'John'
  }
];

// Predefined calculation presets
export const CALCULATION_PRESETS: Record<string, CalculationPreset> = {
  default: {
    name: 'Default',
    description: 'Balanced approach for general documentation prioritization',
    criteria: {
      documentSize: { weight: 0.4, method: 'linear' },
      category: { weight: 0.3, values: { guide: 95, concept: 85, examples: 70, reference: 75 } },
      keywordDensity: { weight: 0.2, method: 'logarithmic' },
      crossReferences: { weight: 0.1, boost: 5 },
      recentModification: { weight: 0.05, dayThreshold: 7 },
      teamWorkload: { weight: 0.05, assigneePenalty: 10 }
    }
  },
  contentFocused: {
    name: 'Content Focused',
    description: 'Prioritizes content quality and comprehensiveness',
    criteria: {
      documentSize: { weight: 0.6, method: 'exponential' },
      category: { weight: 0.25, values: { guide: 100, concept: 90, examples: 60, reference: 70 } },
      keywordDensity: { weight: 0.1, method: 'polynomial', exponent: 2 },
      crossReferences: { weight: 0.05, boost: 3 },
      recentModification: { weight: 0.0, dayThreshold: 30 },
      teamWorkload: { weight: 0.0 }
    }
  },
  collaborationFocused: {
    name: 'Collaboration Focused',
    description: 'Emphasizes team collaboration and cross-referencing',
    criteria: {
      documentSize: { weight: 0.2, method: 'linear' },
      category: { weight: 0.25, values: { guide: 85, concept: 80, examples: 75, reference: 70 } },
      keywordDensity: { weight: 0.15, method: 'linear' },
      crossReferences: { weight: 0.25, boost: 8, diminishingReturns: true },
      recentModification: { weight: 0.1, dayThreshold: 14, decayRate: 0.1 },
      teamWorkload: { weight: 0.15, assigneePenalty: 20, conflictDetection: true }
    }
  },
  timeSensitive: {
    name: 'Time Sensitive',
    description: 'Prioritizes recent updates and time-critical content',
    criteria: {
      documentSize: { weight: 0.25, method: 'linear' },
      category: { weight: 0.3, values: { guide: 90, concept: 85, examples: 65, reference: 75 } },
      keywordDensity: { weight: 0.15, method: 'logarithmic' },
      crossReferences: { weight: 0.1, boost: 4 },
      recentModification: { weight: 0.2, dayThreshold: 3, decayRate: 0.2 },
      teamWorkload: { weight: 0.1, assigneePenalty: 15 }
    }
  }
};

// Default calculation criteria
export const DEFAULT_CRITERIA: PriorityCalculationCriteria = CALCULATION_PRESETS.default.criteria;

// Character limits for multilingual processing
export const CHARACTER_LIMITS = [100, 200, 300, 500, 1000, 2000, 5000];

// Sample document content for multilingual simulation
export const SAMPLE_DOCUMENTS_CONTENT = {
  en: {
    'getting-started.md': {
      title: 'Getting Started with Context-Action',
      content: `# Getting Started with Context-Action Framework

The Context-Action framework is a revolutionary state management system designed to overcome the fundamental limitations of existing libraries through document-centric context separation and effective artifact management.

## Quick Start

### Installation

\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

### Basic Usage

Create an action context for your application:

\`\`\`typescript
import { createActionContext } from '@context-action/react';

interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const { Provider, useActionDispatch, useActionHandler } = createActionContext<AppActions>('App');
\`\`\`

This framework provides perfect separation of concerns through document-centric context architecture.`,
      category: 'guide',
      tags: ['getting-started', 'installation', 'basic-usage']
    },
    'action-pipeline.md': {
      title: 'Action Pipeline System',
      content: `# Action Pipeline System

The Action Pipeline System is the core orchestration mechanism in Context-Action framework, providing priority-based handler execution with comprehensive flow control.

## Priority-Based Execution

Handlers execute in descending priority order:

\`\`\`typescript
actionRegister.register('authenticate', validateInput, { priority: 100 });
actionRegister.register('authenticate', checkRateLimit, { priority: 90 });
actionRegister.register('authenticate', performAuth, { priority: 80 });
\`\`\`

## Advanced Features

- **Blocking Operations**: Control execution flow with waitForRefs
- **Abort Mechanisms**: Stop pipeline execution when needed
- **Result Collection**: Aggregate results from multiple handlers
- **Priority Management**: Fine-grained control over execution order`,
      category: 'concept',
      tags: ['pipeline', 'priority', 'handlers', 'flow-control']
    }
  },
  ko: {
    'getting-started.md': {
      title: 'Context-Action 시작하기',
      content: `# Context-Action 프레임워크 시작하기

Context-Action 프레임워크는 문서 중심의 컨텍스트 분리와 효과적인 아티팩트 관리를 통해 기존 라이브러리의 근본적인 한계를 극복하도록 설계된 혁신적인 상태 관리 시스템입니다.

## 빠른 시작

### 설치

\`\`\`bash
npm install @context-action/core @context-action/react
\`\`\`

### 기본 사용법

애플리케이션을 위한 액션 컨텍스트를 생성하세요:

\`\`\`typescript
import { createActionContext } from '@context-action/react';

interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const { Provider, useActionDispatch, useActionHandler } = createActionContext<AppActions>('App');
\`\`\`

이 프레임워크는 문서 중심의 컨텍스트 아키텍처를 통해 완벽한 관심사 분리를 제공합니다.`,
      category: 'guide',
      tags: ['시작하기', '설치', '기본-사용법']
    }
  }
};