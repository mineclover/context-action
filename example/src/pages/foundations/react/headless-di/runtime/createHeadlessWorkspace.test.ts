// @vitest-environment node
import { StoreManager } from '@context-action/react';
import { isTimeTravelStore } from '@context-action/react/time-travel';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createHeadlessWorkspace,
  type HeadlessWorkspaceRuntime,
} from './createHeadlessWorkspace';

describe('createHeadlessWorkspace (pure TypeScript without React)', () => {
  let workspace: HeadlessWorkspaceRuntime | null = null;

  afterEach(() => {
    workspace?.dispose();
    workspace = null;
  });

  it('orchestrates guards, Store mutations, and TimeTravel undo/redo without React', async () => {
    workspace = createHeadlessWorkspace();

    expect(workspace.documentStore.getValue().bullets).toHaveLength(1);
    expect(
      isTimeTravelStore(workspace.documentManager.getStore('document'))
    ).toBe(true);

    // Invalid blank title is blocked by headless guard
    await workspace.register.dispatch('updateTitle', {
      title: '   ',
      source: 'headless',
    });
    expect(workspace.sessionStore.getValue().lastError).toBe(
      'Title cannot be blank.'
    );
    expect(workspace.sessionStore.getValue().revision).toBe(0);

    // Valid title + note mutations advance TimeTravel history
    await workspace.register.dispatch('updateTitle', {
      title: 'Domain Orchestration Spec',
      source: 'headless',
    });
    await workspace.register.dispatch('appendBullet', {
      text: 'Verified under vitest node environment',
      source: 'headless',
    });

    expect(workspace.documentStore.getValue().title).toBe(
      'Domain Orchestration Spec'
    );
    expect(workspace.documentStore.getValue().bullets).toHaveLength(2);
    expect(workspace.sessionStore.getValue().revision).toBe(2);
    expect(workspace.documentStore.canUndo()).toBe(true);

    // TimeTravel undo/redo works cleanly outside React
    workspace.documentStore.undo();
    expect(workspace.documentStore.getValue().bullets).toHaveLength(1);
    expect(workspace.documentStore.canRedo()).toBe(true);

    workspace.documentStore.redo();
    expect(workspace.documentStore.getValue().bullets).toHaveLength(2);

    // Publish and reset baseline
    await workspace.register.dispatch('publishSnapshot', {
      source: 'headless',
    });
    expect(workspace.sessionStore.getValue().publishedTitle).toBe(
      'Domain Orchestration Spec'
    );

    await workspace.register.dispatch('resetWorkspace');
    expect(workspace.documentStore.getValue().bullets).toHaveLength(1);
    expect(workspace.sessionStore.getValue().revision).toBe(0);
    expect(workspace.sessionStore.getValue().publishedTitle).toBeNull();
  });

  it('supports StoreManager shared ownership cleanly in headless Node code', () => {
    workspace = createHeadlessWorkspace();
    const externalManager = new StoreManager(
      'HeadlessSessionManagerTest',
      {
        session: { initialValue: workspace.sessionStore.getValue() },
      },
      {
        externalStores: { session: workspace.sessionStore },
        externalOwnership: 'shared',
      }
    );

    expect(externalManager.getStore('session')).toBe(workspace.sessionStore);
    externalManager.dispose();
    // Shared ownership keeps injected store usable after wrapper disposal
    workspace.sessionStore.update((draft) => {
      draft.revision = 9;
      return undefined;
    });
    expect(workspace.sessionStore.getValue().revision).toBe(9);
  });
});
