import { toToolListRequest } from '@context-action/react';
import { useCallback, useMemo } from 'react';
import type { BoltStyleRegistry } from '../bolt-style-tool-context';
import type {
  ToolCatalogDefinition,
  ToolCatalogFilter,
} from '../views/tool-catalog-panel';

export type ToolCatalogModelOptions = {
  registry: BoltStyleRegistry;
  selectedToolName: string;
  toolFilter: string;
  toolCatalogFilter: ToolCatalogFilter;
};

/**
 * Reads the canonical tool catalog and exposes the filtered view model used by
 * the studio shell. The composition root receives catalog data, not registry
 * management calls.
 */
export function useToolCatalogModel({
  registry,
  selectedToolName,
  toolFilter,
  toolCatalogFilter,
}: ToolCatalogModelOptions) {
  const toolNames = useMemo(
    () => registry.getToolNames().map(String),
    [registry]
  );
  const getToolDefinition = useCallback(
    (name: string): ToolCatalogDefinition | undefined =>
      registry.getToolDefinition(name),
    [registry]
  );
  const toolsList = useMemo(
    () => registry.listTools(toToolListRequest()),
    [registry]
  );
  const toolCatalogCounts = useMemo(() => {
    const counts: Record<ToolCatalogFilter, number> = {
      all: toolNames.length,
      read: 0,
      workspace: 0,
      preview: 0,
    };
    for (const name of toolNames) {
      if (getToolDefinition(name)?.annotations?.readOnlyHint === true) {
        counts.read += 1;
      }
      if (name.startsWith('workspace.')) counts.workspace += 1;
      if (name.startsWith('preview.')) counts.preview += 1;
    }
    return counts;
  }, [getToolDefinition, toolNames]);
  const visibleToolNames = useMemo(() => {
    const query = toolFilter.trim().toLowerCase();
    return toolNames.filter((name) => {
      const definition = getToolDefinition(name);
      const matchesCatalog =
        toolCatalogFilter === 'all' ||
        (toolCatalogFilter === 'read' &&
          definition?.annotations?.readOnlyHint === true) ||
        (toolCatalogFilter === 'workspace' && name.startsWith('workspace.')) ||
        (toolCatalogFilter === 'preview' && name.startsWith('preview.'));
      return matchesCatalog && (!query || name.toLowerCase().includes(query));
    });
  }, [getToolDefinition, toolCatalogFilter, toolFilter, toolNames]);
  const selectedToolDefinition = selectedToolName
    ? getToolDefinition(selectedToolName)
    : undefined;

  return {
    getToolDefinition,
    selectedToolDefinition,
    toolCatalogCounts,
    toolNames,
    toolsList,
    visibleToolNames,
  };
}
