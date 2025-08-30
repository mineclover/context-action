import { useStoreValue } from '@context-action/react';
import { useChildAStore } from '../contexts/ChildAContext';

// ==============================================
// CHILD A DOMAIN - Data Subscription Hooks
// ==============================================

/**
 * ChildA 카운터 데이터 구독
 */
export function useChildACounter() {
  const counterStore = useChildAStore('counter');
  const counter = useStoreValue(counterStore);
  
  return {
    counter,
    isZero: counter === 0,
    isPositive: counter > 0,
    displayValue: `카운터: ${counter}`,
    status: counter === 0 ? 'idle' : counter > 10 ? 'high' : 'normal'
  };
}
