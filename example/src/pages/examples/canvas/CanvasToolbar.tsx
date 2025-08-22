import React from 'react';
import { useCanvas } from './CanvasContext';

export function CanvasToolbar() {
  const {
    currentMode,
    currentTool,
    currentColor,
    strokeWidth,
    setMode,
    setTool,
    setColor,
    setStrokeWidth,
    clearAllShapes,
  } = useCanvas();

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Canvas Toolbar</h2>
      
      {/* 수평 레이아웃으로 모든 컨트롤 배치 */}
      <div className="flex flex-wrap items-center gap-4">
        
        {/* Canvas 컨트롤 버튼들 */}
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            onClick={() => {
              // Focus Canvas 로직은 부모에서 처리
            }}
          >
            Focus
          </button>
          <button 
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            onClick={clearAllShapes}
          >
            Clear All
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 모드 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mode:</span>
          <div className="flex gap-1">
            <button 
              className={`px-2 py-1 rounded text-sm ${currentMode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setMode('draw')}
            >
              ✏️ Draw
            </button>
            <button 
              className={`px-2 py-1 rounded text-sm ${currentMode === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setMode('select')}
            >
              🔍 Select
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 도구 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tools:</span>
          <div className="flex gap-1">
            <button 
              className={`px-2 py-1 rounded text-sm ${currentTool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              ⬜
            </button>
            <button 
              className={`px-2 py-1 rounded text-sm ${currentTool === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setTool('circle')}
              title="Circle"
            >
              ⭕
            </button>
            <button 
              className={`px-2 py-1 rounded text-sm ${currentTool === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setTool('line')}
              title="Line"
            >
              📏
            </button>
            <button 
              className={`px-2 py-1 rounded text-sm ${currentTool === 'freehand' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setTool('freehand')}
              title="Freehand"
            >
              ✍️
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 색상 설정 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Color:</span>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title={`Color: ${currentColor}`}
          />
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 스트로크 너비 설정 */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-sm font-medium text-gray-700">Width:</span>
          <span className="text-sm text-gray-600 w-6">{strokeWidth}</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="flex-1"
            title={`Stroke Width: ${strokeWidth}px`}
          />
        </div>
      </div>
    </div>
  );
}