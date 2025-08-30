import { useStoreValue } from '@context-action/react';
import { useParentStore } from '../contexts/ParentContext';

// ==============================================
// PARENT DOMAIN - Data Subscription Hooks
// ==============================================

/**
 * 등록된 하위 컴포넌트들 데이터 구독
 */
export function useRegisteredChildren() {
  const registeredChildrenStore = useParentStore('registered-children');
  const registeredChildren = useStoreValue(registeredChildrenStore);
  
  return {
    registeredChildren,
    childrenCount: registeredChildren.length,
    hasChildren: registeredChildren.length > 0,
    getChildById: (childId: string) => 
      registeredChildren.find(child => child.childId === childId)
  };
}



/**
 * 상위 카운터 데이터 구독
 */
export function useParentCounter() {
  const parentCounterStore = useParentStore('parent-counter');
  const parentCounter = useStoreValue(parentCounterStore);
  
  return {
    parentCounter,
    isZero: parentCounter === 0,
    isPositive: parentCounter > 0,
    displayValue: `카운터: ${parentCounter}`
  };
}

/**
 * 통합 상위 상태 구독
 */
export function useParentState() {
  const { registeredChildren, childrenCount } = useRegisteredChildren();
  const { parentCounter, isZero } = useParentCounter();
  
  return {
    registeredChildren,
    childrenCount,
    parentCounter,
    isZero,
    summary: {
      totalChildren: childrenCount,
      currentCounter: parentCounter
    }
  };
}
