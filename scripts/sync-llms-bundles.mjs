#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRepositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const LOCALES = ['en', 'ko'];
const CATEGORY_ORDER = [
  'context-layered',
  'concept',
  'guide',
  'examples',
  'troubleshooting',
  'releases',
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function stripFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return normalized;
  const endMarker = normalized.indexOf('\n---\n', 4);
  if (endMarker === -1) return normalized;
  return normalized.slice(endMarker + 5);
}

function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

function stripMarkdownFormatting(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(content, relativePath) {
  const withoutFrontmatter = stripFrontmatter(content);
  for (const line of withoutFrontmatter.split('\n')) {
    const match = line.match(/^#\s+(.+)$/);
    if (match?.[1]) {
      return stripMarkdownFormatting(match[1]);
    }
  }
  return path.basename(relativePath, '.md');
}

function extractSectionHeadings(content) {
  const withoutFrontmatter = stripFrontmatter(content);
  const headings = [];
  let inCodeFence = false;
  for (const line of withoutFrontmatter.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = line.match(/^##\s+(.+)$/);
    if (match?.[1]) {
      headings.push(stripMarkdownFormatting(match[1]));
    }
  }
  return headings;
}

function extractCleanBodyLines(content) {
  const withoutFrontmatter = stripHtmlComments(stripFrontmatter(content));
  const lines = [];
  let inCodeFence = false;
  for (const rawLine of withoutFrontmatter.split('\n')) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    if (!trimmed) continue;
    if (trimmed === '---' || trimmed === '***') continue;
    if (/^#{1,6}\s+/.test(trimmed)) continue;
    lines.push(trimmed);
  }
  return lines;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  const slice = text.slice(0, maxLength - 3).trimEnd();
  return `${slice}...`;
}

function extractSummary(content) {
  const lines = extractCleanBodyLines(content);
  const paragraphParts = [];
  for (const line of lines) {
    if (line.startsWith('|')) continue;
    paragraphParts.push(line);
    if (stripMarkdownFormatting(paragraphParts.join(' ')).length >= 160) {
      break;
    }
  }
  const plain = stripMarkdownFormatting(paragraphParts.join(' '));
  return truncateText(plain || 'Documentation guide.', 160);
}

function extractExcerpt500(content) {
  const lines = extractCleanBodyLines(content);
  const cleaned = stripMarkdownFormatting(lines.join(' '));
  return truncateText(cleaned, 500);
}

function collectLocaleDocuments(docsDir, locale) {
  const localeRoot = path.join(docsDir, locale);
  if (!fs.existsSync(localeRoot)) return [];

  const relPaths = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const rel = toPosix(path.relative(localeRoot, fullPath));
        if (rel === 'llms' || rel.startsWith('llms/')) continue;
        relPaths.push(rel);
      }
    }
  };

  visit(localeRoot);

  relPaths.sort((a, b) => {
    const catA = getCategory(a);
    const catB = getCategory(b);
    const rankA = getCategoryRank(catA);
    const rankB = getCategoryRank(catB);
    if (rankA !== rankB) return rankA - rankB;
    if (rankA === CATEGORY_ORDER.length && catA !== catB) {
      return catA.localeCompare(catB, 'en');
    }
    return a.localeCompare(b, 'en');
  });

  return relPaths.map((relativePath) => {
    const absolutePath = path.join(localeRoot, relativePath);
    const rawContent = fs.readFileSync(absolutePath, 'utf8').replace(/\r\n/g, '\n');
    const category = getCategory(relativePath);
    const title = extractTitle(rawContent, relativePath);
    const headings = extractSectionHeadings(rawContent);
    const summary = extractSummary(rawContent);
    const excerpt500 = extractExcerpt500(rawContent);
    return {
      locale,
      relativePath,
      docId: `${locale}/${relativePath}`,
      category,
      title,
      headings,
      summary,
      excerpt500,
      content: rawContent.trimEnd(),
    };
  });
}

function getCategory(relativePath) {
  const slashIndex = relativePath.indexOf('/');
  return slashIndex === -1 ? 'root' : relativePath.slice(0, slashIndex);
}

function getCategoryRank(category) {
  const index = CATEGORY_ORDER.indexOf(category);
  if (index !== -1) return index;
  if (category === 'root') return CATEGORY_ORDER.length + 1;
  return CATEGORY_ORDER.length;
}

function buildMinimalBundle(locale, docs) {
  const header =
    locale === 'ko'
      ? '# Context-Action 문서 인덱스 (Minimal)'
      : '# Context-Action Documentation Index (Minimal)';
  const lines = [header, ''];
  docs.forEach((doc, index) => {
    lines.push(
      `${index + 1}. **[${doc.title}](docs/${doc.docId})** (${doc.category}) — ${doc.summary}`,
    );
  });
  return `${lines.join('\n')}\n`;
}

function build500CharsBundle(docs) {
  const sections = docs.map((doc) => {
    const headerLine = `===================[ DOC: ${doc.docId} ]===================`;
    const parts = [headerLine, `# ${doc.title}`];
    if (doc.headings.length > 0) {
      parts.push(`Sections: ${doc.headings.slice(0, 8).join(' | ')}`);
    }
    if (doc.excerpt500) {
      parts.push('', doc.excerpt500);
    }
    return parts.join('\n');
  });
  return `${sections.join('\n\n')}\n`;
}

function buildOriginBundle(docs) {
  const sections = docs.map((doc) => {
    const headerLine = `===================[ DOC: ${doc.docId} ]===================`;
    return `${headerLine}\n${doc.content}`;
  });
  return `${sections.join('\n\n')}\n`;
}

export function generateLlmsBundles(repositoryRoot = defaultRepositoryRoot) {
  const docsDir = path.join(repositoryRoot, 'docs');
  const outputs = [];
  const summaryByLocale = {};

  for (const locale of LOCALES) {
    const docs = collectLocaleDocuments(docsDir, locale);
    summaryByLocale[locale] = docs.length;

    const files = [
      {
        relativePath: `docs/${locale}/llms/llms-minimal.txt`,
        content: buildMinimalBundle(locale, docs),
      },
      {
        relativePath: `docs/${locale}/llms/llms-500chars.txt`,
        content: build500CharsBundle(docs),
      },
      {
        relativePath: `docs/${locale}/llms/llms-origin.txt`,
        content: buildOriginBundle(docs),
      },
    ];

    for (const file of files) {
      outputs.push({
        locale,
        relativePath: file.relativePath,
        absolutePath: path.join(repositoryRoot, file.relativePath),
        content: file.content,
        docCount: docs.length,
        bytes: Buffer.byteLength(file.content, 'utf8'),
      });
    }
  }

  return { outputs, summaryByLocale };
}

export function syncLlmsBundles({
  repositoryRoot = defaultRepositoryRoot,
  write = false,
} = {}) {
  const { outputs, summaryByLocale } = generateLlmsBundles(repositoryRoot);
  const drifted = [];
  const written = [];

  for (const entry of outputs) {
    const expectedBuffer = Buffer.from(entry.content, 'utf8');
    const exists = fs.existsSync(entry.absolutePath);
    const currentBuffer = exists ? fs.readFileSync(entry.absolutePath) : null;
    const isMatch =
      currentBuffer !== null && Buffer.compare(expectedBuffer, currentBuffer) === 0;

    if (write) {
      fs.mkdirSync(path.dirname(entry.absolutePath), { recursive: true });
      fs.writeFileSync(entry.absolutePath, expectedBuffer);
      written.push(entry);
    } else if (!isMatch) {
      drifted.push({
        relativePath: entry.relativePath,
        reason: exists ? 'out-of-sync' : 'missing',
      });
    }
  }

  return {
    ok: write || drifted.length === 0,
    outputs,
    drifted,
    written,
    summaryByLocale,
  };
}

function runCli() {
  const args = new Set(process.argv.slice(2));
  const write = args.has('--write');
  const rootArgIndex = process.argv.indexOf('--root');
  const repositoryRoot =
    rootArgIndex !== -1 && process.argv[rootArgIndex + 1]
      ? path.resolve(process.argv[rootArgIndex + 1])
      : defaultRepositoryRoot;

  const result = syncLlmsBundles({ repositoryRoot, write });

  if (write) {
    console.log('Generated LLMS bundles:');
    for (const entry of result.written) {
      console.log(
        `- ${entry.relativePath} (${entry.docCount} docs, ${entry.bytes} bytes)`,
      );
    }
    return;
  }

  if (!result.ok) {
    console.error('LLMS bundle check failed:');
    for (const item of result.drifted) {
      console.error(`- ${item.relativePath}: ${item.reason}`);
    }
    console.error("Run 'pnpm docs:llms' to regenerate.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `LLMS bundles up-to-date (${result.outputs.length} files across ${LOCALES.join(', ')}; en=${result.summaryByLocale.en} docs, ko=${result.summaryByLocale.ko} docs).`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli();
}
