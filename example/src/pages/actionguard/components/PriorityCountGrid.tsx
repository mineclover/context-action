import React from 'react';
import { usePriorityTestTestCount } from '../hooks/usePriorityTestViewModel';
import styles from '../PriorityTestPage.module.css';

interface PriorityCountGridProps {
  priorities: number[];
  configs?: Array<{ priority: number; color?: string; label?: string }>;
  maxPriority?: number;
  className?: string;
}

export const PriorityCountGrid: React.FC<PriorityCountGridProps> = ({ 
  priorities,
  configs = [],
  maxPriority = 300,
  className = ''
}) => {
  return (
    <div className={`${styles.priorityCountVisualization} ${className}`}>
      <div className={styles.priorityCountGrid}>
        {priorities.map((priority) => (
          <PriorityCountCell 
            key={priority} 
            priority={priority}
            config={configs.find(c => c.priority === priority)}
          />
        ))}
      </div>
    </div>
  );
};

interface PriorityCountCellProps {
  priority: number;
  config?: { priority: number; color?: string; label?: string };
}

const PriorityCountCell: React.FC<PriorityCountCellProps> = ({ priority, config }) => {
  const count = usePriorityTestTestCount(priority);
  
  const hasHandlers = !!config;
  const isActive = count > 0;
  
  // 핸들러가 없고 카운트도 0인 경우 표시하지 않음
  if (!hasHandlers && count === 0) {
    return null;
  }
  
  return (
    <div 
      className={`${styles.priorityCountCell} ${hasHandlers ? styles.hasHandlers : ''} ${isActive ? styles.active : ''}`}
      title={`Priority ${priority}: ${count}회 실행${hasHandlers ? ' (핸들러 있음)' : ''}`}
      style={config?.color ? { borderColor: config.color } : undefined}
    >
      <div className={styles.priorityNumber}>{priority}</div>
      <div className={styles.countNumber}>{count > 0 ? count : ''}</div>
      {config?.label && (
        <div className={styles.priorityLabel} style={{ fontSize: '9px', color: '#6b7280' }}>
          {config.label}
        </div>
      )}
    </div>
  );
};