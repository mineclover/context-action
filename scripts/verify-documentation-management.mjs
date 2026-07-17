import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const docsRoot = path.join(repositoryRoot, 'docs');

function collectMarkdown(relativeDirectory) {
  const directory = path.join(docsRoot, relativeDirectory);
  const files = [];
  const visit = (currentDirectory) => {
    for (const entry of fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(path.relative(directory, entryPath));
      }
    }
  };
  visit(directory);
  return files.sort();
}

function read(relativePath) {
  const filePath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing documentation-management file: ${relativePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(relativePath, source, pattern, description) {
  if (!pattern.test(source)) {
    throw new Error(`${relativePath} does not expose ${description}`);
  }
}

const pairedDirectories = ['context-layered', 'concept', 'examples'];
for (const directory of pairedDirectories) {
  const english = collectMarkdown(`en/${directory}`);
  const korean = collectMarkdown(`ko/${directory}`);
  const englishSet = new Set(english);
  const koreanSet = new Set(korean);
  const missingKorean = english.filter((file) => !koreanSet.has(file));
  const missingEnglish = korean.filter((file) => !englishSet.has(file));
  if (missingKorean.length || missingEnglish.length) {
    throw new Error(
      `${directory} documentation pair is incomplete: ${JSON.stringify({ missingKorean, missingEnglish })}`
    );
  }
}

const issueTemplates = {
  '.github/ISSUE_TEMPLATE/feature-spec.yml': [
    /id: area/,
    /id: change_class/,
    /id: acceptance/,
    /id: evidence/,
  ],
  '.github/ISSUE_TEMPLATE/bug-report.yml': [
    /id: environment/,
    /id: reproduction/,
    /id: actual/,
    /id: expected/,
    /id: evidence/,
  ],
  '.github/ISSUE_TEMPLATE/documentation-drift.yml': [
    /id: canonical_source/,
    /id: drift/,
    /id: affected_surfaces/,
    /id: fix_plan/,
  ],
};
for (const [relativePath, patterns] of Object.entries(issueTemplates)) {
  const source = read(relativePath);
  assertContains(relativePath, source, /^name:/m, 'issue form name');
  assertContains(relativePath, source, /^description:/m, 'issue form description');
  assertContains(relativePath, source, /^body:/m, 'issue form body');
  for (const pattern of patterns) {
    assertContains(relativePath, source, pattern, `required field ${pattern}`);
  }
}

const englishConventionIndex = read(
  'docs/en/context-layered/convention-index.md'
);
const koreanConventionIndex = read(
  'docs/ko/context-layered/convention-index.md'
);
assertContains(
  'docs/en/context-layered/convention-index.md',
  englishConventionIndex,
  /\/en\/context-layered\/change-management-convention/,
  'the change-management discovery link'
);
assertContains(
  'docs/ko/context-layered/convention-index.md',
  koreanConventionIndex,
  /\/ko\/context-layered\/change-management-convention/,
  'the change-management discovery link'
);

for (const [locale, relativePath] of [
  ['en', 'docs/en/context-layered/change-management-convention.md'],
  ['ko', 'docs/ko/context-layered/change-management-convention.md'],
]) {
  const source = read(relativePath);
  assertContains(relativePath, source, /\*\*(?:Status|상태):\*\*/, `${locale} status metadata`);
  assertContains(relativePath, source, /## (?:Review decision|리뷰 판정)/, `${locale} review decision`);
  assertContains(relativePath, source, /## (?:Review and handoff checklist|리뷰 및 handoff 체크리스트)/, `${locale} handoff checklist`);
}

console.log('Documentation management verification');
console.log(`- paired directories checked: ${pairedDirectories.length}`);
console.log(`- issue forms checked: ${Object.keys(issueTemplates).length}`);
console.log('- convention discovery links checked: en, ko');
console.log('- change-management metadata and handoff checklist checked: en, ko');
