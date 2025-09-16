/**
 * @fileoverview Performance Management Actions
 *
 * Context-Driven Architecture의 Action Layer
 * 성능 관리 액션 디스패치 및 콜백 처리
 */

import { useCallback } from 'react';
import { usePerformanceManagementAction } from '../contexts/PriorityContexts';

/**
 * 성능 관리 액션 훅
 *
 * 성능 관리 관련 액션들을 디스패치하고 결과를 처리합니다.
 */
export function usePerformanceManagementActions() {
  const dispatch = usePerformanceManagementAction();

  const addInstance = useCallback(async () => {
    try {
      const result = await dispatch('addInstance');
      console.log('Instance added successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to add instance:', error);
      throw error;
    }
  }, [dispatch]);

  const removeInstance = useCallback(async (instanceId: string) => {
    try {
      const result = await dispatch('removeInstance', { instanceId });
      console.log('Instance removed successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to remove instance:', error);
      throw error;
    }
  }, [dispatch]);

  const resetInstances = useCallback(async () => {
    try {
      const result = await dispatch('resetInstances');
      console.log('Instances reset successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to reset instances:', error);
      throw error;
    }
  }, [dispatch]);

  const startInstanceExecution = useCallback(async (instanceId: string) => {
    try {
      const result = await dispatch('startInstanceExecution', { instanceId });
      console.log('Instance execution started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start instance execution:', error);
      throw error;
    }
  }, [dispatch]);

  const stopInstanceExecution = useCallback(async (instanceId: string) => {
    try {
      const result = await dispatch('stopInstanceExecution', { instanceId });
      console.log('Instance execution stopped:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop instance execution:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    addInstance,
    removeInstance,
    resetInstances,
    startInstanceExecution,
    stopInstanceExecution,
  };
}