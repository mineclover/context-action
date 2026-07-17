import type { VerificationFinding, VerificationReport } from './contracts.js';
import { InputContractError } from './errors.js';
import {
  assertVerificationReport,
  MAX_VERIFICATION_REPORT_RENDER_BYTES,
} from './report-contract.js';
import { compactText } from './text.js';

function findingScope(finding: VerificationFinding): string {
  return finding.capabilityId ?? finding.ruleId ?? 'repository';
}

function markdownCode(value: string): string {
  const content = compactText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|');
  let longestRun = 0;
  for (const match of content.matchAll(/`+/g)) {
    longestRun = Math.max(longestRun, match[0].length);
  }
  const fence = '`'.repeat(longestRun + 1);
  const padding = content.startsWith('`') || content.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${content}${padding}${fence}`;
}

function projectList(projects: string[] | undefined): string {
  return projects && projects.length > 0
    ? projects.map(compactText).join(', ')
    : 'none';
}

function markdownProjectList(projects: string[] | undefined): string {
  return projects && projects.length > 0
    ? projects.map(markdownCode).join(', ')
    : 'none';
}

function boundedRenderedReport(output: string, format: string): string {
  const outputBytes = Buffer.byteLength(output, 'utf8');
  if (outputBytes > MAX_VERIFICATION_REPORT_RENDER_BYTES) {
    throw new InputContractError(
      `${format} report exceeds ${MAX_VERIFICATION_REPORT_RENDER_BYTES} rendered byte limit`,
    );
  }
  return output;
}

export function renderConsoleReport(report: VerificationReport): string {
  assertVerificationReport(report);
  const lines = [
    `Architecture verification: ${report.passed ? 'PASS' : 'FAIL'}`,
    `Gate: fail on ${report.failOn}`,
    `Capabilities: ${report.summary.capabilities} | Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings} | Info: ${report.summary.info}`,
  ];
  if (report.semVersion) lines.push(`Sem version: ${compactText(report.semVersion)}`);
  if (report.semFailure) {
    const project = report.semFailure.projectId
      ? ` | project ${compactText(report.semFailure.projectId)}`
      : '';
    lines.push(`Sem failure: ${report.semFailure.operation} | ${report.semFailure.reason}${project} | ${report.semFailure.durationMs}ms`);
    if (report.semFailure.impactTargets !== undefined) {
      lines.push(
        `Sem impact query limit: ${report.semFailure.impactTargets} targets | maximum ${report.semFailure.maxImpactQueries}`,
      );
    }
    if (report.semFailure.requestedProjects) {
      lines.push(
        `Sem progress: completed ${projectList(report.semFailure.completedProjects)} | skipped ${projectList(report.semFailure.skippedProjects)} | requested ${projectList(report.semFailure.requestedProjects)}`,
      );
    }
    if (report.semFailure.expectedVersion || report.semFailure.observedVersion) {
      lines.push(
        `Sem version compatibility: observed ${compactText(report.semFailure.observedVersion ?? 'unknown')} | expected ${compactText(report.semFailure.expectedVersion ?? 'unknown')}`,
      );
    }
  }
  for (const analysis of report.semAnalyses) {
    const duration = analysis.durationMs === undefined ? '' : ` | ${analysis.durationMs}ms`;
    lines.push(`Sem ${compactText(analysis.projectId)}: ${analysis.entities} entities | ${analysis.impacts} impact queries${duration} | ${compactText(analysis.root)}`);
  }
  if (report.symbolUsages) {
    lines.push(`Symbol usage files: ${report.symbolUsages.length} symbols`);
  }
  if (report.semChanges) {
    const source = report.semChanges.source.mode === 'range'
      ? `${compactText(report.semChanges.source.from)}..${compactText(report.semChanges.source.to)}`
      : report.semChanges.source.mode;
    lines.push(`Sem changes (${source}): ${report.semChanges.entities} entities | ${report.semChanges.files.length} files (${report.semChanges.semanticFiles.length} semantic, ${report.semChanges.binaryFiles.length} binary, ${report.semChanges.untrackedFiles.length} untracked) | ${report.semChanges.affectedCapabilities.length} capabilities | ${report.semChanges.affectedDocuments.length} docs`);
  }
  if (report.findings.length === 0) {
    lines.push('No findings.');
  } else {
    for (const entry of report.findings) {
      lines.push(`[${entry.severity.toUpperCase()}] ${compactText(entry.code)} (${compactText(findingScope(entry))}): ${compactText(entry.message)}`);
    }
  }
  return boundedRenderedReport(`${lines.join('\n')}\n`, 'console');
}

export function renderMarkdownReport(report: VerificationReport): string {
  assertVerificationReport(report);
  const lines = [
    '# Architecture Verification Report',
    '',
    `- Result: **${report.passed ? 'PASS' : 'FAIL'}**`,
    `- Gate: fail on \`${report.failOn}\``,
    `- Capabilities: ${report.summary.capabilities}`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Registry: ${markdownCode(report.registryPath)}`,
    ...(report.semVersion ? [`- Sem version: ${markdownCode(report.semVersion)}`] : []),
    `- Sem projects: ${report.semAnalyses.length}`,
    ...(report.semChanges ? [
      `- Changed entities: ${report.semChanges.entities}`,
      `- Changed files: ${report.semChanges.files.length} (${report.semChanges.semanticFiles.length} semantic, ${report.semChanges.binaryFiles.length} binary, ${report.semChanges.untrackedFiles.length} untracked)`,
      `- Change source: ${report.semChanges.source.mode === 'range' ? markdownCode(`${report.semChanges.source.from}..${report.semChanges.source.to}`) : markdownCode(report.semChanges.source.mode)}`,
      `- Affected capabilities: ${report.semChanges.affectedCapabilities.length === 0 ? 'none' : report.semChanges.affectedCapabilities.map(markdownCode).join(', ')}`,
    ] : []),
    '',
    ...(report.semFailure ? [
      '## SEM Execution Failure',
      '',
      `- Operation: ${markdownCode(report.semFailure.operation)}`,
      `- Reason: ${markdownCode(report.semFailure.reason)}`,
      ...(report.semFailure.projectId ? [`- Project: ${markdownCode(report.semFailure.projectId)}`] : []),
      ...(report.semFailure.requestedProjects ? [
        `- Requested projects: ${markdownProjectList(report.semFailure.requestedProjects)}`,
        `- Completed projects: ${markdownProjectList(report.semFailure.completedProjects)}`,
        `- Skipped projects: ${markdownProjectList(report.semFailure.skippedProjects)}`,
      ] : []),
      ...(report.semFailure.observedVersion ? [
        `- Observed version: ${markdownCode(report.semFailure.observedVersion)}`,
      ] : []),
      ...(report.semFailure.expectedVersion ? [
        `- Expected version: ${markdownCode(report.semFailure.expectedVersion)}`,
      ] : []),
      `- Duration: ${report.semFailure.durationMs}ms`,
      `- Timeout: ${report.semFailure.timeoutMs}ms`,
      `- Output limit: ${report.semFailure.maxOutputBytes} bytes`,
      ...(report.semFailure.impactTargets === undefined ? [] : [
        `- Impact targets: ${report.semFailure.impactTargets}`,
        `- Impact query limit: ${report.semFailure.maxImpactQueries}`,
      ]),
      `- Command: ${markdownCode([report.semFailure.command, ...report.semFailure.args].join(' '))}`,
      ...(report.semFailure.exitCode === undefined ? [] : [`- Exit code: ${report.semFailure.exitCode}`]),
      ...(report.semFailure.signal ? [`- Signal: ${markdownCode(report.semFailure.signal)}`] : []),
      ...(report.semFailure.detail ? [`- Detail: ${markdownCode(report.semFailure.detail)}`] : []),
      ...(report.semFailure.stderr ? [`- Stderr: ${markdownCode(report.semFailure.stderr)}`] : []),
      '',
    ] : []),
    '## Capability Traceability',
    '',
    '| Capability | Status | Anchors | Tests | Docs | Findings |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
    ...report.capabilities.map((entry) =>
    `| ${markdownCode(entry.id)} | ${entry.status} | ${entry.implementationAnchors} | ${entry.testEvidence} | ${entry.publicDocs} | ${entry.findings} |`),
    ...(report.symbolUsages ? [
      '',
      '## Symbol Usage Files',
      '',
      '| Capability | Anchor | Definition | Usage files |',
      '| --- | --- | --- | ---: |',
      ...report.symbolUsages.map((entry) =>
        `| ${markdownCode(entry.capabilityId)} | ${markdownCode(entry.anchor)} | ${markdownCode(`${entry.definition.file}:${entry.definition.startLine}-${entry.definition.endLine}`)} | ${entry.usageFiles.length === 0 ? 'none' : entry.usageFiles.map(markdownCode).join(', ')} |`),
    ] : []),
    '',
    ...(report.semChanges ? [
      '## Change Scope',
      '',
      '### Binary Files to Review',
      '',
      ...(report.semChanges.binaryFiles.length === 0
        ? ['No binary files changed.']
        : report.semChanges.binaryFiles.map((file) => `- ${markdownCode(file)}`)),
      '',
      '### Documents to Review',
      '',
      ...(report.semChanges.affectedDocuments.length === 0
        ? ['No directly affected documents.']
        : report.semChanges.affectedDocuments.map((document) => `- ${markdownCode(document)}`)),
      '',
      '### Tests to Run',
      '',
      ...(report.semChanges.affectedTests.length === 0
        ? ['No directly affected tests.']
        : report.semChanges.affectedTests.map((test) => `- ${markdownCode(test)}`)),
      '',
    ] : []),
    '## Findings',
    '',
  ];
  if (report.findings.length === 0) {
    lines.push('No findings.');
  } else {
    lines.push('| Severity | Code | Scope | Message |', '| --- | --- | --- | --- |');
    for (const entry of report.findings) {
      lines.push(`| ${entry.severity} | ${markdownCode(entry.code)} | ${markdownCode(findingScope(entry))} | ${markdownCode(entry.message)} |`);
    }
  }
  lines.push('');
  return boundedRenderedReport(lines.join('\n'), 'Markdown');
}

export function renderJsonReport(report: VerificationReport): string {
  assertVerificationReport(report);
  return boundedRenderedReport(`${JSON.stringify(report, null, 2)}\n`, 'JSON');
}
