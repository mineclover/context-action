import { useStoreValue } from '@context-action/react';
import { useCallback } from 'react';
import {
  useLiveUsecaseDispatch,
  useLiveUsecaseDispatchWithResult,
  useLiveUsecaseStore,
} from './LiveUsecaseContexts';

export function useLiveUsecaseFacade() {
  const workflow = useStoreValue(useLiveUsecaseStore('workflow'));
  const activity = useStoreValue(useLiveUsecaseStore('activity'));
  const dispatch = useLiveUsecaseDispatch();
  const { dispatchWithResult } = useLiveUsecaseDispatchWithResult();

  const selectResource = useCallback(
    (resourceId: string) => dispatch('selectResource', resourceId),
    [dispatch]
  );
  const changeReason = useCallback(
    (reason: string) => dispatch('changeReason', reason),
    [dispatch]
  );
  const reset = useCallback(() => dispatch('resetRequest'), [dispatch]);
  const submit = useCallback(
    () => dispatchWithResult('submitRequest'),
    [dispatchWithResult]
  );

  return {
    workflow,
    activity,
    isBusy: workflow.phase === 'validating' || workflow.phase === 'packaging',
    canSubmit: workflow.reason.trim().length >= 24,
    commands: {
      selectResource,
      changeReason,
      reset,
      submit,
    },
  };
}
