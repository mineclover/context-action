import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import {
  createAriaComboBox,
  createAriaDataGrid,
  createAriaDialog,
  createAriaMenu,
  createAriaSlider,
  createAriaTabs,
  useAriaButton,
  type AriaComboBoxItem,
  type AriaGridRowData,
  type AriaMenuItem,
  type AriaSortDescriptor,
  type AriaTabItem,
} from '../../examples/hooks/aria-headless-hooks-example';
import { mergeProps } from '../../src/utils';

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

    it('supports controlled open state and consumer mergeProps handler chaining on Tabs & Button', async () => {
      const ControlledTabs = createAriaTabs('ControlledReviewTabs');
      const items: AriaTabItem[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'settings', label: 'Settings' },
      ];
      const consumerClick = jest.fn();
      const controlledOnSelect = jest.fn();

      function InnerTabs() {
        const tabListProps = ControlledTabs.useTabList();
        const tOverview = ControlledTabs.useTab('overview');
        const tSettings = ControlledTabs.useTab('settings');
        const panelOverview = ControlledTabs.useTabPanel('overview');
        const panelSettings = ControlledTabs.useTabPanel('settings');
        return (
          <div>
            <div {...tabListProps}>
              <button {...tOverview.tabProps} data-testid="ctrl-tab-overview">
                Overview
              </button>
              <button {...tSettings.tabProps} data-testid="ctrl-tab-settings">
                Settings
              </button>
            </div>
            <div {...panelOverview.tabPanelProps} data-testid="ctrl-panel-overview">
              Overview Content
            </div>
            <div {...panelSettings.tabPanelProps} data-testid="ctrl-panel-settings">
              Settings Content
            </div>
          </div>
        );
      }

      function Harness() {
        const [selectedId, setSelectedId] = useState('overview');
        const { buttonProps } = useAriaButton();
        const mergedButtonProps = mergeProps(buttonProps, {
          onClick: consumerClick,
        });

        return (
          <div>
            <button {...mergedButtonProps} data-testid="merged-aria-btn">
              Action
            </button>
            <button
              type="button"
              data-testid="external-select-settings"
              onClick={() => setSelectedId('settings')}
            >
              External Switch
            </button>
            <ControlledTabs.Provider
              items={items}
              selectedId={selectedId}
              onSelect={next => {
                controlledOnSelect(next);
                setSelectedId(next);
              }}
            >
              <InnerTabs />
            </ControlledTabs.Provider>
          </div>
        );
      }

      const view = render(<Harness />);
      fireEvent.click(view.getByTestId('merged-aria-btn'));
      expect(consumerClick).toHaveBeenCalledTimes(1);

      expect(view.getByTestId('ctrl-panel-overview').hidden).toBe(false);
      expect(view.getByTestId('ctrl-panel-settings').hidden).toBe(true);

      // External controlled prop update flows directly into Store via useControlledStoreSync
      fireEvent.click(view.getByTestId('external-select-settings'));
      await waitFor(() => {
        expect(view.getByTestId('ctrl-tab-settings').getAttribute('aria-selected')).toBe('true');
        expect(view.getByTestId('ctrl-panel-settings').hidden).toBe(false);
        expect(view.getByTestId('ctrl-panel-overview').hidden).toBe(true);
      });
      expect(controlledOnSelect).not.toHaveBeenCalled();

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('5. createAriaComboBox (virtual aria-activedescendant + fast filter + outside dismiss + controlled)', () => {
    const ComboBox = createAriaComboBox('ReviewComboBox');
    const fruits: AriaComboBoxItem[] = [
      { id: 'apple', label: 'Apple' },
      { id: 'apricot', label: 'Apricot', disabled: true },
      { id: 'banana', label: 'Banana' },
      { id: 'blueberry', label: 'Blueberry' },
    ];

    function OptionRow({ item }: { item: AriaComboBoxItem }) {
      const { optionProps } = ComboBox.useComboBoxOption(item.id);
      return (
        <li {...optionProps} data-testid={`combo-opt-${item.id}`}>
          {item.label}
        </li>
      );
    }

    function ComboView() {
      const { inputProps } = ComboBox.useComboBoxInput();
      const { triggerProps } = ComboBox.useComboBoxTrigger();
      const { filteredItems, listBoxProps } = ComboBox.useComboBoxListBox();
      const { selectedKey: activeKey, isOpen } = ComboBox.useComboBoxState();

      return (
        <div>
          <button type="button" data-testid="combo-outside">
            Outside
          </button>
          <input {...inputProps} data-testid="combo-input" />
          <button {...triggerProps} data-testid="combo-trigger">
            Toggle
          </button>
          <ul {...listBoxProps} data-testid="combo-listbox">
            {filteredItems.map(item => (
              <OptionRow key={item.id} item={item} />
            ))}
          </ul>
          <div data-testid="combo-state">
            {`${activeKey ?? 'none'}:${isOpen ? 'open' : 'closed'}`}
          </div>
        </div>
      );
    }

    function ComboHarness({
      defaultSelectedKey = null,
      selectedKey,
      onSelectionChange,
    }: {
      defaultSelectedKey?: string | null;
      selectedKey?: string | null;
      onSelectionChange?: (key: string | null) => void;
    }) {

      return (
        <ComboBox.Provider
          items={fruits}
          defaultSelectedKey={defaultSelectedKey}
          selectedKey={selectedKey}
          onSelectionChange={onSelectionChange}
        >
          <ComboView />
        </ComboBox.Provider>
      );
    }

    it('filters fast, navigates virtual aria-activedescendant while keeping input DOM focus, skips disabled options, and dismisses on Escape or outside pointerdown', async () => {
      const onSelectionChange = jest.fn();
      const view = render(<ComboHarness onSelectionChange={onSelectionChange} />);

      const input = view.getByTestId('combo-input') as HTMLInputElement;
      const listbox = view.getByTestId('combo-listbox') as HTMLUListElement;
      const outside = view.getByTestId('combo-outside') as HTMLButtonElement;

      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-controls')).toBe(listbox.id);
      expect(listbox.hidden).toBe(true);

      // Focus input and filter with "b" -> opens, filters to Banana & Blueberry, highlights Banana
      input.focus();
      expect(document.activeElement).toBe(input);

      await act(async () => {
        fireEvent.change(input, { target: { value: 'b' } });
      });

      await waitFor(() => {
        expect(listbox.hidden).toBe(false);
        expect(input.getAttribute('aria-expanded')).toBe('true');
      });
      expect(view.queryByTestId('combo-opt-apple')).toBeNull();
      const banana = view.getByTestId('combo-opt-banana') as HTMLLIElement;
      const blueberry = view.getByTestId('combo-opt-blueberry') as HTMLLIElement;
      expect(input.getAttribute('aria-activedescendant')).toBe(banana.id);

      // Virtual ArrowDown / ArrowUp / Home / End move aria-activedescendant without blurring <input>
      await act(async () => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
      });
      expect(input.getAttribute('aria-activedescendant')).toBe(blueberry.id);
      expect(document.activeElement).toBe(input);

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Home' });
      });
      expect(input.getAttribute('aria-activedescendant')).toBe(banana.id);

      await act(async () => {
        fireEvent.keyDown(input, { key: 'End' });
      });
      expect(input.getAttribute('aria-activedescendant')).toBe(blueberry.id);

      // Enter commits virtual active option -> closes listbox, syncs input text & fires observer
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter' });
      });
      await waitFor(() => {
        expect(listbox.hidden).toBe(true);
        expect(input.value).toBe('Blueberry');
        expect(view.getByTestId('combo-state').textContent).toBe('blueberry:closed');
      });
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith('blueberry');

      // Re-open with trigger -> disabled option ("Apricot") cannot be selected on click
      await act(async () => {
        fireEvent.click(view.getByTestId('combo-trigger'));
      });
      await waitFor(() => {
        expect(listbox.hidden).toBe(false);
      });
      const apricot = view.getByTestId('combo-opt-apricot') as HTMLLIElement;
      expect(apricot.getAttribute('aria-disabled')).toBe('true');
      await act(async () => {
        fireEvent.click(apricot);
      });
      expect(listbox.hidden).toBe(false);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);

      // Outside pointerdown closes open listbox
      await act(async () => {
        dispatchPointerEvent(outside, 'pointerdown');
      });
      await waitFor(() => {
        expect(listbox.hidden).toBe(true);
        expect(view.getByTestId('combo-state').textContent).toBe('blueberry:closed');
      });

      // Re-open then Escape closes listbox
      await act(async () => {
        fireEvent.click(view.getByTestId('combo-trigger'));
      });
      await waitFor(() => {
        expect(listbox.hidden).toBe(false);
      });
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape' });
      });
      await waitFor(() => {
        expect(listbox.hidden).toBe(true);
      });

      await act(async () => {
        view.unmount();
      });
    });

    it('synchronizes external controlled selectedKey updates to both state and input label', async () => {
      function ControlledComboHarness() {
        const [selectedKey, setSelectedKey] = useState<string | null>('apple');
        return (
          <div>
            <button
              type="button"
              data-testid="combo-ext-banana"
              onClick={() => setSelectedKey('banana')}
            >
              Select Banana
            </button>
            <ComboHarness selectedKey={selectedKey} onSelectionChange={setSelectedKey} />
          </div>
        );
      }

      const view = render(<ControlledComboHarness />);
      const input = view.getByTestId('combo-input') as HTMLInputElement;
      expect(input.value).toBe('Apple');
      expect(view.getByTestId('combo-state').textContent).toBe('apple:closed');

      fireEvent.click(view.getByTestId('combo-ext-banana'));
      await waitFor(() => {
        expect(input.value).toBe('Banana');
        expect(view.getByTestId('combo-state').textContent).toBe('banana:closed');
      });

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('6. createAriaDataGrid (50-row O(1) selectedById isolation + Shift range + sort + roving + 0-render hover)', () => {
    const DataGrid = createAriaDataGrid('ReviewGrid');
    const sampleRows: AriaGridRowData[] = Array.from({ length: 50 }, (_, idx) => ({
      id: `row-${idx + 1}`,
      name: `Item ${String(50 - idx).padStart(2, '0')}`,
      score: idx === 4 ? 999 : (idx + 1) * 10,
      disabled: idx === 2, // row-3 is disabled
    }));

    it('isolates row selection renders to the single toggled row (0 sibling renders), skips disabled rows in Shift+Click range, sorts columns, roves vertically, and keeps hover at 0 React renders', async () => {
      const onSelectionChange = jest.fn();
      const onSortChange = jest.fn((_desc: AriaSortDescriptor | null) => undefined);
      const rowRenderCounts = new Map<string, number>();
      let shellRenderCount = 0;

      const GridRow = React.memo(function GridRow({ rowId }: { rowId: string }) {
        rowRenderCounts.set(rowId, (rowRenderCounts.get(rowId) ?? 0) + 1);
        const { row, isSelected, rowProps } = DataGrid.useGridRow(rowId);
        if (!row) return null;
        return (
          <tr {...rowProps} data-testid={`grid-row-${rowId}`}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.score}</td>
            <td>{isSelected ? 'selected' : 'idle'}</td>
          </tr>
        );
      });

      const GridHeader = React.memo(function GridHeader() {
        const nameHeader = DataGrid.useGridColumnHeader('name');
        const scoreHeader = DataGrid.useGridColumnHeader('score');
        const hoverBadge = DataGrid.useGridHoverBadge();
        return (
          <div>
            <div ref={hoverBadge.setRef} data-testid="grid-hover-badge">
              Hover idle
            </div>
            <button {...nameHeader.columnHeaderProps} data-testid="grid-sort-name">
              Name ({nameHeader.ariaSort})
            </button>
            <button {...scoreHeader.columnHeaderProps} data-testid="grid-sort-score">
              Score ({scoreHeader.ariaSort})
            </button>
          </div>
        );
      });

      const GridBody = React.memo(function GridBody() {
        shellRenderCount += 1;
        const { rowOrder, selectAll, clearSelection, gridProps } = DataGrid.useGrid();
        return (
          <div>
            <button type="button" data-testid="grid-select-all" onClick={selectAll}>
              Select All
            </button>
            <button type="button" data-testid="grid-clear-all" onClick={clearSelection}>
              Clear All
            </button>
            <table {...gridProps} data-testid="grid-table">
              <tbody>
                {rowOrder.map(id => (
                  <GridRow key={id} rowId={id} />
                ))}
              </tbody>
            </table>
          </div>
        );
      });

      const view = render(
        <DataGrid.Provider
          rows={sampleRows}
          onSelectionChange={onSelectionChange}
          onSortChange={onSortChange}
        >
          <GridHeader />
          <GridBody />
        </DataGrid.Provider>,
      );

      expect(shellRenderCount).toBe(1);
      expect(rowRenderCounts.size).toBe(50);

      // Snapshot counts before toggling row-2
      const beforeRow2 = rowRenderCounts.get('row-2') ?? 0;
      const beforeRow1 = rowRenderCounts.get('row-1') ?? 0;
      const beforeRow50 = rowRenderCounts.get('row-50') ?? 0;

      // 1. Toggle row-2 -> ONLY row-2 re-renders (+1); 49 sibling rows & GridBody stay at +0
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-row-row-2'));
      });
      await waitFor(() => {
        expect(view.getByTestId('grid-row-row-2').getAttribute('aria-selected')).toBe('true');
      });

      expect((rowRenderCounts.get('row-2') ?? 0) - beforeRow2).toBe(1);
      expect((rowRenderCounts.get('row-1') ?? 0) - beforeRow1).toBe(0);
      expect((rowRenderCounts.get('row-50') ?? 0) - beforeRow50).toBe(0);
      expect(shellRenderCount).toBe(1);
      expect(onSelectionChange).toHaveBeenLastCalledWith(['row-2']);

      // 2. 100 fast-lane pointer hover dispatches -> DOM badge updates directly, 0 React renders
      const preHoverRow1 = rowRenderCounts.get('row-1') ?? 0;
      const preHoverRow2 = rowRenderCounts.get('row-2') ?? 0;
      act(() => {
        for (let i = 0; i < 100; i += 1) {
          const targetId = `row-${(i % 50) + 1}`;
          fireEvent.pointerEnter(view.getByTestId(`grid-row-${targetId}`));
        }
      });
      const badge = view.getByTestId('grid-hover-badge');
      expect(badge.dataset.hoverRow).toBe('row-50');
      expect(badge.textContent).toBe('Hovered: row-50');
      expect(shellRenderCount).toBe(1);
      expect(rowRenderCounts.get('row-1')).toBe(preHoverRow1);
      expect(rowRenderCounts.get('row-2')).toBe(preHoverRow2);

      // 3. Shift+Click on row-4 -> selects range row-2..row-4 while skipping disabled row-3
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-row-row-4'), { shiftKey: true });
      });
      await waitFor(() => {
        expect(view.getByTestId('grid-row-row-4').getAttribute('aria-selected')).toBe('true');
      });
      expect(view.getByTestId('grid-row-row-3').getAttribute('aria-selected')).toBe('false');
      expect(onSelectionChange).toHaveBeenLastCalledWith(['row-2', 'row-4']);

      // 4. Disabled row-3 rejects selection toggle
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-row-row-3'));
      });
      expect(view.getByTestId('grid-row-row-3').getAttribute('aria-selected')).toBe('false');

      // 5. Vertical roving focus skips disabled row-3 (row-2 -> ArrowDown -> row-4)
      const row2El = view.getByTestId('grid-row-row-2');
      const row4El = view.getByTestId('grid-row-row-4');
      await act(async () => {
        fireEvent.focus(row2El);
      });
      await waitFor(() => {
        expect(row2El.tabIndex).toBe(0);
      });
      await act(async () => {
        fireEvent.keyDown(row2El, { key: 'ArrowDown' });
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(row4El);
        expect(row4El.tabIndex).toBe(0);
        expect(row2El.tabIndex).toBe(-1);
      });

      // 6. Column sort updates aria-sort & order without clearing existing selection
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-sort-score'));
      });
      await waitFor(() => {
        expect(view.getByTestId('grid-sort-score').getAttribute('aria-sort')).toBe('ascending');
      });
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-sort-score'));
      });
      await waitFor(() => {
        expect(view.getByTestId('grid-sort-score').getAttribute('aria-sort')).toBe('descending');
      });
      expect(onSortChange).toHaveBeenLastCalledWith({ column: 'score', direction: 'descending' });
      const firstRowAfterDescSort = view.getByTestId('grid-table').querySelector('tbody tr');
      expect(firstRowAfterDescSort?.getAttribute('data-testid')).toBe('grid-row-row-5');
      expect(view.getByTestId('grid-row-row-2').getAttribute('aria-selected')).toBe('true');

      // 7. Select all selects all 49 enabled rows (skipping disabled row-3), clear resets to []
      await act(async () => {
        fireEvent.click(view.getByTestId('grid-select-all'));
      });
      await waitFor(() => {
        const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1]?.[0];
        expect(lastCall).toHaveLength(49);
        expect(lastCall).not.toContain('row-3');
      });

      await act(async () => {
        fireEvent.click(view.getByTestId('grid-clear-all'));
      });
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      });

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('7. createAriaMenu (typeahead + roving focus + dismiss layer + trigger focus restoration)', () => {
    const Menu = createAriaMenu('ReviewMenu');
    const menuItems: AriaMenuItem[] = [
      { id: 'new', label: 'New File' },
      { id: 'save', label: 'Save' },
      { id: 'share', label: 'Share' },
      { id: 'locked', label: 'Settings', disabled: true },
      { id: 'del', label: 'Delete' },
    ];

    function MenuItemButton({ item }: { item: AriaMenuItem }) {
      const { menuItemProps } = Menu.useMenuItem(item.id);
      return (
        <button {...menuItemProps} data-testid={`menu-item-${item.id}`}>
          {item.label}
        </button>
      );
    }

    function MenuView() {
      const { triggerProps } = Menu.useMenuTrigger();
      const { menuProps } = Menu.useMenu();
      const { isOpen, activeItemId } = Menu.useMenuState();
      return (
        <div>
          <button type="button" data-testid="menu-outside">
            Outside
          </button>
          <button {...triggerProps} data-testid="menu-trigger">
            Actions
          </button>
          <div {...menuProps} data-testid="menu-list">
            {menuItems.map(item => (
              <MenuItemButton key={item.id} item={item} />
            ))}
          </div>
          <div data-testid="menu-state">{`${isOpen ? 'open' : 'closed'}:${activeItemId ?? 'none'}`}</div>
        </div>
      );
    }

    it('supports Arrow/typeahead cycling & multi-char search, guarded disabled activation, Enter activation with trigger focus restore, and Escape/outside dismissal', async () => {
      const onAction = jest.fn();
      const view = render(
        <Menu.Provider items={menuItems} onAction={onAction}>
          <MenuView />
        </Menu.Provider>,
      );

      const trigger = view.getByTestId('menu-trigger') as HTMLButtonElement;
      const menuEl = view.getByTestId('menu-list') as HTMLDivElement;
      const outside = view.getByTestId('menu-outside') as HTMLButtonElement;

      expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(menuEl.hidden).toBe(true);

      // ArrowDown on trigger opens menu and focuses first enabled item ('new')
      await act(async () => {
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(view.getByTestId('menu-item-new'));
      });

      // Disabled item ('locked') rejects click via guard without firing onAction
      await act(async () => {
        fireEvent.click(view.getByTestId('menu-item-locked'));
      });
      expect(onAction).not.toHaveBeenCalled();
      expect(menuEl.hidden).toBe(false);

      // Typeahead: 's' jumps to 'save', repeated 's' cycles to 'share' (skips disabled 'Settings')
      await act(async () => {
        fireEvent.keyDown(menuEl, { key: 's' });
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(view.getByTestId('menu-item-save'));
      });

      await act(async () => {
        fireEvent.keyDown(menuEl, { key: 's' });
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(view.getByTestId('menu-item-share'));
      });

      // Multi-char typeahead: 'de' jumps to 'Delete', Enter activates & restores trigger focus
      await act(async () => {
        fireEvent.keyDown(menuEl, { key: 'd' });
        fireEvent.keyDown(menuEl, { key: 'e' });
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(view.getByTestId('menu-item-del'));
      });

      await act(async () => {
        fireEvent.keyDown(view.getByTestId('menu-item-del'), { key: 'Enter' });
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(true);
        expect(document.activeElement).toBe(trigger);
      });
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledWith('del');

      // Re-open with ArrowUp (focuses last enabled item 'del'), then dismiss via Escape
      await act(async () => {
        fireEvent.keyDown(trigger, { key: 'ArrowUp' });
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(false);
        expect(document.activeElement).toBe(view.getByTestId('menu-item-del'));
      });

      await act(async () => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(true);
        expect(document.activeElement).toBe(trigger);
      });

      // Re-open with click, then outside pointerdown dismisses menu
      await act(async () => {
        fireEvent.click(trigger);
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(false);
      });
      await act(async () => {
        dispatchPointerEvent(outside, 'pointerdown');
      });
      await waitFor(() => {
        expect(menuEl.hidden).toBe(true);
      });

      await act(async () => {
        view.unmount();
      });
    });
  });

  describe('8. Nested Overlay Dismiss Stack (ComboBox inside Dialog — LIFO Escape & outside-pointer)', () => {
    const OuterDialog = createAriaDialog('NestedOuterDialog');
    const InnerCombo = createAriaComboBox('NestedInnerCombo');
    const comboItems: AriaComboBoxItem[] = [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ];

    function NestedComboOption({ item }: { item: AriaComboBoxItem }) {
      const { optionProps } = InnerCombo.useComboBoxOption(item.id);
      return (
        <li {...optionProps} data-testid={`nested-combo-opt-${item.id}`}>
          {item.label}
        </li>
      );
    }

    function NestedComboView() {
      const { inputProps } = InnerCombo.useComboBoxInput();
      const { triggerProps } = InnerCombo.useComboBoxTrigger();
      const { filteredItems, listBoxProps } = InnerCombo.useComboBoxListBox();

      return (
        <div>
          <input {...inputProps} data-testid="nested-combo-input" />
          <button {...triggerProps} data-testid="nested-combo-trigger">
            Pick
          </button>
          <ul {...listBoxProps} data-testid="nested-combo-listbox">
            {filteredItems.map(item => (
              <NestedComboOption key={item.id} item={item} />
            ))}
          </ul>
        </div>
      );
    }

    function NestedOverlayView() {
      const { triggerProps } = OuterDialog.useDialogTrigger();
      const { dialogProps, titleProps } = OuterDialog.useDialog();

      return (
        <div>
          <button {...triggerProps} data-testid="nested-dlg-trigger">
            Open Modal
          </button>
          <div {...dialogProps} data-testid="nested-dlg-panel">
            <h4 {...titleProps} data-testid="nested-dlg-header">
              Modal Header
            </h4>
            <InnerCombo.Provider items={comboItems}>
              <NestedComboView />
            </InnerCombo.Provider>
          </div>
        </div>
      );
    }

    it('dismisses only the top-most inner ComboBox on Escape and Dialog-body pointerdown, then dismisses Dialog on next Escape', async () => {
      const view = render(
        <OuterDialog.Provider dismissOnOutsideClick>
          <NestedOverlayView />
        </OuterDialog.Provider>,
      );

      const dlgTrigger = view.getByTestId('nested-dlg-trigger') as HTMLButtonElement;
      const dlgPanel = view.getByTestId('nested-dlg-panel') as HTMLDivElement;
      const dlgHeader = view.getByTestId('nested-dlg-header') as HTMLHeadingElement;
      const comboTrigger = view.getByTestId('nested-combo-trigger') as HTMLButtonElement;
      const comboInput = view.getByTestId('nested-combo-input') as HTMLInputElement;
      const comboListbox = view.getByTestId('nested-combo-listbox') as HTMLUListElement;

      // 1. Open Dialog -> Dialog is open, ComboBox is closed
      await act(async () => {
        fireEvent.click(dlgTrigger);
      });
      await waitFor(() => {
        expect(dlgPanel.hidden).toBe(false);
        expect(comboListbox.hidden).toBe(true);
      });

      // 2. Open nested ComboBox inside Dialog -> Stack = [Dialog, ComboBox]
      await act(async () => {
        fireEvent.click(comboTrigger);
      });
      await waitFor(() => {
        expect(comboListbox.hidden).toBe(false);
        expect(dlgPanel.hidden).toBe(false);
      });

      // 3. First Escape -> ONLY inner ComboBox closes; outer Dialog MUST stay open
      await act(async () => {
        comboInput.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      });
      await waitFor(() => {
        expect(comboListbox.hidden).toBe(true);
        expect(dlgPanel.hidden).toBe(false);
      });

      // 4. Re-open ComboBox, then click Dialog header (outside ComboBox, inside Dialog) -> ONLY ComboBox closes
      await act(async () => {
        fireEvent.click(comboTrigger);
      });
      await waitFor(() => {
        expect(comboListbox.hidden).toBe(false);
      });
      await act(async () => {
        dispatchPointerEvent(dlgHeader, 'pointerdown');
      });
      await waitFor(() => {
        expect(comboListbox.hidden).toBe(true);
        expect(dlgPanel.hidden).toBe(false);
      });

      // 5. Next Escape (now Dialog is top-most) -> Dialog closes & restores focus to trigger
      await act(async () => {
        dlgPanel.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        );
      });
      await waitFor(() => {
        expect(dlgPanel.hidden).toBe(true);
        expect(document.activeElement).toBe(dlgTrigger);
      });

      await act(async () => {
        view.unmount();
      });
    });
  });
});
