import { InputContractError } from './errors.js';

export const MAX_GLOB_PATTERN_CHARS = 4096;
export const MAX_GLOB_PATTERN_SET_COMPLEXITY = 16_384;
export const MAX_GLOB_MATCH_VALUE_CHARS = 4096;

type GlobToken =
  | { type: 'literal'; value: string }
  | { type: 'segment-star' }
  | { type: 'globstar' }
  | { type: 'directory-globstar-start' }
  | { type: 'directory-globstar-body' };

export function globPatternIssue(pattern: unknown): string | undefined {
  if (typeof pattern !== 'string') return 'glob pattern must be a string';
  let characters = 0;
  for (const _character of pattern) {
    characters += 1;
    if (characters > MAX_GLOB_PATTERN_CHARS) {
      return `glob pattern exceeds ${MAX_GLOB_PATTERN_CHARS} character limit`;
    }
  }
  return undefined;
}

export function globPatternSetIssue(patterns: unknown): string | undefined {
  if (!Array.isArray(patterns)) return 'glob patterns must be an array';
  let complexity = 0;
  for (const [index, pattern] of patterns.entries()) {
    if (typeof pattern !== 'string') {
      return 'glob patterns must contain only strings';
    }
    const issue = globPatternIssue(pattern);
    if (issue) return `glob patterns[${index}] ${issue}`;
    let characters = 0;
    for (const _character of pattern) characters += 1;
    complexity += Math.max(1, characters);
    if (complexity > MAX_GLOB_PATTERN_SET_COMPLEXITY) {
      return `glob pattern set exceeds ${MAX_GLOB_PATTERN_SET_COMPLEXITY} character complexity limit`;
    }
  }
  return undefined;
}

function globMatchValueIssue(value: unknown): string | undefined {
  if (typeof value !== 'string') return 'glob match value must be a string';
  let characters = 0;
  for (const _character of value) {
    characters += 1;
    if (characters > MAX_GLOB_MATCH_VALUE_CHARS) {
      return `glob match value exceeds ${MAX_GLOB_MATCH_VALUE_CHARS} character limit`;
    }
  }
  return undefined;
}

function tokenize(pattern: string): GlobToken[] {
  const issue = globPatternIssue(pattern);
  if (issue) throw new InputContractError(issue);

  const characters = [...pattern];
  const tokens: GlobToken[] = [];
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (character === '*' && characters[index + 1] === '*') {
      if (characters[index + 2] === '/') {
        tokens.push(
          { type: 'directory-globstar-start' },
          { type: 'directory-globstar-body' },
        );
        index += 2;
      } else {
        tokens.push({ type: 'globstar' });
        index += 1;
      }
    } else if (character === '*') {
      tokens.push({ type: 'segment-star' });
    } else {
      tokens.push({ type: 'literal', value: character ?? '' });
    }
  }
  return tokens;
}

function epsilonClosure(tokens: GlobToken[], initial: Set<number>): Set<number> {
  const states = new Set(initial);
  const pending = [...states];
  while (pending.length > 0) {
    const state = pending.pop();
    if (state === undefined) continue;
    const token = tokens[state];
    const next = token?.type === 'segment-star' || token?.type === 'globstar'
      ? state + 1
      : token?.type === 'directory-globstar-start'
        ? state + 2
        : undefined;
    if (next !== undefined && !states.has(next)) {
      states.add(next);
      pending.push(next);
    }
  }
  return states;
}

function matchesTokens(value: string, tokens: GlobToken[]): boolean {
  let states = epsilonClosure(tokens, new Set([0]));
  for (const character of value) {
    const nextStates = new Set<number>();
    for (const state of states) {
      const token = tokens[state];
      if (!token) continue;
      if (token.type === 'literal' && token.value === character) {
        nextStates.add(state + 1);
      } else if (token.type === 'segment-star' && character !== '/') {
        nextStates.add(state);
      } else if (token.type === 'globstar') {
        nextStates.add(state);
      } else if (token.type === 'directory-globstar-start') {
        nextStates.add(state + 1);
        if (character === '/') nextStates.add(state + 2);
      } else if (token.type === 'directory-globstar-body') {
        nextStates.add(state);
        if (character === '/') nextStates.add(state + 1);
      }
    }
    states = epsilonClosure(tokens, nextStates);
    if (states.size === 0) return false;
  }
  return states.has(tokens.length);
}

export function compileGlobPatterns(patterns: string[]): (value: string) => boolean {
  const issue = globPatternSetIssue(patterns);
  if (issue) throw new InputContractError(issue);
  const tokenSets = patterns.map(tokenize);
  return (value) => {
    const issue = globMatchValueIssue(value);
    if (issue) throw new InputContractError(issue);
    return tokenSets.some((tokens) => matchesTokens(value, tokens));
  };
}

export function matchesAny(value: string, patterns: string[]): boolean {
  return compileGlobPatterns(patterns)(value);
}
