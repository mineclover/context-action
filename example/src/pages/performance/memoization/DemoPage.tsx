import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandlerComparisonDemo } from './components/HandlerComparisonDemo';
import { HandlerComparisonDemoRefactored } from './components/HandlerComparisonDemoRefactored';

const DemoPage: React.FC = () => {
  const [demoVersion, setDemoVersion] = useState<'canonical' | 'compatibility'>(
    'canonical'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/performance"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Performance
                </Link>
              </li>
              <li>
                <Link
                  to="/performance/memoization"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Memoization
                </Link>
              </li>
              <li className="text-gray-900">Demo</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                실시간 성능 비교 데모
              </h1>
              <p className="text-gray-600">
                메모이제이션 사용 여부에 따른 성능 차이를 실시간으로 확인할 수
                있습니다.
              </p>
            </div>

            {/* Architecture Version Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setDemoVersion('canonical')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  demoVersion === 'canonical'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Context-Layered 아키텍처
              </button>
              <button
                onClick={() => setDemoVersion('compatibility')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  demoVersion === 'compatibility'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                기존 import 호환
              </button>
            </div>
          </div>

          {/* Architecture Description */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {demoVersion === 'canonical' ? (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  🏗️ Context-Layered 아키텍처 (Context-Action)
                </h3>
                <p className="text-blue-800 text-sm mb-2">
                  Context, business rules, commands, Registry, View를 분리한
                  canonical 패턴을 사용합니다.
                </p>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>
                    • <strong>Model:</strong> createStoreContext,
                    createActionContext로 데이터 계층 관리
                  </li>
                  <li>
                    • <strong>Registry:</strong> handler 등록과 orchestration
                    담당
                  </li>
                  <li>
                    • <strong>View:</strong> 순수 UI 컴포넌트 + Widget 조합
                  </li>
                  <li>
                    • <strong>특징:</strong> View는 Store 구독과 semantic
                    command만 사용
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  🏗️ 기존 import 호환 진입점
                </h3>
                <p className="text-blue-800 text-sm mb-2">
                  이전 import 경로를 유지하면서 canonical 데모를 재사용하는
                  compatibility wrapper입니다.
                </p>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>
                    • <strong>상태 관리:</strong> canonical Store Context 사용
                  </li>
                  <li>
                    • <strong>비즈니스 로직:</strong> Handler Registry에 위임
                  </li>
                  <li>
                    • <strong>특징:</strong> 기존 source import와 링크 호환
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Demo Component */}
          {demoVersion === 'canonical' ? (
            <HandlerComparisonDemoRefactored />
          ) : (
            <HandlerComparisonDemo />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
