import { useStoreSelector, useStoreValue } from '@context-action/react';
import { useCallback } from 'react';
import { useCanvasAction, useCanvasStore } from './CanvasContext';

interface CanvasToolbarProps {
  onFocusCanvas?: () => void;
  onTestAction?: (action: string, details: string) => void;
}

export function CanvasToolbar({
  onFocusCanvas,
  onTestAction,
}: CanvasToolbarProps) {
  // 필요한 store만 구독 - 성능 최적화
  const currentModeStore = useCanvasStore('currentMode');
  const currentToolStore = useCanvasStore('currentTool');
  const currentColorStore = useCanvasStore('currentColor');
  const strokeWidthStore = useCanvasStore('strokeWidth');
  const shapesStore = useCanvasStore('shapes');
  const selectedShapeIdStore = useCanvasStore('selectedShapeId');

  const currentMode = useStoreValue(currentModeStore);
  const currentTool = useStoreValue(currentToolStore);
  const currentColor = useStoreValue(currentColorStore);
  const strokeWidth = useStoreValue(strokeWidthStore);
  // shapes 배열의 길이만 필요하므로 selector 사용
  const shapesCount = useStoreSelector(shapesStore, (shapes) => shapes.length);
  const _selectedShapeId = useStoreValue(selectedShapeIdStore);

  // Action dispatch 함수
  const dispatch = useCanvasAction();

  // 편의를 위한 액션 래퍼 함수들
  const setMode = (mode: 'draw' | 'select') => dispatch('setMode', { mode });
  const setTool = (tool: 'rectangle' | 'circle' | 'line' | 'freehand') =>
    dispatch('setTool', { tool });
  const setColor = (color: string) => dispatch('setColor', { color });
  const setStrokeWidth = (width: number) =>
    dispatch('setStrokeWidth', { width });
  const clearAllShapes = () => dispatch('clearAllShapes');

  // 테스트 액션들
  const handleClearAll = useCallback(() => {
    clearAllShapes();
    onTestAction?.('clear', `모든 도형 삭제 - 이전 개수: ${shapesCount}`);
  }, [clearAllShapes, shapesCount, onTestAction]);

  const handleModeChange = useCallback(
    (mode: 'draw' | 'select') => {
      setMode(mode);
      onTestAction?.('mode_change', `모드 변경: ${currentMode} → ${mode}`);
    },
    [setMode, currentMode, onTestAction]
  );

  const handleToolChange = useCallback(
    (tool: 'rectangle' | 'circle' | 'line' | 'freehand') => {
      setTool(tool);
      onTestAction?.('tool_change', `도구 변경: ${currentTool} → ${tool}`);
    },
    [setTool, currentTool, onTestAction]
  );

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Canvas Toolbar</h2>

      {/* 수평 레이아웃으로 모든 컨트롤 배치 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Canvas 컨트롤 버튼들 */}
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
            onClick={onFocusCanvas}
            title="Canvas에 포커스를 설정합니다"
          >
            🎯 Focus
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleClearAll}
            disabled={shapesCount === 0}
            title={
              shapesCount === 0
                ? '삭제할 도형이 없습니다'
                : `${shapesCount}개 도형을 모두 삭제합니다`
            }
          >
            🗑️ Clear All {shapesCount > 0 && `(${shapesCount})`}
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 모드 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mode:</span>
          <div className="flex gap-1">
            <button
              className={`px-2 py-1 rounded text-sm transition-all ${
                currentMode === 'draw'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => handleModeChange('draw')}
              title="새로운 도형을 그리는 모드"
            >
              ✏️ Draw
            </button>
            <button
              className={`px-2 py-1 rounded text-sm transition-all ${
                currentMode === 'select'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => handleModeChange('select')}
              title="도형을 선택하고 이동하는 모드"
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
            {[
              { key: 'rectangle', icon: '⬜', name: 'Rectangle' },
              { key: 'circle', icon: '⭕', name: 'Circle' },
              { key: 'line', icon: '📏', name: 'Line' },
              { key: 'freehand', icon: '✍️', name: 'Freehand' },
            ].map(({ key, icon, name }) => (
              <button
                key={key}
                className={`px-2 py-1 rounded text-sm transition-all ${
                  currentTool === key
                    ? 'bg-blue-500 text-white shadow-md transform scale-110 ring-2 ring-blue-300'
                    : 'bg-gray-200 hover:bg-gray-300 hover:scale-105'
                }`}
                onClick={() => handleToolChange(key as any)}
                title={`${name} 도구로 그리기`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 색상 설정 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Color:</span>
          <div className="relative">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-blue-400 transition-colors"
              title={`현재 색상: ${currentColor}`}
            />
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-white border border-gray-400 rounded-full flex items-center justify-center text-xs">
              🎨
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {currentColor}
          </span>
        </div>

        {/* 구분선 */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* 스트로크 너비 설정 */}
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-sm font-medium text-gray-700">Width:</span>
          <div className="flex items-center gap-2 flex-1">
            <span
              className={`text-sm font-bold w-6 transition-colors ${
                strokeWidth <= 5
                  ? 'text-green-600'
                  : strokeWidth <= 10
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {strokeWidth}
            </span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="flex-1 accent-blue-500"
              title={`스트로크 두께: ${strokeWidth}px`}
            />
            <div className="flex flex-col items-center">
              <div
                className="bg-gray-800 rounded-full transition-all"
                style={{
                  width: `${Math.max(strokeWidth / 2, 2)}px`,
                  height: `${Math.max(strokeWidth / 2, 2)}px`,
                }}
              />
              <span className="text-xs text-gray-400 mt-1">px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
