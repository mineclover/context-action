import {
  ReactAriaReferenceActions,
  ReactAriaReferenceStores,
} from './contexts/ReactAriaReferenceContexts';
import { ReactAriaReferenceHandlerRegistry } from './handlers/ReactAriaReferenceHandlerRegistry';
import { ReactAriaReferenceView } from './views/ReactAriaReferenceView';

export default function ReactAriaReferencePage() {
  return (
    <ReactAriaReferenceActions.Provider>
      <ReactAriaReferenceStores.Provider>
        <ReactAriaReferenceHandlerRegistry>
          <ReactAriaReferenceView />
        </ReactAriaReferenceHandlerRegistry>
      </ReactAriaReferenceStores.Provider>
    </ReactAriaReferenceActions.Provider>
  );
}
