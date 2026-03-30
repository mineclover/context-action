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
        'Barrel export for the split business modules used by the canonical example.',
      tags: ['business', 'implementation-playbook'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/business/orderDraft.ts',
    {
      name: 'orderDraft',
      description:
        'Draft defaults and shared order draft types for the canonical example.',
      tags: ['business', 'implementation-playbook', 'draft'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/business/orderValidation.ts',
    {
      name: 'orderValidation',
      description:
        'Pure validation rules that return domain issues instead of UI strings.',
      tags: ['business', 'implementation-playbook', 'validation'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/business/orderQuote.ts',
    {
      name: 'orderQuote',
      description:
        'Pure quote calculation rules for the implementation playbook example.',
      tags: ['business', 'implementation-playbook', 'quote'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/business/submissionStateMachine.ts',
    {
      name: 'submissionStateMachine',
      description:
        'Explicit submission state machine used by handlers to drive valid transitions.',
      tags: ['business', 'implementation-playbook', 'state-machine'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/handlers/CanonicalOrderHandlers.tsx',
    {
      name: 'CanonicalOrderHandlers',
      description: 'Provider composition point for the split handler modules.',
      tags: ['handlers', 'implementation-playbook'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/handlers/orderHandlerSupport.ts',
    {
      name: 'orderHandlerSupport',
      description:
        'Maps domain issues, submission states, and activity events to view-friendly text.',
      tags: ['handlers', 'implementation-playbook', 'mapping'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/handlers/useCanonicalOrderDraftHandlers.tsx',
    {
      name: 'useCanonicalOrderDraftHandlers',
      description:
        'Draft-focused handler registration for edit, prefill, and reset flows.',
      tags: ['handlers', 'implementation-playbook', 'draft'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/handlers/useCanonicalOrderSubmissionHandlers.tsx',
    {
      name: 'useCanonicalOrderSubmissionHandlers',
      description:
        'Submission-focused handler registration using validation and state transitions.',
      tags: ['handlers', 'implementation-playbook', 'submission'],
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
