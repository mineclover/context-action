import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export type SortColumn = 'project' | 'owner' | 'status' | 'reviewDate';
export type SortDirection = 'ascending' | 'descending';

export interface ReviewRow {
  id: string;
  project: string;
  owner: string;
  status: 'Ready' | 'Needs review' | 'Blocked';
  reviewDate: string;
}

export interface ReactAriaReferenceActions extends ActionPayloadMap {
  tableSelectionChanged: { keys: string[] };
  tableSortChanged: { column: SortColumn; direction: SortDirection };
  calendarDateCommitted: { value: string | null };
  reviewScheduled: void;
}

export interface AuditEntry {
  id: string;
  message: string;
}

export const reviewRows: ReviewRow[] = [
  {
    id: 'core-contract',
    project: 'Core public contract',
    owner: 'Mina',
    status: 'Ready',
    reviewDate: '2026-08-12',
  },
  {
    id: 'react-ssr',
    project: 'React SSR consumer',
    owner: 'Jae',
    status: 'Needs review',
    reviewDate: '2026-08-14',
  },
  {
    id: 'tool-protocol',
    project: 'Tool Protocol adapter',
    owner: 'Sora',
    status: 'Ready',
    reviewDate: '2026-08-18',
  },
  {
    id: 'webmcp-boundary',
    project: 'WebMCP boundary',
    owner: 'Hoon',
    status: 'Blocked',
    reviewDate: '2026-08-21',
  },
];

export const ReactAriaReferenceStores = createStoreContext(
  'ReactAriaReference',
  {
    selectedKeys: { initialValue: [] as string[] },
    sort: {
      initialValue: {
        column: 'reviewDate' as SortColumn,
        direction: 'ascending' as SortDirection,
      },
    },
    selectedDate: { initialValue: '2026-08-12' as string | null },
    audit: { initialValue: [] as AuditEntry[] },
  }
);

export const ReactAriaReferenceActions =
  createActionContext<ReactAriaReferenceActions>('ReactAriaReference');
