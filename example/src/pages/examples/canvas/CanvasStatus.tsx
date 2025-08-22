import React from 'react';
import { useCanvas } from './CanvasContext';

interface CanvasStatusProps {
  canvasFocused: boolean;
}

export function CanvasStatus({ canvasFocused }: CanvasStatusProps) {
  const {
    shapes,
    selectedShapeId,
    currentMode,
    currentTool,
  } = useCanvas();

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Canvas Status & Shapes</h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas 상태 정보 */}
        <div className="lg:w-80 flex-shrink-0">
          <h3 className="text-lg font-semibold mb-3">Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">Selection</div>
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
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">Focus</div>
              <div className="font-medium">
                <span className={canvasFocused ? 'text-green-600' : 'text-gray-400'}>
                  {canvasFocused ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">Mode</div>
              <div className="font-medium capitalize text-purple-600">{currentMode}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">Tool</div>
              <div className="font-medium capitalize text-orange-600">{currentTool}</div>
            </div>
          </div>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {shapes.map((shape, index) => (
                <div
                  key={shape.id}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedShapeId === shape.id 
                      ? 'bg-blue-50 border-blue-300 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm capitalize text-gray-800">
                      {shape.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: shape.color }}
                        title={`Color: ${shape.color}`}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      {shape.type === 'freehand' 
                        ? `${shape.points?.length || 0} points`
                        : `${Math.round(shape.width)} × ${Math.round(shape.height)}`
                      }
                    </div>
                    <div>
                      Stroke: {shape.strokeWidth}px
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}