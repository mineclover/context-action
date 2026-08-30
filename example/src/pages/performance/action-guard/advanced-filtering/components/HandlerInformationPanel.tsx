import { FILTERING_HANDLERS } from '../business/filtering-demo-rules';

const borderClassByColor = {
  red: 'border-red-200',
  blue: 'border-blue-200',
  green: 'border-green-200',
  yellow: 'border-yellow-200',
  purple: 'border-purple-200',
} as const;

export function HandlerInformationPanel() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 max-w-4xl mx-auto">
      <h3 className="font-bold text-blue-900 mb-4 flex items-center justify-center gap-2">
        <span>🔧</span>
        Registered Handlers (Priority Order)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {FILTERING_HANDLERS.map((handler) => (
          <div
            key={handler.id}
            className={`bg-white border-2 rounded-lg p-3 text-center ${borderClassByColor[handler.color]}`}
          >
            <div className="text-2xl mb-1">{handler.icon}</div>
            <div className="font-semibold text-sm text-gray-900">
              {handler.name}
            </div>
            <div className="text-xs text-gray-500">P{handler.priority}</div>
            <div
              className={`text-xs px-2 py-1 rounded mt-1 ${
                handler.blocking
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {handler.blocking ? '⏳ Blocking' : '⚡ Non-blocking'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
