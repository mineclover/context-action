import { useRegisterSourceFile } from '../../../../hooks/useRegisterSourceFile';
import RenewalRiskReviewExample from './RenewalRiskReviewExample';

function useRenewalRiskReviewSourceRegistration() {
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/RenewalRiskReviewExamplePage.tsx',
    {
      name: 'RenewalRiskReviewExamplePage',
      description:
        'Route-level entry for the renewal risk review implementation-playbook example.',
      tags: ['patterns', 'implementation-playbook', 'renewal-risk-review'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/RenewalRiskReviewExample.tsx',
    {
      name: 'RenewalRiskReviewExample',
      description:
        'Integration point that composes providers and the renewal risk review view.',
      tags: ['patterns', 'implementation-playbook', 'integration'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/contexts/RenewalRiskReviewContexts.tsx',
    {
      name: 'RenewalRiskReviewContexts',
      description:
        'Action, Store, and Ref boundaries for the renewal risk review workflow.',
      tags: ['contexts', 'implementation-playbook', 'renewal-risk-review'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/business/renewalBusiness.ts',
    {
      name: 'renewalBusiness',
      description:
        'Barrel export for the split renewal risk review business modules.',
      tags: ['business', 'implementation-playbook', 'renewal-risk-review'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/business/renewalStateMachine.ts',
    {
      name: 'renewalStateMachine',
      description:
        'Explicit state transitions for the renewal risk review workflow.',
      tags: ['business', 'implementation-playbook', 'state-machine'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/handlers/useRenewalSubmissionHandlers.tsx',
    {
      name: 'useRenewalSubmissionHandlers',
      description:
        'Submission handler registration for the renewal risk review flow.',
      tags: ['handlers', 'implementation-playbook', 'renewal-risk-review'],
      priority: 8,
    }
  );
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/renewal-risk-review/views/RenewalRiskReviewView.tsx',
    {
      name: 'RenewalRiskReviewView',
      description:
        'Product-style rendering layer for the renewal risk review playbook example.',
      tags: ['views', 'implementation-playbook', 'renewal-risk-review'],
      priority: 8,
    }
  );
}

export default function RenewalRiskReviewExamplePage() {
  useRenewalRiskReviewSourceRegistration();

  return <RenewalRiskReviewExample />;
}
