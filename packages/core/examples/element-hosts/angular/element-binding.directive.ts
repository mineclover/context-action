/** @evidenceExclude Tier 3 Angular lifecycle adapter; no domain handlers. */
import {
  Directive, DestroyRef, ElementRef, Input, PLATFORM_ID, inject,
  type AfterViewInit, type OnChanges, type SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { ElementBinding, ElementBindingConfig } from '@context-action/core/element';
import { connectBinding } from '../shared/connect-binding.js';

/** AoT-compatible reference directive; config is fixed for the lifetime of its node. */
@Directive({ selector: '[caElementBinding]', standalone: true })
export class ElementBindingDirective<Props extends object> implements AfterViewInit, OnChanges {
  @Input({ required: true }) caElementBinding!: ElementBindingConfig<Props>;
  @Input({ required: true }) caElementInput!: Props;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private binding: ElementBinding<Props> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.binding?.dispose();
      this.binding = null;
    });
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    try {
      connectBinding(this.element.nativeElement, this.caElementBinding, this.caElementInput,
        { assignmentErrors: 'throw' }, binding => { this.binding = binding; });
    } catch (error) {
      this.binding = null;
      throw error;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.binding) return;
    if (changes.caElementBinding) {
      throw new Error('Element binding configuration is fixed after mount; remount the host to change it');
    }
    this.binding.update(this.caElementInput);
  }
}
