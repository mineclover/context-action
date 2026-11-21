/** @evidenceExclude Tier 3 volatile presentation view for Headless-First Symmetric DI showcase */
import { type FormEvent, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
  Input,
} from '@/components/ui';
import { useHeadlessDiActions } from '../actions/useHeadlessDiActions';
import { useHeadlessDiData } from '../hooks/useHeadlessDiData';

const SYMMETRIC_DI_SNIPPET = `<ActionProvider register={runtime.register} ownership="shared">
  <StoreProvider stores={{ session: runtime.sessionStore }} ownership="shared">
    <TimeTravelStoreProvider manager={runtime.documentManager} ownership="shared">
      <MountedWorkspaceView />
    </TimeTravelStoreProvider>
  </StoreProvider>
</ActionProvider>`;

export function HeadlessDiView() {
  const { session, viewLocal, documentState, timeTravel, summaryText } =
    useHeadlessDiData();
  const {
    updateTitle,
    appendBullet,
    publishSnapshot,
    resetWorkspace,
    setViewFilterTag,
    undoDocument,
    redoDocument,
  } = useHeadlessDiActions();

  const [titleInput, setTitleInput] = useState(documentState.title);
  const [bulletInput, setBulletInput] = useState('');

  const handleTitleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await updateTitle(titleInput);
  };

  const handleBulletSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await appendBullet(bulletInput);
    if (bulletInput.trim()) {
      setBulletInput('');
    }
  };

  return (
    <div className="space-y-6" data-testid="mounted-react-boundary">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Mounted React View Boundary</CardTitle>
              <CardDescription>
                Injected via ActionProvider(register) + StoreProvider(stores) +
                TimeTravelStoreProvider(manager) with
                ownership=&quot;shared&quot;.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" data-testid="react-summary-badge">
                {summaryText}
              </Badge>
              <Badge variant="outline" data-testid="react-last-source">
                Last source: {session.lastSource}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {session.lastError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="react-validation-error"
            >
              {session.lastError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={handleTitleSubmit} className="space-y-2">
              <Input
                label="Document Title (Dispatches to shared ActionRegister)"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                data-testid="title-input"
              />
              <Button type="submit" size="sm" data-testid="apply-title-button">
                Update Shared Title
              </Button>
            </form>

            <form onSubmit={handleBulletSubmit} className="space-y-2">
              <Input
                label="Append Shared Note"
                placeholder="Enter note bullet..."
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                data-testid="bullet-input"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  data-testid="append-bullet-button"
                >
                  Append Note (React)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void publishSnapshot()}
                  data-testid="publish-button"
                >
                  Publish Snapshot
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void resetWorkspace()}
                  data-testid="reset-workspace-button"
                >
                  Reset Shared State
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Shared Document &amp; TimeTravel History
                </h3>
                <p
                  className="text-xs text-slate-600"
                  data-testid="react-document-title"
                >
                  Title: {documentState.title} • Revision: {session.revision}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs text-slate-700"
                  data-testid="react-history-meta"
                >
                  pos {timeTravel.position} / {timeTravel.historyLength - 1}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!timeTravel.canUndo}
                  onClick={() => undoDocument()}
                  data-testid="react-undo-button"
                >
                  Undo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!timeTravel.canRedo}
                  onClick={() => redoDocument()}
                  data-testid="react-redo-button"
                >
                  Redo
                </Button>
              </div>
            </div>

            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
              {documentState.bullets.map((bullet, index) => (
                <li key={`${index}-${bullet}`}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-amber-950">
                  Provider-Owned Sibling Store (Uninjected key: viewLocal)
                </h4>
                <p className="text-xs text-amber-800">
                  Because StoreProvider injects only &quot;session&quot;, the
                  uninjected &quot;viewLocal&quot; key stays owned by the
                  Provider and resets when the view unmounts.
                </p>
              </div>
              <Badge variant="warning" data-testid="view-local-filter-badge">
                filterTag: {viewLocal.filterTag}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'react', 'headless'] as const).map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  size="sm"
                  variant={viewLocal.filterTag === tag ? 'primary' : 'outline'}
                  onClick={() => setViewFilterTag(tag)}
                  data-testid={`filter-tag-${tag}`}
                >
                  {tag}
                </Button>
              ))}
              {viewLocal.draftHeadline && (
                <span
                  className="text-xs font-mono text-amber-900"
                  data-testid="react-observer-note"
                >
                  {viewLocal.draftHeadline}
                </span>
              )}
            </div>
          </div>

          <CodeBlock size="sm">{SYMMETRIC_DI_SNIPPET}</CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}
