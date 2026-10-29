/** Real client runtimes: no TestBed, JSDOM, or lifecycle-hook mocks. */
import '@angular/compiler';
import { createApplication } from '@angular/platform-browser';
import { createComponent, provideZonelessChangeDetection } from '@angular/core';
import { createApp, h, nextTick, shallowRef } from 'vue';
import { flushSync, mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import VueHost from './compiled/vue/Host.js';
import SvelteHost from './compiled/svelte/Host.js';
import { HostComponent } from './compiled/angular/host.component.js';

export const hostFactories = {
  async vue(container) {
    const snapshot = shallowRef({});
    const app = createApp({ setup: () => () => h(VueHost, { snapshot: snapshot.value }) });
    app.mount(container);
    await nextTick();
    return {
      element: container.querySelector('host-binding-probe'),
      async update(input) { snapshot.value = input; await nextTick(); },
      async unmount() { app.unmount(); await nextTick(); },
    };
  },
  async svelte(container) {
    const source = writable({});
    let component;
    flushSync(() => { component = mount(SvelteHost, { target: container, props: { source } }); });
    return {
      element: container.querySelector('host-binding-probe'),
      async update(input) { flushSync(() => source.set(input)); },
      async unmount() { await unmount(component); },
    };
  },
  async angular(container) {
    const app = await createApplication({ providers: [provideZonelessChangeDetection()] });
    const root = document.createElement('binding-host-example');
    container.append(root);
    const component = createComponent(HostComponent, { environmentInjector: app.injector, hostElement: root });
    app.attachView(component.hostView);
    component.changeDetectorRef.detectChanges();
    return {
      element: root.querySelector('host-binding-probe'),
      async update(input) { component.setInput('snapshot', input); component.changeDetectorRef.detectChanges(); },
      async unmount() {
        app.detachView(component.hostView);
        component.destroy();
        app.destroy();
        root.remove();
      },
    };
  },
};
