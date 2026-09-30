import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';
import type { AuditRecord, OrderItem } from '../business/orderCalculation';

export interface LitWebComponentsActions extends ActionPayloadMap {
  quantityUpdated: { productId: string; quantity: number };
  discountToggled: { enabled: boolean };
  cartReset: void;
  ticketSubmitted: {
    attendeeName: string;
    ticketTier: string;
    ticketCount: number;
    notes: string;
  };
}

export interface SubmittedTicket {
  attendeeName: string;
  ticketTier: string;
  ticketCount: number;
  notes: string;
  submittedAt: string;
}

export const initialOrderItems: readonly OrderItem[] = [
  {
    id: 'prod-lit-guide',
    name: 'Lit Web Components Masterclass',
    unitPrice: 38000,
    quantity: 1,
  },
  {
    id: 'prod-context-di',
    name: 'W3C Context Protocol DI Toolkit',
    unitPrice: 45000,
    quantity: 2,
  },
  {
    id: 'prod-face-pack',
    name: 'Form-Associated Custom Element Suite',
    unitPrice: 22000,
    quantity: 1,
  },
];

export const LitWebComponentsActionsContext =
  createActionContext<LitWebComponentsActions>('LitWebComponentsActions');

export const LitWebComponentsStoresContext = createStoreContext(
  'LitWebComponentsStores',
  {
    items: [...initialOrderItems] as OrderItem[],
    discountEnabled: false,
    submittedTicket: null as SubmittedTicket | null,
    auditLog: [
      {
        id: 'audit-lit-0',
        message:
          'Lit Web Components showcase initialized with StoreController & ActionController.',
        timestamp: '00:00:00.000',
      },
    ] as AuditRecord[],
  }
);
