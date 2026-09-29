import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type { AuditRecord, OrderItem } from '../business/orderCalculation';

export interface PreactWebComponentsActions extends ActionPayloadMap {
  quantityUpdated: { productId: string; quantity: number };
  discountToggled: { enabled: boolean };
  cartReset: void;
  ticketSubmitted: {
    attendeeName: string;
    ticketType: string;
    count: number;
    specialRequest: string;
  };
}

export interface SubmittedTicket {
  attendeeName: string;
  ticketType: string;
  count: number;
  specialRequest: string;
  submittedAt: string;
}

export const initialOrderItems: readonly OrderItem[] = [
  {
    id: 'prod-react-book',
    name: 'Micro-Frontend Architecture Handbook',
    unitPrice: 42000,
    quantity: 1,
  },
  {
    id: 'prod-signals-pack',
    name: 'Preact Signals Devtools Pro License',
    unitPrice: 28000,
    quantity: 2,
  },
  {
    id: 'prod-wc-badge',
    name: 'Custom Element Hardware Enclosure',
    unitPrice: 15000,
    quantity: 1,
  },
];

export const PreactWebComponentsActionsContext =
  createActionContext<PreactWebComponentsActions>('PreactWebComponentsActions');

export const PreactWebComponentsStoresContext = createStoreContext(
  'PreactWebComponentsStores',
  {
    items: [...initialOrderItems] as OrderItem[],
    discountEnabled: false,
    submittedTicket: null as SubmittedTicket | null,
    auditLog: [
      {
        id: 'audit-0',
        message:
          'Preact Web Components showcase initialized with 3 cart items.',
        timestamp: '00:00:00.000',
      },
    ] as AuditRecord[],
  }
);
