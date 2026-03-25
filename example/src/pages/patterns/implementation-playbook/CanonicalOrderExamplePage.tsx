import React from 'react';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';
import CanonicalOrderExample from './CanonicalOrderExample';

function useCanonicalOrderSourceRegistration() {
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/CanonicalOrderExamplePage.tsx',
    {
      name: 'CanonicalOrderExamplePage',
      description:
        'Route-level entry for the implementation-first canonical order example.',
      tags: ['patterns', 'implementation-playbook', 'canonical-example'],
      priority: 10,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/CanonicalOrderExample.tsx',
    {
      name: 'CanonicalOrderExample',
      description:
        'Integration point that composes providers and the implementation-focused view.',
      tags: ['patterns', 'implementation-playbook', 'integration'],
      priority: 9,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/contexts/CanonicalOrderContexts.tsx',
    {
      name: 'CanonicalOrderContexts',
      description:
        'Context boundaries for Action, Store, and Ref responsibilities.',
      tags: ['contexts', 'implementation-playbook'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/business/orderBusiness.ts',
    {
      name: 'orderBusiness',
      description:
        'Pure validation and quote calculation rules for the canonical example.',
      tags: ['business', 'implementation-playbook'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/handlers/CanonicalOrderHandlers.tsx',
    {
      name: 'CanonicalOrderHandlers',
      description:
        'Handler orchestration layer for validation, submission, and reset flows.',
      tags: ['handlers', 'implementation-playbook'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/actions/useCanonicalOrderActions.ts',
    {
      name: 'useCanonicalOrderActions',
      description: 'View-facing dispatch helpers for the canonical order flow.',
      tags: ['actions', 'implementation-playbook'],
      priority: 7,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/hooks/useCanonicalOrderData.ts',
    {
      name: 'useCanonicalOrderData',
      description:
        'Reactive data access layer exposing store-backed state to the view.',
      tags: ['hooks', 'implementation-playbook'],
      priority: 7,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/views/CanonicalOrderView.tsx',
    {
      name: 'CanonicalOrderView',
      description:
        'Pure rendering layer for the canonical implementation playbook example.',
      tags: ['views', 'implementation-playbook'],
      priority: 7,
    }
  );
}

export default function CanonicalOrderExamplePage() {
  useCanonicalOrderSourceRegistration();

  return <CanonicalOrderExample />;
}
