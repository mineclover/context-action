#!/usr/bin/env node

/**
 * Mapping Generator - 매핑 데이터를 기반으로 구현 문서 자동 생성
 */

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import matter from 'gray-matter';
import chalk from 'chalk';
import { config } from './config.js';

class MappingGenerator {
  constructor() {
    this.mappings = null;
    this.glossaryTerms = new Map(); // 용어집에서 로드한 용어들
    this.registerHandlebarsHelpers();
  }

  /**
   * 메인 생성 실행
   */
  async run() {
    console.log(chalk.blue('📝 Starting document generation...'));
    
    try {
      // 매핑 데이터 로드
      await this.loadMappings();
      
      // 용어집 로드
      await this.loadGlossaryTerms();
      
      // 구현 문서 생성
      await this.generateImplementationDocs();
      
      // 대시보드 생성
      await this.generateDashboard();
      
      console.log(chalk.green('✅ Document generation completed'));
      
    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Handlebars 헬퍼 등록
   */
  registerHandlebarsHelpers() {
    // 파일 링크 생성
    Handlebars.registerHelper('fileLink', function(filePath, line) {
      return `[${filePath}:${line}](../../${filePath}#L${line})`;
    });
    
    // 용어 링크 생성
    Handlebars.registerHelper('termLink', function(term, category) {
      const slug = term.toLowerCase().replace(/\\s+/g, '-');
      return `[${term}](../glossary/${category}.md#${slug})`;
    });
    
    // URL 슬러그 생성
    Handlebars.registerHelper('slugify', function(text) {
      return text.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    });
    
    // 배열 조인
    Handlebars.registerHelper('join', function(array, separator) {
      return array.join(separator || ', ');
    });
    
    // 백분율 계산
    Handlebars.registerHelper('percentage', function(value, total) {
      return total > 0 ? Math.round((value / total) * 100) : 0;
    });
    
    // 날짜 포맷
    Handlebars.registerHelper('formatDate', function(dateString) {
      return new Date(dateString).toLocaleDateString('ko-KR');
    });
    
    // 조건부 표시
    Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    });
  }

  /**
   * 매핑 데이터 로드
   */
  async loadMappings() {
    const mappingsPath = path.join(config.paths.docs, config.output.mappingsFile);
    
    if (!fs.existsSync(mappingsPath)) {
      throw new Error(`Mappings file not found: ${mappingsPath}`);
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
      const fullPath = path.join(config.paths.docs, filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = matter(content);
        
        // 마크다운에서 용어 추출 (## 헤더들)
        const terms = this.extractTermsFromMarkdown(parsed.content);
        
        for (const term of terms) {
          this.glossaryTerms.set(term.slug, {
            name: term.name,
            definition: term.definition,
            category,
            categoryTitle: this.formatCategoryTitle(category)
          });
        }
      }
    }
    
    console.log(chalk.gray(`Loaded glossary terms: ${this.glossaryTerms.size} terms`));
  }

  /**
   * 마크다운에서 용어 추출
   */
  extractTermsFromMarkdown(content) {
    const terms = [];
    const lines = content.split('\\n');
    
    let currentTerm = null;
    let currentDefinition = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // ## 헤더 (용어 시작)
      if (line.startsWith('## ') && !line.startsWith('### ')) {
        // 이전 용어 저장
        if (currentTerm) {
          terms.push({
            name: currentTerm,
            slug: currentTerm.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            definition: currentDefinition.join(' ').trim() || '정의가 없습니다.'
          });
        }
        
        // 새 용어 시작
        currentTerm = line.substring(3).trim();
        currentDefinition = [];
      } 
      // 정의 내용 수집
      else if (currentTerm && line && !line.startsWith('#')) {
        currentDefinition.push(line);
      }
    }
    
    // 마지막 용어 저장
    if (currentTerm) {
      terms.push({
        name: currentTerm,
        slug: currentTerm.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        definition: currentDefinition.join(' ').trim() || '정의가 없습니다.'
      });
    }
    
    return terms;
  }

  /**
   * 구현 문서들 생성
   */
  async generateImplementationDocs() {
    const template = this.loadTemplate('implementation.md');
    
    for (const [category, terms] of Object.entries(this.mappings.categories)) {
      const implementations = this.prepareImplementationData(category, terms);
      const outputPath = path.join(
        config.paths.docs, 
        config.output.implementationsDir, 
        `${category}.md`
      );
      
      const content = template({
        category,
        categoryTitle: this.formatCategoryTitle(category),
        implementations,
        totalTerms: terms.length,
        implementedTerms: implementations.filter(impl => impl.implementations.length > 0).length,
        totalImplementations: implementations.reduce((sum, impl) => sum + impl.implementations.length, 0),
        implementationRate: this.calculateImplementationRate(implementations),
        fileStats: this.generateFileStats(implementations),
        typeStats: this.generateTypeStats(implementations),
        categoryGuidelines: this.getCategoryGuidelines(category),
        lastUpdate: new Date().toISOString()
      });
      
      this.ensureDirectoryExists(path.dirname(outputPath));
      fs.writeFileSync(outputPath, content);
      
      console.log(chalk.green(`✓ Generated ${category}.md`));
    }
  }

  /**
   * 구현 데이터 준비
   */
  prepareImplementationData(category, terms) {
    return terms.map(termSlug => {
      const glossaryTerm = this.glossaryTerms.get(termSlug);
      const implementations = this.mappings.terms[termSlug] || [];
      
      return {
        term: glossaryTerm?.name || termSlug,
        category,
        definition: glossaryTerm?.definition || '정의를 찾을 수 없습니다.',
        implementations: implementations.map(impl => ({
          ...impl,
          hasMultipleImplementations: implementations.length > 1
        })),
        hasMultipleImplementations: implementations.length > 1
      };
    });
  }

  /**
   * 대시보드 생성
   */
  async generateDashboard() {
    const template = this.loadTemplate('dashboard.md');
    
    // 통계 계산
    const stats = this.calculateDashboardStats();
    
    const outputPath = path.join(
      config.paths.docs,
      config.output.implementationsDir,
      'index.md'
    );
    
    const content = template({
      statistics: this.mappings.statistics,
      implementationRate: this.calculateOverallImplementationRate(),
      categoryStats: this.generateCategoryStats(),
      topImplementedTerms: this.getTopImplementedTerms(),
      recentChanges: this.getRecentChanges(),
      unmappedTerms: this.getUnmappedTerms(),
      categories: this.getCategorySummary(),
      lastUpdate: new Date().toISOString()
    });
    
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, content);
    
    console.log(chalk.green('✓ Generated dashboard (index.md)'));
  }

  /**
   * 대시보드 통계 계산
   */
  calculateDashboardStats() {
    const totalGlossaryTerms = this.glossaryTerms.size;
    const mappedTerms = Object.keys(this.mappings.terms).length;
    
    // 매핑 통계 업데이트
    this.mappings.statistics.totalTerms = totalGlossaryTerms;
    this.mappings.statistics.unmappedTerms = totalGlossaryTerms - mappedTerms;
    
    return this.mappings.statistics;
  }

  /**
   * 전체 구현률 계산
   */
  calculateOverallImplementationRate() {
    const total = this.mappings.statistics.totalTerms;
    const mapped = this.mappings.statistics.mappedTerms;
    return total > 0 ? Math.round((mapped / total) * 100) : 0;
  }

  /**
   * 카테고리별 통계 생성
   */
  generateCategoryStats() {
    const stats = [];
    
    for (const [category, terms] of Object.entries(this.mappings.categories)) {
      const categoryTerms = Array.from(this.glossaryTerms.values())
        .filter(term => term.category === category);
      
      const total = categoryTerms.length;
      const mapped = terms.length;
      const rate = total > 0 ? Math.round((mapped / total) * 100) : 0;
      
      stats.push({
        name: this.formatCategoryTitle(category),
        category,
        total,
        mapped,
        rate,
        topTerms: this.getTopTermsForCategory(category)
      });
    }
    
    return stats.sort((a, b) => b.rate - a.rate);
  }

  /**
   * 카테고리별 상위 용어
   */
  getTopTermsForCategory(category) {
    const categoryTerms = this.mappings.categories[category] || [];
    
    return categoryTerms
      .map(term => ({
        term,
        count: (this.mappings.terms[term] || []).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  /**
   * 가장 많이 구현된 용어들
   */
  getTopImplementedTerms() {
    const terms = Object.entries(this.mappings.terms)
      .map(([term, implementations]) => {
        const glossaryTerm = this.glossaryTerms.get(term);
        return {
          term: glossaryTerm?.name || term,
          slug: term,
          count: implementations.length,
          category: glossaryTerm?.category || 'unknown'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return [{
      items: terms.map((term, index) => ({ ...term, index: index + 1 }))
    }];
  }

  /**
   * 최근 변경사항
   */
  getRecentChanges() {
    // 현재는 간단히 구현, 실제로는 git history나 파일 수정 시간 활용
    const changes = [];
    const today = new Date().toISOString().split('T')[0];
    
    const recentFiles = Object.entries(this.mappings.files)
      .filter(([, fileData]) => {
        const fileDate = new Date(fileData.lastScanned).toISOString().split('T')[0];
        return fileDate === today;
      })
      .slice(0, 5);
    
    if (recentFiles.length > 0) {
      changes.push({
        date: today,
        files: recentFiles.map(([file, fileData]) => ({
          file,
          terms: fileData.terms
        }))
      });
    }
    
    return changes;
  }

  /**
   * 매핑되지 않은 용어들
   */
  getUnmappedTerms() {
    const unmapped = new Map();
    
    for (const [termSlug, termData] of this.glossaryTerms) {
      if (!this.mappings.terms[termSlug]) {
        const category = termData.category;
        if (!unmapped.has(category)) {
          unmapped.set(category, []);
        }
        
        unmapped.get(category).push({
          term: termData.name,
          slug: termSlug,
          definition: termData.definition.substring(0, 100) + (termData.definition.length > 100 ? '...' : '')
        });
      }
    }
    
    return Array.from(unmapped.entries()).map(([category, terms]) => ({
      category,
      categoryTitle: this.formatCategoryTitle(category),
      terms
    }));
  }

  /**
   * 카테고리 요약
   */
  getCategorySummary() {
    return Object.entries(config.glossaryPaths).map(([category, filePath]) => {
      const categoryTerms = Array.from(this.glossaryTerms.values())
        .filter(term => term.category === category);
      
      const mappedTerms = this.mappings.categories[category] || [];
      const totalImplementations = mappedTerms.reduce((sum, term) => {
        return sum + (this.mappings.terms[term] || []).length;
      }, 0);
      
      return {
        name: category,
        title: this.formatCategoryTitle(category),
        termCount: categoryTerms.length,
        implementationCount: totalImplementations
      };
    });
  }

  /**
   * 구현률 계산
   */
  calculateImplementationRate(implementations) {
    const total = implementations.length;
    const implemented = implementations.filter(impl => impl.implementations.length > 0).length;
    return total > 0 ? Math.round((implemented / total) * 100) : 0;
  }

  /**
   * 파일별 통계 생성
   */
  generateFileStats(implementations) {
    const fileMap = new Map();
    
    for (const impl of implementations) {
      for (const implDetail of impl.implementations) {
        if (!fileMap.has(implDetail.file)) {
          fileMap.set(implDetail.file, {
            file: implDetail.file,
            count: 0,
            terms: []
          });
        }
        
        const fileData = fileMap.get(implDetail.file);
        fileData.count++;
        if (!fileData.terms.includes(impl.term)) {
          fileData.terms.push(impl.term);
        }
      }
    }
    
    return [{
      files: Array.from(fileMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }];
  }

  /**
   * 타입별 통계 생성
   */
  generateTypeStats(implementations) {
    const typeMap = new Map();
    let total = 0;
    
    for (const impl of implementations) {
      for (const implDetail of impl.implementations) {
        const type = implDetail.type || 'unknown';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
        total++;
      }
    }
    
    return Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 카테고리별 가이드라인
   */
  getCategoryGuidelines(category) {
    const guidelines = {
      'core-concepts': [
        '핵심 컨셉을 구현할 때는 명확한 인터페이스 정의',
        '다른 컴포넌트와의 결합도를 최소화',
        '테스트 가능한 구조로 설계'
      ],
      'architecture-terms': [
        'MVVM 패턴을 따라 레이어 분리',
        '의존성 주입 원칙 적용',
        '단일 책임 원칙 준수'
      ],
      'api-terms': [
        'TypeScript 타입 정의 필수',
        'JSDoc 주석으로 API 문서화',
        '에러 핸들링 포함'
      ],
      'naming-conventions': [
        '일관된 명명 규칙 적용',
        'camelCase 또는 PascalCase 사용',
        '의미있는 이름 사용'
      ]
    };
    
    return guidelines[category] || [];
  }

  /**
   * 카테고리 제목 포맷
   */
  formatCategoryTitle(category) {
    const titles = {
      'core-concepts': '핵심 개념',
      'architecture-terms': '아키텍처 용어',
      'api-terms': 'API 용어',
      'naming-conventions': '명명 규칙'
    };
    
    return titles[category] || category;
  }

  /**
   * 템플릿 로드
   */
  loadTemplate(templateName) {
    const templatePath = path.join(config.paths.tools, 'templates', templateName);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
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
  const generator = new MappingGenerator();
  generator.run().catch(console.error);
}