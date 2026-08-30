import { useStoreValue } from '@context-action/react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { useAdvancedSearchActions } from './actions/useAdvancedSearchActions';
import { sampleData } from './business/search-rules';
import {
  AdvancedSearchActionProvider,
  AdvancedSearchStoreProvider,
  useAdvancedSearchStore,
} from './contexts/AdvancedSearchContexts';
import { AdvancedSearchHandlerRegistry } from './handlers/AdvancedSearchHandlerRegistry';

function SelectionControls() {
  const { clearSelectedResult, selectResult } = useAdvancedSearchActions();
  const selectedResultStore = useAdvancedSearchStore('selectedResult');
  const selectedResult = useStoreValue(selectedResultStore);
  const firstResult = sampleData[0]!;

  return (
    <>
      <button type="button" onClick={() => selectResult(firstResult)}>
        Select first result
      </button>
      <button type="button" onClick={clearSelectedResult}>
        Clear selection
      </button>
      <output data-testid="selected-result">
        {selectedResult?.id ?? 'none'}
      </output>
    </>
  );
}

function renderSelectionControls() {
  return render(
    <AdvancedSearchActionProvider>
      <AdvancedSearchStoreProvider>
        <AdvancedSearchHandlerRegistry>
          <SelectionControls />
        </AdvancedSearchHandlerRegistry>
      </AdvancedSearchStoreProvider>
    </AdvancedSearchActionProvider>
  );
}

describe('AdvancedSearch selection', () => {
  afterEach(() => {
    cleanup();
  });

  it('clears a selected result through the action facade and handler', async () => {
    const user = userEvent.setup();
    renderSelectionControls();

    const firstResult = sampleData[0]!;
    await user.click(
      screen.getByRole('button', { name: 'Select first result' })
    );
    await waitFor(() => {
      expect(screen.getByTestId('selected-result').textContent).toBe(
        firstResult.id
      );
    });

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    await waitFor(() => {
      expect(screen.getByTestId('selected-result').textContent).toBe('none');
    });
  });
});
