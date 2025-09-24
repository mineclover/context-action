import React from 'react';
import { Container } from '../../../components/ui';
import { UserManagementExample } from './UserManagementExample';
import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../../stores/SourceLinkRegistry';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';

// 6-Layer 구조별 파일 분류 정의
interface LayerInfo {
  name: string;
  icon: string;
  description: string;
  pathPattern: RegExp;
  color: string;
}

const LAYER_STRUCTURE: LayerInfo[] = [
  {
    name: 'contexts',
    icon: '📁',
    description: 'Context Definitions & Types',
    pathPattern: /contexts\//,
    color: 'blue'
  },
  {
    name: 'business',
    icon: '🧠',
    description: 'Pure Business Logic Functions',
    pathPattern: /business\//,
    color: 'green'
  },
  {
    name: 'handlers',
    icon: '⚙️',
    description: 'Handler Logic with Injection',
    pathPattern: /handlers\//,
    color: 'purple'
  },
  {
    name: 'actions',
    icon: '🚀',
    description: 'Action Dispatch & Callbacks',
    pathPattern: /actions\//,
    color: 'orange'
  },
  {
    name: 'hooks',
    icon: '🔗',
    description: 'Store Subscriptions',
    pathPattern: /hooks\//,
    color: 'indigo'
  },
  {
    name: 'views',
    icon: '🖼️',
    description: 'Pure UI Components',
    pathPattern: /views\//,
    color: 'pink'
  }
];

// 현재 등록된 파일을 6-Layer 구조별로 분류하는 컴포넌트
function LayeredArchitectureFiles() {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);

  // layered-architecture 폴더의 파일들만 필터링
  const layeredArchFiles = Object.values(entries)
    .filter(entry =>
      entry.instances &&
      entry.instances.size > 0 &&
      entry.filePath.includes('layered-architecture')
    );

  // 레이어별로 파일 분류
  const filesByLayer = LAYER_STRUCTURE.map(layer => {
    const files = layeredArchFiles.filter(file => layer.pathPattern.test(file.filePath));
    return { ...layer, files };
  });

  // 분류되지 않은 파일들
  const uncategorizedFiles = layeredArchFiles.filter(file =>
    !LAYER_STRUCTURE.some(layer => layer.pathPattern.test(file.filePath))
  );

  if (layeredArchFiles.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="text-sm text-gray-500 text-center">
          No layered architecture files currently registered.
          <br />
          <span className="text-xs">Navigate through the example to see source file structure.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        <strong>{layeredArchFiles.length}</strong> files currently registered from layered architecture pattern
      </div>

      {/* 6-Layer 구조별 표시 */}
      {filesByLayer.map(layer => (
        <div key={layer.name} className="border rounded-lg overflow-hidden">
          <div className={`bg-${layer.color}-50 border-${layer.color}-200 px-4 py-2 border-b`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{layer.icon}</span>
              <div>
                <div className={`font-medium text-${layer.color}-800`}>
                  {layer.name}/
                </div>
                <div className={`text-xs text-${layer.color}-600`}>
                  {layer.description}
                </div>
              </div>
              <div className="ml-auto">
                <span className={`text-xs bg-${layer.color}-100 text-${layer.color}-700 px-2 py-1 rounded`}>
                  {layer.files.length} files
                </span>
              </div>
            </div>
          </div>

          {layer.files.length > 0 ? (
            <div className="bg-white">
              {layer.files.map(file => (
                <div key={file.filePath} className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <div className="flex-1">
                    <a
                      href={file.githubPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-sm"
                      title={file.filePath}
                    >
                      {file.name}
                    </a>
                    {file.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {file.description}
                      </div>
                    )}
                  </div>
                  {file.instances.size > 1 && (
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      {file.instances.size} instances
                    </span>
                  )}
                  <div className="text-xs text-gray-400">
                    <a
                      href={file.githubPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      📄 View Source
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center">
              No files in this layer yet
            </div>
          )}
        </div>
      ))}

      {/* 분류되지 않은 파일들 */}
      {uncategorizedFiles.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">📂</span>
              <div>
                <div className="font-medium text-gray-800">
                  Other Files
                </div>
                <div className="text-xs text-gray-600">
                  Files not categorized in the 6-layer structure
                </div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {uncategorizedFiles.length} files
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white">
            {uncategorizedFiles.map(file => (
              <div key={file.filePath} className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                <div className="flex-1">
                  <a
                    href={file.githubPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono text-sm"
                    title={file.filePath}
                  >
                    {file.name}
                  </a>
                  {file.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {file.description}
                    </div>
                  )}
                </div>
                {file.instances.size > 1 && (
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                    {file.instances.size} instances
                  </span>
                )}
                <div className="text-xs text-gray-400">
                  <a
                    href={file.githubPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    📄 View Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Layered Context Architecture Example Page
 *
 * Demonstrates the implementation of 6-layer architecture where:
 * 1. Pure business logic functions are separated from side effects
 * 2. Handler injection pattern resolves latest value dependencies
 * 3. Context API provides dependency injection for handlers
 */
export default function LayeredArchitecturePage() {
  // 이 페이지 자체를 등록
  useRegisterSourceFile('pages/patterns/layered-architecture/LayeredArchitecturePage.tsx', {
    name: 'LayeredArchitecturePage',
    description: 'Main page demonstrating 6-layer architecture pattern',
    tags: ['patterns', 'architecture', 'layered'],
    priority: 1
  });
  return (
    <Container>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Layered Architecture
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Pure Business Logic Functions + Handler Injection Pattern
          </p>
        </header>

        {/* 예제 섹션을 위로 이동 */}
        <section className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 p-6 rounded-xl border border-purple-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              Interactive Demo: Layered Architecture in Action
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-3 text-purple-800 flex items-center gap-2">
                  <span>🔄</span>
                  Real-time Features to Try
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Create users and see instant statistics updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Try duplicate email validation (Handler Injection)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Watch role distribution chart animate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Experience smooth form validation feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Edit/delete operations with visual feedback</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg mb-3 text-pink-800 flex items-center gap-2">
                  <span>🧪</span>
                  Test Handler Injection Pattern
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">Try This:</p>
                    <p className="text-blue-700">
                      1. Create a user with email "test@example.com"<br/>
                      2. Try creating another user with the same email<br/>
                      3. Watch the Handler Injection Pattern prevent duplicates!
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">Observe:</p>
                    <p className="text-green-700">
                      Pure business logic + Latest values from stores = Perfect validation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <UserManagementExample />
        </section>

        {/* 현재 등록된 파일들 표시 */}
        <section className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-3">
            <span className="text-2xl">📁</span>
            Currently Registered Files
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            실제 구현된 파일들을 6-Layer 구조별로 분류하여 표시합니다.
            각 파일은 <a href="/utilities/source-directory" className="text-blue-600 hover:underline">Source Directory</a> 시스템에 의해 자동으로 등록되며,
            GitHub에서 실제 소스 코드를 확인할 수 있습니다.
          </p>
          <LayeredArchitectureFiles />
        </section>

        {/* 설명 섹션을 아래로 이동 */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">🏗️ Architecture Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-bold text-lg mb-4 text-gray-700">6-Layer Structure:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">📁</span>
                  <div>
                    <strong className="text-blue-600">contexts/</strong>
                    <p className="text-sm text-gray-600">Context Definitions & Types</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🧠</span>
                  <div>
                    <strong className="text-green-600">business/</strong>
                    <p className="text-sm text-gray-600">Pure Business Logic Functions</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <strong className="text-purple-600">handlers/</strong>
                    <p className="text-sm text-gray-600">Handler Logic with Injection</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🚀</span>
                  <div>
                    <strong className="text-orange-600">actions/</strong>
                    <p className="text-sm text-gray-600">Action Dispatch & Callbacks</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🔗</span>
                  <div>
                    <strong className="text-indigo-600">hooks/</strong>
                    <p className="text-sm text-gray-600">Store Subscriptions</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🖼️</span>
                  <div>
                    <strong className="text-pink-600">views/</strong>
                    <p className="text-sm text-gray-600">Pure UI Components</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-bold text-lg mb-4 text-gray-700">Key Benefits:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-2 rounded-md hover:bg-green-50 transition-colors">
                  <span className="text-green-500 font-bold text-lg">✅</span>
                  <div>
                    <strong className="text-gray-800">Pure functions are easily testable</strong>
                    <p className="text-sm text-gray-600 mt-1">Business logic can be unit tested in isolation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-md hover:bg-green-50 transition-colors">
                  <span className="text-green-500 font-bold text-lg">✅</span>
                  <div>
                    <strong className="text-gray-800">Side effects are isolated in handlers</strong>
                    <p className="text-sm text-gray-600 mt-1">Clear separation between logic and effects</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-md hover:bg-green-50 transition-colors">
                  <span className="text-green-500 font-bold text-lg">✅</span>
                  <div>
                    <strong className="text-gray-800">Latest values through handler injection</strong>
                    <p className="text-sm text-gray-600 mt-1">Always access current state safely</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-md hover:bg-green-50 transition-colors">
                  <span className="text-green-500 font-bold text-lg">✅</span>
                  <div>
                    <strong className="text-gray-800">Clear separation of concerns</strong>
                    <p className="text-sm text-gray-600 mt-1">Each layer has distinct responsibilities</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-md hover:bg-green-50 transition-colors">
                  <span className="text-green-500 font-bold text-lg">✅</span>
                  <div>
                    <strong className="text-gray-800">Context-driven dependency injection</strong>
                    <p className="text-sm text-gray-600 mt-1">Flexible and testable architecture</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🔄 Data Flow</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span><strong>User Interaction</strong> → View triggers action</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span><strong>Action Dispatch</strong> → Action layer calls handler</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              <span><strong>Handler Injection</strong> → Gets latest values from context</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
              <span><strong>Pure Business Logic</strong> → Executes domain logic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
              <span><strong>Side Effects</strong> → Handler updates stores</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">6</span>
              <span><strong>Reactive Update</strong> → Hook layer updates view</span>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}