/**
 * Interactive Command Palette / Toolbar Dual-Lane Example.
 *
 * Combines:
 * - @context-action/interactions (`createRovingFocusController`) for synchronous
 *   roving tabindex keyboard navigation (ArrowRight, ArrowLeft, Home, End) skipping disabled items.
 * - @context-action/core (`ActionRegister`) separating high-frequency view interactions
 *   (`focusItem` & `previewFilter` on `lane: 'fast'`) from guarded, audited command execution
 *   (`executeCommand` on `lane: 'orchestrated'` with scoped dispatch trace).
 *
 * Run directly with Node 24+:
 *   node packages/interactions/examples/interactive-toolbar-demo.ts
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  ActionRegister,
  type ActionPayloadMap,
  type ActionResultMap,
} from '@context-action/core';
import {
  createRovingFocusController,
  type RovingFocusItem,
} from '@context-action/interactions';

interface PaletteCommand extends RovingFocusItem {
  readonly label: string;
  readonly category: 'file' | 'edit' | 'view' | 'deploy';
  readonly locked?: boolean;
}

interface ToolbarActions extends ActionPayloadMap {
  focusItem: { itemId: string; source: 'keyboard' | 'pointer' };
  previewFilter: { query: string };
  executeCommand: { commandId: string; confirmed?: boolean };
}

interface ToolbarResults extends ActionResultMap<ToolbarActions> {
  executeCommand: { commandId: string; ranAtIso: string; executionNumber: number };
}

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'new-file', label: 'File: New Document', category: 'file' },
  { id: 'format-doc', label: 'Edit: Format Selection', category: 'edit', disabled: true },
  { id: 'toggle-grid', label: 'View: Toggle Snap Grid', category: 'view' },
  { id: 'split-pane', label: 'View: Split Editor Right', category: 'view' },
  { id: 'prod-deploy', label: 'Deploy: Production Release', category: 'deploy', locked: true },
];

function unwrapSingleResult<T>(value: T | readonly T[] | undefined): T | undefined {
  return Array.isArray(value) ? (value[0] as T | undefined) : (value as T | undefined);
}

async function main(): Promise<void> {
  let activeId = 'new-file';
  let visibleCommands: readonly PaletteCommand[] = COMMANDS;
  let filterUpdateCount = 0;
  let focusUpdateCount = 0;
  let executionCounter = 0;
  const auditTrail: string[] = [];
  const tracedCommands: string[] = [];

  const register = new ActionRegister<ToolbarActions, ToolbarResults>({
    name: 'InteractiveToolbar',
    actions: {
      focusItem: { lane: 'fast' },
      previewFilter: { lane: 'fast' },
      executeCommand: { lane: 'orchestrated', queue: 'serial', timeout: 2000 },
    },
  });

  // Scoped trace records ONLY executed commands — zero overhead on focus/filter bursts.
  const unsubscribeTrace = register.subscribeDispatchTrace(
    event => {
      tracedCommands.push(`${event.action}:${event.phase}:${event.status ?? 'open'}`);
    },
    { actions: ['executeCommand'] },
  );

  // Fast-lane view state handlers
  register.registerCommand('focusItem', payload => {
    activeId = payload.itemId;
    focusUpdateCount += 1;
  });

  register.registerCommand('previewFilter', payload => {
    const q = payload.query.trim().toLowerCase();
    visibleCommands = q.length === 0
      ? COMMANDS
      : COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(q));
    filterUpdateCount += 1;
  });

  // Orchestrated command execution pipeline
  register.registerGuard(
    'executeCommand',
    (payload, controller) => {
      const target = COMMANDS.find(item => item.id === payload.commandId);
      if (!target) {
        controller.abort(`unknown command: ${payload.commandId}`);
        return;
      }
      if (target.disabled) {
        controller.abort(`command disabled: ${payload.commandId}`);
      }
    },
    { priority: 200 },
  );

  register.registerGuard(
    'executeCommand',
    (payload, controller) => {
      const target = COMMANDS.find(item => item.id === payload.commandId);
      if (target?.locked && !payload.confirmed) {
        controller.abort(`command "${target.label}" requires confirmation`);
      }
    },
    { priority: 100 },
  );

  register.registerResult('executeCommand', payload => {
    executionCounter += 1;
    return {
      commandId: payload.commandId,
      ranAtIso: new Date().toISOString(),
      executionNumber: executionCounter,
    };
  });

  register.registerObserver<'executeCommand', ToolbarResults['executeCommand']>(
    'executeCommand',
    event => {
      const execNum = unwrapSingleResult(event.result)?.executionNumber;
      auditTrail.push(`completed:${event.payload.commandId}:#${execNum}`);
    },
    { when: 'success' },
  );

  // Synchronous roving tabindex controller for keyboard toolbar navigation
  const rovingFocus = createRovingFocusController({
    orientation: 'horizontal',
    loop: true,
    getItems: () => COMMANDS,
    getActiveId: () => activeId,
    onFocusChange(nextId) {
      void register.dispatch('focusItem', { itemId: nextId, source: 'keyboard' });
    },
  });

  // ---------------------------------------------------------------------------
  // 1. Keyboard navigation: disabled "format-doc" is skipped automatically
  // ---------------------------------------------------------------------------
  let preventedCount = 0;
  const preventDefault = () => {
    preventedCount += 1;
  };

  assert.equal(rovingFocus.getTabIndex('new-file'), 0);
  assert.equal(rovingFocus.getTabIndex('format-doc'), -1);

  const afterRight = rovingFocus.handleKeyDown(activeId, { key: 'ArrowRight', preventDefault });
  await Promise.resolve();
  assert.equal(afterRight, 'toggle-grid');
  assert.equal(activeId, 'toggle-grid');

  const afterEnd = rovingFocus.handleKeyDown(activeId, { key: 'End', preventDefault });
  await Promise.resolve();
  assert.equal(afterEnd, 'prod-deploy');

  const afterWrapRight = rovingFocus.handleKeyDown(activeId, { key: 'ArrowRight', preventDefault });
  await Promise.resolve();
  assert.equal(afterWrapRight, 'new-file');

  const afterHome = rovingFocus.handleKeyDown('split-pane', { key: 'Home', preventDefault });
  await Promise.resolve();
  assert.equal(afterHome, 'new-file');

  assert.equal(preventedCount, 4);
  assert.equal(focusUpdateCount, 4);

  // ---------------------------------------------------------------------------
  // 2. High-frequency live filter updates (2,000 keystrokes/filter ticks on fast lane)
  // ---------------------------------------------------------------------------
  const queries = ['v', 'vi', 'vie', 'view', 'view:', 'toggle', 'split', ''];
  for (let i = 0; i < 200; i++) {
    await register.dispatch('previewFilter', { query: queries[i % queries.length]! });
  }
  filterUpdateCount = 0;
  const traceBeforeFilter = tracedCommands.length;

  const filterIterations = 2_000;
  const tFilter0 = performance.now();
  for (let i = 0; i < filterIterations; i++) {
    await register.dispatch('previewFilter', { query: queries[i % queries.length]! });
  }
  const filterMs = performance.now() - tFilter0;

  // Set final query to "view" and verify narrowed command list
  await register.dispatch('previewFilter', { query: 'view' });
  assert.deepEqual(
    visibleCommands.map(c => c.id),
    ['toggle-grid', 'split-pane'],
  );
  assert.equal(filterUpdateCount, filterIterations + 1);
  assert.equal(tracedCommands.length - traceBeforeFilter, 0);

  const filterUsPerOp = (filterMs * 1_000) / filterIterations;

  // ---------------------------------------------------------------------------
  // 3. Guarded & audited orchestrated command execution
  // ---------------------------------------------------------------------------
  const okOutcome = await register.dispatchWithResult('executeCommand', {
    commandId: 'toggle-grid',
  });
  const okResult = unwrapSingleResult(okOutcome.result);
  assert.equal(okOutcome.outcome, 'completed');
  assert.equal(okResult?.commandId, 'toggle-grid');
  assert.equal(okResult?.executionNumber, 1);

  const rejectedOutcome = await register.dispatchWithResult('executeCommand', {
    commandId: 'prod-deploy',
    confirmed: false,
  });
  assert.equal(rejectedOutcome.aborted, true);
  assert.match(rejectedOutcome.abortReason ?? '', /requires confirmation/);

  const confirmedOutcome = await register.dispatchWithResult('executeCommand', {
    commandId: 'prod-deploy',
    confirmed: true,
  });
  const confirmedResult = unwrapSingleResult(confirmedOutcome.result);
  assert.equal(confirmedOutcome.outcome, 'completed');
  assert.equal(confirmedResult?.executionNumber, 2);
  assert.equal(auditTrail.length, 2);

  console.log('Interactive Toolbar Summary:', {
    rovingFocusSequence: [afterRight, afterEnd, afterWrapRight, afterHome],
    preventedKeyEvents: preventedCount,
    fastFilterUpdates: filterIterations,
    fastFilterMs: Number(filterMs.toFixed(2)),
    fastFilterUsPerOp: Number(filterUsPerOp.toFixed(3)),
    traceLeakDuringFilterAndFocus: tracedCommands.length - (executionCounter + 1) * 2,
    visibleViewCommands: visibleCommands.map(c => c.id),
    rejectedAbortReason: rejectedOutcome.abortReason,
    auditTrail,
    tracedEventCount: tracedCommands.length,
  });

  unsubscribeTrace();
  await register.destroyAsync();
}

main().catch(error => {
  console.error('Interactive toolbar demo failed:', error);
  process.exitCode = 1;
});
