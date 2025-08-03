#!/usr/bin/env node

/**
 * @fileoverview 대화형 CLI 인터페이스
 * @implements cli-interface
 * @implements interactive-search
 * @memberof glossary-tools
 * @version 1.0.0
 * 
 * 사용하기 쉬운 대화형 CLI로 구조적 검색 도구를 제공
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

/**
 * 대화형 CLI 인터페이스
 * @implements interactive-cli
 * @memberof core-concepts
 * @since 1.0.0
 */
class CLIInterface {
  constructor() {
    this.dataPath = path.join(__dirname, '../implementations/_data');
    this.termsPath = path.join(__dirname, '../terms');
    
    // 데이터
    this.mappings = null;
    this.analysis = null;
    this.termDefinitions = new Map();
    
    // CLI 상태
    this.rl = null;
    this.currentMode = 'main';
    this.searchHistory = [];
    this.favorites = new Set();
    
    // 간단한 검색 엔진
    this.searchEngine = null;
  }

  /**
   * CLI 시작
   * @implements start-cli
   * @memberof api-terms
   * @since 1.0.0
   */
  async start() {
    console.log('🧭 Context-Action 구조적 검색 도구');
    console.log('=====================================\n');
    
    try {
      // 데이터 로드
      await this.loadData();
      
      // readline 인터페이스 설정
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '검색> '
      });
      
      // 자동완성 설정
      this.setupAutoComplete();
      
      // 환영 메시지 및 도움말
      this.showWelcome();
      
      // 메인 루프 시작
      this.startMainLoop();
      
    } catch (error) {
      console.error('❌ CLI 시작 실패:', error.message);
      process.exit(1);
    }
  }

  /**
   * 데이터 로드
   * @implements load-cli-data
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadData() {
    console.log('📊 데이터 로드 중...');
    
    // 매핑 및 분석 데이터
    this.mappings = JSON.parse(await fs.readFile(path.join(this.dataPath, 'mappings.json'), 'utf-8'));
    this.analysis = JSON.parse(await fs.readFile(path.join(this.dataPath, 'structural-analysis.json'), 'utf-8'));
    
    // 용어 정의
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md', 'naming-conventions.md'];
    
    for (const filename of termFiles) {
      const category = filename.replace('.md', '');
      const content = await fs.readFile(path.join(this.termsPath, filename), 'utf-8');
      
      const terms = this.parseMarkdownTerms(content, category);
      terms.forEach(term => {
        this.termDefinitions.set(term.id, term);
      });
    }
    
    console.log(`✅ ${this.termDefinitions.size}개 용어, ${Object.keys(this.mappings.terms).length}개 매핑 로드 완료\n`);
  }

  /**
   * 자동완성 설정
   * @implements setup-autocomplete
   * @memberof api-terms
   * @since 1.0.0
   */
  setupAutoComplete() {
    // 명령어 목록
    const commands = [
      '/help', '/exit', '/quit', '/clear',
      '/categories', '/stats', '/popular', '/recent',
      '/search', '/find', '/explore', '/navigate'
    ];
    
    // 용어 목록
    const terms = Array.from(this.termDefinitions.keys());
    const titles = Array.from(this.termDefinitions.values()).map(t => t.title.toLowerCase());
    
    // 자동완성 데이터
    const completions = [...commands, ...terms, ...titles];
    
    this.rl.completer = (line) => {
      const hits = completions.filter(c => c.startsWith(line));
      return [hits, line];
    };
  }

  /**
   * 환영 메시지 표시
   * @implements show-welcome
   * @memberof api-terms
   * @since 1.0.0
   */
  showWelcome() {
    console.log('🎯 사용 가능한 명령어:');
    console.log('  검색어 입력     - 용어 검색');
    console.log('  /help          - 도움말');
    console.log('  /categories    - 카테고리 탐색');
    console.log('  /stats         - 통계 정보');
    console.log('  /popular       - 인기 용어');
    console.log('  /exit          - 종료');
    console.log('\n💡 팁: Tab 키로 자동완성, 방향키로 이전 명령어\n');
  }

  /**
   * 메인 루프 시작
   * @implements start-main-loop
   * @memberof api-terms
   * @since 1.0.0
   */
  startMainLoop() {
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      const line = input.trim();
      
      if (line === '') {
        this.rl.prompt();
        return;
      }
      
      try {
        await this.processCommand(line);
      } catch (error) {
        console.log(`❌ 오류: ${error.message}`);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log('\n👋 안녕히 가세요!');
      process.exit(0);
    });
  }

  /**
   * 명령어 처리
   * @implements process-command
   * @memberof api-terms
   * @since 1.0.0
   */
  async processCommand(input) {
    // 검색 기록 추가
    this.searchHistory.push(input);
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }
    
    // 명령어인지 검색어인지 판단
    if (input.startsWith('/')) {
      await this.handleCommand(input);
    } else {
      await this.handleSearch(input);
    }
  }

  /**
   * 시스템 명령어 처리
   * @implements handle-command
   * @memberof api-terms
   * @since 1.0.0
   */
  async handleCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case '/help':
        this.showHelp();
        break;
        
      case '/exit':
      case '/quit':
        this.rl.close();
        break;
        
      case '/clear':
        console.clear();
        this.showWelcome();
        break;
        
      case '/categories':
        this.showCategories();
        break;
        
      case '/stats':
        this.showStats();
        break;
        
      case '/popular':
        this.showPopular();
        break;
        
      case '/recent':
        this.showRecent();
        break;
        
      case '/search':
      case '/find':
        if (args.length > 0) {
          await this.handleSearch(args.join(' '));
        } else {
          console.log('사용법: /search 검색어');
        }
        break;
        
      case '/explore':
        if (args.length > 0) {
          await this.exploreMode(args[0]);
        } else {
          console.log('사용법: /explore 카테고리명');
        }
        break;
        
      default:
        console.log(`알 수 없는 명령어: ${cmd}`);
        console.log('사용 가능한 명령어를 보려면 /help를 입력하세요.');
    }
  }

  /**
   * 검색 처리
   * @implements handle-search
   * @memberof api-terms
   * @since 1.0.0
   */
  async handleSearch(query) {
    console.log(`\n🔍 "${query}" 검색 결과:`);
    
    const results = this.search(query);
    
    if (results.length === 0) {
      console.log('  검색 결과가 없습니다.');
      
      // 제안 검색어
      const suggestions = this.getSuggestions(query);
      if (suggestions.length > 0) {
        console.log(`\n💡 이런 검색어는 어떠세요: ${suggestions.join(', ')}`);
      }
      return;
    }
    
    // 결과 표시 (상위 5개)
    results.slice(0, 5).forEach((result, index) => {
      console.log(`\n  ${index + 1}. ${result.title}`);
      console.log(`     카테고리: ${this.getCategoryName(result.category)}`);
      console.log(`     정의: ${result.definition.substring(0, 100)}${result.definition.length > 100 ? '...' : ''}`);
      
      const implementations = this.mappings.terms[result.termId] || [];
      if (implementations.length > 0) {
        console.log(`     구현: ${implementations.length}개 (${implementations[0].file})`);
      } else {
        console.log('     구현: 없음');
      }
      
      console.log(`     관련성: ${result.relevance.toFixed(2)}`);
    });
    
    if (results.length > 5) {
      console.log(`\n  ... 및 ${results.length - 5}개 더`);
    }
    
    // 상세 정보 조회 옵션
    console.log('\n💡 특정 결과의 상세 정보를 보려면 숫자를 입력하세요 (예: 1)');
    console.log('   관련 용어를 보려면 "related 1" 형태로 입력하세요');
  }

  /**
   * 간단한 검색 엔진
   * @implements simple-search
   * @memberof api-terms
   * @since 1.0.0
   */
  search(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    this.termDefinitions.forEach((termDef, termId) => {
      let relevance = 0;
      
      // 제목 매칭
      if (termDef.title.toLowerCase() === queryLower) {
        relevance += 2.0;
      } else if (termDef.title.toLowerCase().includes(queryLower)) {
        relevance += 1.5;
      }
      
      // ID 매칭
      if (termId === queryLower) {
        relevance += 1.8;
      } else if (termId.includes(queryLower)) {
        relevance += 1.0;
      }
      
      // 정의 매칭
      if (termDef.definition?.toLowerCase().includes(queryLower)) {
        relevance += 0.8;
      }
      
      // 단어별 매칭
      const queryWords = queryLower.split(/\\s+/);
      const titleWords = termDef.title.toLowerCase().split(/\\s+/);
      const matchingWords = queryWords.filter(qw => 
        titleWords.some(tw => tw.includes(qw))
      );
      relevance += (matchingWords.length / queryWords.length) * 0.5;
      
      if (relevance > 0) {
        results.push({
          termId,
          title: termDef.title,
          definition: termDef.definition || '',
          category: termDef.category,
          relevance
        });
      }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 제안 검색어 생성
   * @implements get-suggestions
   * @memberof api-terms
   * @since 1.0.0
   */
  getSuggestions(query) {
    const suggestions = new Set();
    
    // 인기 용어들
    const popularTerms = ['action', 'store', 'handler', 'provider', 'pipeline'];
    
    // 유사한 키워드
    this.termDefinitions.forEach((termDef, termId) => {
      const words = termDef.title.toLowerCase().split(/\\s+/);
      words.forEach(word => {
        if (word.length >= 3 && 
            word.includes(query.substring(0, 3)) ||
            query.includes(word.substring(0, 3))) {
          suggestions.add(word);
        }
      });
    });
    
    return [...suggestions, ...popularTerms].slice(0, 5);
  }

  /**
   * 도움말 표시
   * @implements show-help
   * @memberof api-terms
   * @since 1.0.0
   */
  showHelp() {
    console.log('\n📚 Context-Action 검색 도구 도움말');
    console.log('======================================\n');
    
    console.log('🔍 기본 검색:');
    console.log('  action          - "action" 관련 용어 검색');
    console.log('  store hooks     - "store hooks" 검색');
    console.log('  ActionRegister  - 정확한 용어명 검색\n');
    
    console.log('📋 시스템 명령어:');
    console.log('  /help           - 이 도움말 표시');
    console.log('  /categories     - 카테고리별 용어 목록');
    console.log('  /stats          - 시스템 통계 정보');
    console.log('  /popular        - 인기 있는 용어들');
    console.log('  /recent         - 최근 검색 기록');
    console.log('  /clear          - 화면 지우기');
    console.log('  /exit           - 프로그램 종료\n');
    
    console.log('🧭 탐색 명령어:');
    console.log('  /explore core-concepts    - 핵심 개념 탐색');
    console.log('  /explore api-terms        - API 용어 탐색');
    console.log('  /search 검색어            - 고급 검색\n');
    
    console.log('💡 사용 팁:');
    console.log('  - Tab 키로 자동완성 사용');
    console.log('  - 방향키로 이전 명령어 재사용');
    console.log('  - 검색 결과에서 숫자 입력으로 상세 정보 조회');
    console.log('  - "related 1" 형태로 관련 용어 조회\n');
  }

  /**
   * 카테고리 정보 표시
   * @implements show-categories
   * @memberof api-terms
   * @since 1.0.0
   */
  showCategories() {
    console.log('\n📂 카테고리별 용어 현황:');
    
    const categories = {
      'core-concepts': '핵심 개념',
      'api-terms': 'API 용어',
      'architecture-terms': '아키텍처 용어',
      'naming-conventions': '네이밍 규칙'
    };
    
    Object.entries(categories).forEach(([categoryId, categoryName]) => {
      const categoryTerms = Array.from(this.termDefinitions.values())
        .filter(term => term.category === categoryId);
      
      const implementedCount = categoryTerms
        .filter(term => this.mappings.terms[term.id]?.length > 0).length;
      
      const implementationRate = ((implementedCount / categoryTerms.length) * 100).toFixed(1);
      
      console.log(`\n  📁 ${categoryName}`);
      console.log(`     전체: ${categoryTerms.length}개 용어`);
      console.log(`     구현: ${implementedCount}개 (${implementationRate}%)`);
      console.log(`     탐색: /explore ${categoryId}`);
    });
    
    console.log('\n💡 특정 카테고리를 탐색하려면 /explore 명령어를 사용하세요.');
  }

  /**
   * 통계 정보 표시
   * @implements show-stats
   * @memberof api-terms
   * @since 1.0.0
   */
  showStats() {
    console.log('\n📊 시스템 통계:');
    
    const totalTerms = this.termDefinitions.size;
    const mappedTerms = Object.keys(this.mappings.terms).length;
    const totalImplementations = Object.values(this.mappings.terms)
      .reduce((sum, impls) => sum + impls.length, 0);
    
    console.log(`\n  📖 전체 용어: ${totalTerms}개`);
    console.log(`  🔗 매핑된 용어: ${mappedTerms}개`);
    console.log(`  ⚙️ 총 구현체: ${totalImplementations}개`);
    console.log(`  📈 매핑률: ${((mappedTerms / totalTerms) * 100).toFixed(1)}%`);
    
    // 중심성 정보
    if (this.analysis.centrality?.rankings) {
      const topTerms = this.analysis.centrality.rankings.slice(0, 3);
      console.log('\n  🌟 가장 중요한 용어들:');
      topTerms.forEach(([termId, metrics], index) => {
        const termDef = this.termDefinitions.get(termId);
        console.log(`     ${index + 1}. ${termDef?.title || termId} (연결도: ${metrics.degree})`);
      });
    }
    
    // 카테고리별 구현률
    console.log('\n  📂 카테고리별 구현률:');
    Object.entries(this.analysis.categories).forEach(([categoryId, data]) => {
      const rate = (data.implementationRate * 100).toFixed(1);
      console.log(`     ${data.name}: ${rate}%`);
    });
  }

  /**
   * 인기 용어 표시
   * @implements show-popular
   * @memberof api-terms
   * @since 1.0.0
   */
  showPopular() {
    console.log('\n🌟 인기 용어들:');
    
    // 구현이 많은 용어들
    const popularByImpl = Object.entries(this.mappings.terms)
      .map(([termId, impls]) => ({
        termId,
        title: this.termDefinitions.get(termId)?.title || termId,
        implementationCount: impls.length
      }))
      .filter(term => term.implementationCount > 1)
      .sort((a, b) => b.implementationCount - a.implementationCount)
      .slice(0, 5);
    
    console.log('\n  🏆 구현이 많은 용어:');
    popularByImpl.forEach((term, index) => {
      console.log(`     ${index + 1}. ${term.title} (${term.implementationCount}개 구현)`);
    });
    
    // 중심성이 높은 용어들
    if (this.analysis.centrality?.rankings) {
      console.log('\n  🌐 연결성이 높은 용어:');
      this.analysis.centrality.rankings.slice(0, 5).forEach(([termId, metrics], index) => {
        const termDef = this.termDefinitions.get(termId);
        console.log(`     ${index + 1}. ${termDef?.title || termId} (연결도: ${metrics.degree})`);
      });
    }
  }

  /**
   * 최근 검색 기록 표시
   * @implements show-recent
   * @memberof api-terms
   * @since 1.0.0
   */
  showRecent() {
    console.log('\n🕒 최근 검색 기록:');
    
    if (this.searchHistory.length === 0) {
      console.log('  검색 기록이 없습니다.');
      return;
    }
    
    const recentSearches = this.searchHistory.slice(-10).reverse();
    recentSearches.forEach((search, index) => {
      console.log(`  ${index + 1}. ${search}`);
    });
    
    console.log('\n💡 이전 검색어를 다시 실행하려면 방향키를 사용하세요.');
  }

  /**
   * 탐색 모드
   * @implements explore-mode
   * @memberof api-terms
   * @since 1.0.0
   */
  async exploreMode(categoryId) {
    const categoryNames = {
      'core-concepts': '핵심 개념',
      'api-terms': 'API 용어', 
      'architecture-terms': '아키텍처 용어',
      'naming-conventions': '네이밍 규칙'
    };
    
    const categoryName = categoryNames[categoryId];
    if (!categoryName) {
      console.log(`알 수 없는 카테고리: ${categoryId}`);
      console.log(`사용 가능한 카테고리: ${Object.keys(categoryNames).join(', ')}`);
      return;
    }
    
    console.log(`\n📂 ${categoryName} 탐색:`);
    
    const categoryTerms = Array.from(this.termDefinitions.values())
      .filter(term => term.category === categoryId)
      .sort((a, b) => a.title.localeCompare(b.title));
    
    categoryTerms.forEach((term, index) => {
      const implementations = this.mappings.terms[term.id] || [];
      const status = implementations.length > 0 ? 
        `✅ ${implementations.length}개 구현` : '❌ 미구현';
      
      console.log(`\n  ${index + 1}. ${term.title}`);
      console.log(`     ${status}`);
      console.log(`     ${term.definition.substring(0, 80)}${term.definition.length > 80 ? '...' : ''}`);
    });
    
    console.log(`\n📊 ${categoryName} 요약:`);
    console.log(`  전체: ${categoryTerms.length}개 용어`);
    
    const implementedCount = categoryTerms
      .filter(term => this.mappings.terms[term.id]?.length > 0).length;
    console.log(`  구현: ${implementedCount}개 (${((implementedCount / categoryTerms.length) * 100).toFixed(1)}%)`);
  }

  // 유틸리티 메서드들
  getCategoryName(categoryId) {
    const names = {
      'core-concepts': '핵심 개념',
      'api-terms': 'API 용어',
      'architecture-terms': '아키텍처 용어',
      'naming-conventions': '네이밍 규칙'
    };
    return names[categoryId] || categoryId;
  }

  parseMarkdownTerms(content, category) {
    const terms = [];
    const sections = content.split(/\\n## /).slice(1);
    
    sections.forEach(section => {
      const lines = section.split('\\n');
      const title = lines[0].trim();
      const id = this.titleToId(title);
      
      let definition = '';
      let relatedTerms = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('**Definition**:')) {
          definition = trimmed.replace('**Definition**:', '').trim();
        } else if (trimmed.startsWith('**Related Terms**:')) {
          relatedTerms = this.parseRelatedTerms(trimmed.replace('**Related Terms**:', '').trim());
        }
      });
      
      terms.push({ id, title, definition, relatedTerms, category });
    });
    
    return terms;
  }

  titleToId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  parseRelatedTerms(text) {
    const terms = [];
    const linkPattern = /\\[([^\\]]+)\\]\\(([^)]+)\\)/g;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      const [, title, link] = match;
      const id = this.extractIdFromLink(link);
      terms.push({ title: title.trim(), id });
    }
    
    return terms;
  }

  extractIdFromLink(link) {
    if (link.startsWith('#')) {
      return link.substring(1);
    } else if (link.includes('#')) {
      return link.split('#')[1];
    }
    return this.titleToId(link);
  }
}

// CLI 실행
if (require.main === module) {
  const cli = new CLIInterface();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n\\n👋 안녕히 가세요!');
    process.exit(0);
  });
  
  cli.start().catch(error => {
    console.error('❌ CLI 시작 실패:', error);
    process.exit(1);
  });
}

module.exports = { CLIInterface };