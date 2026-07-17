import { useEffect, useRef, useState } from 'react';
import {
  captureWorkspaceVersion,
  type WorkspaceVersion,
} from '../version-diff';
import type { WorkspaceSnapshot } from '../workspace';

const MAX_VISIBLE_VERSIONS = 40;

/** Captures observable workspace revisions for the demo's version feedback UI. */
export function useWorkspaceVersionHistory(snapshot: WorkspaceSnapshot): {
  versions: readonly WorkspaceVersion[];
} {
  const versionsRef = useRef<WorkspaceVersion[]>([]);
  const [versions, setVersions] = useState<readonly WorkspaceVersion[]>([]);

  useEffect(() => {
    if (snapshot.storageMode === 'loading') return;
    if (versionsRef.current.at(-1)?.revision === snapshot.revision) return;
    const previousVersion = versionsRef.current.at(-1);
    const nextVersion = captureWorkspaceVersion(snapshot, previousVersion);
    const nextVersions = [...versionsRef.current, nextVersion].slice(
      -MAX_VISIBLE_VERSIONS
    );
    versionsRef.current = nextVersions;
    setVersions(nextVersions);
  }, [snapshot]);

  return { versions };
}
