/**
 * Basic Error Boundary Example
 * 
 * ContextActionErrorBoundary의 기본 사용법을 보여주는 예제:
 * - 컴포넌트 에러 캐치 및 폴백 UI 렌더링
 * - 에러 정보 로깅 및 DevTools 연동
 * - 사용자 정의 에러 처리 로직
 */

import React, { useState, useCallback } from 'react';
import { ContextActionErrorBoundary, createErrorHandler } from '@context-action/react';
import { setupDevTools } from '@context-action/react';

// DevTools 초기화 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  setupDevTools({
    enabled: true,
    enablePerformanceMonitoring: true
  });
}

// 의도적으로 에러를 발생시키는 컴포넌트
function ProblematicComponent({ shouldError = false, errorType = 'render' }: {
  shouldError: boolean;
  errorType: 'render' | 'async' | 'null-access';
}) {
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  // 렌더링 중 에러
  if (shouldError && errorType === 'render') {
    throw new Error('💥 Render Error: Something went wrong in component rendering!');
  }

  // null 참조 에러
  if (shouldError && errorType === 'null-access') {
    const nullObject: any = null;
    return <div>{nullObject.nonExistentProperty}</div>;
  }

  // 비동기 에러 처리
  const handleAsyncError = useCallback(async () => {
    try {
      // 실패하는 비동기 작업 시뮬레이션
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('비동기 작업이 실패했습니다!')), 500);
      });
    } catch (error) {
      setAsyncError(error as Error);
      throw error; // ErrorBoundary가 캐치하도록 다시 throw
    }
  }, []);

  if (asyncError) {
    throw asyncError;
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-semibold text-green-800 mb-2">
        ✅ 정상 작동 중인 컴포넌트
      </h3>
      <p className="text-green-700 mb-4">
        이 컴포넌트는 현재 정상적으로 작동하고 있습니다.
      </p>
      
      {errorType === 'async' && (
        <button
          onClick={handleAsyncError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          비동기 에러 발생시키기
        </button>
      )}
    </div>
  );
}

// 에러 폴백 컴포넌트
function ErrorFallback({ error, resetError, errorInfo }: {
  error: Error;
  resetError: () => void;
  errorInfo?: { componentStack: string };
}) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.352 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            앗! 뭔가 잘못됐어요
          </h3>
          <p className="text-red-700 mb-4">
            컴포넌트에서 에러가 발생했습니다. 아래 정보를 확인해주세요.
          </p>
          
          <div className="bg-red-100 p-3 rounded-md mb-4">
            <h4 className="font-medium text-red-800 mb-1">에러 메시지:</h4>
            <p className="text-sm text-red-700 font-mono">{error.message}</p>
          </div>
          
          {errorInfo?.componentStack && (
            <details className="bg-red-100 p-3 rounded-md mb-4">
              <summary className="font-medium text-red-800 cursor-pointer">
                컴포넌트 스택 (클릭하여 펼치기)
              </summary>
              <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    </div>
  );
}

export function BasicErrorBoundaryPage() {
  const [errorConfig, setErrorConfig] = useState({
    shouldError: false,
    errorType: 'render' as 'render' | 'async' | 'null-access'
  });

  // 에러 핸들러 생성
  const errorHandler = createErrorHandler({
    onError: (error, context) => {
      console.error('🚨 Error Handler:', error.message, context);
      
      // DevTools에도 에러 로깅
      if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
          name: 'Error Boundary Demo'
        });
        devTools.send('ERROR_OCCURRED', {
          error: error.message,
          context: context?.context || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  const handleErrorTypeChange = (type: typeof errorConfig.errorType) => {
    setErrorConfig(prev => ({
      ...prev,
      errorType: type,
      shouldError: false // 에러 타입 변경시 에러 상태 리셋
    }));
  };

  const triggerError = () => {
    setErrorConfig(prev => ({ ...prev, shouldError: true }));
  };

  const resetError = () => {
    setErrorConfig(prev => ({ ...prev, shouldError: false }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🛡️ Basic Error Boundary
        </h1>
        <p className="text-lg text-gray-600">
          ContextActionErrorBoundary를 사용한 기본적인 에러 처리 패턴을 살펴보세요.
          다양한 유형의 에러를 발생시켜보고 어떻게 처리되는지 확인할 수 있습니다.
        </p>
      </header>

      {/* 에러 제어 패널 */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🎛️ 에러 제어 패널
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              에러 유형 선택:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'render', label: '렌더링 에러', desc: '컴포넌트 렌더링 중 발생' },
                { value: 'async', label: '비동기 에러', desc: '비동기 작업 중 발생' },
                { value: 'null-access', label: 'Null 참조 에러', desc: 'null 객체 접근 시도' }
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    errorConfig.errorType === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="errorType"
                    value={value}
                    checked={errorConfig.errorType === value}
                    onChange={() => handleErrorTypeChange(value as any)}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={triggerError}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🚨 에러 발생시키기
            </button>
            <button
              onClick={resetError}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 초기화
            </button>
          </div>
        </div>
      </div>

      {/* ErrorBoundary로 감싼 컴포넌트 영역 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📦 Protected Component Area
        </h2>
        
        <ContextActionErrorBoundary
          fallbackComponent={(props) => <ErrorFallback {...props} />}
          onError={(error, errorInfo) => {
            errorHandler.handleError(error, {
              context: 'basic-error-boundary',
              category: 'component-error',
              componentStack: errorInfo.componentStack
            });
          }}
        >
          <ProblematicComponent
            shouldError={errorConfig.shouldError}
            errorType={errorConfig.errorType}
          />
        </ContextActionErrorBoundary>
      </div>

      {/* DevTools 안내 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          🔧 개발 도구 확인사항
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 브라우저 콘솔에서 에러 로그 확인</li>
          <li>• Redux DevTools에서 에러 액션 모니터링</li>
          <li>• React Developer Tools에서 컴포넌트 트리 상태 확인</li>
        </ul>
      </div>

      {/* 코드 예시 */}
      <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💻 코드 예시</h3>
        <pre className="text-sm overflow-x-auto">
{`import { ContextActionErrorBoundary, createErrorHandler } from '@context-action/react';

// 에러 핸들러 생성
const errorHandler = createErrorHandler({
  onError: (error, context) => {
    console.error('Error:', error.message, context);
    // DevTools 로깅, 분석 시스템 연동 등...
  }
});

// ErrorBoundary 사용
<ContextActionErrorBoundary
  fallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    errorHandler.handleError(error, {
      context: 'component-boundary',
      category: 'render-error'
    });
  }}
>
  <YourComponent />
</ContextActionErrorBoundary>`}
        </pre>
      </div>
    </div>
  );
}