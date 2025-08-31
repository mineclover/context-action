import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../stores/SourceLinkRegistry';
import { PageLayout } from '../../components/layout/PageLayout';
import { useRegisterSourceFile, useIsSourceFileRegistered, useSourceFileInstanceCount } from '../../hooks/useRegisterSourceFile';
import { CodeExample, CodeBlock } from '../../components/ui/CodeExample';
import { useState, useEffect } from 'react';

// 실시간 등록 데모 컴포넌트
function DynamicRegistrationDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [demoCounter, setDemoCounter] = useState(0);
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-green-700">
        버튼을 클릭하여 가상 컴포넌트를 마운트/언마운트하고 실시간으로 등록 상태를 확인하세요.
      </p>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowDemo(!showDemo)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
        >
          {showDemo ? '데모 언마운트' : '데모 마운트'}
        </button>
        <button 
          onClick={() => setDemoCounter(c => c + 1)}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          카운터 증가 ({demoCounter})
        </button>
      </div>
      {showDemo && <VirtualDemoComponent counter={demoCounter} />}
      <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
        💡 위 파일 목록에서 "demo/VirtualDemo.tsx" 항목을 확인해보세요!
      </div>
    </div>
  );
}

// 가상 데모 컴포넌트
function VirtualDemoComponent({ counter }: { counter: number }) {
  useRegisterSourceFile('demo/VirtualDemo.tsx', {
    name: `VirtualDemo (${counter})`,
    description: '실시간 등록 데모용 가상 컴포넌트',
    tags: ['demo', 'virtual', 'live'],
    priority: 100
  });
  
  return (
    <div className="bg-white border-2 border-green-300 rounded p-2 text-sm">
      <div className="font-medium text-green-800">🎭 Virtual Demo Component</div>
      <div className="text-green-600">Counter: {counter}</div>
      <div className="text-xs text-green-500">이 컴포넌트는 demo/VirtualDemo.tsx로 등록됩니다</div>
    </div>
  );
}

// 파일 상태 체커
function FileStatusChecker() {
  const [testFilePath, setTestFilePath] = useState('demo/VirtualDemo.tsx');
  const isRegistered = useIsSourceFileRegistered(testFilePath);
  const instanceCount = useSourceFileInstanceCount(testFilePath);
  
  const testFiles = [
    'demo/VirtualDemo.tsx',
    'pages/utilities/SourceLinkDirectory.tsx',
    'components/NonExistent.tsx'
  ];
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-purple-700">
        파일 경로를 선택하여 등록 상태와 인스턴스 개수를 실시간으로 확인하세요.
      </p>
      <div className="flex gap-2 flex-wrap">
        {testFiles.map(file => (
          <button
            key={file}
            onClick={() => setTestFilePath(file)}
            className={`px-2 py-1 rounded text-xs ${
              testFilePath === file 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {file.split('/').pop()}
          </button>
        ))}
      </div>
      <div className="bg-white border border-purple-200 rounded p-3 text-sm">
        <div className="font-medium text-purple-800">📋 Status for: {testFilePath}</div>
        <div className="mt-1 space-y-1">
          <div className="flex justify-between">
            <span>등록됨:</span>
            <span className={`font-medium ${isRegistered ? 'text-green-600' : 'text-red-600'}`}>
              {isRegistered ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>활성 인스턴스:</span>
            <span className="font-medium text-purple-600">{instanceCount}개</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 인스턴스 카운터 데모
function InstanceCounterDemo() {
  const [instances, setInstances] = useState<number[]>([]);
  const instanceCount = useSourceFileInstanceCount('demo/MultiInstance.tsx');
  
  const addInstance = () => {
    setInstances(prev => [...prev, Date.now()]);
  };
  
  const removeInstance = (id: number) => {
    setInstances(prev => prev.filter(i => i !== id));
  };
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-orange-700">
        동일한 컴포넌트의 여러 인스턴스를 생성하여 인스턴스 추적 기능을 확인하세요.
      </p>
      <div className="flex gap-2">
        <button 
          onClick={addInstance}
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
        >
          인스턴스 추가
        </button>
        <div className="text-sm text-orange-700 py-1">
          현재 {instanceCount}개 활성
        </div>
      </div>
      <div className="space-y-2">
        {instances.map(id => (
          <MultiInstanceDemo 
            key={id} 
            instanceId={id}
            onRemove={() => removeInstance(id)}
          />
        ))}
      </div>
      {instances.length > 0 && (
        <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
          💡 위 파일 목록에서 "demo/MultiInstance.tsx" 항목의 숫자를 확인해보세요!
        </div>
      )}
    </div>
  );
}

// 멀티 인스턴스 데모 컴포넌트
function MultiInstanceDemo({ instanceId, onRemove }: { instanceId: number; onRemove: () => void }) {
  useRegisterSourceFile('demo/MultiInstance.tsx', {
    name: 'MultiInstance',
    description: '다중 인스턴스 추적 데모',
    tags: ['demo', 'multi-instance'],
    priority: 90
  });
  
  return (
    <div className="bg-white border-2 border-orange-300 rounded p-2 text-sm flex justify-between items-center">
      <div>
        <div className="font-medium text-orange-800">🔄 Multi Instance #{instanceId}</div>
        <div className="text-xs text-orange-500">demo/MultiInstance.tsx로 등록됨</div>
      </div>
      <button 
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 text-xs"
      >
        ✕ 제거
      </button>
    </div>
  );
}

export function SourceLinkDirectory() {
  // 이 페이지 자체 등록
  useRegisterSourceFile('pages/utilities/SourceLinkDirectory.tsx');

  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  // 활성 파일들만 필터링하고 정렬
  const activeFiles = Object.values(entries)
    .filter(e => e.instances && e.instances.size > 0)
    .sort((a, b) => a.filePath.localeCompare(b.filePath));

  return (
    <PageLayout 
      title="Source Link Directory"
      description="A utility system for automatically tracking and linking to source files in the example application"
    >
      <div className="space-y-6">
        
        {/* What is Source Link Directory */}
        <section className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mb-3">What is Source Link Directory?</h2>
          <p className="text-gray-600 mb-4">
            소스 링크 디렉터리는 예제 애플리케이션의 모든 페이지와 컴포넌트가 자동으로 자신의 소스 코드 위치를 등록하고,
            GitHub에서 직접 확인할 수 있는 링크를 제공하는 유틸리티 시스템입니다.
          </p>
          
          <h3 className="text-base font-medium mb-2">Key Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Automatic Registration:</strong> 컴포넌트가 마운트될 때 자동으로 소스 파일 등록</li>
            <li>• <strong>Instance Tracking:</strong> 동일한 컴포넌트의 여러 인스턴스 추적</li>
            <li>• <strong>GitHub Integration:</strong> 소스 파일에 대한 직접 GitHub 링크 제공</li>
            <li>• <strong>Category Organization:</strong> 파일 경로 기반 카테고리 자동 분류</li>
            <li>• <strong>Real-time Updates:</strong> 페이지 네비게이션에 따른 실시간 파일 목록 업데이트</li>
          </ul>
        </section>

        {/* Basic Usage */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Basic Usage</h2>
          <p className="text-sm text-gray-600 mb-4">
            컴포넌트에서 <code className="bg-gray-100 px-1 rounded">useRegisterSourceFile</code> 훅을 사용하여 소스 파일을 등록합니다:
          </p>
          
          <CodeExample title="Simple Registration">
            <CodeBlock>
{`import { useRegisterSourceFile } from '../hooks/useRegisterSourceFile';

function MyComponent() {
  // 소스 파일 자동 등록 - GitHub 링크가 생성됩니다
  useRegisterSourceFile('components/MyComponent.tsx');
  
  return <div>My Component</div>;
}`}
            </CodeBlock>
          </CodeExample>
        </section>

        {/* Advanced Usage */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Advanced Usage with Options</h2>
          <p className="text-sm text-gray-600 mb-4">
            추가 메타데이터와 함께 파일을 등록할 수 있습니다:
          </p>
          
          <CodeExample title="Registration with Metadata">
            <CodeBlock>
{`function UserProfileComponent() {
  useRegisterSourceFile('components/UserProfile.tsx', {
    name: 'UserProfile',
    description: 'User profile management component',
    tags: ['user', 'profile', 'form'],
    priority: 10  // 높은 우선순위로 상단에 표시
  });
  
  return <div>User Profile</div>;
}`}
            </CodeBlock>
          </CodeExample>
        </section>

        {/* Utility Hooks */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Utility Hooks</h2>
          <p className="text-sm text-gray-600 mb-4">
            소스 파일 상태를 확인하는 유틸리티 훅들도 제공합니다:
          </p>
          
          <CodeExample title="Utility Hooks">
            <CodeBlock>
{`import { 
  useIsSourceFileRegistered, 
  useSourceFileInstanceCount 
} from '../hooks/useRegisterSourceFile';

function FileStatusComponent() {
  const isRegistered = useIsSourceFileRegistered('components/MyComponent.tsx');
  const instanceCount = useSourceFileInstanceCount('components/MyComponent.tsx');
  
  return (
    <div>
      <p>File registered: {isRegistered ? 'Yes' : 'No'}</p>
      <p>Active instances: {instanceCount}</p>
    </div>
  );
}`}
            </CodeBlock>
          </CodeExample>
        </section>

        {/* Store Structure */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Store Structure</h2>
          <p className="text-sm text-gray-600 mb-4">
            소스 링크 정보는 Context-Action의 Store 시스템으로 관리됩니다:
          </p>
          
          <CodeExample title="SourceLinkEntry Interface">
            <CodeBlock>
{`interface SourceLinkEntry {
  filePath: string;             // 파일 경로 (고유 키)
  name: string;                 // 표시명
  githubPath: string;           // GitHub URL
  category: string;             // 카테고리 (자동 감지)
  description?: string;         // 설명
  tags?: string[];              // 태그들
  priority?: number;            // 우선순위
  instances: Set<string>;       // 활성 인스턴스 ID들
  firstRegisteredAt: Date;      // 최초 등록 시간
  lastUpdatedAt: Date;          // 마지막 업데이트 시간
}

interface SourceLinkRegistryState {
  entries: Record<string, SourceLinkEntry>;
  categories: string[];
  totalCount: number;
}`}
            </CodeBlock>
          </CodeExample>
        </section>

        {/* Live Examples */}
        <section>
          <h2 className="text-lg font-semibold mb-3">🎯 Live Examples</h2>
          <div className="space-y-4">
            
            {/* Dynamic Demo Component */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-2 text-green-800">실시간 등록 데모</h3>
              <DynamicRegistrationDemo />
            </div>
            
            {/* Status Checker */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-2 text-purple-800">파일 상태 체커</h3>
              <FileStatusChecker />
            </div>
            
            {/* Instance Counter */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-base font-medium mb-2 text-orange-800">인스턴스 카운터</h3>
              <InstanceCounterDemo />
            </div>
            
          </div>
        </section>

        {/* Current State */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Currently Registered Files</h2>
          <div className="bg-gray-50 border rounded p-4">
            <div className="text-xs text-gray-500 mb-3">
              {activeFiles.length} files registered
            </div>
            
            {activeFiles.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No files registered. Navigate to other pages to see source files.
              </div>
            ) : (
              <div className="space-y-1">
                {activeFiles.map(file => (
                  <div key={file.filePath} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 text-xs font-mono w-16">
                      {file.category}
                    </span>
                    <a
                      href={file.githubPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex-1 font-mono"
                      title={file.filePath}
                    >
                      {file.name}
                    </a>
                    {file.instances.size > 1 && (
                      <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">
                        {file.instances.size}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Core Components */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">🏗️ Core Components</h2>
          <p className="text-sm text-blue-700 mb-3">
            Source Directory는 다음과 같은 핵심 구성 요소들로 이루어져 있습니다:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="font-medium text-blue-800 mb-1">📝 useRegisterSourceFile</div>
              <div className="text-blue-600 text-xs">컴포넌트에서 소스 파일을 자동 등록하는 메인 훅</div>
            </div>
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="font-medium text-blue-800 mb-1">🗄️ SourceLinkRegistry</div>
              <div className="text-blue-600 text-xs">등록된 파일 정보를 관리하는 Store Context</div>
            </div>
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="font-medium text-blue-800 mb-1">🔍 Utility Hooks</div>
              <div className="text-blue-600 text-xs">파일 상태 확인을 위한 보조 훅들</div>
            </div>
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="font-medium text-blue-800 mb-1">📋 Directory Page</div>
              <div className="text-blue-600 text-xs">등록된 모든 파일을 표시하는 현재 페이지</div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mb-3">Benefits</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>For Developers:</strong> 예제 코드를 보면서 실제 구현을 바로 GitHub에서 확인</p>
            <p><strong>For Learning:</strong> 각 페이지의 구현 방식을 쉽게 탐색하고 학습</p>
            <p><strong>For Documentation:</strong> 코드와 문서가 항상 동기화된 상태 유지</p>
            <p><strong>For Development:</strong> 컴포넌트 재사용성과 구조 파악이 용이</p>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}