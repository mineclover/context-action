<script lang="ts">
  /** @evidenceExclude Tier 3 native-element host template. */
  import type { Readable } from 'svelte/store';
  import type { CounterProps } from '../shared/counter-contract.js';
  import { counterConfig } from '../shared/counter-contract.js';
  import { createElementAction } from './element-action.js';

  let { source }: { source: Readable<CounterProps> } = $props();
  const bind = createElementAction(counterConfig);
</script>

<host-binding-probe use:bind={$source}></host-binding-probe>
