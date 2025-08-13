/**
 * Isolated Mouse Renderer - Placeholder
 */

import React, { ReactNode } from 'react';

interface IsolatedMouseRendererProps {
  children: ReactNode;
  onMouseMove?: (position: { x: number; y: number }, velocity: number) => void;
  onMouseClick?: (position: { x: number; y: number }, button: number) => void;
  onMouseEnter?: (position: { x: number; y: number }) => void;
  onMouseLeave?: (position: { x: number; y: number }) => void;
}

export function IsolatedMouseRenderer({ 
  children, 
  onMouseMove, 
  onMouseClick, 
  onMouseEnter, 
  onMouseLeave 
}: IsolatedMouseRendererProps) {
  return (
    <div 
      onMouseMove={(e) => {
        if (onMouseMove) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onMouseMove({ x, y }, 0);
        }
      }}
      onMouseEnter={(e) => {
        if (onMouseEnter) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onMouseEnter({ x, y });
        }
      }}
      onMouseLeave={(e) => {
        if (onMouseLeave) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onMouseLeave({ x, y });
        }
      }}
      onClick={(e) => {
        if (onMouseClick) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onMouseClick({ x, y }, e.button);
        }
      }}
    >
      {children}
    </div>
  );
}

export default IsolatedMouseRenderer;