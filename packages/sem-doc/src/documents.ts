import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import * as path from 'node:path';

import type { SemEntity } from './sem-json';

export const DOCUMENT_INDEX_SCHEMA = 'sem-documents.v2' as const;

export interface DocumentReference {
  readonly symbol: string;
  readonly documentPath: string;
  readonly line: number;
}

export interface DocumentDefinition {
  readonly symbol: string;
  readonly documentPath: string;
  readonly line: number;
  readonly canonical: true;
  readonly entity?: DocumentEntityBinding;
}

export interface DocumentEntityBinding {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly file: string;
}

export interface DocumentRecord {
  readonly documentPath: string;
  readonly title?: string;
  readonly definitions: readonly string[];
  readonly references: readonly string[];
}

export interface DocumentLookup {
  readonly symbol: string;
  readonly definitions: readonly DocumentDefinition[];
  readonly references: readonly DocumentReference[];
  readonly backlinks: readonly string[];
}

export interface DocumentEntityLookup {
  readonly status: 'resolved' | 'unresolved';
  readonly entity: SemEntity;
  readonly symbol?: string;
  readonly definitions: readonly DocumentDefinition[];
  readonly references: readonly DocumentReference[];
  readonly backlinks: readonly string[];
  readonly candidates: readonly DocumentDefinition[];
}

export interface DocumentIndexData {
  readonly schemaVersion: typeof DOCUMENT_INDEX_SCHEMA;
  readonly root: string;
  readonly files: number;
  readonly documents: readonly DocumentRecord[];
  readonly definitions: readonly DocumentDefinition[];
  readonly references: readonly DocumentReference[];
  readonly missingReferences: readonly DocumentReference[];
}

export class DocumentIndexError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DocumentIndexError';
  }
}

export class DocumentIndex implements DocumentIndexData {
  public readonly schemaVersion = DOCUMENT_INDEX_SCHEMA;
  public readonly files: number;
  public readonly missingReferences: readonly DocumentReference[];

  public constructor(
    public readonly root: string,
    public readonly documents: readonly DocumentRecord[],
    public readonly definitions: readonly DocumentDefinition[],
    public readonly references: readonly DocumentReference[]
  ) {
    validateUniqueDefinitions(definitions);
    this.files = documents.length;
    const defined = new Set(definitions.map((definition) => symbolKey(definition.symbol)));
    this.missingReferences = references.filter(
      (reference) => !defined.has(symbolKey(reference.symbol))
    );
  }

  public lookup(symbol: string): DocumentLookup {
    const key = symbolKey(symbol);
    const definitions = this.definitions.filter(
      (definition) => symbolKey(definition.symbol) === key
    );
    const references = this.references.filter((reference) => symbolKey(reference.symbol) === key);
    const backlinks = [...new Set(references.map((reference) => reference.documentPath))];
    return {
      symbol,
      definitions,
      references,
      backlinks,
    };
  }

  public lookupEntity(entity: SemEntity): DocumentEntityLookup {
    const matches = this.definitions.filter(
      (definition) => definition.entity !== undefined && entityMatches(definition.entity, entity)
    );
    if (matches.length > 1) {
      throw new DocumentIndexError(
        `Ambiguous document binding for sem entity ${entity.id ?? entity.name}: ${matches
          .map((definition) => definition.documentPath)
          .join(', ')}`
      );
    }
    if (matches.length === 0) {
      return {
        status: 'unresolved',
        entity,
        definitions: [],
        references: [],
        backlinks: [],
        candidates: this.definitions.filter(
          (definition) => definition.entity?.name === entity.name
        ),
      };
    }
    const definition = matches[0];
    const lookup = this.lookup(definition.symbol);
    return {
      status: 'resolved',
      entity,
      symbol: definition.symbol,
      definitions: [definition],
      references: lookup.references,
      backlinks: lookup.backlinks,
      candidates: [],
    };
  }

  public toJSON(): DocumentIndexData {
    return {
      schemaVersion: this.schemaVersion,
      root: this.root,
      files: this.files,
      documents: this.documents,
      definitions: this.definitions,
      references: this.references,
      missingReferences: this.missingReferences,
    };
  }
}

export interface DocumentIndexOptions {
  readonly extensions?: readonly string[];
  readonly ignoredDirectories?: readonly string[];
}

export function indexDocuments(rootDir: string, options: DocumentIndexOptions = {}): DocumentIndex {
  const root = path.resolve(rootDir);
  const extensions = new Set(
    (options.extensions ?? ['.md', '.mdx']).map((extension) => extension.toLowerCase())
  );
  const ignored = new Set(
    options.ignoredDirectories ?? ['.git', 'node_modules', 'dist', '.test-dist', '.reports']
  );
  if (!existsSync(root)) return new DocumentIndex(root, [], [], []);
  const paths = collectDocumentPaths(root, extensions, ignored);
  const parsed = paths.map((documentPath) => parseDocument(root, documentPath));
  const definitions = parsed.flatMap((document) => document.definitions);
  const references = parsed.flatMap((document) => document.references);
  return new DocumentIndex(
    root,
    parsed.map((document) => document.record),
    definitions,
    references
  );
}

interface ParsedDocument {
  readonly record: DocumentRecord;
  readonly definitions: readonly DocumentDefinition[];
  readonly references: readonly DocumentReference[];
}

function collectDocumentPaths(
  root: string,
  extensions: ReadonlySet<string>,
  ignored: ReadonlySet<string>
): readonly string[] {
  const result: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) visit(path.join(directory, entry.name));
      } else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
        result.push(path.join(directory, entry.name));
      }
    }
  };
  if (statSync(root).isDirectory()) visit(root);
  else if (extensions.has(path.extname(root))) result.push(root);
  return result.sort();
}

function parseDocument(root: string, absolutePath: string): ParsedDocument {
  const content = readFileSync(absolutePath, 'utf8');
  const searchableContent = maskFencedCode(content);
  const documentPath = toDocumentPath(root, absolutePath);
  const definitions: DocumentDefinition[] = [];
  const references: DocumentReference[] = [];
  const definitionNames: string[] = [];
  const referenceNames: string[] = [];
  const entity = parseEntityBinding(content, documentPath);
  const headingMatches = [...searchableContent.matchAll(/^(#{1,6})[ \t]+(.+?)\s*$/gmu)];
  for (const match of headingMatches) {
    const level = match[1]?.length ?? 0;
    const heading = match[2] ?? '';
    if (level !== 1) continue;
    for (const symbol of extractSymbols(heading)) {
      const definition = {
        symbol,
        documentPath,
        line: lineNumberAt(content, match.index ?? 0),
        canonical: true,
        ...(entity === undefined ? {} : { entity }),
      } as const;
      definitions.push(definition);
      definitionNames.push(symbol);
    }
  }
  if (entity !== undefined && definitions.length !== 1) {
    throw new DocumentIndexError(
      `${documentPath} must contain exactly one H1 [[Checkpoint]] when sem entity metadata is declared`
    );
  }
  for (const match of searchableContent.matchAll(/\[\[([^\]]+)\]\]/gu)) {
    const symbol = parseSymbol(match[1] ?? '');
    if (symbol.length === 0) continue;
    references.push({
      symbol,
      documentPath,
      line: lineNumberAt(content, match.index ?? 0),
    });
    referenceNames.push(symbol);
  }
  const title = headingMatches.find((match) => match[1]?.length === 1)?.[2]?.trim();
  return {
    record: {
      documentPath,
      title,
      definitions: definitionNames,
      references: referenceNames,
    },
    definitions,
    references,
  };
}

function maskFencedCode(content: string): string {
  let fenceCharacter: '`' | '~' | undefined;
  let fenceLength = 0;
  return content
    .split(/(?<=\n)/u)
    .map((line) => {
      const marker = /^[ \t]*(`{3,}|~{3,})/u.exec(line)?.[1];
      if (fenceCharacter === undefined && marker !== undefined) {
        fenceCharacter = marker[0] as '`' | '~';
        fenceLength = marker.length;
        return maskLine(line);
      }
      if (
        fenceCharacter !== undefined &&
        marker !== undefined &&
        marker[0] === fenceCharacter &&
        marker.length >= fenceLength
      ) {
        fenceCharacter = undefined;
        fenceLength = 0;
        return maskLine(line);
      }
      return fenceCharacter === undefined ? line : maskLine(line);
    })
    .join('');
}

function maskLine(line: string): string {
  return line.replace(/[^\r\n]/gu, ' ');
}

function parseEntityBinding(
  content: string,
  documentPath: string
): DocumentEntityBinding | undefined {
  const frontmatter = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/u.exec(content)?.[1];
  if (frontmatter === undefined) return undefined;
  const values = new Map<string, string>();
  const keys = new Set(['semEntityId', 'semEntityName', 'semEntityType', 'semEntityFile']);
  for (const line of frontmatter.split(/\r?\n/u)) {
    const match = /^([A-Za-z][A-Za-z0-9]*):[ \t]*(.*?)\s*$/u.exec(line);
    if (match === null || !keys.has(match[1])) continue;
    values.set(match[1], unquote(match[2]));
  }
  const present = [...keys].filter((key) => values.has(key));
  if (present.length === 0) return undefined;
  const missing = [...keys].filter((key) => (values.get(key) ?? '').length === 0);
  if (missing.length > 0) {
    throw new DocumentIndexError(
      `${documentPath} has incomplete sem entity metadata; missing: ${missing.join(', ')}`
    );
  }
  const file = normalizeEntityFile(values.get('semEntityFile') ?? '');
  if (file.length === 0 || file === '..' || file.startsWith('../') || path.posix.isAbsolute(file)) {
    throw new DocumentIndexError(`${documentPath} semEntityFile must be repository-relative`);
  }
  return {
    id: values.get('semEntityId') ?? '',
    name: values.get('semEntityName') ?? '',
    type: values.get('semEntityType') ?? '',
    file,
  };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  const first = trimmed[0];
  if ((first === '"' || first === "'") && trimmed.at(-1) === first) return trimmed.slice(1, -1);
  return trimmed;
}

function entityMatches(binding: DocumentEntityBinding, entity: SemEntity): boolean {
  return (
    entity.id !== undefined &&
    binding.id === entity.id &&
    binding.name === entity.name &&
    binding.type === entity.type &&
    binding.file === normalizeEntityFile(entity.file)
  );
}

function normalizeEntityFile(file: string): string {
  return path.posix.normalize(file.replaceAll('\\', '/')).replace(/^\.\//u, '');
}

function validateUniqueDefinitions(definitions: readonly DocumentDefinition[]): void {
  const symbols = new Map<string, DocumentDefinition>();
  const entities = new Map<string, DocumentDefinition>();
  for (const definition of definitions) {
    const symbol = symbolKey(definition.symbol);
    const existingSymbol = symbols.get(symbol);
    if (existingSymbol !== undefined) {
      throw new DocumentIndexError(
        `Duplicate canonical document definition [[${definition.symbol}]]: ${existingSymbol.documentPath}, ${definition.documentPath}`
      );
    }
    symbols.set(symbol, definition);
    if (definition.entity === undefined) continue;
    const existingEntity = entities.get(definition.entity.id);
    if (existingEntity !== undefined) {
      throw new DocumentIndexError(
        `Duplicate sem entity binding ${definition.entity.id}: ${existingEntity.documentPath}, ${definition.documentPath}`
      );
    }
    entities.set(definition.entity.id, definition);
  }
}

function extractSymbols(heading: string): readonly string[] {
  return [...heading.matchAll(/\[\[([^\]]+)\]\]/gu)]
    .map((match) => parseSymbol(match[1] ?? ''))
    .filter((symbol) => symbol.length > 0);
}

function parseSymbol(value: string): string {
  return value.split('|', 1)[0]?.split('#', 1)[0]?.trim() ?? '';
}

function symbolKey(symbol: string): string {
  // sem entity names are case-sensitive; document lookup must not merge Foo and foo.
  return symbol.trim();
}

function lineNumberAt(content: string, offset: number): number {
  return content.slice(0, offset).split('\n').length;
}

function toDocumentPath(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}
