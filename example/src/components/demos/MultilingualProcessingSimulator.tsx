/**
 * @fileoverview Multilingual Document Processing Simulator
 * 
 * Simulates the LLMS Generator's multilingual document processing workflow
 * with language detection, template generation, and priority management.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';

interface DocumentTemplate {
  id: string;
  originalId: string;
  language: 'en' | 'ko';
  characterLimit: number;
  content: string;
  wordCount: number;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'error';
}

interface PriorityMetadata {
  id: string;
  documentId: string;
  language: 'en' | 'ko';
  title: string;
  category: string;
  priority: number;
  tags: string[];
  estimatedReadTime: number;
  complexity: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

interface ProcessingJob {
  id: string;
  originalFile: string;
  language: 'en' | 'ko';
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  endTime?: Date;
  templates: DocumentTemplate[];
  metadata?: PriorityMetadata;
  error?: string;
}

const CHARACTER_LIMITS = [100, 200, 300, 500, 1000, 2000, 5000];

// Sample document content for simulation
const SAMPLE_DOCUMENTS = {
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

### Action Handlers

Register action handlers to process business logic:

\`\`\`typescript
function UserComponent() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', async (payload) => {
    // Business logic here
    const response = await api.updateUser(payload);
    userStore.setValue(response.user);
  });
  
  return (
    <button onClick={() => dispatch('updateUser', { id: '1', name: 'John' })}>
      Update User
    </button>
  );
}
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

## Pipeline Controller

The controller provides advanced flow control:

\`\`\`typescript
useActionHandler('processData', async (payload, controller) => {
  // Check conditions
  if (!isValid(payload)) {
    controller.abort('Invalid data');
    return;
  }
  
  // Set intermediate results
  controller.setResult({ step: 'validation', success: true });
  
  // Modify payload for next handlers
  controller.modifyPayload(current => ({
    ...current,
    validated: true
  }));
});
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

### 액션 핸들러

비즈니스 로직을 처리할 액션 핸들러를 등록하세요:

\`\`\`typescript
function UserComponent() {
  const dispatch = useActionDispatch();
  
  useActionHandler('updateUser', async (payload) => {
    // 비즈니스 로직
    const response = await api.updateUser(payload);
    userStore.setValue(response.user);
  });
  
  return (
    <button onClick={() => dispatch('updateUser', { id: '1', name: 'John' })}>
      사용자 업데이트
    </button>
  );
}
\`\`\`

이 프레임워크는 문서 중심의 컨텍스트 아키텍처를 통해 완벽한 관심사 분리를 제공합니다.`,
      category: 'guide',
      tags: ['시작하기', '설치', '기본-사용법']
    },
    'action-pipeline.md': {
      title: '액션 파이프라인 시스템',
      content: `# 액션 파이프라인 시스템

액션 파이프라인 시스템은 Context-Action 프레임워크의 핵심 오케스트레이션 메커니즘으로, 포괄적인 흐름 제어와 함께 우선순위 기반 핸들러 실행을 제공합니다.

## 우선순위 기반 실행

핸들러는 우선순위 내림차순으로 실행됩니다:

\`\`\`typescript
actionRegister.register('authenticate', validateInput, { priority: 100 });
actionRegister.register('authenticate', checkRateLimit, { priority: 90 });
actionRegister.register('authenticate', performAuth, { priority: 80 });
\`\`\`

## 파이프라인 컨트롤러

컨트롤러는 고급 흐름 제어를 제공합니다:

\`\`\`typescript
useActionHandler('processData', async (payload, controller) => {
  // 조건 확인
  if (!isValid(payload)) {
    controller.abort('잘못된 데이터');
    return;
  }
  
  // 중간 결과 설정
  controller.setResult({ step: 'validation', success: true });
  
  // 다음 핸들러를 위한 페이로드 수정
  controller.modifyPayload(current => ({
    ...current,
    validated: true
  }));
});
\`\`\`

## 고급 기능

- **블로킹 연산**: waitForRefs로 실행 흐름 제어
- **중단 메커니즘**: 필요시 파이프라인 실행 중단
- **결과 수집**: 여러 핸들러의 결과 집계
- **우선순위 관리**: 실행 순서의 세밀한 제어`,
      category: 'concept',
      tags: ['파이프라인', '우선순위', '핸들러', '흐름-제어']
    }
  }
};

export function MultilingualProcessingSimulator() {
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'en' | 'ko'>('all');
  const [autoProcess, setAutoProcess] = useState(false);
  const [processingSpeed, setProcessingSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Simulate document processing
  const processDocument = useCallback(async (documentKey: string, language: 'en' | 'ko') => {
    const document = SAMPLE_DOCUMENTS[language][documentKey as keyof typeof SAMPLE_DOCUMENTS[typeof language]];
    if (!document) return;

    const jobId = `${language}-${documentKey}-${Date.now()}`;
    const job: ProcessingJob = {
      id: jobId,
      originalFile: `docs/${language}/${documentKey}`,
      language,
      status: 'queued',
      progress: 0,
      startTime: new Date(),
      templates: []
    };

    setProcessingJobs(prev => [...prev, job]);

    // Simulate processing with progress updates
    const speedMultiplier = processingSpeed === 'fast' ? 0.3 : processingSpeed === 'slow' ? 2 : 1;
    
    setTimeout(() => {
      setProcessingJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'processing' } : j
      ));
    }, 100 * speedMultiplier);

    // Generate templates progressively
    for (let i = 0; i < CHARACTER_LIMITS.length; i++) {
      const limit = CHARACTER_LIMITS[i];
      const progress = ((i + 1) / CHARACTER_LIMITS.length) * 80; // 80% for templates
      
      setTimeout(() => {
        const truncatedContent = document.content.length > limit 
          ? document.content.substring(0, limit - 3) + '...'
          : document.content;

        const template: DocumentTemplate = {
          id: `${jobId}-${limit}`,
          originalId: jobId,
          language,
          characterLimit: limit,
          content: truncatedContent,
          wordCount: truncatedContent.split(/\s+/).length,
          generatedAt: new Date(),
          status: 'completed'
        };

        setProcessingJobs(prev => prev.map(j => 
          j.id === jobId ? {
            ...j,
            progress,
            templates: [...j.templates, template]
          } : j
        ));
      }, (i + 1) * 300 * speedMultiplier);
    }

    // Generate priority metadata
    setTimeout(() => {
      const metadata: PriorityMetadata = {
        id: `${jobId}-priority`,
        documentId: jobId,
        language,
        title: document.title,
        category: document.category,
        priority: calculatePriority(document, language),
        tags: document.tags,
        estimatedReadTime: Math.ceil(document.content.split(/\s+/).length / 200),
        complexity: document.content.length > 2000 ? 'high' : 
                    document.content.length > 1000 ? 'medium' : 'low',
        lastUpdated: new Date()
      };

      setProcessingJobs(prev => prev.map(j => 
        j.id === jobId ? {
          ...j,
          progress: 100,
          status: 'completed',
          endTime: new Date(),
          metadata
        } : j
      ));
    }, CHARACTER_LIMITS.length * 300 * speedMultiplier + 200 * speedMultiplier);

  }, [processingSpeed]);

  // Calculate priority based on document characteristics
  const calculatePriority = useCallback((document: any, language: 'en' | 'ko'): number => {
    let score = 0;
    
    // Category weight
    const categoryWeights = { guide: 90, concept: 80, examples: 65, reference: 70 };
    score += categoryWeights[document.category as keyof typeof categoryWeights] || 50;
    
    // Content size weight
    score += Math.min((document.content.length / 100) * 2, 20);
    
    // Language adjustment (slight preference for primary language)
    if (language === 'en') score += 2;
    
    // Tag density bonus
    score += Math.min(document.tags.length * 3, 15);
    
    return Math.min(Math.max(Math.round(score), 0), 100);
  }, []);

  // Auto-process documents
  useEffect(() => {
    if (!autoProcess) return;

    const interval = setInterval(() => {
      const languages: ('en' | 'ko')[] = ['en', 'ko'];
      const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
      const documents = Object.keys(SAMPLE_DOCUMENTS[randomLanguage]);
      const randomDoc = documents[Math.floor(Math.random() * documents.length)];
      
      processDocument(randomDoc, randomLanguage);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoProcess, processDocument]);

  const filteredJobs = processingJobs.filter(job => 
    selectedLanguage === 'all' || job.language === selectedLanguage
  );

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'queued': return 'outline';
      case 'processing': return 'primary';
      case 'completed': return 'default';
      case 'error': return 'danger';
    }
  };

  const getLanguageFlag = (language: 'en' | 'ko') => {
    return language === 'en' ? '🇺🇸' : '🇰🇷';
  };

  const clearCompleted = useCallback(() => {
    setProcessingJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setProcessingJobs([]);
  }, []);

  const stats = {
    total: processingJobs.length,
    completed: processingJobs.filter(j => j.status === 'completed').length,
    processing: processingJobs.filter(j => j.status === 'processing').length,
    queued: processingJobs.filter(j => j.status === 'queued').length,
    byLanguage: {
      en: processingJobs.filter(j => j.language === 'en').length,
      ko: processingJobs.filter(j => j.language === 'ko').length
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🌐 Multilingual Processing Simulator</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {stats.total} Total Jobs
            </Badge>
            <Badge variant="default">
              {stats.completed} Completed
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Language Filter</label>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Languages</option>
              <option value="en">🇺🇸 English Only</option>
              <option value="ko">🇰🇷 Korean Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Processing Speed</label>
            <select 
              value={processingSpeed} 
              onChange={(e) => setProcessingSpeed(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="slow">🐌 Slow (2x time)</option>
              <option value="normal">⚡ Normal</option>
              <option value="fast">🚀 Fast (0.3x time)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
              />
              <span className="text-sm">🔄 Auto Process</span>
            </label>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={clearCompleted} variant="outline" size="sm">
              🧹 Clear Completed
            </Button>
            <Button onClick={clearAll} variant="outline" size="sm">
              ❌ Clear All
            </Button>
          </div>
        </div>

        {/* Manual Processing */}
        <div className="space-y-3">
          <h3 className="font-semibold">📄 Process Sample Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">🇺🇸 English Documents</h4>
              <div className="space-y-2">
                {Object.keys(SAMPLE_DOCUMENTS.en).map(docKey => (
                  <Button
                    key={docKey}
                    onClick={() => processDocument(docKey, 'en')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    📝 {SAMPLE_DOCUMENTS.en[docKey as keyof typeof SAMPLE_DOCUMENTS.en].title}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">🇰🇷 Korean Documents</h4>
              <div className="space-y-2">
                {Object.keys(SAMPLE_DOCUMENTS.ko).map(docKey => (
                  <Button
                    key={docKey}
                    onClick={() => processDocument(docKey, 'ko')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    📝 {SAMPLE_DOCUMENTS.ko[docKey as keyof typeof SAMPLE_DOCUMENTS.ko].title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Dashboard */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">📊 Processing Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total Jobs</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-800">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
            <div className="text-sm text-yellow-800">Processing</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.byLanguage.en}</div>
            <div className="text-sm text-purple-800">🇺🇸 English</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{stats.byLanguage.ko}</div>
            <div className="text-sm text-pink-800">🇰🇷 Korean</div>
          </div>
        </div>
      </Card>

      {/* Processing Jobs */}
      <div className="space-y-4">
        <h3 className="font-semibold">🔄 Processing Jobs ({filteredJobs.length})</h3>
        
        {filteredJobs.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <div>No processing jobs</div>
            <div className="text-sm">Select documents above to start processing</div>
          </Card>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getLanguageFlag(job.language)} {job.originalFile}</span>
                    <Badge variant={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  {job.metadata && (
                    <div className="text-sm text-gray-600">
                      {job.metadata.title} • Priority: {job.metadata.priority} • 
                      Category: {job.metadata.category} • 
                      Complexity: {job.metadata.complexity}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {job.status === 'processing' && (
                    <div>{job.progress}% complete</div>
                  )}
                  {job.endTime && (
                    <div>
                      ⏱️ {Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)}s
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {job.status === 'processing' && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Generated Templates */}
              {job.templates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">📄 Generated Templates ({job.templates.length}/{CHARACTER_LIMITS.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {CHARACTER_LIMITS.map(limit => {
                      const template = job.templates.find(t => t.characterLimit === limit);
                      return (
                        <div 
                          key={limit}
                          className={`text-center p-2 rounded text-xs ${
                            template ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          } border`}
                        >
                          <div className="font-medium">{limit}</div>
                          <div className="text-gray-600">chars</div>
                          {template && (
                            <div className="text-green-600 mt-1">✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Priority Metadata */}
              {job.metadata && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">🏷️ Priority Metadata</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <strong>Priority:</strong> {job.metadata.priority}/100
                    </div>
                    <div>
                      <strong>Read Time:</strong> {job.metadata.estimatedReadTime}min
                    </div>
                    <div>
                      <strong>Tags:</strong> {job.metadata.tags.slice(0, 2).join(', ')}
                      {job.metadata.tags.length > 2 && ` +${job.metadata.tags.length - 2}`}
                    </div>
                    <div>
                      <strong>Complexity:</strong> {job.metadata.complexity}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* LLMS Integration Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-green-900 mb-3">✅ LLMS Generator Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">🔄 Automated Workflow</h4>
            <ul className="space-y-1 text-green-800">
              <li>• <strong>Detection:</strong> docs/(en|ko)/**/*.md changes</li>
              <li>• <strong>Processing:</strong> 7 character-limited templates (100-5000)</li>
              <li>• <strong>Metadata:</strong> priority.json with language detection</li>
              <li>• <strong>Commit:</strong> Separate commits for clean history</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🌐 Language Support</h4>
            <ul className="space-y-1 text-green-800">
              <li>• <strong>English/Korean:</strong> Full processing support</li>
              <li>• <strong>Smart Detection:</strong> Automatic language identification</li>
              <li>• <strong>Consistency Checks:</strong> Cross-language priority validation</li>
              <li>• <strong>CLI Commands:</strong> Language-specific processing options</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 mb-2">💻 CLI Commands</h4>
          <div className="font-mono text-xs text-green-800 space-y-1">
            <div>pnpm llms:sync-docs:ko --changed-files docs/ko/guide/example.md</div>
            <div>pnpm llms:sync-docs:en --changed-files docs/en/guide/example.md</div>
            <div>pnpm llms:sync-docs:dry --changed-files files... # Preview mode</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default MultilingualProcessingSimulator;