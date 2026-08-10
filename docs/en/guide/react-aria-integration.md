# React Aria Integration Boundary

Context-Action integrates with React Aria at the domain boundary. It is not a
replacement for React Stately's component-local interaction state.

The runnable reference is available in the example application at
`/integrations/react-aria-reference`. It uses `react-aria-components` for a
sortable, multi-select table and a calendar, then uses Context-Action actions
and stores for the product-facing decisions those components emit.

## Ownership model

| Concern | Owner | Why |
| --- | --- | --- |
| Keyboard navigation, focus movement, typeahead, collection traversal | React Aria / React Stately | These behaviors depend on the component's accessibility state contract. |
| Calendar month navigation and cell focus | React Aria / React Stately | Keep the high-frequency interaction loop local and synchronous. |
| Selected work items, persisted sort, selected review date | Context-Action Store | These are application-level values that other views or handlers can consume. |
| Scheduling, authorization, API work, audit trail | Context-Action Action handlers | These are domain workflows and may be asynchronous, guarded, or observed. |

## Table boundary

Pass Context-Action's recorded selection and sort values to the component as
controlled props. Convert React Aria callbacks into semantic actions; do not
reimplement `SelectionManager`, row focus, or collection construction.

```tsx
<Table
  selectionMode="multiple"
  selectedKeys={new Set(selectedKeys)}
  onSelectionChange={(keys) => {
    const selected = keys === 'all'
      ? allRowIds
      : [...keys].map(String);
    void dispatch('tableSelectionChanged', { keys: selected });
  }}
  sortDescriptor={sort}
  onSortChange={({ column, direction }) => {
    void dispatch('tableSortChanged', {
      column: column as SortColumn,
      direction,
    });
  }}
/>
```

Keep a row's focus and keyboard behavior under React Aria control. An action
handler may persist the selection, fetch details, or update another context,
but must not introduce an await boundary before the interaction component has
handled its own event.

## Calendar boundary

Store a serializable ISO date rather than a React Aria date object. Convert at
the component edge, keeping visible-month navigation and grid focus local.

```tsx
<Calendar
  value={selectedDate ? parseDate(selectedDate) : null}
  onChange={(value) => {
    void dispatch('calendarDateCommitted', {
      value: value?.toString() ?? null,
    });
  }}
/>
```

This lets action handlers validate a schedule, update a server, or emit an
audit event without coupling the domain store to calendar implementation types.

## Verification checklist

Before applying this pattern to another component, verify:

1. Arrow-key navigation, range/multi-selection, and focus-visible behavior.
2. Calendar month movement and selection with keyboard and pointer input.
3. Overlay focus restoration for any related popover or dialog.
4. React 18/19 SSR and hydration if the controlled values are server supplied.
5. That action handlers do not delay the component's high-frequency interaction
   loop; send semantic commits to handlers rather than driving roving focus
   through the action pipeline.

For deeper React Aria state contracts, use the official React Aria and React
Stately documentation. Context-Action owns the application workflow around the
component, not its accessibility state machine.
