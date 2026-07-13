import { RenewalRiskReviewProviders } from './handlers/RenewalRiskReviewHandlers';
import { RenewalRiskReviewView } from './views/RenewalRiskReviewView';

export function RenewalRiskReviewExample() {
  return (
    <RenewalRiskReviewProviders>
      <RenewalRiskReviewView />
    </RenewalRiskReviewProviders>
  );
}

export default RenewalRiskReviewExample;
