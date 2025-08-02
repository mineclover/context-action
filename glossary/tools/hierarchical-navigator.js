#!/usr/bin/env node

/**
 * @fileoverview 계층적 탐색 시스템 구현
 * @implements hierarchical-navigation
 * @implements structural-search-engine
 * @memberof glossary-tools
 * @version 1.0.0
 * 
 * 구조적 정보를 기반으로 용어집을 계층적으로 탐색할 수 있는 시스템
 * 관계성, 의존성, 중심성을 고려한 지능형 네비게이션 제공
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 계층적 네비게이터 클래스
 * @implements hierarchical-navigator
 * @memberof core-concepts
 * @since 1.0.0
 */
class HierarchicalNavigator {
  constructor() {
    this.dataPath = path.join(__dirname, '../implementations/_data');
    
    // 구조적 데이터
    this.structuralAnalysis = null;
    this.mappings = null;
    this.termDefinitions = new Map();
    
    // 네비게이션 인덱스
    this.navigationIndex = {
      byCategory: new Map(),
      byConnection: new Map(),
      byImplementation: new Map(),
      byDepth: new Map(),
      byCentrality: new Map()
    };
    
    // 검색 인덱스
    this.searchIndex = {
      keywords: new Map(),
      relationships: new Map(),
      clusters: new Map()
    };
  }

  /**
   * 네비게이터 초기화
   * @implements initialize-navigator
   * @memberof api-terms
   * @since 1.0.0
   */
  async initialize() {
    console.log('🧭 계층적 네비게이터 초기화...');
    
    // 1. 구조적 분석 데이터 로드
    await this.loadStructuralData();
    
    // 2. 용어 정의 로드
    await this.loadTermDefinitions();
    
    // 3. 네비게이션 인덱스 구축  
    await this.buildNavigationIndexes();
    
    // 4. 검색 인덱스 구축
    await this.buildSearchIndexes();
    
    console.log('✅ 네비게이터 초기화 완료');
  }

  /**
   * 구조적 데이터 로드
   * @implements load-structural-data
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadStructuralData() {
    // 구조적 분석 결과 로드
    const analysisPath = path.join(this.dataPath, 'structural-analysis.json');
    this.structuralAnalysis = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
    
    // 매핑 데이터 로드
    const mappingsPath = path.join(this.dataPath, 'mappings.json');
    this.mappings = JSON.parse(await fs.readFile(mappingsPath, 'utf-8'));
    
    console.log(`📊 ${this.structuralAnalysis.metadata.totalTerms}개 용어 구조 데이터 로드`);
  }

  /**
   * 용어 정의 로드
   * @implements load-term-definitions
   * @memberof api-terms  
   * @since 1.0.0
   */
  async loadTermDefinitions() {
    const termsPath = path.join(__dirname, '../terms');
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md', 'naming-conventions.md'];
    
    for (const filename of termFiles) {
      const category = filename.replace('.md', '');
      const content = await fs.readFile(path.join(termsPath, filename), 'utf-8');
      
      const terms = this.parseMarkdownTerms(content, category);
      terms.forEach(term => {
        this.termDefinitions.set(term.id, term);
      });
    }
    
    console.log(`📖 ${this.termDefinitions.size}개 용어 정의 로드`);
  }

  /**
   * 마크다운 용어 파싱
   * @implements parse-markdown-terms
   * @memberof api-terms
   * @since 1.0.0
   */
  parseMarkdownTerms(content, category) {
    const terms = [];
    const sections = content.split(/\n## /).slice(1);
    
    sections.forEach(section => {
      const lines = section.split('\n');
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
      
      terms.push({
        id,
        title,
        definition,
        relatedTerms,
        category
      });
    });
    
    return terms;
  }

  /**
   * 네비게이션 인덱스 구축
   * @implements build-navigation-indexes
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildNavigationIndexes() {
    // 1. 카테고리별 인덱스
    Object.entries(this.structuralAnalysis.categories).forEach(([categoryId, categoryData]) => {
      const terms = Object.entries(this.mappings.terms)
        .filter(([termId, impls]) => {
          const termDef = this.termDefinitions.get(termId);
          return termDef && termDef.category === categoryId;
        })
        .map(([termId]) => termId);
      
      this.navigationIndex.byCategory.set(categoryId, {
        ...categoryData,
        terms,
        navigation: {
          implemented: terms.filter(termId => this.mappings.terms[termId]?.length > 0),
          notImplemented: terms.filter(termId => !this.mappings.terms[termId] || this.mappings.terms[termId].length === 0)
        }
      });
    });

    // 2. 연결성별 인덱스 (중심성 기반)
    if (this.structuralAnalysis.centrality && this.structuralAnalysis.centrality.rankings) {
      this.structuralAnalysis.centrality.rankings.forEach(([termId, metrics], index) => {
        const level = this.getCentralityLevel(index, this.structuralAnalysis.centrality.rankings.length);
        
        if (!this.navigationIndex.byCentrality.has(level)) {
          this.navigationIndex.byCentrality.set(level, []);
        }
        
        this.navigationIndex.byCentrality.get(level).push({
          termId,
          ...metrics,
          rank: index + 1
        });
      });
    }

    // 3. 구현 수준별 인덱스
    const implementationLevels = {
      'multiple': [], // 다중 구현
      'single': [],   // 단일 구현  
      'none': []      // 미구현
    };

    Object.entries(this.mappings.terms).forEach(([termId, implementations]) => {
      if (implementations.length > 1) {
        implementationLevels.multiple.push({ termId, count: implementations.length });
      } else if (implementations.length === 1) {
        implementationLevels.single.push({ termId, count: 1 });
      } else {
        implementationLevels.none.push({ termId, count: 0 });
      }
    });

    // 정렬
    implementationLevels.multiple.sort((a, b) => b.count - a.count);
    
    Object.entries(implementationLevels).forEach(([level, terms]) => {
      this.navigationIndex.byImplementation.set(level, terms);
    });

    // 4. 의존성 깊이별 인덱스
    if (this.structuralAnalysis.dependencies) {
      Object.entries(this.structuralAnalysis.dependencies.levelDistribution).forEach(([depth, count]) => {
        this.navigationIndex.byDepth.set(parseInt(depth), {
          count,
          terms: [] // 실제로는 더 자세한 분석 필요
        });
      });
    }

    console.log('📇 네비게이션 인덱스 구축 완료');
  }

  /**
   * 검색 인덱스 구축
   * @implements build-search-indexes
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildSearchIndexes() {
    // 1. 키워드 인덱스
    this.termDefinitions.forEach((term, termId) => {
      const keywords = this.extractKeywords(term.title + ' ' + term.definition);
      keywords.forEach(keyword => {
        if (!this.searchIndex.keywords.has(keyword)) {
          this.searchIndex.keywords.set(keyword, []);
        }
        this.searchIndex.keywords.get(keyword).push({
          termId,
          title: term.title,
          relevance: this.calculateKeywordRelevance(keyword, term)
        });
      });
    });

    // 키워드별 관련성 순 정렬
    this.searchIndex.keywords.forEach((terms, keyword) => {
      terms.sort((a, b) => b.relevance - a.relevance);
    });

    // 2. 관계성 인덱스  
    this.termDefinitions.forEach((term, termId) => {
      const relationships = {
        related: term.relatedTerms.map(rt => rt.id),
        coImplemented: this.getCoImplementedTerms(termId),
        sameCategory: this.getSameCategoryTerms(termId, term.category)
      };
      
      this.searchIndex.relationships.set(termId, relationships);
    });

    // 3. 클러스터 인덱스
    if (this.structuralAnalysis.clusters) {
      this.structuralAnalysis.clusters.forEach((cluster, index) => {
        this.searchIndex.clusters.set(cluster.id, {
          ...cluster,
          index,
          termDetails: cluster.terms.map(termId => ({
            termId,
            title: this.termDefinitions.get(termId)?.title || termId,
            implementations: this.mappings.terms[termId]?.length || 0
          }))
        });
      });
    }

    console.log('🔍 검색 인덱스 구축 완료');
  }

  /**
   * 계층적 탐색 - 카테고리 기반
   * @implements navigate-by-category
   * @memberof api-terms
   * @since 1.0.0
   */
  navigateByCategory(categoryId = null) {
    if (!categoryId) {
      // 전체 카테고리 개요
      const categories = Array.from(this.navigationIndex.byCategory.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        termCount: data.termCount, 
        implementationCount: data.implementationCount,
        implementationRate: data.implementationRate,
        status: this.getCategoryStatus(data.implementationRate)
      }));
      
      return {
        type: 'category_overview',
        data: categories.sort((a, b) => b.implementationRate - a.implementationRate),
        navigation: {
          totalCategories: categories.length,
          totalTerms: categories.reduce((sum, cat) => sum + cat.termCount, 0),
          averageImplementation: categories.reduce((sum, cat) => sum + cat.implementationRate, 0) / categories.length
        }
      };
    }

    // 특정 카테고리 상세
    const categoryData = this.navigationIndex.byCategory.get(categoryId);
    if (!categoryData) {
      throw new Error(`Category '${categoryId}' not found`);
    }

    const termDetails = categoryData.terms.map(termId => {
      const termDef = this.termDefinitions.get(termId);
      const implementations = this.mappings.terms[termId] || [];
      
      return {
        id: termId,
        title: termDef?.title || termId,
        definition: termDef?.definition || '',
        implementationCount: implementations.length,
        hasMultipleImpl: implementations.length > 1,
        files: implementations.map(impl => impl.file),
        connections: this.getTermConnections(termId)
      };
    });

    return {
      type: 'category_detail',
      category: {
        id: categoryId,
        ...categoryData
      },
      terms: termDetails.sort((a, b) => b.implementationCount - a.implementationCount),
      navigation: {
        implemented: termDetails.filter(t => t.implementationCount > 0),
        notImplemented: termDetails.filter(t => t.implementationCount === 0),
        multipleImpl: termDetails.filter(t => t.hasMultipleImpl)
      }
    };
  }

  /**
   * 계층적 탐색 - 연결성 기반
   * @implements navigate-by-connectivity
   * @memberof api-terms
   * @since 1.0.0
   */
  navigateByConnectivity(level = 'high') {
    const connectivityLevels = {
      'high': this.navigationIndex.byCentrality.get('high') || [],
      'medium': this.navigationIndex.byCentrality.get('medium') || [],
      'low': this.navigationIndex.byCentrality.get('low') || []
    };

    const levelData = connectivityLevels[level];
    if (!levelData) {
      return {
        type: 'connectivity_overview',
        data: Object.entries(connectivityLevels).map(([level, terms]) => ({
          level,
          count: terms.length,
          avgConnections: terms.reduce((sum, t) => sum + t.degree, 0) / terms.length || 0
        }))
      };
    }

    const termDetails = levelData.map(termData => {
      const termDef = this.termDefinitions.get(termData.termId);
      const implementations = this.mappings.terms[termData.termId] || [];
      
      return {
        ...termData,
        title: termDef?.title || termData.termId,
        definition: termDef?.definition || '',
        category: termDef?.category || 'unknown',
        implementationCount: implementations.length,
        relatedTerms: this.searchIndex.relationships.get(termData.termId)?.related || []
      };
    });

    return {
      type: 'connectivity_detail',
      level,
      terms: termDetails,
      navigation: {
        totalTerms: termDetails.length,
        avgDegree: termDetails.reduce((sum, t) => sum + t.degree, 0) / termDetails.length,
        avgBetweenness: termDetails.reduce((sum, t) => sum + t.betweenness, 0) / termDetails.length
      }
    };
  }

  /**
   * 계층적 탐색 - 구현 수준 기반  
   * @implements navigate-by-implementation
   * @memberof api-terms
   * @since 1.0.0
   */
  navigateByImplementation(level = null) {
    if (!level) {
      // 구현 수준 개요
      const levels = ['multiple', 'single', 'none'];
      const overview = levels.map(level => {
        const terms = this.navigationIndex.byImplementation.get(level) || [];
        return {
          level,
          count: terms.length,
          percentage: (terms.length / this.termDefinitions.size) * 100,
          status: this.getImplementationStatus(level)
        };
      });

      return {
        type: 'implementation_overview', 
        data: overview,
        navigation: {
          totalTerms: this.termDefinitions.size,
          implementedTerms: overview.slice(0, 2).reduce((sum, level) => sum + level.count, 0)
        }
      };
    }

    // 특정 구현 수준 상세
    const levelTerms = this.navigationIndex.byImplementation.get(level);
    if (!levelTerms) {
      throw new Error(`Implementation level '${level}' not found`);
    }

    const termDetails = levelTerms.map(termData => {
      const termDef = this.termDefinitions.get(termData.termId);
      const implementations = this.mappings.terms[termData.termId] || [];
      
      return {
        id: termData.termId,
        title: termDef?.title || termData.termId,
        definition: termDef?.definition || '',
        category: termDef?.category || 'unknown',
        implementationCount: termData.count,
        implementations: implementations.map(impl => ({
          name: impl.name,
          file: impl.file,
          type: impl.type,
          line: impl.line
        })),
        priority: this.calculateImplementationPriority(termData.termId, termData.count)
      };
    });

    return {
      type: 'implementation_detail',
      level,
      terms: termDetails,
      navigation: {
        totalTerms: termDetails.length,
        avgImplementations: termDetails.reduce((sum, t) => sum + t.implementationCount, 0) / termDetails.length,
        highPriority: termDetails.filter(t => t.priority === 'high').length
      }
    };
  }

  /**
   * 구조적 검색
   * @implements structural-search
   * @memberof api-terms
   * @since 1.0.0
   */
  search(query, options = {}) {
    const {
      type = 'keyword', // keyword, relationship, cluster, mixed
      limit = 10,
      includeRelated = true,
      sortBy = 'relevance' // relevance, connections, implementations
    } = options;

    let results = [];

    switch (type) {
      case 'keyword':
        results = this.searchByKeyword(query, limit);
        break;
      case 'relationship':
        results = this.searchByRelationship(query, limit);
        break;
      case 'cluster':
        results = this.searchByCluster(query, limit);  
        break;
      case 'mixed':
        results = this.searchMixed(query, limit);
        break;
      default:
        throw new Error(`Unknown search type: ${type}`);
    }

    // 관련 용어 포함
    if (includeRelated && results.length > 0) {
      results = results.map(result => ({
        ...result,
        relatedTerms: this.getRelatedTerms(result.termId, 3)
      }));
    }

    // 정렬
    results = this.sortSearchResults(results, sortBy);

    return {
      query,
      type,
      resultCount: results.length,
      results: results.slice(0, limit),
      navigation: {
        hasMore: results.length > limit,
        searchSuggestions: this.generateSearchSuggestions(query, results)
      }
    };
  }

  /**
   * 키워드 검색
   * @implements search-by-keyword
   * @memberof api-terms
   * @since 1.0.0
   */
  searchByKeyword(query, limit) {
    const keywords = this.extractKeywords(query);
    const results = new Map();

    keywords.forEach(keyword => {
      const matches = this.searchIndex.keywords.get(keyword.toLowerCase()) || [];
      matches.forEach(match => {
        if (results.has(match.termId)) {
          results.get(match.termId).relevance += match.relevance;
          results.get(match.termId).matchedKeywords.push(keyword);
        } else {
          results.set(match.termId, {
            termId: match.termId,
            title: match.title,
            relevance: match.relevance,
            matchedKeywords: [keyword],
            type: 'keyword',
            searchContext: this.getSearchContext(match.termId)
          });
        }
      });
    });

    return Array.from(results.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * 관계성 검색
   * @implements search-by-relationship
   * @memberof api-terms
   * @since 1.0.0
   */
  searchByRelationship(termId, limit) {
    const relationships = this.searchIndex.relationships.get(termId);
    if (!relationships) {
      return [];
    }

    const results = [];

    // 직접 관련 용어들
    relationships.related.forEach(relatedId => {
      const termDef = this.termDefinitions.get(relatedId);
      if (termDef) {
        results.push({
          termId: relatedId,
          title: termDef.title,
          relevance: 1.0,
          relationshipType: 'semantic',
          type: 'relationship',
          searchContext: this.getSearchContext(relatedId)
        });
      }
    });

    // 공동 구현 용어들
    relationships.coImplemented.forEach(coImplId => {
      const termDef = this.termDefinitions.get(coImplId);
      if (termDef) {
        results.push({
          termId: coImplId,
          title: termDef.title,
          relevance: 0.8,
          relationshipType: 'co_implementation',
          type: 'relationship',
          searchContext: this.getSearchContext(coImplId)
        });
      }
    });

    // 동일 카테고리 용어들
    relationships.sameCategory.forEach(sameCatId => {
      const termDef = this.termDefinitions.get(sameCatId);
      if (termDef) {
        results.push({
          termId: sameCatId, 
          title: termDef.title,
          relevance: 0.6,
          relationshipType: 'same_category',
          type: 'relationship',
          searchContext: this.getSearchContext(sameCatId)
        });
      }
    });

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // 유틸리티 메서드들
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

  extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\\s]/g, ' ')
      .split(/\\s+/)
      .filter(word => word.length >= 3)
      .filter(word => !['the', 'and', 'for', 'with', 'that', 'this'].includes(word));
  }

  getCentralityLevel(index, total) {
    const ratio = index / total;
    if (ratio < 0.2) return 'high';
    if (ratio < 0.6) return 'medium';
    return 'low';
  }

  getCategoryStatus(implementationRate) {
    if (implementationRate >= 0.8) return { text: '완료', color: 'green', icon: '✅' };
    if (implementationRate >= 0.5) return { text: '진행중', color: 'yellow', icon: '🟡' };
    if (implementationRate >= 0.2) return { text: '개선필요', color: 'orange', icon: '🟠' };
    return { text: '시작단계', color: 'red', icon: '🔴' };
  }

  getImplementationStatus(level) {
    const statuses = {
      'multiple': { text: '다중구현', color: 'green', icon: '🟢' },
      'single': { text: '단일구현', color: 'blue', icon: '🔵' },
      'none': { text: '미구현', color: 'red', icon: '🔴' }
    };
    return statuses[level] || { text: '알수없음', color: 'gray', icon: '⚫' };
  }

  getTermConnections(termId) {
    const relationships = this.searchIndex.relationships.get(termId);
    if (!relationships) return 0;
    
    return relationships.related.length + 
           relationships.coImplemented.length + 
           relationships.sameCategory.length;
  }

  getCoImplementedTerms(termId) {
    // 실제 구현에서는 구조적 분석 데이터에서 추출
    return [];
  }

  getSameCategoryTerms(termId, category) {
    return Array.from(this.termDefinitions.entries())
      .filter(([id, term]) => id !== termId && term.category === category)
      .map(([id]) => id);
  }

  calculateKeywordRelevance(keyword, term) {
    let relevance = 0;
    
    // 제목에 포함되면 높은 점수
    if (term.title.toLowerCase().includes(keyword)) {
      relevance += 2.0;
    }
    
    // 정의에 포함되면 중간 점수  
    if (term.definition.toLowerCase().includes(keyword)) {
      relevance += 1.0;
    }
    
    return relevance;
  }

  calculateImplementationPriority(termId, implementationCount) {
    const connections = this.getTermConnections(termId);
    
    if (implementationCount === 0 && connections >= 3) return 'high';
    if (implementationCount === 1 && connections >= 5) return 'medium';
    return 'low';
  }

  getSearchContext(termId) {
    const termDef = this.termDefinitions.get(termId);
    const implementations = this.mappings.terms[termId] || [];
    
    return {
      category: termDef?.category || 'unknown',
      implementationCount: implementations.length,
      connections: this.getTermConnections(termId)
    };
  }

  getRelatedTerms(termId, limit = 3) {
    const relationships = this.searchIndex.relationships.get(termId);
    if (!relationships) return [];
    
    return relationships.related
      .slice(0, limit)
      .map(relatedId => {
        const termDef = this.termDefinitions.get(relatedId);
        return {
          id: relatedId,
          title: termDef?.title || relatedId
        };
      });
  }

  sortSearchResults(results, sortBy) {
    switch (sortBy) {
      case 'relevance':
        return results.sort((a, b) => b.relevance - a.relevance);
      case 'connections':
        return results.sort((a, b) => 
          (b.searchContext?.connections || 0) - (a.searchContext?.connections || 0)
        );
      case 'implementations':
        return results.sort((a, b) => 
          (b.searchContext?.implementationCount || 0) - (a.searchContext?.implementationCount || 0)
        );
      default:
        return results;
    }
  }

  generateSearchSuggestions(query, results) {
    // 검색 결과 기반 추천 검색어 생성
    const suggestions = [];
    
    results.slice(0, 3).forEach(result => {
      if (result.relatedTerms) {
        result.relatedTerms.forEach(related => {
          suggestions.push(related.title);
        });
      }
    });
    
    return [...new Set(suggestions)].slice(0, 5);
  }

  searchByCluster(query, limit) {
    // 클러스터 기반 검색 (단순화된 구현)
    const results = [];
    
    this.searchIndex.clusters.forEach((cluster, clusterId) => {
      if (cluster.termDetails.some(term => 
        term.title.toLowerCase().includes(query.toLowerCase())
      )) {
        cluster.termDetails.forEach(term => {
          results.push({
            termId: term.termId,
            title: term.title,
            relevance: 0.7,
            type: 'cluster',
            clusterId,
            searchContext: this.getSearchContext(term.termId)
          });
        });
      }
    });
    
    return results.slice(0, limit);
  }

  searchMixed(query, limit) {
    // 키워드 + 관계성 혼합 검색
    const keywordResults = this.searchByKeyword(query, Math.floor(limit * 0.7));
    const relationshipResults = [];
    
    // 키워드 결과의 관련 용어들 추가
    keywordResults.slice(0, 2).forEach(result => {
      const related = this.searchByRelationship(result.termId, 2);
      relationshipResults.push(...related);
    });
    
    return [...keywordResults, ...relationshipResults].slice(0, limit);
  }
}

// CLI 인터페이스
if (require.main === module) {
  const navigator = new HierarchicalNavigator();
  
  async function runCLI() {
    try {
      await navigator.initialize();
      
      console.log('\\n🧭 계층적 네비게이터가 준비되었습니다!');
      console.log('\\n사용 가능한 명령어:');
      console.log('1. 카테고리 탐색: navigateByCategory()');
      console.log('2. 연결성 탐색: navigateByConnectivity()');
      console.log('3. 구현 수준 탐색: navigateByImplementation()');
      console.log('4. 구조적 검색: search()');
      
      // 예제 실행
      console.log('\\n📊 카테고리 개요:');
      const categoryOverview = navigator.navigateByCategory();
      console.log(JSON.stringify(categoryOverview, null, 2));
      
      console.log('\\n🔍 키워드 검색 예제 (action):');
      const searchResults = navigator.search('action', { type: 'keyword', limit: 3 });
      console.log(JSON.stringify(searchResults, null, 2));
      
    } catch (error) {
      console.error('❌ 네비게이터 실행 오류:', error);
    }
  }
  
  runCLI();
}

module.exports = { HierarchicalNavigator };