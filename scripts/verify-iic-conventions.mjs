import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const documents = [
  {
    language: 'en',
    file: path.join(repositoryRoot, 'docs/en/context-layered/interaction-intent-contract.md'),
    templateFields: [
      'Agreement ID: CA-IIC-<number>',
      'Status: draft | accepted | implemented | superseded | deprecated',
      'Owner:',
      'Reviewer:',
      'Reviewed at:',
      'Review due / revisit:',
      'Impact: lite | full',
      'Reversibility:',
      'Supersedes / superseded by:',
      'Semantic source of truth',
      'Runtime owner',
      'Rollback criteria',
      'Negative contract',
    ],
    recordHeading: '### Example record: `',
    recordFields: [
      '**Status:**', '**Impact:**', '**Reversibility:**', '**Owner/reviewer:**',
      '**Semantic source of truth:**', '**Runtime owner:**', '**Negative contract:**',
      '**Rollback:**', '**Evidence:**',
    ],
  },
  {
    language: 'ko',
    file: path.join(repositoryRoot, 'docs/ko/context-layered/interaction-intent-contract.md'),
    templateFields: [
      '합의 ID: CA-IIC-<번호>',
      '상태: draft | accepted | implemented | superseded | deprecated',
      'owner:', 'reviewer:', 'reviewedAt:', 'reviewDue / revisit:',
      'impact: lite | full', 'reversibility:', 'supersedes / supersededBy:',
      'Semantic source of truth', 'Runtime owner', 'Rollback 기준', 'Negative contract',
    ],
    recordHeading: '### 기록 예시: `',
    recordFields: [
      '**상태:**', '**impact:**', '**reversibility:**', '**owner/reviewer:**',
      '**semantic source of truth:**', '**runtime owner:**', '**negative contract:**',
      '**rollback:**', '**증거:**',
    ],
  },
];

const errors = [];
const recordIdsByLanguage = new Map();

function readDocument(document) {
  if (!fs.existsSync(document.file)) {
    errors.push(`${document.language}: missing ${path.relative(repositoryRoot, document.file)}`);
    return '';
  }
  return fs.readFileSync(document.file, 'utf8');
}

function validateDocument(document, source) {
  for (const field of document.templateFields) {
    if (!source.includes(field)) errors.push(`${document.language}: IIC template is missing '${field}'`);
  }

  const recordIds = new Set(source.match(/CA-IIC-[A-Z0-9]+(?:-[A-Z0-9]+)+/g) ?? []);
  recordIdsByLanguage.set(document.language, recordIds);
  for (const recordId of recordIds) {
    const headingIndex = source.indexOf(`${document.recordHeading}${recordId}`);
    if (headingIndex === -1) {
      errors.push(`${document.language}: ${recordId} has no example record heading`);
      continue;
    }
    const nextHeading = source.indexOf('\n## ', headingIndex + 1);
    const record = source.slice(headingIndex, nextHeading === -1 ? source.length : nextHeading);
    for (const field of document.recordFields) {
      if (!record.includes(field)) errors.push(`${document.language}: ${recordId} is missing '${field}'`);
    }
  }
}

for (const document of documents) validateDocument(document, readDocument(document));

const englishIds = recordIdsByLanguage.get('en') ?? new Set();
const koreanIds = recordIdsByLanguage.get('ko') ?? new Set();
for (const id of new Set([...englishIds, ...koreanIds])) {
  if (!englishIds.has(id) || !koreanIds.has(id)) {
    errors.push(`paired docs: ${id} must exist in both English and Korean records`);
  }
}

if (errors.length > 0) {
  console.error('IIC convention verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`IIC convention verified: ${englishIds.size} paired record(s), lifecycle and evidence fields present.`);
}
