/**
 * @fileoverview React Context Pattern Migration Validation Tests
 *
 * This test suite validates that common React Context patterns
 * can be successfully migrated to Context-Action framework.
 *
 * Tested patterns:
 * 1. Smart setters (function/value dual support)
 * 2. Cross-context communication
 * 3. localStorage persistence
 * 4. Nested state updates
 * 5. Cascading deletions
 * 6. Undo/Redo history
 * 7. ID remapping on delete
 */

import React, { useCallback, useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { createStoreContext } from '../../src/stores/patterns/declarative-store-pattern-v2';
import { createTimeTravelStoreContext } from '../../src/stores/patterns/time-travel-store-pattern';
import { useStoreValue } from '../../src/stores/hooks/useStoreValue';
import type { Store } from '../../src/stores/core/Store';

// Helper to wait for RAF updates
const waitForUpdate = async () => {
  await act(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
};

describe('React Context Pattern Migration Tests', () => {
  /**
   * Pattern 1: Smart Setters
   * React Context uses setTransform(actionOrValue) that accepts both functions and values
   */
  describe('Smart Setter Pattern', () => {
    interface Transform {
      zoom: number;
      pan: { x: number; y: number };
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    it('should support both value and function updates with smart setter pattern', async () => {
      const { Provider, useStore } = createStoreContext('Transform', {
        transform: { zoom: 1, pan: { x: 0, y: 0 } } as Transform
      });

      function TransformComponent() {
        const transformStore = useStore('transform');
        const transform = useStoreValue(transformStore);

        // Smart setter that mimics common setTransform pattern
        const setTransform = useCallback((
          actionOrValue: Transform | ((prev: Transform) => Partial<Transform>)
        ) => {
          transformStore.update(prev => {
            const updates = typeof actionOrValue === 'function'
              ? actionOrValue(prev)
              : actionOrValue;

            return {
              zoom: clamp(updates.zoom ?? prev.zoom, 0.02, 5),
              pan: {
                x: updates.pan?.x ?? prev.pan.x,
                y: updates.pan?.y ?? prev.pan.y,
              }
            };
          });
        }, [transformStore]);

        return (
          <div>
            <div data-testid="zoom">Zoom: {transform.zoom}</div>
            <div data-testid="pan">Pan: {transform.pan.x}, {transform.pan.y}</div>

            {/* Value-based update */}
            <button
              data-testid="set-value"
              onClick={() => setTransform({ zoom: 2, pan: { x: 100, y: 200 } })}
            >
              Set Value
            </button>

            {/* Function-based update */}
            <button
              data-testid="set-function"
              onClick={() => setTransform(prev => ({ zoom: prev.zoom + 0.5 }))}
            >
              Zoom In
            </button>

            {/* Test clamping (with value clamping) */}
            <button
              data-testid="set-extreme"
              onClick={() => setTransform({ zoom: 100, pan: { x: 0, y: 0 } })}
            >
              Extreme Zoom
            </button>
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <TransformComponent />
        </Provider>
      );

      expect(getByTestId('zoom')).toHaveTextContent('Zoom: 1');
      expect(getByTestId('pan')).toHaveTextContent('Pan: 0, 0');

      // Test value-based update
      fireEvent.click(getByTestId('set-value'));
      await waitForUpdate();
      expect(getByTestId('zoom')).toHaveTextContent('Zoom: 2');
      expect(getByTestId('pan')).toHaveTextContent('Pan: 100, 200');

      // Test function-based update
      fireEvent.click(getByTestId('set-function'));
      await waitForUpdate();
      expect(getByTestId('zoom')).toHaveTextContent('Zoom: 2.5');

      // Test clamping
      fireEvent.click(getByTestId('set-extreme'));
      await waitForUpdate();
      expect(getByTestId('zoom')).toHaveTextContent('Zoom: 5'); // Clamped to max
    });

    it('should support partial updates with default fallbacks', async () => {
      const { Provider, useStore } = createStoreContext('PartialUpdate', {
        settings: { theme: 'light', fontSize: 14, language: 'en' }
      });

      function SettingsComponent() {
        const settingsStore = useStore('settings');
        const settings = useStoreValue(settingsStore);

        // Partial update with fallback defaults pattern
        const updateSettings = useCallback((updates: Partial<typeof settings>) => {
          settingsStore.update(prev => ({
            theme: updates.theme ?? prev.theme,
            fontSize: updates.fontSize ?? prev.fontSize,
            language: updates.language ?? prev.language,
          }));
        }, [settingsStore]);

        return (
          <div>
            <div data-testid="theme">{settings.theme}</div>
            <div data-testid="fontSize">{settings.fontSize}</div>
            <button
              data-testid="update-partial"
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              Dark Mode
            </button>
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <SettingsComponent />
        </Provider>
      );

      expect(getByTestId('theme')).toHaveTextContent('light');
      expect(getByTestId('fontSize')).toHaveTextContent('14');

      // Partial update should preserve other fields
      fireEvent.click(getByTestId('update-partial'));
      await waitForUpdate();

      expect(getByTestId('theme')).toHaveTextContent('dark');
      expect(getByTestId('fontSize')).toHaveTextContent('14'); // Preserved
    });
  });

  /**
   * Pattern 2: Cross-Context Communication
   * common DiagramContext accesses useTransform, useSelect, useUndoRedo inside provider
   */
  describe('Cross-Context Communication Pattern', () => {
    interface Table {
      id: string;
      name: string;
      x: number;
      y: number;
      fields: Array<{ id: string; name: string; type: string }>;
    }

    interface HistoryEntry {
      action: 'ADD' | 'DELETE' | 'UPDATE';
      data: unknown;
    }

    it('should allow handlers to access multiple stores with cross-context pattern', async () => {
      // Multiple store contexts (separate domain contexts)
      const { Provider: DiagramProvider, useStore: useDiagramStore } = createStoreContext('Diagram', {
        tables: [] as Table[],
      });

      const { Provider: TransformProvider, useStore: useTransformStore } = createStoreContext('TransformCtx', {
        pan: { x: 50, y: 100 },
        zoom: 1,
      });

      const { Provider: UndoProvider, useStore: useUndoStore } = createStoreContext('Undo', {
        undoStack: [] as HistoryEntry[],
        redoStack: [] as HistoryEntry[],
      });

      const { Provider: SelectProvider, useStore: useSelectStore } = createStoreContext('Select', {
        selectedId: null as string | null,
      });

      // Handler component that accesses multiple stores (cross-context handler pattern)
      function DiagramHandlers({ children }: { children: React.ReactNode }) {
        const tablesStore = useDiagramStore('tables');
        const panStore = useTransformStore('pan');
        const undoStackStore = useUndoStore('undoStack');
        const redoStackStore = useUndoStore('redoStack');
        const selectStore = useSelectStore('selectedId');

        return (
          <>
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<{
                  onAddTable: () => void;
                  onDeleteTable: (id: string) => void;
                }>, {
                  onAddTable: () => {
                    const pan = panStore.getValue(); // Read from transform store
                    const newTable: Table = {
                      id: `table-${Date.now()}`,
                      name: 'New Table',
                      x: pan.x,
                      y: pan.y,
                      fields: [{ id: 'f1', name: 'id', type: 'INT' }]
                    };

                    tablesStore.update(prev => [...prev, newTable]);
                    undoStackStore.update(prev => [...prev, { action: 'ADD', data: newTable }]);
                    redoStackStore.setValue([]); // Clear redo on new action
                  },
                  onDeleteTable: (id: string) => {
                    const tables = tablesStore.getValue();
                    const deletedTable = tables.find(t => t.id === id);

                    tablesStore.update(prev => prev.filter(t => t.id !== id));

                    if (deletedTable) {
                      undoStackStore.update(prev => [...prev, { action: 'DELETE', data: deletedTable }]);
                    }

                    // Clear selection if deleted table was selected (cascading update)
                    const selectedId = selectStore.getValue();
                    if (selectedId === id) {
                      selectStore.setValue(null);
                    }
                  }
                });
              }
              return child;
            })}
          </>
        );
      }

      function DiagramUI({
        onAddTable,
        onDeleteTable
      }: {
        onAddTable?: () => void;
        onDeleteTable?: (id: string) => void;
      }) {
        const tablesStore = useDiagramStore('tables');
        const undoStackStore = useUndoStore('undoStack');
        const selectStore = useSelectStore('selectedId');

        const tables = useStoreValue(tablesStore);
        const undoStack = useStoreValue(undoStackStore);
        const selectedId = useStoreValue(selectStore);

        return (
          <div>
            <div data-testid="table-count">Tables: {tables.length}</div>
            <div data-testid="undo-count">Undo Stack: {undoStack.length}</div>
            <div data-testid="selected">Selected: {selectedId || 'none'}</div>

            {tables.map(table => (
              <div key={table.id} data-testid={`table-${table.id}`}>
                {table.name} at ({table.x}, {table.y})
                <button
                  data-testid={`select-${table.id}`}
                  onClick={() => selectStore.setValue(table.id)}
                >
                  Select
                </button>
                <button
                  data-testid={`delete-${table.id}`}
                  onClick={() => onDeleteTable?.(table.id)}
                >
                  Delete
                </button>
              </div>
            ))}

            <button data-testid="add-table" onClick={onAddTable}>
              Add Table
            </button>
          </div>
        );
      }

      const { getByTestId, queryByTestId } = render(
        <DiagramProvider>
          <TransformProvider>
            <UndoProvider>
              <SelectProvider>
                <DiagramHandlers>
                  <DiagramUI />
                </DiagramHandlers>
              </SelectProvider>
            </UndoProvider>
          </TransformProvider>
        </DiagramProvider>
      );

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 0');
      expect(getByTestId('undo-count')).toHaveTextContent('Undo Stack: 0');

      // Add table - should use transform position
      fireEvent.click(getByTestId('add-table'));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 1');
      expect(getByTestId('undo-count')).toHaveTextContent('Undo Stack: 1');

      // Verify table position matches transform pan
      const tableElement = document.querySelector('[data-testid^="table-table-"]');
      expect(tableElement).toHaveTextContent('at (50, 100)');

      // Get the table ID for further tests
      const tableId = tableElement?.getAttribute('data-testid')?.replace('table-', '');

      // Select the table
      fireEvent.click(getByTestId(`select-${tableId}`));
      await waitForUpdate();
      expect(getByTestId('selected')).toHaveTextContent(`Selected: ${tableId}`);

      // Delete should clear selection
      fireEvent.click(getByTestId(`delete-${tableId}`));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 0');
      expect(getByTestId('selected')).toHaveTextContent('Selected: none');
      expect(getByTestId('undo-count')).toHaveTextContent('Undo Stack: 2');
    });
  });

  /**
   * Pattern 3: localStorage Persistence
   * common SettingsContext persists to localStorage
   */
  describe('localStorage Persistence Pattern', () => {
    const STORAGE_KEY = 'test-settings';

    beforeEach(() => {
      localStorage.clear();
    });

    it('should persist store changes to localStorage', async () => {
      const { Provider, useStore } = createStoreContext('PersistentSettings', {
        theme: 'light',
        fontSize: 14,
      });

      // Persistence component (persistence pattern with useEffect)
      function SettingsPersistence() {
        const themeStore = useStore('theme');
        const fontSizeStore = useStore('fontSize');

        useEffect(() => {
          // Load from storage on mount
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const { theme, fontSize } = JSON.parse(saved);
            themeStore.setValue(theme);
            fontSizeStore.setValue(fontSize);
          }

          // Save on changes via subscription
          const unsubTheme = themeStore.subscribe(() => {
            const current = {
              theme: themeStore.getValue(),
              fontSize: fontSizeStore.getValue()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          });

          const unsubFontSize = fontSizeStore.subscribe(() => {
            const current = {
              theme: themeStore.getValue(),
              fontSize: fontSizeStore.getValue()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          });

          return () => {
            unsubTheme();
            unsubFontSize();
          };
        }, [themeStore, fontSizeStore]);

        return null;
      }

      function SettingsUI() {
        const themeStore = useStore('theme');
        const theme = useStoreValue(themeStore);

        return (
          <div>
            <div data-testid="theme">{theme}</div>
            <button
              data-testid="toggle-theme"
              onClick={() => themeStore.setValue(theme === 'light' ? 'dark' : 'light')}
            >
              Toggle
            </button>
          </div>
        );
      }

      const { getByTestId, unmount } = render(
        <Provider>
          <SettingsPersistence />
          <SettingsUI />
        </Provider>
      );

      expect(getByTestId('theme')).toHaveTextContent('light');

      // Change theme
      fireEvent.click(getByTestId('toggle-theme'));
      await waitForUpdate();

      expect(getByTestId('theme')).toHaveTextContent('dark');

      // Verify localStorage was updated
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.theme).toBe('dark');

      // Unmount and remount to test persistence loading
      unmount();

      const { getByTestId: getByTestId2 } = render(
        <Provider>
          <SettingsPersistence />
          <SettingsUI />
        </Provider>
      );

      // Should load persisted value
      await waitForUpdate();
      expect(getByTestId2('theme')).toHaveTextContent('dark');
    });
  });

  /**
   * Pattern 4: Nested State Updates
   * common updateField pattern: table.fields[].property
   */
  describe('Nested State Update Pattern', () => {
    interface Field {
      id: string;
      name: string;
      type: string;
      notNull: boolean;
    }

    interface Table {
      id: string;
      name: string;
      fields: Field[];
    }

    it('should update deeply nested state with nested field updates', async () => {
      const { Provider, useStore } = createStoreContext('NestedDiagram', {
        tables: [
          {
            id: 't1',
            name: 'users',
            fields: [
              { id: 'f1', name: 'id', type: 'INT', notNull: true },
              { id: 'f2', name: 'name', type: 'VARCHAR', notNull: false },
            ]
          }
        ] as Table[]
      });

      function TableEditor() {
        const tablesStore = useStore('tables');
        const tables = useStoreValue(tablesStore);

        // common updateField pattern
        const updateField = useCallback((
          tableId: string,
          fieldId: string,
          updates: Partial<Field>
        ) => {
          tablesStore.update(draft => {
            const table = draft.find(t => t.id === tableId);
            if (table) {
              const field = table.fields.find(f => f.id === fieldId);
              if (field) {
                Object.assign(field, updates);
              }
            }
          });
        }, [tablesStore]);

        // common deleteField pattern
        const deleteField = useCallback((tableId: string, fieldId: string) => {
          tablesStore.update(draft => {
            const table = draft.find(t => t.id === tableId);
            if (table) {
              table.fields = table.fields.filter(f => f.id !== fieldId);
            }
          });
        }, [tablesStore]);

        // common addField pattern
        const addField = useCallback((tableId: string, field: Field) => {
          tablesStore.update(draft => {
            const table = draft.find(t => t.id === tableId);
            if (table) {
              table.fields.push(field);
            }
          });
        }, [tablesStore]);

        return (
          <div>
            {tables.map(table => (
              <div key={table.id}>
                <div data-testid={`table-${table.id}`}>{table.name}</div>
                {table.fields.map(field => (
                  <div key={field.id} data-testid={`field-${field.id}`}>
                    {field.name}: {field.type} {field.notNull ? 'NOT NULL' : 'NULL'}
                    <button
                      data-testid={`update-${field.id}`}
                      onClick={() => updateField(table.id, field.id, { notNull: !field.notNull })}
                    >
                      Toggle NotNull
                    </button>
                    <button
                      data-testid={`delete-${field.id}`}
                      onClick={() => deleteField(table.id, field.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  data-testid={`add-field-${table.id}`}
                  onClick={() => addField(table.id, {
                    id: `f${Date.now()}`,
                    name: 'new_field',
                    type: 'TEXT',
                    notNull: false
                  })}
                >
                  Add Field
                </button>
              </div>
            ))}
            <div data-testid="field-count">
              Fields: {tables[0]?.fields.length || 0}
            </div>
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <TableEditor />
        </Provider>
      );

      expect(getByTestId('field-f1')).toHaveTextContent('id: INT NOT NULL');
      expect(getByTestId('field-f2')).toHaveTextContent('name: VARCHAR NULL');
      expect(getByTestId('field-count')).toHaveTextContent('Fields: 2');

      // Test nested update
      fireEvent.click(getByTestId('update-f2'));
      await waitForUpdate();
      expect(getByTestId('field-f2')).toHaveTextContent('name: VARCHAR NOT NULL');

      // Test nested delete
      fireEvent.click(getByTestId('delete-f2'));
      await waitForUpdate();
      expect(getByTestId('field-count')).toHaveTextContent('Fields: 1');

      // Test nested add
      fireEvent.click(getByTestId('add-field-t1'));
      await waitForUpdate();
      expect(getByTestId('field-count')).toHaveTextContent('Fields: 2');
    });
  });

  /**
   * Pattern 5: Cascading Deletions
   * common deleteTable removes related relationships
   */
  describe('Cascading Deletion Pattern', () => {
    interface Relationship {
      id: string;
      startTableId: string;
      endTableId: string;
      name: string;
    }

    it('should cascade deletions with cascading deletions', async () => {
      const { Provider, useStore } = createStoreContext('CascadeDiagram', {
        tables: [
          { id: 't1', name: 'users' },
          { id: 't2', name: 'posts' },
          { id: 't3', name: 'comments' },
        ],
        relationships: [
          { id: 'r1', startTableId: 't1', endTableId: 't2', name: 'user_posts' },
          { id: 'r2', startTableId: 't2', endTableId: 't3', name: 'post_comments' },
          { id: 'r3', startTableId: 't1', endTableId: 't3', name: 'user_comments' },
        ] as Relationship[],
        selectedTableId: 't1' as string | null,
      });

      function CascadeEditor() {
        const tablesStore = useStore('tables');
        const relationshipsStore = useStore('relationships');
        const selectedStore = useStore('selectedTableId');

        const tables = useStoreValue(tablesStore);
        const relationships = useStoreValue(relationshipsStore);
        const selectedTableId = useStoreValue(selectedStore);

        // common cascading delete pattern
        const deleteTable = useCallback((id: string) => {
          // Delete related relationships first (cascading update)
          relationshipsStore.update(rels =>
            rels.filter(r => r.startTableId !== id && r.endTableId !== id)
          );

          // Delete the table
          tablesStore.update(tables => tables.filter(t => t.id !== id));

          // Clear selection if deleted (cascading update)
          if (selectedTableId === id) {
            selectedStore.setValue(null);
          }
        }, [tablesStore, relationshipsStore, selectedStore, selectedTableId]);

        return (
          <div>
            <div data-testid="table-count">Tables: {tables.length}</div>
            <div data-testid="relationship-count">Relationships: {relationships.length}</div>
            <div data-testid="selected">Selected: {selectedTableId || 'none'}</div>

            {tables.map(table => (
              <button
                key={table.id}
                data-testid={`delete-${table.id}`}
                onClick={() => deleteTable(table.id)}
              >
                Delete {table.name}
              </button>
            ))}
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <CascadeEditor />
        </Provider>
      );

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 3');
      expect(getByTestId('relationship-count')).toHaveTextContent('Relationships: 3');
      expect(getByTestId('selected')).toHaveTextContent('Selected: t1');

      // Delete t1 - should cascade to relationships and clear selection
      fireEvent.click(getByTestId('delete-t1'));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 2');
      // r1 (t1->t2) and r3 (t1->t3) should be deleted, only r2 remains
      expect(getByTestId('relationship-count')).toHaveTextContent('Relationships: 1');
      expect(getByTestId('selected')).toHaveTextContent('Selected: none');
    });
  });

  /**
   * Pattern 6: Undo/Redo History
   * common UndoRedoContext pattern
   */
  describe('Undo/Redo History Pattern', () => {
    it('should support undo/redo using TimeTravelStore', async () => {
      const { Provider, useStore, useTimeTravelControls } = createTimeTravelStoreContext('TimeTravelDiagram', {
        tables: [{ id: 't1', name: 'original' }],
      }, { defaultMaxHistory: 50 });

      function TimeTravelEditor() {
        const tablesStore = useStore('tables');
        const tables = useStoreValue(tablesStore);
        const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls('tables');

        const addTable = () => {
          tablesStore.update(prev => [
            ...prev,
            { id: `t${Date.now()}`, name: `table_${prev.length + 1}` }
          ]);
        };

        const renameFirst = () => {
          tablesStore.update(draft => {
            if (draft[0]) {
              draft[0].name = 'renamed';
            }
          });
        };

        return (
          <div>
            <div data-testid="table-count">Tables: {tables.length}</div>
            <div data-testid="first-name">First: {tables[0]?.name || 'none'}</div>
            <div data-testid="history">History: {position + 1}/{historyLength}</div>
            <div data-testid="can-undo">Can Undo: {canUndo ? 'yes' : 'no'}</div>
            <div data-testid="can-redo">Can Redo: {canRedo ? 'yes' : 'no'}</div>

            <button data-testid="add" onClick={addTable}>Add Table</button>
            <button data-testid="rename" onClick={renameFirst}>Rename First</button>
            <button data-testid="undo" onClick={() => undo()} disabled={!canUndo}>Undo</button>
            <button data-testid="redo" onClick={() => redo()} disabled={!canRedo}>Redo</button>
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <TimeTravelEditor />
        </Provider>
      );

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 1');
      expect(getByTestId('first-name')).toHaveTextContent('First: original');
      expect(getByTestId('can-undo')).toHaveTextContent('Can Undo: no');

      // Add a table
      fireEvent.click(getByTestId('add'));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 2');
      expect(getByTestId('can-undo')).toHaveTextContent('Can Undo: yes');

      // Rename first table
      fireEvent.click(getByTestId('rename'));
      await waitForUpdate();

      expect(getByTestId('first-name')).toHaveTextContent('First: renamed');

      // Undo rename
      fireEvent.click(getByTestId('undo'));
      await waitForUpdate();

      expect(getByTestId('first-name')).toHaveTextContent('First: original');
      expect(getByTestId('table-count')).toHaveTextContent('Tables: 2');
      expect(getByTestId('can-redo')).toHaveTextContent('Can Redo: yes');

      // Undo add
      fireEvent.click(getByTestId('undo'));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 1');

      // Redo add
      fireEvent.click(getByTestId('redo'));
      await waitForUpdate();

      expect(getByTestId('table-count')).toHaveTextContent('Tables: 2');
    });
  });

  /**
   * Pattern 7: ID Remapping on Delete
   * common pattern of reassigning IDs after deletion
   */
  describe('ID Remapping Pattern', () => {
    it('should remap IDs on deletion with ID remapping', async () => {
      const { Provider, useStore } = createStoreContext('Areas', {
        areas: [
          { id: 0, name: 'Area 0' },
          { id: 1, name: 'Area 1' },
          { id: 2, name: 'Area 2' },
        ]
      });

      function AreaEditor() {
        const areasStore = useStore('areas');
        const areas = useStoreValue(areasStore);

        // common deleteArea pattern with ID remapping
        const deleteArea = useCallback((id: number) => {
          areasStore.update(prev =>
            prev
              .filter(e => e.id !== id)
              .map((e, i) => ({ ...e, id: i })) // Remap IDs
          );
        }, [areasStore]);

        return (
          <div>
            <div data-testid="areas">
              {areas.map(a => `${a.id}:${a.name}`).join(', ')}
            </div>
            {areas.map(area => (
              <button
                key={area.id}
                data-testid={`delete-${area.id}`}
                onClick={() => deleteArea(area.id)}
              >
                Delete {area.name}
              </button>
            ))}
          </div>
        );
      }

      const { getByTestId } = render(
        <Provider>
          <AreaEditor />
        </Provider>
      );

      expect(getByTestId('areas')).toHaveTextContent('0:Area 0, 1:Area 1, 2:Area 2');

      // Delete middle area (id: 1)
      fireEvent.click(getByTestId('delete-1'));
      await waitForUpdate();

      // IDs should be remapped: Area 0 stays 0, Area 2 becomes 1
      expect(getByTestId('areas')).toHaveTextContent('0:Area 0, 1:Area 2');
    });
  });
});
