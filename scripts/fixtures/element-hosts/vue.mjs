import { createApp, h, nextTick, shallowRef } from 'vue';
import Host from './compiled/vue/Host.js';

export async function mountHost(container) {
  const snapshot = shallowRef({});
  const app = createApp({
    setup: () => () => h(Host, { snapshot: snapshot.value }),
  });
  app.mount(container);
  await nextTick();
  return {
    element: container.querySelector('host-binding-probe'),
    async update(input) { snapshot.value = input; await nextTick(); },
    async unmount() { app.unmount(); await nextTick(); },
  };
}
