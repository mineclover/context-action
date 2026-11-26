export interface HeadlessSessionState {
  revision: number;
  publishedTitle: string | null;
  lastSource: 'headless' | 'react' | 'reset';
  lastError: string | null;
}

export interface ViewLocalState {
  filterTag: 'all' | 'react' | 'headless';
  draftHeadline: string;
}

export interface WorkspaceDocumentState {
  title: string;
  bullets: string[];
}

export type HeadlessWorkspaceActions = {
  updateTitle: { title: string; source: 'react' | 'headless' };
  appendBullet: { text: string; source: 'react' | 'headless' };
  publishSnapshot: { source: 'react' | 'headless' };
  resetWorkspace: void;
};

export type HeadlessViewActions = {
  setViewFilterTag: { filterTag: ViewLocalState['filterTag'] };
};

export interface WorkspaceValidationResult {
  valid: boolean;
  normalized: string;
  reason: string | null;
}

export function createInitialSessionState(): HeadlessSessionState {
  return {
    revision: 0,
    publishedTitle: null,
    lastSource: 'reset',
    lastError: null,
  };
}

export function createInitialViewLocalState(): ViewLocalState {
  return {
    filterTag: 'all',
    draftHeadline: '',
  };
}

export function createInitialDocumentState(): WorkspaceDocumentState {
  return {
    title: 'Symmetric Headless DI Workspace',
    bullets: ['Bootstrapped outside React'],
  };
}

export function validateDocumentTitle(
  rawTitle: string
): WorkspaceValidationResult {
  const normalized = rawTitle.trim();
  if (!normalized) {
    return {
      valid: false,
      normalized,
      reason: 'Title cannot be blank.',
    };
  }
  if (normalized.length > 80) {
    return {
      valid: false,
      normalized,
      reason: 'Title must be 80 characters or fewer.',
    };
  }
  return {
    valid: true,
    normalized,
    reason: null,
  };
}

export function validateBulletText(rawText: string): WorkspaceValidationResult {
  const normalized = rawText.trim();
  if (!normalized) {
    return {
      valid: false,
      normalized,
      reason: 'Note bullet cannot be blank.',
    };
  }
  if (normalized.length > 120) {
    return {
      valid: false,
      normalized,
      reason: 'Note bullet must be 120 characters or fewer.',
    };
  }
  return {
    valid: true,
    normalized,
    reason: null,
  };
}

export function formatWorkspaceSummary(
  session: HeadlessSessionState,
  doc: WorkspaceDocumentState
): string {
  const status = session.publishedTitle
    ? `Published "${session.publishedTitle}"`
    : 'Draft only';
  return `${doc.title} • ${doc.bullets.length} note(s) • ${status}`;
}
