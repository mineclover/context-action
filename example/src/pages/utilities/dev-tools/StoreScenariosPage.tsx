/**
 * @fileoverview Store Scenarios Demo Page
 * 다양한 상태 관리 시나리오를 보여주는 실용적인 데모들
 */

import { createStoreContext, useStoreValue } from '@context-action/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { ChatDemo } from '@/pages/integrations/business/store-scenarios/components';
import { StoreScenarios } from '@/pages/integrations/business/store-scenarios/stores';

const ComparisonStrategyStores = createStoreContext('ComparisonStrategies', {
  referenceStore: {
    initialValue: { count: 1, nested: { label: 'alpha' } },
    strategy: 'reference' as const,
  },
  shallowStore: {
    initialValue: { count: 1, nested: { label: 'alpha' } },
    strategy: 'shallow' as const,
  },
  deepStore: {
    initialValue: { count: 1, nested: { label: 'alpha' } },
    strategy: 'deep' as const,
  },
});

function StrategySubscriberCard({
  title,
  strategy,
  storeName,
}: {
  title: string;
  strategy: 'reference' | 'shallow' | 'deep';
  storeName: 'referenceStore' | 'shallowStore' | 'deepStore';
}) {
  const store = ComparisonStrategyStores.useStore(storeName);
  const value = useStoreValue(store);
  const [notified, setNotified] = useState({
    count: 0,
    label: value.nested.label,
  });

  useEffect(() => {
    setNotified((prev) => ({
      count: prev.count + 1,
      label: `${value.count}:${value.nested.label}`,
    }));
  }, [value]);

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <code className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
          {strategy}
        </code>
      </div>
      <div className="text-2xl font-bold text-indigo-600">
        {notified.count} notifications
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Current state: count={value.count}, label={value.nested.label} (
        {notified.label})
      </div>
    </div>
  );
}

function ComparisonStrategyDemo() {
  const referenceStore = ComparisonStrategyStores.useStore('referenceStore');
  const shallowStore = ComparisonStrategyStores.useStore('shallowStore');
  const deepStore = ComparisonStrategyStores.useStore('deepStore');

  const updateShallowEqual = () => {
    for (const store of [referenceStore, shallowStore, deepStore]) {
      const current = store.getValue();
      store.setValue({ count: current.count, nested: current.nested });
    }
  };

  const updateDeepEqualNewNested = () => {
    for (const store of [referenceStore, shallowStore, deepStore]) {
      const current = store.getValue();
      store.setValue({
        count: current.count,
        nested: { ...current.nested },
      });
    }
  };

  const incrementCount = () => {
    for (const store of [referenceStore, shallowStore, deepStore]) {
      const current = store.getValue();
      store.setValue({
        count: current.count + 1,
        nested: current.nested,
      });
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl border border-indigo-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ⚖️ Store Comparison Strategy Lab
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            동일한 데이터 구조에서 <code>reference</code>, <code>shallow</code>,{' '}
            <code>deep</code> 비교 전략이 리렌더 알림을 어떻게 제어하는지
            확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={updateShallowEqual}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
          >
            New Top-Level Ref (Reference Only)
          </button>
          <button
            type="button"
            onClick={updateDeepEqualNewNested}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800"
          >
            New Nested Ref (Skip Deep)
          </button>
          <button
            type="button"
            onClick={incrementCount}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Change Value (Notify All)
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StrategySubscriberCard
          title="Reference Strategy"
          strategy="reference"
          storeName="referenceStore"
        />
        <StrategySubscriberCard
          title="Shallow Strategy"
          strategy="shallow"
          storeName="shallowStore"
        />
        <StrategySubscriberCard
          title="Deep Strategy"
          strategy="deep"
          storeName="deepStore"
        />
      </div>
    </div>
  );
}

export function StoreScenariosPage() {
  return (
    <PageWithLogMonitor pageId="store-scenarios" title="Store Scenarios">
      <StoreScenarios.Provider>
        <ComparisonStrategyStores.Provider>
          <div className="max-w-6xl mx-auto p-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl mb-8 border border-purple-200">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  🏪 Store Scenarios Demo
                </h1>
                <p className="text-lg text-gray-600">
                  다양한 Store 비교 전략과 실전 상태 관리 시나리오를
                  비교·테스트할 수 있습니다.
                </p>
              </div>
            </div>

            <ComparisonStrategyDemo />

            {/* Chat Demo Section */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">💬</span>
                        Chat Demo
                      </h2>
                      <p className="text-green-100 text-sm mt-2 leading-relaxed">
                        실시간 채팅 시스템 데모
                      </p>
                    </div>
                    <div className="text-right text-green-100 text-xs">
                      <div>Real-time Chat</div>
                      <div>Auto Scroll</div>
                      <div>Multi Users</div>
                    </div>
                  </div>
                </div>
                <div className="p-0">
                  <ChatDemo />
                </div>
              </div>
            </div>

            {/* Available Features */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                ✅ 사용 가능한 기능들
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4 text-green-600">
                    Chat Demo 기능
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      • <strong>실시간 메시징</strong>: Enter 키로 전송
                    </li>
                    <li>
                      • <strong>사용자 전환</strong>: 사용자명 변경 가능
                    </li>
                    <li>
                      • <strong>자동 응답</strong>: Bot 자동 응답
                    </li>
                    <li>
                      • <strong>타이핑 인디케이터</strong>: 타이핑 상태 표시
                    </li>
                    <li>
                      • <strong>메시지 히스토리</strong>: 모든 메시지 저장
                    </li>
                    <li>
                      • <strong>빠른 메시지</strong>: 템플릿 메시지
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4 text-blue-600">
                    기술적 특징
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      • <strong>Store Architecture</strong>: 메시지 히스토리
                      관리
                    </li>
                    <li>
                      • <strong>Immutable Updates</strong>: 메시지 배열 불변성
                    </li>
                    <li>
                      • <strong>Real-time Updates</strong>: 즉시 UI 반영
                    </li>
                    <li>
                      • <strong>Auto Scroll</strong>: 스마트 스크롤 관리
                    </li>
                    <li>
                      • <strong>Ref Management</strong>: DOM 참조 최적화
                    </li>
                    <li>
                      • <strong>Event Handling</strong>: 키보드 이벤트
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Related Links */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                🔗 관련 리소스
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  to="/integrations/business/chat"
                  className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                >
                  💬 Chat Demo 페이지
                </Link>
                <Link
                  to="/patterns/refs/canvas"
                  className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                >
                  🎨 Canvas Ref Demo
                </Link>
                <Link
                  to="/performance/action-guard/scroll"
                  className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                >
                  📜 Advanced Scroll Demo
                </Link>
              </div>
            </div>
          </div>
        </ComparisonStrategyStores.Provider>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}
