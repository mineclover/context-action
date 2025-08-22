/**
 * @fileoverview Priority calculation custom hook
 */

import { useState, useCallback, useMemo } from 'react';
import type { Document, PriorityCalculationCriteria, PreviewStats } from '../types';
import { calculatePriorityForDocuments, getPreviewStats } from '../utils';

export function usePriorityCalculation(initialDocuments: Document[]) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [criteria, setCriteria] = useState<PriorityCalculationCriteria | null>(null);

  const previewStats = useMemo((): PreviewStats | null => {
    if (!criteria) return null;
    return getPreviewStats(documents, criteria);
  }, [documents, criteria]);

  const applyCalculation = useCallback((newCriteria: PriorityCalculationCriteria) => {
    const updatedDocuments = calculatePriorityForDocuments(documents, newCriteria);
    setDocuments(updatedDocuments);
    setCriteria(newCriteria);
  }, [documents]);

  const resetDocuments = useCallback((newDocuments: Document[]) => {
    setDocuments(newDocuments);
    setCriteria(null);
  }, []);

  return {
    documents,
    criteria,
    previewStats,
    applyCalculation,
    resetDocuments,
    setCriteria
  };
}