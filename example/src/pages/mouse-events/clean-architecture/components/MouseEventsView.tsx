/**
 * Mouse Events View - Simplified
 */

import React from 'react';

export function MouseEventsView() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mouse Events Demo</h2>
      <p className="text-gray-600">
        Mouse events tracking demo (simplified for build compatibility)
      </p>

      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Mouse Tracking Area</h3>
        <div
          className="w-full h-64 bg-gray-50 border border-gray-300 rounded cursor-crosshair flex items-center justify-center"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log(`Mouse position: ${x}, ${y}`);
          }}
        >
          <p className="text-gray-500">Move mouse here to track position</p>
        </div>
      </div>
    </div>
  );
}

export default MouseEventsView;
