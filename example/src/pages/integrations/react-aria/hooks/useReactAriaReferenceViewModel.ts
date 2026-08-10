import { useStoreValue } from '@context-action/react';
import { useCallback, useMemo } from 'react';
import type { Selection } from 'react-aria-components';
import {
  ReactAriaReferenceActions,
  ReactAriaReferenceStores,
  reviewRows,
  type SortColumn,
  type SortDirection,
} from '../contexts/ReactAriaReferenceContexts';

export function isSortColumn(key: React.Key): key is SortColumn {
  return ['project', 'owner', 'status', 'reviewDate'].includes(String(key));
}

function reportActionError(error: unknown) {
  console.error('React Aria reference action failed', error);
}

export function useReactAriaReferenceViewModel() {
  const selectedKeysStore = ReactAriaReferenceStores.useStore('selectedKeys');
  const sortStore = ReactAriaReferenceStores.useStore('sort');
  const selectedDateStore = ReactAriaReferenceStores.useStore('selectedDate');
  const auditStore = ReactAriaReferenceStores.useStore('audit');
  const selectedKeys = useStoreValue(selectedKeysStore);
  const sort = useStoreValue(sortStore);
  const selectedDate = useStoreValue(selectedDateStore);
  const audit = useStoreValue(auditStore);
  const dispatch = ReactAriaReferenceActions.useActionDispatch();

  const sortedRows = useMemo(() => {
    const multiplier = sort.direction === 'ascending' ? 1 : -1;
    return [...reviewRows].sort(
      (left, right) =>
        left[sort.column].localeCompare(right[sort.column]) * multiplier
    );
  }, [sort]);

  const onSelectionChange = useCallback(
    (selection: Selection) => {
      const keys =
        selection === 'all'
          ? reviewRows.map((row) => row.id)
          : [...selection].map(String);
      void dispatch('tableSelectionChanged', { keys }).catch(reportActionError);
    },
    [dispatch]
  );

  const onSortChange = useCallback(
    (next: { column: React.Key; direction: SortDirection }) => {
      if (!isSortColumn(next.column)) {
        reportActionError(
          new Error(
            `Unsupported React Aria sort column: ${String(next.column)}`
          )
        );
        return;
      }
      void dispatch('tableSortChanged', {
        column: next.column,
        direction: next.direction,
      }).catch(reportActionError);
    },
    [dispatch]
  );

  const onCalendarChange = useCallback(
    (value: { toString(): string } | null) => {
      void dispatch('calendarDateCommitted', {
        value: value?.toString() ?? null,
      }).catch(reportActionError);
    },
    [dispatch]
  );

  const scheduleReview = useCallback(() => {
    void dispatch('reviewScheduled').catch(reportActionError);
  }, [dispatch]);

  return {
    audit,
    onCalendarChange,
    onSelectionChange,
    onSortChange,
    scheduleReview,
    selectedDate,
    selectedKeys,
    sort,
    sortedRows,
  };
}
