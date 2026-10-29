import { flushSync, mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import Host from './compiled/svelte/Host.js';

export async function mountHost(container) {
  const source = writable({});
  let component;
  flushSync(() => { component = mount(Host, { target: container, props: { source } }); });
  return {
    element: container.querySelector('host-binding-probe'),
    async update(input) { flushSync(() => source.set(input)); },
    async unmount() { await unmount(component); },
  };
}
