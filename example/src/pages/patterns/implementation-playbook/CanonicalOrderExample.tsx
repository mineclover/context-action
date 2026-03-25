import React from 'react';
import { CanonicalOrderProviders } from './handlers/CanonicalOrderHandlers';
import { CanonicalOrderView } from './views/CanonicalOrderView';

export function CanonicalOrderExample() {
  return (
    <CanonicalOrderProviders>
      <CanonicalOrderView />
    </CanonicalOrderProviders>
  );
}

export default CanonicalOrderExample;
