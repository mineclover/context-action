<script setup lang="ts">
/** @evidenceExclude Tier 3 native-element host template. */
import type { CounterProps } from '../shared/counter-contract.js';
import { counterConfig } from '../shared/counter-contract.js';
import { createElementDirective } from './element-directive.js';

defineProps<{ snapshot: CounterProps }>();
const vElement = createElementDirective(counterConfig);
</script>

<template>
  <host-binding-probe v-element="snapshot" />
</template>
