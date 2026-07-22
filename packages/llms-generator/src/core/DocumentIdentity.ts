import path from 'node:path';

export interface CanonicalDocumentIdentity {
  language: string;
  category: string;
  documentId: string;
  relativeSourcePath: string;
}

const DOCUMENT_ID_SEPARATOR = '--';

export function normalizeDocumentPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function encodeDocumentIdSegment(segment: string): string {
  // Preserve the existing category--filename convention while escaping the
  // separator itself so the mapping remains reversible for every path segment.
  return segment
    .replace(/%/g, '%25')
    .replace(/--/g, '%2D%2D');
}

function decodeDocumentIdSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function getCanonicalDocumentIdentity(
  relativeSourcePath: string,
): CanonicalDocumentIdentity | null {
  const normalizedInput = normalizeDocumentPath(relativeSourcePath);
  if (path.posix.isAbsolute(normalizedInput)) {
    return null;
  }

  const normalizedPath = path.posix.normalize(normalizedInput).replace(/^\.\//, '');
  if (
    normalizedPath === '..'
    || normalizedPath.startsWith('../')
    || normalizedPath.includes('/../')
  ) {
    return null;
  }

  const pathParts = normalizedPath.split('/').filter(Boolean);
  if (pathParts.length < 3) {
    return null;
  }

  const language = pathParts[0];
  const category = pathParts[1];
  const sourceSegments = pathParts.slice(1);
  const fileName = sourceSegments[sourceSegments.length - 1];

  if (!language || !category || !fileName || !/\.md$/i.test(fileName)) {
    return null;
  }

  sourceSegments[sourceSegments.length - 1] = fileName.replace(/\.md$/i, '');
  if (sourceSegments.some((segment) => segment.length === 0)) {
    return null;
  }

  return {
    language,
    category,
    documentId: sourceSegments.map(encodeDocumentIdSegment).join(DOCUMENT_ID_SEPARATOR),
    relativeSourcePath: pathParts.join('/'),
  };
}

export function getCanonicalDocumentKey(
  language: string,
  documentId: string,
): string {
  return `${language}\u0000${documentId}`;
}

export function getDocumentIdCategory(documentId: string): string | null {
  const firstSegment = documentId.split(DOCUMENT_ID_SEPARATOR)[0];
  if (!firstSegment || !documentId.includes(DOCUMENT_ID_SEPARATOR)) {
    return null;
  }

  return decodeDocumentIdSegment(firstSegment);
}

export function getRelativeSourcePathFromDocumentId(
  language: string,
  documentId: string,
): string | null {
  const encodedSegments = documentId.split(DOCUMENT_ID_SEPARATOR);
  if (encodedSegments.length < 2 || encodedSegments.some((segment) => !segment)) {
    return null;
  }

  const sourceSegments = encodedSegments.map(decodeDocumentIdSegment);
  const fileName = sourceSegments[sourceSegments.length - 1];
  if (!fileName) {
    return null;
  }

  sourceSegments[sourceSegments.length - 1] = `${fileName}.md`;
  return [language, ...sourceSegments].join('/');
}
