import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { EnhancedContextStoreProvider } from '../../../../example/src/pages/performance/mouse-events/enhanced-context-store/providers/EnhancedContextStoreProvider';
import { EnhancedContextStoreView } from '../../../../example/src/pages/performance/mouse-events/enhanced-context-store/components/EnhancedContextStoreView';

describe('Enhanced context-store mouse usecase', () => {
  it('connects the Provider, Registry, View, and Store through a real click', async () => {
    const { container, getByText } = render(
      <EnhancedContextStoreProvider>
        <EnhancedContextStoreView />
      </EnhancedContextStoreProvider>
    );

    const canvas = container.querySelector('div.cursor-crosshair');
    expect(canvas).toBeInTheDocument();

    fireEvent.mouseEnter(canvas as HTMLDivElement, {
      clientX: 40,
      clientY: 50,
    });
    fireEvent.mouseDown(canvas as HTMLDivElement, {
      button: 0,
      clientX: 40,
      clientY: 50,
    });

    await waitFor(() => {
      expect(getByText('1 clicks')).toBeInTheDocument();
      expect(getByText('CLICKING')).toBeInTheDocument();
    });
  });
});
