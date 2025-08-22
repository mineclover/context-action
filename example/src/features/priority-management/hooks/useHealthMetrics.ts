/**
 * @fileoverview Health metrics calculation custom hook
 */

import { useMemo } from 'react';
import type { Document, HealthMetrics, HistoricalHealthData } from '../types';
import { analyzeHealthMetrics } from '../utils';

export function useHealthMetrics(
  documents: Document[],
  historicalData: HistoricalHealthData[] = [],
  languageFilter: 'all' | 'en' | 'ko' = 'all',
  categoryFilter: 'all' | string = 'all'
) {
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const languageMatch = languageFilter === 'all' || doc.language === languageFilter;
      const categoryMatch = categoryFilter === 'all' || doc.category === categoryFilter;
      return languageMatch && categoryMatch;
    });
  }, [documents, languageFilter, categoryFilter]);

  const healthMetrics = useMemo((): HealthMetrics => {
    return analyzeHealthMetrics(filteredDocuments, historicalData);
  }, [filteredDocuments, historicalData]);

  return {
    healthMetrics,
    filteredDocuments
  };
}