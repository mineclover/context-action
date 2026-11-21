import { useStoreValue } from '@context-action/react';
import { formatWorkspaceSummary } from '../business/headlessWorkspaceRules';
import {
  useHeadlessDocumentControls,
  useHeadlessDocumentStore,
  useHeadlessSessionStore,
} from '../contexts/HeadlessDiContexts';

export function useHeadlessDiData() {
  const sessionStore = useHeadlessSessionStore('session');
  const viewLocalStore = useHeadlessSessionStore('viewLocal');
  const documentStore = useHeadlessDocumentStore('document');

  const session = useStoreValue(sessionStore);
  const viewLocal = useStoreValue(viewLocalStore);
  const documentState = useStoreValue(documentStore);
  const timeTravel = useHeadlessDocumentControls('document');

  return {
    session,
    viewLocal,
    documentState,
    timeTravel,
    summaryText: formatWorkspaceSummary(session, documentState),
  };
}
