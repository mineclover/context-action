import { type ReactNode, useCallback } from 'react';
import {
  ReactAriaReferenceActions,
  ReactAriaReferenceStores,
} from '../contexts/ReactAriaReferenceContexts';

let auditSequence = 0;

function createAuditId() {
  return `audit-${globalThis.crypto?.randomUUID?.() ?? ++auditSequence}`;
}

export function ReactAriaReferenceHandlerRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const selectedKeysStore = ReactAriaReferenceStores.useStore('selectedKeys');
  const sortStore = ReactAriaReferenceStores.useStore('sort');
  const selectedDateStore = ReactAriaReferenceStores.useStore('selectedDate');
  const auditStore = ReactAriaReferenceStores.useStore('audit');

  const record = useCallback(
    (message: string) => {
      const entries = auditStore.getValue();
      auditStore.setValue(
        [
          {
            id: createAuditId(),
            message,
          },
          ...entries,
        ].slice(0, 5)
      );
    },
    [auditStore]
  );

  ReactAriaReferenceActions.useActionHandler(
    'tableSelectionChanged',
    useCallback(
      ({ keys }) => {
        selectedKeysStore.setValue(keys);
        record(`Table selection committed: ${keys.length || 'no'} row(s).`);
      },
      [record, selectedKeysStore]
    ),
    { id: 'react-aria-table-selection', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'tableSortChanged',
    useCallback(
      ({ column, direction }) => {
        sortStore.setValue({ column, direction });
        record(`Table sort committed: ${column} (${direction}).`);
      },
      [record, sortStore]
    ),
    { id: 'react-aria-table-sort', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'calendarDateCommitted',
    useCallback(
      ({ value }) => {
        selectedDateStore.setValue(value);
        record(`Calendar date committed: ${value ?? 'cleared'}.`);
      },
      [record, selectedDateStore]
    ),
    { id: 'react-aria-calendar-date', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'reviewScheduled',
    useCallback(() => {
      const date = selectedDateStore.getValue();
      const selection = selectedKeysStore.getValue();
      record(
        date && selection.length > 0
          ? `Scheduled ${selection.length} selected review(s) for ${date}.`
          : 'Scheduling needs both a calendar date and at least one selected row.'
      );
    }, [record, selectedDateStore, selectedKeysStore]),
    { id: 'react-aria-schedule-review', priority: 80 }
  );

  return children;
}
