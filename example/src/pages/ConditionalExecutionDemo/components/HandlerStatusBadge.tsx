import React from 'react';

interface HandlerStatusBadgeProps {
  id: string;
  name: string;
  permission: string;
  minLevel: number;
  isAllowed: boolean;
}

export function HandlerStatusBadge({ 
  id, 
  name, 
  permission, 
  minLevel, 
  isAllowed 
}: HandlerStatusBadgeProps) {
  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isAllowed 
        ? 'bg-green-50 border-green-200 text-green-900' 
        : 'bg-red-50 border-red-200 text-red-900'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          isAllowed 
            ? 'bg-green-200 text-green-800' 
            : 'bg-red-200 text-red-800'
        }`}>
          {isAllowed ? 'ALLOWED' : 'DENIED'}
        </span>
      </div>
      
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Permission:</span>
          <code className="font-mono">{permission}</code>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Min Level:</span>
          <span>{minLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Handler ID:</span>
          <code className="font-mono text-xs">{id}</code>
        </div>
      </div>
      
      <div className="mt-2">
        <div className={`w-full h-1 rounded ${
          isAllowed ? 'bg-green-300' : 'bg-red-300'
        }`} />
      </div>
    </div>
  );
}