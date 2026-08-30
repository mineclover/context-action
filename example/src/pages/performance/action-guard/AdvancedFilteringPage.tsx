import { ExecutionFlowVisualization } from './advanced-filtering/components/ExecutionFlowVisualization';
import { FilteringDemo } from './advanced-filtering/components/FilteringDemo';
import { HandlerInformationPanel } from './advanced-filtering/components/HandlerInformationPanel';
import { AdvancedFilteringProviders } from './advanced-filtering/handlers/AdvancedFilteringHandlerRegistry';
import { useAdvancedFilteringViewModel } from './advanced-filtering/hooks/useAdvancedFilteringViewModel';

function AdvancedFilteringDemo() {
  const { executionResults, isLoading, visualization, actions } =
    useAdvancedFilteringViewModel();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 Advanced Filtering Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Real-time handler execution visualization with page-scoped Action and
          Store contexts
        </p>
        <HandlerInformationPanel />
      </div>

      <ExecutionFlowVisualization visualization={visualization} />
      <FilteringDemo
        results={executionResults}
        isLoading={isLoading}
        onRunDemo={actions.runDemo}
        onClearResults={actions.clearResults}
      />
    </div>
  );
}

export default function AdvancedFilteringPage() {
  return (
    <AdvancedFilteringProviders>
      <AdvancedFilteringDemo />
    </AdvancedFilteringProviders>
  );
}
