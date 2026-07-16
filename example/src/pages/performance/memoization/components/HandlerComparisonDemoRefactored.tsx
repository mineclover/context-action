import { ComparisonHandlerRegistry } from '../handlers/ComparisonHandlerRegistry';
import {
  ComparisonStoreProvider,
  MemoizedActionProvider,
  NonMemoizedActionProvider,
  PerformanceControlActionProvider,
  PerformanceControlProvider,
} from '../models/ComparisonModel';
import { CodeComparison } from './shared/CodeComparison';
import { PerformanceImpactSummary } from './shared/PerformanceImpactSummary';
import { MemoizedHandlerWidget } from './widgets/MemoizedHandlerWidget';
import { NonMemoizedHandlerWidget } from './widgets/NonMemoizedHandlerWidget';
import { PerformanceControlWidget } from './widgets/PerformanceControlWidget';

/**
 * MVVM 아키텍처로 리팩토링된 Handler Comparison Demo
 *
 * 아키텍처 레이어:
 * - Model: createStoreContext, createActionContext (../models/ComparisonModel.ts)
 * - ViewModel: hooks (../hooks/*.ts)
 * - View: 이 컴포넌트와 Shared Components, Widgets
 *
 * 특징:
 * - 컴포넌트에서 useEffect, dispatch 직접 사용 금지
 * - hooks를 통한 로직 주입 방식
 * - 순수 View Component와 Widget 분리
 * - Context-Action을 통한 복잡도 해소
 */
export function HandlerComparisonDemoRefactored() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          useActionHandler Memoization Comparison (MVVM)
        </h2>
        <p className="text-gray-600">
          Compare performance between memoized and non-memoized action handlers
          using MVVM architecture
        </p>
      </div>

      {/* Model Providers Layer */}
      <ComparisonStoreProvider>
        <PerformanceControlProvider>
          <PerformanceControlActionProvider>
            <MemoizedActionProvider>
              <NonMemoizedActionProvider>
                <ComparisonHandlerRegistry>
                  {/* Performance Control Widget */}
                  <PerformanceControlWidget />

                  {/* Comparison Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <MemoizedHandlerWidget />
                    <NonMemoizedHandlerWidget />
                  </div>
                </ComparisonHandlerRegistry>
              </NonMemoizedActionProvider>
            </MemoizedActionProvider>
          </PerformanceControlActionProvider>
        </PerformanceControlProvider>
      </ComparisonStoreProvider>

      {/* Pure UI Components */}
      <CodeComparison />
      <PerformanceImpactSummary />
    </div>
  );
}

export default HandlerComparisonDemoRefactored;
