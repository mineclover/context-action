import { useCallback, useEffect } from 'react';
import { useChildBActionHandler, useChildBActionDispatch, useChildBStoreManager } from '../contexts/ChildBContext';
import { useParentActionDispatch } from '../contexts/ParentContext';
import { useLogMonitorActions } from '@/components/LogMonitor';
import { LogLevel } from '@/utils/logger';

// ==============================================
// CHILD B DOMAIN - Action Handlers
// ==============================================

/**
 * ChildB 텍스트 액션 핸들러들
 */
export function useChildBTextActions() {
  const storeManager = useChildBStoreManager();
  const childDispatch = useChildBActionDispatch();
  const parentDispatch = useParentActionDispatch();
  const { addLog } = useLogMonitorActions();

  const childId = 'child-b-text';

  // 텍스트 업데이트 핸들러
  const updateTextHandler = useCallback(async (payload: { newText: string }, controller: any) => {
    const { newText } = payload;
    const textStore = storeManager.getStore('text');
    const previousText = textStore.getValue();
    
    textStore.setValue(newText);
    
    // 로그 모니터에 직접 데이터 전송
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: `ChildB 텍스트 업데이트: ${newText}`,
      details: {
        text: newText,
        action: 'update',
        previousText,
        context: 'Child B Component'
      }
    });
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 ChildB 텍스트 업데이트:', { newText, previousText });
  }, [storeManager, parentDispatch, childId]);

  // 텍스트 클리어 핸들러
  const clearTextHandler = useCallback(async (payload: void, controller: any) => {
    const textStore = storeManager.getStore('text');
    const previousText = textStore.getValue();
    
    textStore.setValue('');
    
    // 로그 모니터에 직접 데이터 전송
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: 'ChildB 텍스트 클리어됨',
      details: {
        text: '',
        action: 'clear',
        previousText,
        context: 'Child B Component'
      }
    });
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 ChildB 텍스트 클리어:', { previousText });
  }, [storeManager, parentDispatch, childId]);

  // 핸들러 등록 - 명시적 ID 사용
  useChildBActionHandler('updateText', updateTextHandler, { id: 'child-b-text-update' });
  useChildBActionHandler('clearText', clearTextHandler, { id: 'child-b-text-clear' });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log('🔄 ChildB Text Actions 리프레시됨 - storeManager, parentDispatch, childId 변경');
  }, [storeManager, parentDispatch, childId]);

  // View에서 사용할 액션 함수들
  const updateText = useCallback((newText: string) => 
    childDispatch('updateText', { newText }), [childDispatch]);
  
  const clearText = useCallback(() => 
    childDispatch('clearText', undefined), [childDispatch]);

  return { updateText, clearText };
}
