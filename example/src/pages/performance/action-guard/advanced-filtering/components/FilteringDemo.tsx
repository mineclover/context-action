import {
  type FilteringDispatchOptions,
  type FilteringExecutionResult,
  groupFilteringDemos,
} from '../business/filtering-demo-rules';

const DEMOS_BY_CATEGORY = groupFilteringDemos();

interface FilteringDemoProps {
  results: Record<string, FilteringExecutionResult | null>;
  isLoading: boolean;
  onRunDemo: (
    demoKey: string,
    filterOptions?: FilteringDispatchOptions
  ) => void | Promise<void>;
  onClearResults: () => void | Promise<void>;
}

export function FilteringDemo({
  results,
  isLoading,
  onRunDemo,
  onClearResults,
}: FilteringDemoProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => void onRunDemo('no-filter')}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          🔄 Run All Handlers
        </button>
        <button
          onClick={() =>
            void onRunDemo('critical-only', {
              filter: { handlerIds: ['security-check', 'database-save'] },
            })
          }
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          🔐 Critical Only
        </button>
        <button
          onClick={() => void onClearResults()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
        >
          🗑️ Clear Results
        </button>
      </div>

      {Object.entries(DEMOS_BY_CATEGORY).map(([category, categoryDemos]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2">
            📂 {category} Filtering
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryDemos.map((demo) => {
              const result = results[demo.key];

              return (
                <div
                  key={demo.key}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {demo.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {demo.description}
                    </p>
                  </div>

                  <button
                    onClick={() => void onRunDemo(demo.key, demo.filterOptions)}
                    disabled={isLoading}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {isLoading && result === null ? 'Running...' : 'Execute'}
                  </button>

                  {result && (
                    <div className="mt-3 p-2 rounded-lg bg-gray-50">
                      {result.error ? (
                        <div className="text-red-600 text-sm flex items-center gap-1">
                          <span>❌</span>
                          <span>Error: {result.error}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-green-600 text-sm flex items-center gap-1">
                            <span>✅</span>
                            <span>
                              {result.execution?.handlersExecuted ?? 0} handlers
                              executed
                            </span>
                          </div>
                          <div className="text-blue-600 text-sm flex items-center gap-1">
                            <span>⚡</span>
                            <span>
                              {result.execution?.duration ?? 0}ms duration
                            </span>
                          </div>
                          {result.success === false && (
                            <div className="text-orange-600 text-sm flex items-center gap-1">
                              <span>⚠️</span>
                              <span>Pipeline failed</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(results).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Execution Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {
                  Object.values(results).filter(
                    (result) => result && !result.error
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {
                  Object.values(results).filter((result) => result?.error)
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(results).reduce(
                  (sum, result) =>
                    sum + (result?.execution?.handlersExecuted ?? 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Handlers</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  Object.values(results).reduce(
                    (sum, result) => sum + (result?.execution?.duration ?? 0),
                    0
                  )
                )}
                ms
              </div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
