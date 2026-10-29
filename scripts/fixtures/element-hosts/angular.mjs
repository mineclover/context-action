import '@angular/compiler';
import assert from 'node:assert/strict';
import { ElementRef, PLATFORM_ID, SimpleChange, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HostComponent } from './compiled/angular/host.component.js';
import { ElementBindingDirective } from './compiled/angular/element-binding.directive.js';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

export async function mountHost(container) {
  TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostComponent);
  container.append(fixture.nativeElement);
  fixture.detectChanges();
  return {
    element: fixture.nativeElement.querySelector('host-binding-probe'),
    async update(input) { fixture.componentRef.setInput('snapshot', input); fixture.detectChanges(); },
    async unmount() { fixture.destroy(); TestBed.resetTestingModule(); },
  };
}

export function verifyAdapterContracts() {
  TestBed.configureTestingModule({ providers: [
    provideZonelessChangeDetection(),
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: ElementRef, useValue: { get nativeElement() { throw new Error('Server binding touched native DOM'); } } },
  ] });
  const server = TestBed.runInInjectionContext(() => new ElementBindingDirective());
  server.caElementBinding = { properties: ['input'], events: { changed: 'count-request' } };
  server.caElementInput = { input: { count: 3 }, changed() { throw new Error('Server subscribed a client handler'); } };
  server.ngAfterViewInit();
  server.ngOnChanges({ caElementInput: new SimpleChange({}, server.caElementInput, false) });
  TestBed.resetTestingModule();

  const element = document.createElement('host-binding-probe');
  TestBed.configureTestingModule({ providers: [
    provideZonelessChangeDetection(),
    { provide: PLATFORM_ID, useValue: 'browser' }, { provide: ElementRef, useValue: { nativeElement: element } },
  ] });
  const client = TestBed.runInInjectionContext(() => new ElementBindingDirective());
  let calls = 0;
  const config = { properties: ['input'], events: { changed: 'count-request' } };
  client.caElementBinding = config;
  client.caElementInput = { input: { count: 2 }, changed() { calls++; } };
  client.ngAfterViewInit();
  element.request();
  assert.equal(calls, 1);
  assert.throws(() => client.ngOnChanges({ caElementBinding: new SimpleChange(config, {}, false) }), /fixed after mount/);
  TestBed.resetTestingModule(); // DestroyRef, not manual directive disposal
  element.request();
  assert.equal(calls, 1);

  class EventfulProbe extends HTMLElement {
    other = 'untouched';
    set input(_value) { this.dispatchEvent(new Event('count-request')); }
  }
  customElements.define('angular-reentrant-binding-probe', EventfulProbe);
  const reentrant = new EventfulProbe();
  TestBed.configureTestingModule({ providers: [
    provideZonelessChangeDetection(),
    { provide: PLATFORM_ID, useValue: 'browser' }, { provide: ElementRef, useValue: { nativeElement: reentrant } },
  ] });
  const reentrantClient = TestBed.runInInjectionContext(() => new ElementBindingDirective());
  reentrantClient.caElementBinding = { properties: ['input', 'other'], events: { changed: 'count-request' } };
  reentrantClient.caElementInput = { input: 1, other: 'must not apply', changed() { TestBed.resetTestingModule(); } };
  reentrantClient.ngAfterViewInit();
  assert.equal(reentrant.other, 'untouched', 'DestroyRef must see the binding during synchronous initialization events');
  console.log('Angular fixed config, server DOM guard and DestroyRef cleanup passed');
}
