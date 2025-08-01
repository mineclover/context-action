#!/usr/bin/env node

/**
 * Link Validator - 용어집 참조의 일관성 검증 및 오류 탐지
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import chalk from 'chalk';
import { config } from './config.js';

class LinkValidator {
  constructor() {
    this.mappings = null;
    this.glossaryTerms = new Set();
    this.validCategories = new Set();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 메인 검증 실행
   */
  async run() {
    console.log(chalk.blue('🔍 Starting validation...'));
    
    try {
      // 데이터 로드
      await this.loadMappings();
      await this.loadGlossaryTerms();
      
      // 검증 실행
      this.validateTermExistence();
      this.validateCategories();
      this.validateDuplicates();
      this.validateOrphanedTerms();
      
      // 결과 리포팅
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 매핑 데이터 로드
   */
  async loadMappings() {
    const mappingsPath = path.join(config.paths.docs, config.output.mappingsFile);
    
    if (!fs.existsSync(mappingsPath)) {
      throw new Error(`Mappings file not found: ${mappingsPath}. Run scanner first.`);
    }
    
    const content = fs.readFileSync(mappingsPath, 'utf8');
    this.mappings = JSON.parse(content);
    
    console.log(chalk.gray(`Loaded mappings: ${Object.keys(this.mappings.terms).length} terms`));
  }

  /**
   * 용어집 용어들 로드
   */
  async loadGlossaryTerms() {
    for (const [category, filePath] of Object.entries(config.glossaryPaths)) {
      this.validCategories.add(category);
      
      const fullPath = path.join(config.paths.docs, filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = matter(content);
        
        // 마크다운에서 용어 추출
        const terms = this.extractTermsFromMarkdown(parsed.content);
        
        for (const term of terms) {
          this.glossaryTerms.add(term.slug);
        }
      } else {
        this.warnings.push({
          type: 'MISSING_GLOSSARY_FILE',
          file: filePath,
          message: `Glossary file not found: ${filePath}`
        });
      }
    }
    
    console.log(chalk.gray(`Loaded glossary terms: ${this.glossaryTerms.size} terms`));
    console.log(chalk.gray(`Valid categories: ${Array.from(this.validCategories).join(', ')}`));
  }

  /**
   * 마크다운에서 용어 추출
   */
  extractTermsFromMarkdown(content) {
    const terms = [];
    const lines = content.split('\\n');
    
    for (const line of lines) {
      // ## 헤더 (용어)
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        const termName = line.substring(3).trim();
        const slug = termName.toLowerCase()
          .replace(/\\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        terms.push({ name: termName, slug });
      }
    }
    
    return terms;
  }

  /**
   * 용어 존재성 검증
   */
  validateTermExistence() {
    console.log(chalk.gray('Validating term existence...'));
    
    for (const [term, implementations] of Object.entries(this.mappings.terms)) {
      if (!this.glossaryTerms.has(term)) {
        for (const impl of implementations) {
          this.errors.push({
            type: 'TERM_NOT_FOUND',
            file: impl.file,
            line: impl.line,
            method: impl.method,
            term: term,
            message: `Term '${term}' is not defined in glossary`,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * 카테고리 유효성 검증
   */
  validateCategories() {
    console.log(chalk.gray('Validating categories...'));
    
    for (const [term, implementations] of Object.entries(this.mappings.terms)) {
      for (const impl of implementations) {
        if (impl.category && Array.isArray(impl.category)) {
          for (const category of impl.category) {
            if (!this.validCategories.has(category)) {
              this.errors.push({
                type: 'INVALID_CATEGORY',
                file: impl.file,
                line: impl.line,
                method: impl.method,
                category: category,
                validCategories: Array.from(this.validCategories),
                message: `Invalid category '${category}'. Valid categories: ${Array.from(this.validCategories).join(', ')}`,
                severity: 'error'
              });
            }
          }
        }
      }
    }
  }

  /**
   * 중복 매핑 검증
   */
  validateDuplicates() {
    console.log(chalk.gray('Checking for duplicates...'));
    
    const seen = new Map(); // key: file:method, value: [terms]
    
    for (const [term, implementations] of Object.entries(this.mappings.terms)) {
      for (const impl of implementations) {
        const key = `${impl.file}:${impl.method}`;
        
        if (!seen.has(key)) {
          seen.set(key, []);
        }
        
        seen.get(key).push(term);
      }
    }
    
    // 중복 찾기
    for (const [key, terms] of seen) {
      if (terms.length > 1) {
        const [file, method] = key.split(':');
        this.warnings.push({
          type: 'DUPLICATE_MAPPING',
          file: file,
          method: method,
          terms: terms,
          message: `${method} in ${file} is mapped to multiple terms: ${terms.join(', ')}`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * 고아 용어 검증 (용어집에는 있지만 매핑되지 않은 용어)
   */
  validateOrphanedTerms() {
    console.log(chalk.gray('Checking for orphaned terms...'));
    
    const mappedTerms = new Set(Object.keys(this.mappings.terms));
    
    for (const glossaryTerm of this.glossaryTerms) {
      if (!mappedTerms.has(glossaryTerm)) {
        this.warnings.push({
          type: 'ORPHANED_TERM',
          term: glossaryTerm,
          message: `Glossary term '${glossaryTerm}' has no code implementations`,
          severity: 'info'
        });
      }
    }
  }

  /**
   * 결과 리포팅
   */
  generateReport() {
    const isCI = process.env.CI || process.argv.includes('--ci');
    const totalIssues = this.errors.length + this.warnings.length;
    
    if (isCI) {
      this.generateCIReport();
    } else {
      this.generateConsoleReport();
    }
    
    // JSON 리포트도 생성
    this.generateJSONReport();
    
    // 종료 코드 결정
    const exitCode = this.errors.length > 0 ? 1 : 0;
    console.log(`\\n${totalIssues === 0 ? chalk.green('✅') : chalk.yellow('⚠️')} Validation completed with ${this.errors.length} errors and ${this.warnings.length} warnings`);
    
    if (exitCode > 0) {
      console.log(chalk.red(`Exiting with code ${exitCode} due to errors`));
    }
    
    if (!isCI) {
      process.exit(exitCode);
    }
  }

  /**
   * CI 환경용 리포트 (GitHub Actions 형식)
   */
  generateCIReport() {
    console.log('\\n' + chalk.blue('📋 CI Report:'));
    
    // 에러들
    for (const error of this.errors) {
      const file = error.file || '';
      const line = error.line || 1;
      console.log(`::error file=${file},line=${line}::${error.message}`);
    }
    
    // 경고들
    for (const warning of this.warnings) {
      const file = warning.file || '';
      const line = warning.line || 1;
      console.log(`::warning file=${file},line=${line}::${warning.message}`);
    }
    
    // 요약
    console.log(`::notice::Validation completed: ${this.errors.length} errors, ${this.warnings.length} warnings`);
  }

  /**
   * 콘솔용 리포트
   */
  generateConsoleReport() {
    console.log('\\n' + chalk.blue('📋 Validation Report:'));
    
    if (this.errors.length > 0) {
      console.log('\\n' + chalk.red(`❌ Errors (${this.errors.length}):`));
      this.printIssues(this.errors, 'red');
    }
    
    if (this.warnings.length > 0) {
      console.log('\\n' + chalk.yellow(`⚠️  Warnings (${this.warnings.length}):`));
      this.printIssues(this.warnings, 'yellow');
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('\\n🎉 All validations passed!'));
    }
    
    this.printSummary();
  }

  /**
   * 이슈들 출력
   */
  printIssues(issues, color) {
    const groupedIssues = this.groupIssuesByType(issues);
    
    for (const [type, typeIssues] of Object.entries(groupedIssues)) {
      console.log(chalk[color](`\\n  ${type}:`));
      
      for (const issue of typeIssues.slice(0, 10)) { // 최대 10개만 표시
        if (issue.file) {
          console.log(`    ${issue.file}:${issue.line || '?'} - ${issue.message}`);
        } else {
          console.log(`    ${issue.message}`);
        }
      }
      
      if (typeIssues.length > 10) {
        console.log(chalk.gray(`    ... and ${typeIssues.length - 10} more`));
      }
    }
  }

  /**
   * 이슈를 타입별로 그룹화
   */
  groupIssuesByType(issues) {
    const grouped = {};
    
    for (const issue of issues) {
      const type = issue.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(issue);
    }
    
    return grouped;
  }

  /**
   * 요약 출력
   */
  printSummary() {
    console.log('\\n' + chalk.blue('📊 Summary:'));
    
    const totalGlossaryTerms = this.glossaryTerms.size;
    const mappedTerms = Object.keys(this.mappings.terms).length;
    const implementationRate = totalGlossaryTerms > 0 
      ? Math.round((mappedTerms / totalGlossaryTerms) * 100) 
      : 0;
    
    console.log(`  Glossary terms: ${totalGlossaryTerms}`);
    console.log(`  Mapped terms: ${mappedTerms} (${implementationRate}%)`);
    console.log(`  Files scanned: ${this.mappings.statistics.totalFiles}`);
    console.log(`  Files with tags: ${this.mappings.statistics.taggedFiles}`);
    
    // 가장 문제가 많은 파일들
    const fileIssueCount = this.getFileIssueCount();
    if (fileIssueCount.length > 0) {
      console.log('\\n' + chalk.gray('📁 Files with most issues:'));
      fileIssueCount.slice(0, 5).forEach(([file, count]) => {
        console.log(`  ${file}: ${count} issues`);
      });
    }
  }

  /**
   * 파일별 이슈 수 계산
   */
  getFileIssueCount() {
    const fileMap = new Map();
    
    [...this.errors, ...this.warnings].forEach(issue => {
      if (issue.file) {
        fileMap.set(issue.file, (fileMap.get(issue.file) || 0) + 1);
      }
    });
    
    return Array.from(fileMap.entries())
      .sort(([,a], [,b]) => b - a);
  }

  /**
   * JSON 리포트 생성
   */
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      success: this.errors.length === 0,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        totalIssues: this.errors.length + this.warnings.length,
        glossaryTerms: this.glossaryTerms.size,
        mappedTerms: Object.keys(this.mappings.terms).length,
        implementationRate: this.glossaryTerms.size > 0 
          ? Math.round((Object.keys(this.mappings.terms).length / this.glossaryTerms.size) * 100)
          : 0
      },
      details: {
        errors: this.errors,
        warnings: this.warnings
      },
      statistics: this.mappings.statistics
    };
    
    const reportPath = path.join(
      config.paths.docs, 
      config.output.implementationsDir,
      '_data',
      'validation-report.json'
    );
    
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(chalk.gray(`📄 JSON report saved to ${reportPath}`));
  }

  /**
   * 디렉토리 생성
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new LinkValidator();
  validator.run().catch(console.error);
}