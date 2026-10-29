/** @evidenceExclude Tier 3 native-element host template. */
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { counterConfig, type CounterProps } from '../shared/counter-contract.js';
import { ElementBindingDirective } from './element-binding.directive.js';

@Component({
  selector: 'binding-host-example', standalone: true,
  imports: [ElementBindingDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<host-binding-probe [caElementBinding]="config" [caElementInput]="snapshot" />',
})
export class HostComponent {
  @Input({ required: true }) snapshot: CounterProps = {};
  readonly config = counterConfig;
}
