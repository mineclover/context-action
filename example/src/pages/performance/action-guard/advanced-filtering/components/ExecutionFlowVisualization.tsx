import { Fragment } from 'react';
import {
  type ExecutionVisualizationState,
  FILTERING_HANDLERS,
} from '../business/filtering-demo-rules';

interface ExecutionFlowVisualizationProps {
  visualization: ExecutionVisualizationState;
}

export function ExecutionFlowVisualization({
  visualization,
}: ExecutionFlowVisualizationProps) {
  const { executedHandlers, isRunning, totalExecuted, totalDuration } =
    visualization;

  return (
    <div className="bg-white rounded-xl border shadow-lg p-4 mb-6 max-w-[600px] mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center">
          <span className="mr-2">🔄</span>
          Handler Execution Flow
          <span className="ml-2">🔄</span>
        </h3>

        <div className="flex justify-center space-x-3 mt-2">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold text-sm">
            ✅ {totalExecuted}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded font-semibold text-sm">
            ⏸️ {FILTERING_HANDLERS.length - totalExecuted}
          </div>
          {totalDuration > 0 && (
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-semibold text-sm">
              ⚡ {totalDuration}ms
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center space-x-2 overflow-x-auto">
        {FILTERING_HANDLERS.map((handler, index) => {
          const isExecuted = executedHandlers.includes(handler.id);
          const isNext = index === totalExecuted && isRunning;

          return (
            <Fragment key={handler.id}>
              <div
                className={`
                  flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-500
                  min-w-[80px] max-w-[80px]
                  ${
                    isExecuted
                      ? 'bg-gradient-to-b from-green-50 to-green-100 border-green-500 shadow-lg scale-110 ring-2 ring-green-300'
                      : isNext
                        ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-500 shadow-md animate-pulse'
                        : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300 opacity-60'
                  }
                `}
              >
                <div
                  className={`text-2xl mb-1 transition-all duration-500 ${isExecuted ? 'animate-bounce' : ''}`}
                >
                  {handler.icon}
                </div>
                <div className="text-xs font-medium text-center leading-tight">
                  {handler.name}
                </div>
                <div className="text-xs text-gray-500">P{handler.priority}</div>
              </div>

              {index < FILTERING_HANDLERS.length - 1 && (
                <div
                  className={`
                    transition-all duration-300 text-2xl
                    ${
                      isExecuted &&
                      executedHandlers.includes(
                        FILTERING_HANDLERS[index + 1]?.id ?? ''
                      )
                        ? 'text-green-500 animate-pulse'
                        : isExecuted
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                    }
                  `}
                >
                  →
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
