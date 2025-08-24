import { useState, useEffect } from 'react';
import { useCanvas } from './CanvasContext';
import type { CanvasEvent } from './Canvas';

interface CanvasStatusProps {
  canvasFocused: boolean;
  events?: CanvasEvent[];
  onSelectShape?: (shapeId: string) => void;
}

export function CanvasStatus({ canvasFocused, events = [], onSelectShape }: CanvasStatusProps) {
  const {
    shapes,
    selectedShapeId,
    currentMode,
    currentTool,
    selectShape,
    isDragging,
    currentColor,
    strokeWidth,
  } = useCanvas();

  const selectedShape = shapes.find(s => s.id === selectedShapeId);
  const [showEventLog, setShowEventLog] = useState(false);
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  
  // 최근 이벤트들 (최대 10개)
  const recentEvents = events.slice(-10).reverse();
  
  // 도형 클릭 핸들러
  const handleShapeClick = (shapeId: string) => {
    selectShape(shapeId);
    onSelectShape?.(shapeId);
  };
  
  // 도형 정보 확장/축소
  const toggleShapeExpanded = (shapeId: string) => {
    const newExpanded = new Set(expandedShapes);
    if (newExpanded.has(shapeId)) {
      newExpanded.delete(shapeId);
    } else {
      newExpanded.add(shapeId);
    }
    setExpandedShapes(newExpanded);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Canvas Status & Shapes</h2>
      
      <div className="flex flex-col gap-6">
        {/* Canvas 실시간 상태 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900">실시간 상태</h3>
            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showEventLog 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
              }`}
            >
              {showEventLog ? '📊 이벤트 숨기기' : '📊 이벤트 보기'} {events.length > 0 && `(${events.length})`}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
            <div className={`p-3 rounded-lg transition-colors ${
              selectedShape ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white border border-gray-200'
            }`}>
              <div className="text-gray-600 mb-1">🎯 Selection</div>
              <div className="font-medium">
                {selectedShape ? (
                  <span className="text-blue-600">
                    {selectedShape.type} #{selectedShape.id.slice(-4)}
                  </span>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg transition-colors ${
              canvasFocused ? 'bg-green-100 border-2 border-green-300' : 'bg-white border border-gray-200'
            }`}>
              <div className="text-gray-600 mb-1">👆 Focus</div>
              <div className="font-medium">
                <span className={canvasFocused ? 'text-green-600' : 'text-gray-400'}>
                  {canvasFocused ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg transition-colors ${
              currentMode === 'draw' ? 'bg-purple-100 border-2 border-purple-300' : 'bg-orange-100 border-2 border-orange-300'
            }`}>
              <div className="text-gray-600 mb-1">🛠️ Mode</div>
              <div className={`font-medium capitalize ${currentMode === 'draw' ? 'text-purple-600' : 'text-orange-600'}`}>
                {currentMode}
              </div>
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="text-gray-600 mb-1">🔧 Tool</div>
              <div className="font-medium capitalize text-indigo-600">{currentTool}</div>
            </div>
            
            <div className={`p-3 rounded-lg transition-colors ${
              isDragging ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-white border border-gray-200'
            }`}>
              <div className="text-gray-600 mb-1">✋ Dragging</div>
              <div className="font-medium">
                <span className={isDragging ? 'text-yellow-600' : 'text-gray-400'}>
                  {isDragging ? '● Active' : '○ Idle'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="text-gray-600 mb-1">🎨 Style</div>
              <div className="font-medium flex items-center gap-1">
                <div 
                  className="w-3 h-3 border border-gray-300 rounded"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-xs">{strokeWidth}px</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 이벤트 로그 */}
        {showEventLog && (
          <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-400">📋 Event Log</h4>
              <span className="text-gray-400 text-xs">최근 {recentEvents.length}개 이벤트</span>
            </div>
            {recentEvents.length === 0 ? (
              <div className="text-gray-500 text-center py-4">아직 이벤트가 없습니다.</div>
            ) : (
              <div className="space-y-1">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-500 w-16 flex-shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('ko-KR', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                      event.type === 'draw' ? 'bg-blue-400' :
                      event.type === 'select' ? 'bg-green-400' :
                      event.type === 'delete' ? 'bg-red-400' :
                      event.type === 'focus' ? 'bg-yellow-400' :
                      event.type === 'blur' ? 'bg-gray-400' :
                      'bg-purple-400'
                    }`} />
                    <span className="flex-1">{event.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

        {/* 도형 목록 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Shapes</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {shapes.length} {shapes.length === 1 ? 'shape' : 'shapes'}
            </span>
          </div>
          
          {shapes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-3">🎨</div>
              <div className="text-lg font-medium mb-2">Canvas is empty</div>
              <div className="text-sm">Select a tool from the toolbar above and start drawing!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {shapes.map((shape, index) => {
                const isSelected = selectedShapeId === shape.id;
                const isExpanded = expandedShapes.has(shape.id);
                
                return (
                  <div
                    key={shape.id}
                    className={`rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-400 shadow-lg ring-2 ring-blue-200' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => handleShapeClick(shape.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm capitalize transition-colors ${
                            isSelected ? 'text-blue-800' : 'text-gray-800'
                          }`}>
                            {shape.type}
                          </span>
                          {isSelected && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">선택됨</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: shape.color }}
                            title={`Color: ${shape.color}`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShapeExpanded(shape.id);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? '📁' : '📂'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          {shape.type === 'freehand' 
                            ? `${shape.points?.length || 0} points`
                            : `${Math.round(shape.width)} × ${Math.round(shape.height)}`
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Stroke: {shape.strokeWidth}px</span>
                          <span className="font-mono text-xs">{shape.color}</span>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div><strong>ID:</strong> {shape.id}</div>
                            <div><strong>Position:</strong> ({Math.round(shape.x)}, {Math.round(shape.y)})</div>
                            {shape.type === 'freehand' && shape.points && (
                              <div><strong>Points:</strong> {shape.points.length}개 좌표</div>
                            )}
                            {shape.type !== 'freehand' && (
                              <>
                                <div><strong>Size:</strong> {Math.round(shape.width)}w × {Math.round(shape.height)}h</div>
                                <div><strong>Area:</strong> {Math.round(shape.width * shape.height)}px²</div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}