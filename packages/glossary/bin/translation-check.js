#!/usr/bin/env node

/**
 * CLI wrapper for translation checker
 */

import { createTranslationChecker } from '../dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Color output functions
 */
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

/**
 * Print translation report
 */
function printTranslationReport(summary) {
  console.log(colors.blue('\n📊 번역 상태 요약'));
  console.log(colors.gray('─'.repeat(50)));
  
  // Language status
  for (const [lang, status] of Object.entries(summary.languages)) {
    const { total, upToDate, outdated, missing, completionRate } = status;
    
    console.log(`\n${colors.yellow(lang.toUpperCase())} 번역 현황:`);
    console.log(`  전체: ${total}개`);
    console.log(`  완료: ${colors.green(upToDate)}개 | 수정필요: ${colors.yellow(outdated)}개 | 누락: ${colors.red(missing)}개`);
    console.log(`  완성도: ${completionRate}%`);
  }
  
  // Priority tasks
  console.log(colors.blue('\n📋 번역 우선순위'));
  console.log(colors.gray('─'.repeat(50)));
  
  const priorities = [
    { key: 'high', label: '높음', color: colors.red },
    { key: 'medium', label: '보통', color: colors.yellow }, 
    { key: 'low', label: '낮음', color: colors.gray }
  ];
  
  for (const { key, label, color } of priorities) {
    const items = summary.priorities[key];
    if (items.length === 0) continue;
    
    console.log(`\n${color(`${label} 우선순위`)} (${items.length}개):`);
    
    items.slice(0, 5).forEach(item => { // Show top 5
      const statusIcon = item.status === 'missing' ? '❌' : '⏰';
      const behindText = item.daysBehind > 0 ? ` (${item.daysBehind}일 지연)` : '';
      console.log(`  ${statusIcon} ${item.language}/${item.file}${behindText}`);
    });
    
    if (items.length > 5) {
      console.log(colors.gray(`  ... 외 ${items.length - 5}개`));
    }
  }
}

/**
 * Save report to JSON file
 */
async function saveReport(summary, rootDir) {
  const reportPath = join(rootDir, 'glossary/implementations/_data/translation-status.json');
  const reportDir = dirname(reportPath);
  
  // Create directory
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Save JSON
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log(colors.gray(`💾 리포트 저장: glossary/implementations/_data/translation-status.json`));
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(colors.blue('🌐 번역 상태 검사 시작...\n'));
    
    // Find project root (assumes this is in packages/glossary/bin/)
    const rootDir = join(__dirname, '../../..');
    
    // Create checker
    const checker = createTranslationChecker(rootDir);
    
    // Run check
    const summary = await checker.check();
    
    // Print report
    printTranslationReport(summary);
    
    // Save report
    await saveReport(summary, rootDir);
    
    console.log(colors.green('\n✅ 번역 상태 검사 완료'));
    
  } catch (error) {
    console.error(colors.red('❌ 번역 상태 검사 중 오류:'), error.message);
    process.exit(1);
  }
}

main();