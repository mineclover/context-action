import React from 'react';
import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import AccessRequestExample from './AccessRequestExample';

function useAccessRequestSourceRegistration() {
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/AccessRequestExamplePage.tsx',
    {
      name: 'AccessRequestExamplePage',
      description:
        'Route-level entry for the access request implementation-playbook example.',
      tags: ['patterns', 'implementation-playbook', 'access-request'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/AccessRequestExample.tsx',
    {
      name: 'AccessRequestExample',
      description:
        'Integration point that composes providers and the access request view.',
      tags: ['patterns', 'implementation-playbook', 'integration'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/contexts/AccessRequestContexts.tsx',
    {
      name: 'AccessRequestContexts',
      description:
        'Action, Store, and Ref boundaries for the access request workflow.',
      tags: ['contexts', 'implementation-playbook', 'access-request'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/business/accessBusiness.ts',
    {
      name: 'accessBusiness',
      description: 'Barrel export for the split access request business modules.',
      tags: ['business', 'implementation-playbook', 'access-request'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/business/accessStateMachine.ts',
    {
      name: 'accessStateMachine',
      description:
        'Explicit review state transitions for the access request workflow.',
      tags: ['business', 'implementation-playbook', 'state-machine'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/handlers/useAccessSubmissionHandlers.tsx',
    {
      name: 'useAccessSubmissionHandlers',
      description:
        'Submission handler registration for the access request review flow.',
      tags: ['handlers', 'implementation-playbook', 'access-request'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/access-request/views/AccessRequestView.tsx',
    {
      name: 'AccessRequestView',
      description:
        'Product-style rendering layer for the access request playbook example.',
      tags: ['views', 'implementation-playbook', 'access-request'],
      priority: 8,
    }
  );
}

export default function AccessRequestExamplePage() {
  useAccessRequestSourceRegistration();

  return <AccessRequestExample />;
}
