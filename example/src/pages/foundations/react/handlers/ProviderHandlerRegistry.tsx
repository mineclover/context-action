import React from 'react';
import {
  ProviderActionContext,
  ProviderStoreContext,
} from '../contexts/ProviderContexts';

export function ProviderHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const counterStore = ProviderStoreContext.useStore('counter');
  const messageStore = ProviderStoreContext.useStore('message');
  const activitiesStore = ProviderStoreContext.useStore('activities');

  ProviderActionContext.useActionHandler('updateCounter', ({ value }) => {
    counterStore.setValue(value);
  });

  ProviderActionContext.useActionHandler('resetCounter', () => {
    counterStore.setValue(0);
  });

  ProviderActionContext.useActionHandler('updateMessage', ({ text }) => {
    messageStore.setValue(text);
  });

  ProviderActionContext.useActionHandler('resetMessage', () => {
    messageStore.setValue('Hello from Provider!');
  });

  ProviderActionContext.useActionHandler('logActivity', ({ activity }) => {
    const timestamp = new Date().toLocaleTimeString();
    activitiesStore.update((prev) => [...prev, `${timestamp}: ${activity}`]);
  });

  return <>{children}</>;
}

export function ProviderRuntime({ children }: { children: React.ReactNode }) {
  return (
    <ProviderActionContext.Provider>
      <ProviderStoreContext.Provider registryId="react-provider-demo">
        <ProviderHandlerRegistry>{children}</ProviderHandlerRegistry>
      </ProviderStoreContext.Provider>
    </ProviderActionContext.Provider>
  );
}
