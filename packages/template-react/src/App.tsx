import React from 'react';
import { ThemeProvider } from './theme/ThemeContext';
import { OrderContextProvider } from './features/order-workspace/contexts/OrderContexts';
import { OrderHandlerRegistry } from './features/order-workspace/handlers/OrderHandlerRegistry';
import { OrderWorkspaceView } from './features/order-workspace/views/OrderWorkspaceView';

export function App() {
  return (
    <ThemeProvider>
      <OrderContextProvider>
        {/* Domain Handlers Registration */}
        <OrderHandlerRegistry />
        {/* View Surface */}
        <OrderWorkspaceView />
      </OrderContextProvider>
    </ThemeProvider>
  );
}

export default App;
