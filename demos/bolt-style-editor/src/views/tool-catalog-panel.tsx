export type ToolCatalogFilter = 'all' | 'read' | 'workspace' | 'preview';

export type ToolCatalogAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
};

export type ToolCatalogDefinition = {
  name: string;
  description?: string;
  annotations?: ToolCatalogAnnotations;
  inputSchema: unknown;
  outputSchema?: unknown;
};

const toolCatalogFilterOptions: Array<{
  value: ToolCatalogFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'read', label: 'Read' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'preview', label: 'Preview' },
];

export function toolPolicySummary(
  annotations?: ToolCatalogAnnotations
): string {
  if (annotations?.readOnlyHint === true) return 'allow · read-only';
  return 'approval · local direct allow';
}

export type ToolCatalogPanelProps = {
  toolNames: readonly string[];
  visibleToolNames: readonly string[];
  selectedToolName: string;
  selectedToolDefinition?: ToolCatalogDefinition;
  toolFilter: string;
  toolCatalogFilter: ToolCatalogFilter;
  toolCatalogCounts: Record<ToolCatalogFilter, number>;
  isStorageReady: boolean;
  running: boolean;
  toolArgumentsText: string;
  toolArgumentsError: string | null;
  copyFeedback: string | null;
  getToolDefinition: (name: string) => ToolCatalogDefinition | undefined;
  onCopyToolsList: () => void;
  onDownloadToolsList: () => void;
  onToolFilterChange: (value: string) => void;
  onClearToolFilter: () => void;
  onToolCatalogFilterChange: (value: ToolCatalogFilter) => void;
  onSelectTool: (name: string) => void;
  onCopyDefinition: () => void;
  onDownloadDefinition: () => void;
  onCopyCall: () => void;
  onDownloadCall: () => void;
  onRunSelectedTool: () => void;
  onToolArgumentsChange: (value: string) => void;
  onResetToolArguments: () => void;
};

export function ToolCatalogPanel({
  toolNames,
  visibleToolNames,
  selectedToolName,
  selectedToolDefinition,
  toolFilter,
  toolCatalogFilter,
  toolCatalogCounts,
  isStorageReady,
  running,
  toolArgumentsText,
  toolArgumentsError,
  copyFeedback,
  getToolDefinition,
  onCopyToolsList,
  onDownloadToolsList,
  onToolFilterChange,
  onClearToolFilter,
  onToolCatalogFilterChange,
  onSelectTool,
  onCopyDefinition,
  onDownloadDefinition,
  onCopyCall,
  onDownloadCall,
  onRunSelectedTool,
  onToolArgumentsChange,
  onResetToolArguments,
}: ToolCatalogPanelProps) {
  return (
    <>
      <div className="sidebar-section-heading">
        <span>Tools</span>
        <span className="tool-heading-actions">
          <button
            aria-label="Copy tools/list result"
            className="tool-list-copy-button"
            disabled={!isStorageReady || running}
            onClick={() => onCopyToolsList()}
            type="button"
          >
            Copy list
          </button>
          <button
            aria-label="Download tools/list result"
            className="tool-list-copy-button"
            disabled={!isStorageReady || running}
            onClick={onDownloadToolsList}
            type="button"
          >
            Download list
          </button>
          <span className="count-badge">
            {visibleToolNames.length === toolNames.length
              ? toolNames.length
              : `${visibleToolNames.length}/${toolNames.length}`}
          </span>
        </span>
      </div>
      <label className="tool-filter">
        <span className="sr-only">Filter tools</span>
        <input
          aria-label="Filter tools"
          disabled={!isStorageReady}
          onChange={(event) => onToolFilterChange(event.target.value)}
          placeholder="Filter tools…"
          type="search"
          value={toolFilter}
        />
        {toolFilter ? (
          <button
            aria-label="Clear tool filter"
            onClick={() => onClearToolFilter()}
            type="button"
          >
            ×
          </button>
        ) : null}
      </label>
      <div aria-label="Tool capability filter" className="tool-scope-tabs">
        {toolCatalogFilterOptions.map((option) => (
          <button
            aria-pressed={toolCatalogFilter === option.value}
            className={`tool-scope-tab ${toolCatalogFilter === option.value ? 'tool-scope-tab-active' : ''}`}
            disabled={!isStorageReady}
            key={option.value}
            onClick={() => onToolCatalogFilterChange(option.value)}
            type="button"
          >
            {option.label}
            <span>{toolCatalogCounts[option.value]}</span>
          </button>
        ))}
      </div>
      <div className="tool-palette">
        {visibleToolNames.length ? (
          visibleToolNames.map((name) => {
            const definition = getToolDefinition(name);
            return (
              <button
                aria-pressed={name === selectedToolName}
                className={`tool-row ${name === selectedToolName ? 'tool-row-selected' : ''}`}
                data-tool-name={name}
                disabled={!isStorageReady || running}
                key={name}
                onClick={() => onSelectTool(name)}
                type="button"
              >
                <span className="tool-row-name">
                  <span className="tool-glyph">
                    {name.startsWith('preview') ? '◈' : '◇'}
                  </span>
                  <span>{name}</span>
                </span>
                <span className="tool-policy-label">
                  {toolPolicySummary(definition?.annotations)}
                </span>
              </button>
            );
          })
        ) : (
          <div className="tool-filter-empty">No matching tools</div>
        )}
      </div>
      {selectedToolDefinition ? (
        <section
          aria-label="Selected tool definition"
          className="tool-inspector"
        >
          <div className="tool-inspector-heading">
            <span>Definition</span>
            <span className="tool-inspector-format">MCP</span>
          </div>
          <strong>{selectedToolDefinition.name}</strong>
          <p>{selectedToolDefinition.description}</p>
          <div className="tool-policy-summary">
            Model/MCP: {toolPolicySummary(selectedToolDefinition.annotations)}
          </div>
          <div className="tool-annotations">
            {Object.entries(selectedToolDefinition.annotations ?? {})
              .filter(([, value]) => Boolean(value))
              .map(([key]) => (
                <span key={key}>{key}</span>
              ))}
          </div>
          <div className="tool-inspector-actions">
            <button
              disabled={!isStorageReady || running}
              onClick={() => onCopyDefinition()}
              type="button"
            >
              Copy definition
            </button>
            <button
              aria-label="Download tool definition"
              disabled={!isStorageReady || running}
              onClick={onDownloadDefinition}
              type="button"
            >
              Download definition
            </button>
            <button
              disabled={!isStorageReady || running}
              onClick={() => onCopyCall()}
              type="button"
            >
              Copy tools/call
            </button>
            <button
              aria-label="Download tools/call request"
              disabled={!isStorageReady || running}
              onClick={onDownloadCall}
              type="button"
            >
              Download tools/call
            </button>
          </div>
          {copyFeedback ? (
            <div
              aria-live="polite"
              className="tool-copy-feedback"
              role="status"
            >
              {copyFeedback}
            </div>
          ) : null}
          <button
            className="tool-run-button"
            disabled={!isStorageReady || running || !selectedToolName}
            onClick={() => onRunSelectedTool()}
            type="button"
          >
            {selectedToolDefinition.annotations?.destructiveHint
              ? 'Run destructive sample'
              : 'Run with arguments'}
          </button>
          <div className="tool-schema-label">Arguments (JSON)</div>
          <textarea
            aria-label={`Arguments for ${selectedToolDefinition.name}`}
            className="tool-arguments-input"
            disabled={!isStorageReady || running}
            onChange={(event) => onToolArgumentsChange(event.target.value)}
            spellCheck={false}
            value={toolArgumentsText}
          />
          {toolArgumentsError ? (
            <div className="tool-arguments-error" role="alert">
              {toolArgumentsError}
            </div>
          ) : null}
          <button
            className="tool-reset-button"
            disabled={!isStorageReady || running}
            onClick={onResetToolArguments}
            type="button"
          >
            Reset sample arguments
          </button>
          <div className="tool-schema-label">Input schema</div>
          <pre>
            {JSON.stringify(selectedToolDefinition.inputSchema, null, 2)}
          </pre>
          {selectedToolDefinition.outputSchema ? (
            <>
              <div className="tool-schema-label">Output schema</div>
              <pre>
                {JSON.stringify(selectedToolDefinition.outputSchema, null, 2)}
              </pre>
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
