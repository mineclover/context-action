// import React from 'react';
import { Card, Button } from '@/components/ui';

interface SystemControlsProps {
  systemLoad: number;
  isBusinessHours: boolean;
  onSystemLoadChange: (load: number) => void;
  onToggleBusinessHours: () => void;
  onClearCache: () => void;
}

export function SystemControls({
  systemLoad,
  isBusinessHours,
  onSystemLoadChange,
  onToggleBusinessHours,
  onClearCache
}: SystemControlsProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">⚙️ System Controls</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            System Load: {(systemLoad * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={systemLoad}
            onChange={(e) => onSystemLoadChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <Button
          onClick={onToggleBusinessHours}
          variant={isBusinessHours ? "primary" : "secondary"}
          className="w-full"
        >
          Business Hours: {isBusinessHours ? 'ON' : 'OFF'}
        </Button>
        
        <Button onClick={onClearCache} variant="outline" className="w-full">
          Clear Cache
        </Button>
      </div>
    </Card>
  );
}