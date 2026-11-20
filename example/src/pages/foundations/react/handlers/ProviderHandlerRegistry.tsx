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

  ProviderActionContext.useActionGuard(
    'updateMessage',
    React.useCallback(({ text }, controller) => {
      if (!text.trim()) {
        controller.abort('Message cannot be empty');
      }
    }, []),
    { id: 'provider-message-guard', priority: 100 }
  );

  ProviderActionContext.useActionCommandHandler(
    'updateCounter',
    React.useCallback(
      ({ value }) => {
        counterStore.setValue(value);
      },
      [counterStore]
    )
  );

  ProviderActionContext.useActionObserver(
    'updateCounter',
    React.useCallback(
      (event) => {
        if (event.outcome === 'completed') {
          const timestamp = new Date().toLocaleTimeString();
          activitiesStore.update((prev) => [
            ...prev,
            `${timestamp}: [observer] updateCounter settled (${event.payload.value})`,
          ]);
        }
      },
      [activitiesStore]
    ),
    { id: 'provider-counter-observer', when: 'success', priority: 10 }
  );

  ProviderActionContext.useActionCommandHandler(
    'resetCounter',
    React.useCallback(() => {
      counterStore.setValue(0);
    }, [counterStore])
  );

  ProviderActionContext.useActionCommandHandler(
    'updateMessage',
    React.useCallback(
      ({ text }) => {
        messageStore.setValue(text);
      },
      [messageStore]
    )
  );

  ProviderActionContext.useActionCommandHandler(
    'resetMessage',
    React.useCallback(() => {
      messageStore.setValue('Hello from Provider!');
    }, [messageStore])
  );

  ProviderActionContext.useActionCommandHandler(
    'logActivity',
    React.useCallback(
      ({ activity }) => {
        const timestamp = new Date().toLocaleTimeString();
        activitiesStore.update((prev) => [
          ...prev,
          `${timestamp}: ${activity}`,
        ]);
      },
      [activitiesStore]
    )
  );

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
