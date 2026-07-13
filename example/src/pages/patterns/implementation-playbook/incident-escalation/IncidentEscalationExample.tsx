import { IncidentEscalationProviders } from './handlers/IncidentEscalationHandlers';
import { IncidentEscalationView } from './views/IncidentEscalationView';

export function IncidentEscalationExample() {
  return (
    <IncidentEscalationProviders>
      <IncidentEscalationView />
    </IncidentEscalationProviders>
  );
}

export default IncidentEscalationExample;
