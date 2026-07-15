export type LiveEditorPatchOccurrence = 'first' | 'all';

export type LiveEditorTextPatch = {
  source: string;
  replacements: number;
};

export function applyLiveEditorTextPatch(
  source: string,
  search: string,
  replace: string,
  occurrence: LiveEditorPatchOccurrence
): LiveEditorTextPatch {
  if (occurrence === 'all') {
    const parts = source.split(search);
    const replacements = parts.length - 1;
    if (!replacements) {
      throw new Error('Patch search text was not found in the document.');
    }
    return { source: parts.join(replace), replacements };
  }

  const index = source.indexOf(search);
  if (index < 0) {
    throw new Error('Patch search text was not found in the document.');
  }
  return {
    source: `${source.slice(0, index)}${replace}${source.slice(index + search.length)}`,
    replacements: 1,
  };
}
