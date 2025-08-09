import React from 'react';
import { usePriorityTestTestCount } from '../hooks';

interface PriorityCountDisplayProps {
  priority: number;
  label?: string;
  color?: string;
  className?: string;
}

export const PriorityCountDisplay: React.FC<PriorityCountDisplayProps> = ({ 
  priority, 
  label,
  color = '#3b82f6',
  className = ''
}) => {
  const count = usePriorityTestTestCount(priority);
  
  if (count === undefined || count === 0) {
    return null;
  }

  return (
    <div 
      className={`priority-count-display ${className}`}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: `${color}20`,
        borderLeft: `3px solid ${color}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        {label || `Priority ${priority}`}:
      </span>
      <span style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color 
      }}>
        {count}
      </span>
      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
        executions
      </span>
    </div>
  );
};