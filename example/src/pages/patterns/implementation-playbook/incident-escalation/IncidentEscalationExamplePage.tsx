import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import IncidentEscalationExample from './IncidentEscalationExample';

function useIncidentEscalationSourceRegistration() {
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/IncidentEscalationExamplePage.tsx',
    {
      name: 'IncidentEscalationExamplePage',
      description:
        'Route-level entry for the incident escalation implementation-playbook example.',
      tags: ['patterns', 'implementation-playbook', 'incident-escalation'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/IncidentEscalationExample.tsx',
    {
      name: 'IncidentEscalationExample',
      description:
        'Integration point that composes providers and the incident escalation view.',
      tags: ['patterns', 'implementation-playbook', 'integration'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/contexts/IncidentEscalationContexts.tsx',
    {
      name: 'IncidentEscalationContexts',
      description:
        'Action, Store, and Ref boundaries for the incident escalation workflow.',
      tags: ['contexts', 'implementation-playbook', 'incident-escalation'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/business/incidentBusiness.ts',
    {
      name: 'incidentBusiness',
      description:
        'Barrel export for the split incident escalation business modules.',
      tags: ['business', 'implementation-playbook', 'incident-escalation'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/business/incidentStateMachine.ts',
    {
      name: 'incidentStateMachine',
      description:
        'Explicit state transitions for the incident escalation workflow.',
      tags: ['business', 'implementation-playbook', 'state-machine'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/handlers/useIncidentSubmissionHandlers.tsx',
    {
      name: 'useIncidentSubmissionHandlers',
      description:
        'Submission handler registration for the incident escalation flow.',
      tags: ['handlers', 'implementation-playbook', 'incident-escalation'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/incident-escalation/views/IncidentEscalationView.tsx',
    {
      name: 'IncidentEscalationView',
      description:
        'Product-style rendering layer for the incident escalation playbook example.',
      tags: ['views', 'implementation-playbook', 'incident-escalation'],
      priority: 8,
    }
  );
}

export default function IncidentEscalationExamplePage() {
  useIncidentEscalationSourceRegistration();

  return <IncidentEscalationExample />;
}
