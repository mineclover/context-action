import React from 'react';
import { AccessRequestProviders } from './handlers/AccessRequestHandlers';
import { AccessRequestView } from './views/AccessRequestView';

export function AccessRequestExample() {
  return (
    <AccessRequestProviders>
      <AccessRequestView />
    </AccessRequestProviders>
  );
}

export default AccessRequestExample;
