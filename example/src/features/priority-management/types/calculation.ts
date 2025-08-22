/**
 * @fileoverview Calculation-related type definitions for Priority Management System
 */

export interface PriorityCalculationCriteria {
  documentSize: { 
    weight: number; 
    method: 'linear' | 'logarithmic' | 'exponential';
    minThreshold?: number;
    maxThreshold?: number;
  };
  category: { 
    weight: number; 
    values: Record<string, number>;
    boost?: number;
  };
  keywordDensity: { 
    weight: number; 
    method: 'linear' | 'logarithmic' | 'polynomial';
    exponent?: number;
  };
  crossReferences: { 
    weight: number; 
    boost: number;
    diminishingReturns?: boolean;
  };
  recentModification: { 
    weight: number; 
    dayThreshold: number;
    decayRate?: number;
  };
  teamWorkload: {
    weight: number;
    assigneePenalty?: number;
    conflictDetection?: boolean;
  };
}

export interface CalculationPreset {
  name: string;
  description: string;
  criteria: PriorityCalculationCriteria;
}

export interface PreviewStats {
  averageChange: number;
  maxChange: number;
  significantChanges: number;
  totalDocuments: number;
}