import { useStoreValue } from '@context-action/react';
import { useChildBStore } from '../contexts/ChildBContext';

// ==============================================
// CHILD B DOMAIN - Data Subscription Hooks
// ==============================================

/**
 * ChildB 텍스트 데이터 구독
 */
export function useChildBText() {
  const textStore = useChildBStore('text');
  const text = useStoreValue(textStore);

  return {
    text,
    isEmpty: text.length === 0,
    length: text.length,
    displayValue: text || '텍스트 없음',
    status: text.length === 0 ? 'empty' : text.length > 50 ? 'long' : 'normal',
  };
}
