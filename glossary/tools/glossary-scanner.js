#!/usr/bin/env node

/**
 * Glossary Scanner - 소스 코드에서 용어집 태그를 추출하여 매핑 데이터 생성
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { parse } from '@typescript-eslint/parser';
import chalk from 'chalk';
import { config } from './config.js';

class GlossaryScanner {
  constructor() {
    this.mappings = {
      terms: {},
      categories: {},
      files: {},
      statistics: {
        totalTerms: 0,
        mappedTerms: 0,
        unmappedTerms: 0,
        totalFiles: 0,
        taggedFiles: 0,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 메인 스캔 실행
   */
  async run() {
    console.log(chalk.blue('🔍 Starting glossary scan...'));
    
    try {
      // 출력 디렉토리 생성
      await this.ensureOutputDirectory();
      
      // 소스 파일들 스캔
      const files = await this.findSourceFiles();
      console.log(chalk.gray(`Found ${files.length} files to scan`));
      
      // 각 파일 처리
      for (const file of files) {
        await this.scanFile(file);
      }
      
      // 통계 계산
      this.calculateStatistics();
      
      // 매핑 파일 저장
      await this.saveMappings();
      
      this.printSummary();
      
    } catch (error) {
      console.error(chalk.red('❌ Scanner failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 출력 디렉토리 생성
   */
  async ensureOutputDirectory() {
    const outputDir = path.dirname(
      path.join(config.paths.docs, config.output.mappingsFile)
    );
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * 스캔할 소스 파일들 찾기
   */
  async findSourceFiles() {
    const allFiles = [];
    
    for (const pattern of config.scanPaths) {
      const files = await glob(pattern, {
        cwd: config.paths.root,
        ignore: config.excludePaths,
        absolute: true
      });
      allFiles.push(...files);
    }
    
    return [...new Set(allFiles)]; // 중복 제거
  }

  /**
   * 개별 파일 스캔
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(config.paths.root, filePath);
      
      // TypeScript/JavaScript 파싱
      const ast = this.parseFile(content, filePath);
      if (!ast) return;
      
      // 주석에서 태그 추출
      const comments = ast.comments || [];
      const declarations = this.extractDeclarations(ast);
      
      // 각 선언에 대해 태그 매칭
      const fileMappings = this.matchTagsToDeclarations(
        comments, 
        declarations, 
        relativePath
      );
      
      if (fileMappings.length > 0) {
        this.addFileMappings(relativePath, fileMappings);
        console.log(chalk.green(`✓ ${relativePath}: ${fileMappings.length} mappings`));
      }
      
      this.mappings.statistics.totalFiles++;
      
    } catch (error) {
      console.warn(chalk.yellow(`⚠ Skipping ${filePath}: ${error.message}`));
    }
  }

  /**
   * 파일 파싱 (TypeScript/JavaScript)
   */
  parseFile(content, filePath) {
    try {
      return parse(content, {
        ...config.parser,
        loc: true,
        range: true,
        tokens: true,
        comments: true,
        filePath
      });
    } catch (error) {
      // 파싱 실패시 null 반환
      return null;
    }
  }

  /**
   * AST에서 함수/클래스/타입 선언 추출
   */
  extractDeclarations(ast) {
    const declarations = [];
    
    const visit = (node) => {
      if (!node) return;
      
      // 함수 선언
      if (node.type === 'FunctionDeclaration' && node.id) {
        declarations.push({
          type: 'function',
          name: node.id.name,
          line: node.loc.start.line,
          signature: this.extractSignature(node)
        });
      }
      
      // 변수 선언 (함수 표현식 포함)
      if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          if (declarator.id && declarator.id.name) {
            const declType = this.getDeclarationType(declarator);
            declarations.push({
              type: declType,
              name: declarator.id.name,
              line: declarator.loc.start.line,
              signature: this.extractVariableSignature(declarator)
            });
          }
        }
      }
      
      // 클래스 선언
      if (node.type === 'ClassDeclaration' && node.id) {
        declarations.push({
          type: 'class',
          name: node.id.name,
          line: node.loc.start.line,
          signature: `class ${node.id.name}`
        });
      }
      
      // TypeScript 인터페이스
      if (node.type === 'TSInterfaceDeclaration' && node.id) {
        declarations.push({
          type: 'interface',
          name: node.id.name,
          line: node.loc.start.line,
          signature: `interface ${node.id.name}`
        });
      }
      
      // TypeScript 타입 별칭
      if (node.type === 'TSTypeAliasDeclaration' && node.id) {
        declarations.push({
          type: 'type',
          name: node.id.name,
          line: node.loc.start.line,
          signature: `type ${node.id.name}`
        });
      }
      
      // Export 문 처리
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        visit(node.declaration);
      }
      
      if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        visit(node.declaration);
      }
      
      // 자식 노드들 방문
      for (const key in node) {
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(visit);
        } else if (child && typeof child === 'object' && child.type) {
          visit(child);
        }
      }
    };
    
    visit(ast);
    return declarations;
  }

  /**
   * 변수 선언 타입 결정
   */
  getDeclarationType(declarator) {
    if (declarator.init) {
      if (declarator.init.type === 'ArrowFunctionExpression' || 
          declarator.init.type === 'FunctionExpression') {
        return 'function';
      }
    }
    return 'const';
  }

  /**
   * 함수 시그니처 추출 (간단한 버전)
   */
  extractSignature(node) {
    if (node.type === 'FunctionDeclaration') {
      const params = node.params.map(param => {
        if (param.type === 'Identifier') {
          return param.name;
        }
        return '...';
      }).join(', ');
      
      return `${node.id.name}(${params})`;
    }
    
    return null;
  }

  /**
   * 변수 시그니처 추출
   */
  extractVariableSignature(declarator) {
    if (declarator.id && declarator.id.name) {
      return declarator.id.name;
    }
    return null;
  }

  /**
   * 주석의 태그를 선언에 매칭
   */
  matchTagsToDeclarations(comments, declarations, filePath) {
    const mappings = [];
    
    for (const declaration of declarations) {
      // 선언 바로 위의 주석 찾기
      const associatedComment = this.findAssociatedComment(
        comments, 
        declaration.line
      );
      
      if (associatedComment) {
        const tags = this.extractTags(associatedComment.value);
        
        if (tags.glossary.length > 0) {
          mappings.push({
            ...declaration,
            file: filePath,
            tags,
            description: this.extractDescription(associatedComment.value)
          });
        }
      }
    }
    
    return mappings;
  }

  /**
   * 선언과 연관된 주석 찾기
   */
  findAssociatedComment(comments, declarationLine) {
    // 선언 바로 위 5줄 이내의 주석 찾기
    for (const comment of comments.reverse()) {
      const commentEndLine = comment.loc.end.line;
      const distance = declarationLine - commentEndLine;
      
      if (distance >= 0 && distance <= 5) {
        return comment;
      }
    }
    
    return null;
  }

  /**
   * 주석에서 태그 추출
   */
  extractTags(commentValue) {
    const tags = {
      glossary: [],
      category: [],
      pattern: [],
      related: []
    };
    
    // @glossary 태그 추출
    const glossaryMatches = [
      ...commentValue.matchAll(config.tagPatterns.jsdoc),
      ...commentValue.matchAll(config.tagPatterns.simple)
    ];
    
    for (const match of glossaryMatches) {
      const terms = match[1]
        .split(',')
        .map(term => term.trim())
        .filter(term => term.length > 0);
      tags.glossary.push(...terms);
    }
    
    // 다른 태그들 추출
    this.extractTagType(commentValue, config.tagPatterns.category, tags.category);
    this.extractTagType(commentValue, config.tagPatterns.pattern, tags.pattern);
    this.extractTagType(commentValue, config.tagPatterns.related, tags.related);
    
    return tags;
  }

  /**
   * 특정 타입의 태그 추출
   */
  extractTagType(commentValue, pattern, targetArray) {
    const matches = [...commentValue.matchAll(pattern)];
    for (const match of matches) {
      const items = match[1]
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      targetArray.push(...items);
    }
  }

  /**
   * 주석에서 설명 추출
   */
  extractDescription(commentValue) {
    // 첫 번째 줄에서 설명 추출 (태그가 아닌 부분)
    const lines = commentValue.split('\\n');
    for (const line of lines) {
      const cleaned = line.replace(/^\s*\*?\s*/, '').trim();
      if (cleaned && !cleaned.startsWith('@')) {
        return cleaned;
      }
    }
    return '';
  }

  /**
   * 파일 매핑 추가
   */
  addFileMappings(filePath, fileMappings) {
    this.mappings.files[filePath] = {
      terms: [],
      lastScanned: new Date().toISOString()
    };
    
    for (const mapping of fileMappings) {
      // 각 용어에 대해 매핑 추가
      for (const term of mapping.tags.glossary) {
        if (!this.mappings.terms[term]) {
          this.mappings.terms[term] = [];
        }
        
        this.mappings.terms[term].push({
          file: mapping.file,
          method: mapping.name,
          type: mapping.type,
          line: mapping.line,
          description: mapping.description,
          category: mapping.tags.category,
          patterns: mapping.tags.pattern,
          related: mapping.tags.related,
          signature: mapping.signature,
          lastModified: new Date().toISOString()
        });
        
        this.mappings.files[filePath].terms.push(term);
      }
      
      // 카테고리별 용어 추가
      for (const category of mapping.tags.category) {
        if (!this.mappings.categories[category]) {
          this.mappings.categories[category] = [];
        }
        
        for (const term of mapping.tags.glossary) {
          if (!this.mappings.categories[category].includes(term)) {
            this.mappings.categories[category].push(term);
          }
        }
      }
    }
    
    this.mappings.statistics.taggedFiles++;
  }

  /**
   * 통계 계산
   */
  calculateStatistics() {
    this.mappings.statistics.mappedTerms = Object.keys(this.mappings.terms).length;
    // unmappedTerms는 validator에서 계산 예정
  }

  /**
   * 매핑 파일 저장
   */
  async saveMappings() {
    const outputPath = path.join(config.paths.docs, config.output.mappingsFile);
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(this.mappings, null, 2));
    console.log(chalk.green(`💾 Mappings saved to ${config.output.mappingsFile}`));
  }

  /**
   * 결과 요약 출력
   */
  printSummary() {
    console.log('\\n' + chalk.blue('📊 Scan Summary:'));
    console.log(`Files scanned: ${this.mappings.statistics.totalFiles}`);
    console.log(`Files with tags: ${this.mappings.statistics.taggedFiles}`);
    console.log(`Terms mapped: ${this.mappings.statistics.mappedTerms}`);
    console.log(`Categories: ${Object.keys(this.mappings.categories).length}`);
    
    if (Object.keys(this.mappings.terms).length > 0) {
      console.log('\\n' + chalk.green('✅ Most mapped terms:'));
      const sortedTerms = Object.entries(this.mappings.terms)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 5);
      
      for (const [term, implementations] of sortedTerms) {
        console.log(`  ${term}: ${implementations.length} implementations`);
      }
    }
  }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new GlossaryScanner();
  scanner.run().catch(console.error);
}