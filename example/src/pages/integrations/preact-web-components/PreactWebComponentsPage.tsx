import {
  PreactWebComponentsActionsContext,
  PreactWebComponentsStoresContext,
} from './contexts/PreactWebComponentsContexts';
import { PreactWebComponentsHandlerRegistry } from './handlers/PreactWebComponentsHandlerRegistry';
import { PreactWebComponentsView } from './views/PreactWebComponentsView';

export default function PreactWebComponentsPage() {
  return (
    <PreactWebComponentsActionsContext.Provider>
      <PreactWebComponentsStoresContext.Provider>
        <PreactWebComponentsHandlerRegistry>
          <PreactWebComponentsView />
        </PreactWebComponentsHandlerRegistry>
      </PreactWebComponentsStoresContext.Provider>
    </PreactWebComponentsActionsContext.Provider>
  );
}
