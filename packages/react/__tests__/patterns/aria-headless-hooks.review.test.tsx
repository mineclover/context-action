import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import {
  createAriaDialog,
  createAriaSlider,
  createAriaTabs,
  useAriaButton,
  type AriaTabItem,
} from '../../examples/hooks/aria-headless-hooks-example';

function dispatchPointerEvent(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: { clientX?: number; clientY?: number; button?: number; pointerId?: number } = {},
): void {
  const ev = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperty(ev, 'pointerId', {
    value: init.pointerId ?? 1,
    configurable: true,
  });
  target.dispatchEvent(ev);
}

describe('React Aria-style headless hooks built on Context-Action (Interface Review)', () => {
  describe('1. useAriaButton (sync element pipeline)', () => {
    it('handles pointer press states, synchronous Space/Enter preventDefault, and disabled guard admission', () => {
      const onPress = jest.fn();

      function Harness() {
        const [disabled, setDisabled] = useState(false);
        const { buttonProps, isPressed } = useAriaButton({
          isDisabled: disabled,
          onPress,
        });

        return (
          <div>
            <button {...buttonProps} data-testid="aria-btn">
              {isPressed ? 'Pressed' : 'Idle'}
            </button>
            <button
              type="button"
              data-testid="toggle-disabled"
              onClick={() => setDisabled(prev => !prev)}
            >
              toggle
            </button>
          </div>
        );
      }

      const view = render(<Harness />);
      const btn = view.getByTestId('aria-btn') as HTMLButtonElement;

      expect(btn.getAttribute('role')).toBe('button');
      expect(btn.tabIndex).toBe(0);
      expect(btn.getAttribute('data-pressed')).toBe('false');

      // Pointer down -> pressed=true, pointer up + click -> pressed=false & onPress called
      act(() => {
        dispatchPointerEvent(btn, 'pointerdown', { button: 0 });
      });
      expect(btn.getAttribute('data-pressed')).toBe('true');
      expect(btn.textContent).toBe('Pressed');

      act(() => {
        dispatchPointerEvent(btn, 'pointerup', { button: 0 });
      });
      fireEvent.click(btn);
      expect(btn.getAttribute('data-pressed')).toBe('false');
      expect(onPress).toHaveBeenCalledTimes(1);

      // Space keydown -> synchronous preventDefault() + pressed=true -> Space keyup -> onPress
      const spaceDown = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      act(() => {
        btn.dispatchEvent(spaceDown);
      });
      expect(spaceDown.defaultPrevented).toBe(true);
      expect(btn.getAttribute('data-pressed')).toBe('true');

      const spaceUp = new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true });
      act(() => {
        btn.dispatchEvent(spaceUp);
      });
      expect(spaceUp.defaultPrevented).toBe(true);
      expect(btn.getAttribute('data-pressed')).toBe('false');
      expect(onPress).toHaveBeenCalledTimes(2);

      // Enter keydown -> synchronous preventDefault() + immediate press
      const enterDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        btn.dispatchEvent(enterDown);
      });
      expect(enterDown.defaultPrevented).toBe(true);
      expect(onPress).toHaveBeenCalledTimes(3);

      // Disable button -> guard blocks click, pointerDown, and Space/Enter
      fireEvent.click(view.getByTestId('toggle-disabled'));
      expect(btn.getAttribute('aria-disabled')).toBe('true');
      expect(btn.tabIndex).toBe(-1);

      fireEvent.pointerDown(btn, { button: 0 });
      expect(btn.getAttribute('data-pressed')).toBe('false');
      fireEvent.click(btn);
      fireEvent.keyDown(btn, { key: 'Enter' });
      expect(onPress).toHaveBeenCalledTimes(3);

      view.unmount();
    });
  });

  describe('2. createAriaTabs (roving focus + O(2) selective tab selection + policy guard + isolation)', () => {
    const TabsA = createAriaTabs('ReviewTabsA');
    const TabsB = createAriaTabs('ReviewTabsB');

    it('routes ArrowRight past disabled items, achieves O(2) tab re-renders across 10 tabs, enforces canSelect, and isolates providers', async () => {
      const items: AriaTabItem[] = Array.from({ length: 10 }, (_, idx) => ({
        id: `tab-${idx}`,
        label: `Tab ${idx}`,
        disabled: idx === 1, // Disable tab-1 to verify skip logic
      }));

      const tabRenderCounts: Record<string, number> = {};
      const panelRenderCounts: Record<string, number> = {};
      let shellRenders = 0;
      const onSelect = jest.fn();

      function TabButton({ item }: { item: AriaTabItem }) {
        tabRenderCounts[item.id] = (tabRenderCounts[item.id] ?? 0) + 1;
        const { tabProps } = TabsA.useTab(item.id);
        return (
          <button {...tabProps} data-testid={`tab-a-${item.id}`}>
            {item.label}
          </button>
        );
      }

      function TabPanelView({ item }: { item: AriaTabItem }) {
        panelRenderCounts[item.id] = (panelRenderCounts[item.id] ?? 0) + 1;
        const { tabPanelProps } = TabsA.useTabPanel(item.id);
        return (
          <div {...tabPanelProps} data-testid={`panel-a-${item.id}`}>
            Panel {item.id}
          </div>
        );
      }

      function TabsShell() {
        shellRenders += 1;
        const tabListProps = TabsA.useTabList();
        return (
          <div>
            <div {...tabListProps} data-testid="tablist-a">
              {items.map(item => (
                <TabButton key={item.id} item={item} />
              ))}
            </div>
            {items.map(item => (
              <TabPanelView key={item.id} item={item} />
            ))}
          </div>
        );
      }

      function SecondaryTabs() {
        const listProps = TabsB.useTabList();
        const t0 = TabsB.useTab('b0');
        const t1 = TabsB.useTab('b1');
        return (
          <div {...listProps}>
            <button {...t0.tabProps} data-testid="tab-b-0">
              B0
            </button>
            <button {...t1.tabProps} data-testid="tab-b-1">
              B1
            </button>
          </div>
        );
      }

      const view = render(
        <div>
          <TabsA.Provider
            items={items}
            defaultSelectedId="tab-0"
            canSelect={nextId => nextId !== 'tab-9'} // Lock tab-9 via guard
            onSelect={onSelect}
          >
            <TabsShell />
          </TabsA.Provider>

          <TabsB.Provider
            items={[
              { id: 'b0', label: 'B0' },
              { id: 'b1', label: 'B1' },
            ]}
            defaultSelectedId="b0"
          >
            <SecondaryTabs />
          </TabsB.Provider>
        </div>,
      );

      // Wait one tick so insertion effects settle
      await waitFor(() => {
        expect(view.getByTestId('tab-a-tab-0').getAttribute('aria-selected')).toBe('true');
      });

      const tab0 = view.getByTestId('tab-a-tab-0') as HTMLButtonElement;
      const tab1 = view.getByTestId('tab-a-tab-1') as HTMLButtonElement;
      const tab2 = view.getByTestId('tab-a-tab-2') as HTMLButtonElement;
      const tab9 = view.getByTestId('tab-a-tab-9') as HTMLButtonElement;

      expect(tab0.tabIndex).toBe(0);
      expect(tab1.disabled).toBe(true);
      expect(tab2.tabIndex).toBe(-1);

      // 1. ArrowRight skips disabled tab-1 and moves DOM focus synchronously to tab-2
      tab0.focus();
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        tab0.dispatchEvent(arrowRightEvent);
      });
      expect(arrowRightEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(tab2);
      expect(tab2.tabIndex).toBe(0);
      expect(tab0.tabIndex).toBe(-1);

      // Reset counters before clicking tab-2 to measure O(2) re-render precision on selection change
      // Wait: focus was moved to tab-2 above, so re-focus tab-0 or select tab-4 to isolate selection + focus!
      const tab4 = view.getByTestId('tab-a-tab-4') as HTMLButtonElement;
      const tabCountsBeforeSelect = { ...tabRenderCounts };
      const panelCountsBeforeSelect = { ...panelRenderCounts };
      const shellBeforeSelect = shellRenders;

      await act(async () => {
        fireEvent.click(tab4);
      });
      await waitFor(() => {
        expect(tab4.getAttribute('aria-selected')).toBe('true');
      });

      expect(tab0.getAttribute('aria-selected')).toBe('false');
      expect(view.getByTestId('panel-a-tab-4').hidden).toBe(false);
      expect(view.getByTestId('panel-a-tab-0').hidden).toBe(true);
      expect(onSelect).toHaveBeenCalledWith('tab-4');
      expect(shellRenders).toBe(shellBeforeSelect);

      // Only outgoing (tab-0 selected -> false, tab-2 focused -> false) & incoming (tab-4) tabs changed!
      // All unaffected tabs (tab-1, tab-3, tab-5, tab-6, tab-7, tab-8, tab-9) rendered ZERO extra times!
      for (const id of ['tab-1', 'tab-3', 'tab-5', 'tab-6', 'tab-7', 'tab-8', 'tab-9']) {
        expect(tabRenderCounts[id]).toBe(tabCountsBeforeSelect[id]);
        expect(panelRenderCounts[id]).toBe(panelCountsBeforeSelect[id]);
      }
      expect(tabRenderCounts['tab-4']).toBe((tabCountsBeforeSelect['tab-4'] ?? 0) + 1);
      expect(panelRenderCounts['tab-4']).toBe((panelCountsBeforeSelect['tab-4'] ?? 0) + 1);
      expect(panelRenderCounts['tab-0']).toBe((panelCountsBeforeSelect['tab-0'] ?? 0) + 1);

      // 2. Policy guard blocks locked tab-9
      await act(async () => {
        fireEvent.click(tab9);
      });
      expect(tab4.getAttribute('aria-selected')).toBe('true');
      expect(tab9.getAttribute('aria-selected')).toBe('false');
      expect(onSelect).toHaveBeenCalledTimes(1);

      // 3. Second independent TabsB provider stays untouched and operates independently
      expect(view.getByTestId('tab-b-0').getAttribute('aria-selected')).toBe('true');
      await act(async () => {
        fireEvent.click(view.getByTestId('tab-b-1'));
      });
      await waitFor(() => {
        expect(view.getByTestId('tab-b-1').getAttribute('aria-selected')).toBe('true');
      });
      expect(tab4.getAttribute('aria-selected')).toBe('true');

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('3. createAriaSlider (fast-lane 0-render drag + Escape cancel + orchestrated keyboard/pointerup commit)', () => {
    const Slider = createAriaSlider('ReviewSlider');

    it('drags through 200 pointermove frames with 0 React re-renders, cancels cleanly on Escape, and commits on pointerup/keys', async () => {
      const onChangeEnd = jest.fn();
      const renders = { shell: 0, track: 0, thumb: 0, readout: 0 };

      function SliderReadout() {
        renders.readout += 1;
        const val = Slider.useSliderValue();
        return <span data-testid="slider-committed">{val}</span>;
      }

      function SliderControls() {
        renders.track += 1;
        const { trackProps } = Slider.useSliderTrack();
        const { thumbProps } = Slider.useSliderThumb();
        renders.thumb += 1;

        return (
          <div {...trackProps} data-testid="slider-track">
            <div {...thumbProps} data-testid="slider-thumb" />
          </div>
        );
      }

      function SliderShell() {
        renders.shell += 1;
        return (
          <div>
            <SliderControls />
            <SliderReadout />
          </div>
        );
      }

      const view = render(
        <Slider.Provider min={0} max={100} step={5} defaultValue={20} onChangeEnd={onChangeEnd}>
          <SliderShell />
        </Slider.Provider>,
      );

      const track = view.getByTestId('slider-track') as HTMLDivElement;
      const thumb = view.getByTestId('slider-thumb') as HTMLDivElement;
      track.getBoundingClientRect = () =>
        ({
          left: 0,
          right: 200,
          width: 200,
          top: 0,
          bottom: 20,
          height: 20,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;

      expect(view.getByTestId('slider-committed').textContent).toBe('20');
      const rendersBeforeDrag = { ...renders };

      // 1. Pointer drag across 200 move events (fast lane) -> 0 React re-renders!
      await act(async () => {
        dispatchPointerEvent(track, 'pointerdown', { pointerId: 1, button: 0, clientX: 40, clientY: 10 });
        for (let i = 1; i <= 200; i += 1) {
          const clientX = Math.min(200, 40 + i * 0.6); // ends at clientX=160 -> 80% -> value 80
          dispatchPointerEvent(track, 'pointermove', { pointerId: 1, clientX, clientY: 10 });
        }
      });

      expect(thumb.dataset.previewValue).toBe('80');
      expect(thumb.getAttribute('aria-valuenow')).toBe('80');
      expect(view.getByTestId('slider-committed').textContent).toBe('20'); // Not committed yet!
      expect(onChangeEnd).not.toHaveBeenCalled();
      expect(renders).toEqual(rendersBeforeDrag); // Zero React re-renders across 200 pointermoves!

      // 2. Escape cancels drag & snaps thumb DOM back to committed 20 without committing
      const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        thumb.dispatchEvent(escEvent);
      });
      expect(escEvent.defaultPrevented).toBe(true);
      expect(thumb.dataset.previewValue).toBe('20');
      expect(view.getByTestId('slider-committed').textContent).toBe('20');
      expect(onChangeEnd).not.toHaveBeenCalled();
      expect(renders).toEqual(rendersBeforeDrag);

      // 3. Second drag followed by pointerup commits 75% (clientX=150)
      await act(async () => {
        dispatchPointerEvent(track, 'pointerdown', { pointerId: 2, button: 0, clientX: 50, clientY: 10 });
        dispatchPointerEvent(track, 'pointermove', { pointerId: 2, clientX: 150, clientY: 10 });
      });
      expect(thumb.dataset.previewValue).toBe('75');
      expect(renders).toEqual(rendersBeforeDrag);

      await act(async () => {
        dispatchPointerEvent(track, 'pointerup', { pointerId: 2, button: 0, clientX: 150, clientY: 10 });
      });
      await waitFor(() => {
        expect(view.getByTestId('slider-committed').textContent).toBe('75');
      });
      expect(onChangeEnd).toHaveBeenCalledWith(75);
      expect(renders.shell).toBe(rendersBeforeDrag.shell);
      expect(renders.readout).toBe(rendersBeforeDrag.readout + 1);

      // 4. Keyboard ArrowRight & End step/clamp + call preventDefault
      const arrowRight = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        thumb.dispatchEvent(arrowRight);
      });
      expect(arrowRight.defaultPrevented).toBe(true);
      await waitFor(() => {
        expect(view.getByTestId('slider-committed').textContent).toBe('80');
      });

      await act(async () => {
        fireEvent.keyDown(thumb, { key: 'End' });
      });
      await waitFor(() => {
        expect(view.getByTestId('slider-committed').textContent).toBe('100');
      });
      expect(onChangeEnd).toHaveBeenCalledTimes(3);

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('4. createAriaDialog (guarded dismissal & trigger focus restoration)', () => {
    const Dialog = createAriaDialog('ReviewDialog');

    it('opens and focuses dialog, blocks Escape/Close when canDismiss fails, and restores focus to trigger on dismiss', async () => {
      let allowDismiss = false;
      const onOpenChange = jest.fn();

      function DialogView() {
        const { triggerProps } = Dialog.useDialogTrigger();
        const { dialogProps, titleProps, close } = Dialog.useDialog();

        return (
          <div>
            <button {...triggerProps} data-testid="dlg-trigger">
              Open
            </button>
            <div {...dialogProps} data-testid="dlg-panel">
              <h4 {...titleProps}>Modal Title</h4>
              <button type="button" data-testid="dlg-close" onClick={close}>
                Close
              </button>
            </div>
          </div>
        );
      }

      const view = render(
        <Dialog.Provider canDismiss={() => allowDismiss} onOpenChange={onOpenChange}>
          <DialogView />
        </Dialog.Provider>,
      );

      const trigger = view.getByTestId('dlg-trigger') as HTMLButtonElement;
      const panel = view.getByTestId('dlg-panel') as HTMLDivElement;

      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.hidden).toBe(true);

      // Open dialog -> aria-expanded=true & DOM focus moves into dialog
      trigger.focus();
      await act(async () => {
        fireEvent.click(trigger);
      });
      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(panel.hidden).toBe(false);
        expect(document.activeElement).toBe(panel);
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);

      // Guard blocks both Close button and Escape when allowDismiss=false
      await act(async () => {
        fireEvent.click(view.getByTestId('dlg-close'));
      });
      expect(panel.hidden).toBe(false);

      const blockedEsc = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        panel.dispatchEvent(blockedEsc);
      });
      expect(blockedEsc.defaultPrevented).toBe(true);
      expect(panel.hidden).toBe(false);
      expect(onOpenChange).toHaveBeenCalledTimes(1);

      // Allow dismiss -> Escape closes dialog & restores focus to trigger
      allowDismiss = true;
      await act(async () => {
        panel.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      });
      await waitFor(() => {
        expect(panel.hidden).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger);
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);

      await act(async () => {
        view.unmount();
      });
    });
  });
});
