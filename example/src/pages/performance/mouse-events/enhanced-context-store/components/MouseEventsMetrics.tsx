/**
 * @fileoverview Mouse Events Metrics Components
 * 
 * View Layer: 순수한 Presentation 컴포넌트들
 * - Props를 통한 상태 주입
 * - 재사용 가능한 UI 컴포넌트들
 * - 비즈니스 로직 없는 순수 View
 */

import React from 'react';

// === 메트릭 카드 타입 정의 ===
export interface MetricCardProps {
  title: string;
  icon: string;
  value: string;
  subtitle?: string;
  color?: 'purple' | 'green' | 'orange' | 'cyan' | 'teal';
  details?: Array<{ label: string; value: string }>;
}

/**
 * 개별 메트릭을 표시하는 카드 컴포넌트
 * 재사용 가능한 순수 컴포넌트
 */
export function MetricCard({ 
  title, 
  icon, 
  value, 
  subtitle, 
  color = 'purple', 
  details = [] 
}: MetricCardProps) {
  const colorClasses = {
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-800',
      value: 'text-purple-700',
      detail: 'text-purple-500'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      value: 'text-green-700',
      detail: 'text-green-500'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-800',
      value: 'text-orange-700',
      detail: 'text-orange-500'
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      value: 'text-cyan-700',
      detail: 'text-cyan-500'
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
      border: 'border-teal-200',
      text: 'text-teal-800',
      value: 'text-teal-700',
      detail: 'text-teal-500'
    }
  };
  
  const classes = colorClasses[color];
  
  return (
    <div className={`${classes.bg} p-4 rounded-xl border ${classes.border} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className={`font-semibold ${classes.text} text-sm`}>{title}</h4>
      </div>
      <div className="space-y-1">
        <p className={`text-xs ${classes.value} font-mono bg-white/50 px-2 py-1 rounded`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-xs ${classes.text}`}>
            {subtitle}
          </p>
        )}
        {details.map((detail, index) => (
          <p key={index} className={`text-xs ${classes.detail}`}>
            {detail.label}: {detail.value}
          </p>
        ))}
      </div>
    </div>
  );
}

// === 메트릭스 그리드 Props ===
export interface MetricsGridProps {
  position: {
    displayText: string;
    isValid: boolean;
  };
  movement: {
    velocityText: string;
    distanceText: string;
    pathLengthText: string;
    isMoving: boolean;
    moveCount: number;
  };
  clicks: {
    totalText: string;
    recentText: string;
    hasHistory: boolean;
  };
  activity: {
    statusText: string;
    statusColor: string;
    isActive: boolean;
  };
  performance: {
    renderCountText: string;
    avgRenderTimeText: string;
    memoryUsageText: string;
  };
}

/**
 * 메트릭스를 그리드로 표시하는 컴포넌트
 */
export function MetricsGrid({
  position,
  movement,
  clicks,
  activity,
  performance
}: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <MetricCard
        title="Position"
        icon="📍"
        value={position.displayText}
        subtitle={`Status: ${position.isValid ? '✅ Inside' : '❌ Outside'}`}
        color="purple"
      />
      
      <MetricCard
        title="Movement"
        icon="🏃"
        value={movement.velocityText}
        subtitle={`Path: ${movement.pathLengthText}`}
        color="green"
        details={[
          { label: 'Moving', value: movement.isMoving ? '✅' : '❌' },
          { label: 'Count', value: movement.moveCount.toString() }
        ]}
      />
      
      <MetricCard
        title="Clicks"
        icon="👆"
        value={clicks.totalText}
        subtitle={`Recent: ${clicks.recentText}`}
        color="orange"
        details={[
          { label: 'History', value: clicks.hasHistory ? '✅' : '❌' }
        ]}
      />
      
      <MetricCard
        title="Activity"
        icon="🧮"
        value={activity.statusText}
        subtitle={`Status: ${activity.isActive ? '✅ Active' : '❌ Idle'}`}
        color="cyan"
      />
      
      <MetricCard
        title="Performance"
        icon="📊"
        value={performance.renderCountText}
        subtitle={`Avg: ${performance.avgRenderTimeText}`}
        color="teal"
        details={[
          { label: 'Memory', value: performance.memoryUsageText }
        ]}
      />
    </div>
  );
}

// === 상세 메트릭스 Props ===
export interface DetailedMetricsProps {
  computed: {
    averageVelocityText: string;
    maxVelocityText: string;
    totalDistanceText: string;
    sessionDurationText: string;
    eventsPerSecondText: string;
  };
  summary: {
    hasActivity: boolean;
    totalEvents: number;
    sessionActive: boolean;
  };
}

/**
 * 상세 메트릭스를 표시하는 컴포넌트
 */
export function DetailedMetrics({ computed, summary }: DetailedMetricsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200 mb-4">
      <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
        <span className="text-sm">📊</span>
        Advanced Metrics
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-2">
          <h5 className="font-medium text-purple-700">Velocity Metrics</h5>
          <div className="space-y-1 text-purple-600">
            <p>Average: {computed.averageVelocityText}</p>
            <p>Maximum: {computed.maxVelocityText}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="font-medium text-purple-700">Session Metrics</h5>
          <div className="space-y-1 text-purple-600">
            <p>Duration: {computed.sessionDurationText}</p>
            <p>Events/sec: {computed.eventsPerSecondText}</p>
            <p>Total Distance: {computed.totalDistanceText}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h5 className="font-medium text-purple-700">Session Summary</h5>
          <div className="space-y-1 text-purple-600">
            <p>Active: {summary.sessionActive ? '✅' : '❌'}</p>
            <p>Has Activity: {summary.hasActivity ? '✅' : '❌'}</p>
            <p>Total Events: {summary.totalEvents}</p>
          </div>
        </div>
      </div>
    </div>
  );
}