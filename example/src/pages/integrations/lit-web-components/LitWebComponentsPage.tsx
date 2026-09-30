import {
  LitWebComponentsActionsContext,
  LitWebComponentsStoresContext,
} from './contexts/LitWebComponentsContexts';
import { LitWebComponentsHandlerRegistry } from './handlers/LitWebComponentsHandlerRegistry';
import { LitWebComponentsView } from './views/LitWebComponentsView';

export default function LitWebComponentsPage() {
  return (
    <LitWebComponentsActionsContext.Provider>
      <LitWebComponentsStoresContext.Provider>
        <LitWebComponentsHandlerRegistry>
          <LitWebComponentsView />
        </LitWebComponentsHandlerRegistry>
      </LitWebComponentsStoresContext.Provider>
    </LitWebComponentsActionsContext.Provider>
  );
}

export { LitWebComponentsPage };
