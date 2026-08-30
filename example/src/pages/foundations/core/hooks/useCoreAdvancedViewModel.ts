import { useStoreValue } from '@context-action/react';
import { useCoreAdvancedActions } from '../actions/useCoreAdvancedActions';
import { useCoreAdvancedStore } from '../contexts/CoreAdvancedContexts';

export function useCoreAdvancedViewModel() {
  const count = useStoreValue(useCoreAdvancedStore('count'));
  const priorityResults = useStoreValue(
    useCoreAdvancedStore('priorityResults')
  );
  const asyncResults = useStoreValue(useCoreAdvancedStore('asyncResults'));

  return {
    count,
    priorityResults,
    asyncResults,
    actions: useCoreAdvancedActions(),
  };
}
