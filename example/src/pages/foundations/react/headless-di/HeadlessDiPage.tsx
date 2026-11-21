import { useState, useSyncExternalStore } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useRegisterSourceFile } from '@/hooks/useRegisterSourceFile';
import { HeadlessDiProviders } from './handlers/HeadlessDiHandlerRegistry';
import {
  createHeadlessWorkspace,
  type HeadlessWorkspaceRuntime,
} from './runtime/createHeadlessWorkspace';
import { HeadlessDiView } from './views/HeadlessDiView';

export default function HeadlessDiPage() {
  useRegisterSourceFile(
    'pages/foundations/react/headless-di/HeadlessDiPage.tsx',
    {
      name: 'HeadlessDiPage',
      description:
        'Headless-First Symmetric DI showcase wiring pure-TS ActionRegister, Store, and TimeTravelStoreManager.',
      tags: ['foundations', 'react', 'headless', 'dependency-injection'],
      priority: 10,
    }
  );
  useRegisterSourceFile(
    'pages/foundations/react/headless-di/runtime/createHeadlessWorkspace.ts',
    {
      name: 'createHeadlessWorkspace',
      description:
        'Pure TypeScript domain factory assembling ActionRegister, Store, and TimeTravelStoreManager outside React.',
      tags: ['headless', 'runtime', 'core'],
      priority: 9,
    }
  );
  useRegisterSourceFile(
    'pages/foundations/react/headless-di/handlers/HeadlessDiHandlerRegistry.tsx',
    {
      name: 'HeadlessDiHandlerRegistry',
      description:
        'Symmetric DI Provider boundary attaching a React observer onto an externally owned ActionRegister.',
      tags: ['handlers', 'provider', 'ownership'],
      priority: 8,
    }
  );

  const [runtime, setRuntime] = useState<HeadlessWorkspaceRuntime>(() =>
    createHeadlessWorkspace()
  );
  const [isViewMounted, setIsViewMounted] = useState(true);
  const [headlessCounter, setHeadlessCounter] = useState(1);

  const summary = useSyncExternalStore(
    runtime.subscribeSummary,
    runtime.getSummary,
    runtime.getSummary
  );

  const handleDispatchOutsideReact = async () => {
    const nextNumber = headlessCounter;
    setHeadlessCounter((prev) => prev + 1);
    await runtime.register.dispatch('appendBullet', {
      text: `Headless tick #${nextNumber}`,
      source: 'headless',
    });
  };

  const handleHeadlessUndo = () => {
    runtime.documentStore.undo();
  };

  const handleHeadlessRedo = () => {
    runtime.documentStore.redo();
  };

  const handleRecreateRuntime = () => {
    runtime.dispose();
    setHeadlessCounter(1);
    setRuntime(createHeadlessWorkspace());
  };

  return (
    <PageLayout
      title="Headless-First Symmetric DI"
      description="Assemble ActionRegister, Store, and TimeTravelStoreManager in pure TypeScript outside React, then inject them with ownership='shared' so domain state and undo/redo history survive React view unmounts."
      category="react"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Outside-React Domain Control Bar</CardTitle>
                <CardDescription>
                  Runs directly against pure-TS runtime instances even while the
                  React Provider boundary below is unmounted.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={isViewMounted ? 'success' : 'warning'}
                  data-testid="mount-status-badge"
                >
                  View: {isViewMounted ? 'Mounted' : 'Unmounted'}
                </Badge>
                <Badge variant="outline" data-testid="handler-count-badge">
                  appendBullet handlers: {summary.appendHandlerCount}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={isViewMounted ? 'outline' : 'primary'}
                onClick={() => setIsViewMounted((prev) => !prev)}
                data-testid="toggle-view-mount-button"
              >
                {isViewMounted ? 'Unmount React View' : 'Remount React View'}
              </Button>
              <Button
                type="button"
                onClick={() => void handleDispatchOutsideReact()}
                data-testid="headless-append-button"
              >
                Dispatch Headless Note
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!summary.canUndo}
                onClick={handleHeadlessUndo}
                data-testid="headless-undo-button"
              >
                Headless Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!summary.canRedo}
                onClick={handleHeadlessRedo}
                data-testid="headless-redo-button"
              >
                Headless Redo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRecreateRuntime}
                data-testid="recreate-runtime-button"
              >
                Recreate Runtime
              </Button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-slate-100 font-mono text-xs space-y-1">
              <div data-testid="headless-summary-readout">
                summary: {summary.summaryText}
              </div>
              <div data-testid="headless-history-readout">
                revision: {summary.revision} | history: pos {summary.position} /{' '}
                {summary.historyLength - 1} | lastSource: {summary.lastSource}
              </div>
            </div>
          </CardContent>
        </Card>

        {isViewMounted ? (
          <HeadlessDiProviders runtime={runtime}>
            <HeadlessDiView />
          </HeadlessDiProviders>
        ) : (
          <Card data-testid="unmounted-placeholder">
            <CardContent className="py-8 text-center text-sm text-slate-600">
              React Provider boundary is unmounted. Dispatch headless actions
              above, then remount to verify shared state and undo history
              survived.
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
