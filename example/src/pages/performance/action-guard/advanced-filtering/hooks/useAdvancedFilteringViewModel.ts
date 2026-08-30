import { useStoreValue } from '@context-action/react';
import { useAdvancedFilteringActions } from '../actions/useAdvancedFilteringActions';
import { useAdvancedFilteringStore } from '../contexts/AdvancedFilteringContexts';

export function useAdvancedFilteringViewModel() {
  const executionResults = useStoreValue(
    useAdvancedFilteringStore('executionResults')
  );
  const isLoading = useStoreValue(useAdvancedFilteringStore('isLoading'));
  const visualization = useStoreValue(
    useAdvancedFilteringStore('visualization')
  );

  return {
    executionResults,
    isLoading,
    visualization,
    actions: useAdvancedFilteringActions(),
  };
}
