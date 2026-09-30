import { defineLayerPanel, mountLayerPanel } from './layer-panel/index.js';

const items = [
  { id: 'one', name: 'One' },
  { id: 'two', name: 'Two' },
] as const;

const pending = document.querySelector('pre-layer-panel') as HTMLElement & {
  items: typeof items;
  selectedId: string | null;
};
pending.items = items;
pending.selectedId = 'one';
const Panel = defineLayerPanel('pre-layer-panel');
const customPanel = pending as unknown as InstanceType<typeof Panel>;
const requestIds: string[] = [];
customPanel.addEventListener('selection-request', event => {
  requestIds.push((event as CustomEvent<{ id: string }>).detail.id);
});

const templateHost = document.querySelector<HTMLElement>('#template-host');
const template = document.querySelector<HTMLTemplateElement>('#panel-template');
if (!templateHost || !template) throw new Error('Layer Panel browser fixture is incomplete');
const templatePanel = mountLayerPanel(templateHost, template, { items, selectedId: 'one' });
const templateRequestIds: string[] = [];
templateHost.addEventListener('selection-request', event => {
  templateRequestIds.push((event as CustomEvent<{ id: string }>).detail.id);
});

Object.assign(window, {
  layerPanelContract: {
    customPanel,
    templatePanel,
    requestIds,
    templateRequestIds,
    reconnect() {
      customPanel.remove();
      document.body.append(customPanel);
    },
  },
});
document.querySelector('#status')?.setAttribute('data-ready', 'true');
