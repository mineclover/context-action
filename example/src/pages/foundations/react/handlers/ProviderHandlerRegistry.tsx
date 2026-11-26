import { createScopedContext } from '@context-action/react';
import {
  useRefRegistry,
  useStoreInstance,
} from '@context-action/react/advanced';
import type React from 'react';
import {
  ProviderActionContext,
  ProviderStoreContext,
  ScopedNoteActions,
} from '../contexts/ProviderContexts';

export interface ScopedNoteState {
  note: string;
  savedCount: number;
  lastBlockedReason: string | null;
}

export interface ScopedNoteSetupProps {
  initialNote: string;
  minLength: number;
  onSaved?: (savedText: string) => void;
}

/**
 * Single flat Provider scope combining ScopedNoteActions, local Store,
 * typed RefRegistry, and inline latest-ref guards/commands/observers.
 */
export const ScopedNoteContext = createScopedContext(
  'ScopedNoteWidget',
  ScopedNoteActions,
  ({ initialNote, minLength, onSaved }: ScopedNoteSetupProps) => {
    const store = useStoreInstance<ScopedNoteState>(
      () => ({
        note: initialNote,
        savedCount: 0,
        lastBlockedReason: null,
      }),
      'ScopedNoteStore',
      { notificationMode: 'immediate' }
    );
    const refs = useRefRegistry<{ input: HTMLInputElement }>();

    ScopedNoteActions.useActionGuard('saveNote', ({ text }, controller) => {
      const trimmed = text.trim();
      if (trimmed.length < minLength) {
        controller.abort(`Note must be at least ${minLength} characters`);
      }
    });

    ScopedNoteActions.useActionCommandHandler('saveNote', ({ text }) => {
      const trimmed = text.trim();
      store.update((draft) => {
        draft.note = trimmed;
        draft.savedCount += 1;
        draft.lastBlockedReason = null;
      });
    });

    ScopedNoteActions.useActionObserver(
      'saveNote',
      (event) => {
        onSaved?.(event.payload.text.trim());
      },
      { when: 'success' }
    );

    ScopedNoteActions.useActionObserver(
      'saveNote',
      (event) => {
        const message =
          event.errors[0]?.error.message ??
          `Note must be at least ${minLength} characters`;
        store.update((draft) => {
          draft.lastBlockedReason = message;
        });
      },
      { when: 'failure' }
    );

    ScopedNoteActions.useActionCommandHandler('resetNote', () => {
      store.update((draft) => {
        draft.note = initialNote;
        draft.lastBlockedReason = null;
      });
      refs.executeIfMounted('input', (el) => {
        el.value = initialNote;
        el.focus();
      });
    });

    return { store, refs };
  }
);

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
    ({ text }, controller) => {
      if (!text.trim()) {
        controller.abort('Message cannot be empty');
      }
    },
    { id: 'provider-message-guard', priority: 100 }
  );

  ProviderActionContext.useActionCommandHandler(
    'updateCounter',
    ({ value }) => {
      counterStore.setValue(value);
    }
  );

  ProviderActionContext.useActionObserver(
    'updateCounter',
    (event) => {
      if (event.outcome === 'completed') {
        const timestamp = new Date().toLocaleTimeString();
        activitiesStore.update((prev) => [
          ...prev,
          `${timestamp}: [observer] updateCounter settled (${event.payload.value})`,
        ]);
      }
    },
    { id: 'provider-counter-observer', when: 'success', priority: 10 }
  );

  ProviderActionContext.useActionCommandHandler('resetCounter', () => {
    counterStore.setValue(0);
  });

  ProviderActionContext.useActionCommandHandler('updateMessage', ({ text }) => {
    messageStore.setValue(text);
  });

  ProviderActionContext.useActionCommandHandler('resetMessage', () => {
    messageStore.setValue('Hello from Provider!');
  });

  ProviderActionContext.useActionCommandHandler(
    'logActivity',
    ({ activity }) => {
      const timestamp = new Date().toLocaleTimeString();
      activitiesStore.update((prev) => [...prev, `${timestamp}: ${activity}`]);
    }
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
