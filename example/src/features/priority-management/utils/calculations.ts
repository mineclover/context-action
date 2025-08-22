/**
 * @fileoverview Priority calculation utilities
 */

import type { Document, PriorityCalculationCriteria } from '../types';

export function calculatePriority(
  doc: Document, 
  criteria: PriorityCalculationCriteria,
  allDocuments: Document[] = []
): number {
  let score = 0;

  // Document size component
  const maxSize = Math.max(...allDocuments.map(d => d.size));
  let sizeScore = 0;
  switch (criteria.documentSize.method) {
    case 'linear':
      sizeScore = (doc.size / maxSize) * 100;
      break;
    case 'logarithmic':
      sizeScore = Math.log(doc.size / 100 + 1) * 30;
      break;
    case 'exponential':
      sizeScore = Math.pow(doc.size / maxSize, 0.5) * 100;
      break;
  }
  score += sizeScore * criteria.documentSize.weight;

  // Category component
  const categoryScore = criteria.category.values[doc.category] || 50;
  const categoryBoost = criteria.category.boost || 0;
  score += (categoryScore + categoryBoost) * criteria.category.weight;

  // Keyword density component
  let keywordScore = 0;
  switch (criteria.keywordDensity.method) {
    case 'linear':
      keywordScore = doc.keywordDensity * 100;
      break;
    case 'logarithmic':
      keywordScore = Math.log(doc.keywordDensity * 10 + 1) * 25;
      break;
    case 'polynomial':
      const exponent = criteria.keywordDensity.exponent || 2;
      keywordScore = Math.pow(doc.keywordDensity, exponent) * 100;
      break;
  }
  score += keywordScore * criteria.keywordDensity.weight;

  // Cross references component
  let refScore = doc.crossReferences * criteria.crossReferences.boost;
  if (criteria.crossReferences.diminishingReturns) {
    refScore = Math.sqrt(refScore) * 10; // Diminishing returns
  }
  score += Math.min(refScore, 50) * criteria.crossReferences.weight;

  // Recent modification component
  const daysSinceModified = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceModified <= criteria.recentModification.dayThreshold) {
    let recentBonus = 15;
    if (criteria.recentModification.decayRate) {
      recentBonus *= Math.exp(-daysSinceModified * criteria.recentModification.decayRate);
    }
    score += recentBonus * criteria.recentModification.weight;
  }

  // Team workload component
  if (doc.assignee && criteria.teamWorkload.assigneePenalty) {
    score -= criteria.teamWorkload.assigneePenalty * criteria.teamWorkload.weight;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

export function calculatePriorityForDocuments(
  documents: Document[],
  criteria: PriorityCalculationCriteria
): Document[] {
  return documents.map(doc => ({
    ...doc,
    priority: calculatePriority(doc, criteria, documents)
  }));
}

export function getPreviewStats(
  documents: Document[],
  criteria: PriorityCalculationCriteria
): { averageChange: number; maxChange: number; significantChanges: number; totalDocuments: number } {
  const changes = documents.map(doc => {
    const newPriority = calculatePriority(doc, criteria, documents);
    return Math.abs(doc.priority - newPriority);
  });
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const maxChange = Math.max(...changes);
  const significantChanges = changes.filter(change => change > 10).length;

  return {
    averageChange: Math.round(avgChange * 10) / 10,
    maxChange: Math.round(maxChange),
    significantChanges,
    totalDocuments: documents.length
  };
}