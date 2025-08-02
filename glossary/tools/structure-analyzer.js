#!/usr/bin/env node

/**
 * @fileoverview 구조적 정보 추출 및 관계 분석 도구
 * @implements structure-analyzer
 * @implements relationship-mapper
 * @memberof glossary-tools
 * @version 1.0.0
 * 
 * Context-Action 프레임워크 용어집의 구조적 정보를 추출하고
 * 용어 간의 관계, 의존성, 계층 구조를 분석하는 도구입니다.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 구조 분석기 클래스
 * @implements structural-analysis-engine
 * @memberof core-concepts
 * @since 1.0.0
 */
class StructureAnalyzer {
  constructor() {
    this.termsPath = path.join(__dirname, '../terms');
    this.dataPath = path.join(__dirname, '../implementations/_data');
    
    // 분석 결과 저장
    this.termDefinitions = new Map();
    this.implementations = new Map();
    this.relationships = new Map();
    this.categories = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * 전체 구조 분석 실행
   * @implements analyze-structure
   * @memberof api-terms
   * @since 1.0.0
   */
  async analyze() {
    console.log('🔍 구조적 정보 추출 시작...');
    
    // 1. 용어 정의 로드
    await this.loadTermDefinitions();
    
    // 2. 구현 매핑 로드  
    await this.loadImplementations();
    
    // 3. 관계성 추출
    await this.extractRelationships();
    
    // 4. 의존성 그래프 구축
    await this.buildDependencyGraph();
    
    // 5. 구조적 분석 결과 생성
    const analysis = await this.generateStructuralAnalysis();
    
    // 6. 결과 저장
    await this.saveAnalysisResults(analysis);
    
    console.log('✅ 구조적 정보 추출 완료!');
    return analysis;
  }

  /**
   * 용어 정의 파일들 로드
   * @implements load-term-definitions
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadTermDefinitions() {
    const termFiles = ['core-concepts.md', 'api-terms.md', 'architecture-terms.md', 'naming-conventions.md'];
    
    for (const filename of termFiles) {
      const category = filename.replace('.md', '');
      const content = await fs.readFile(path.join(this.termsPath, filename), 'utf-8');
      
      const terms = this.parseMarkdownTerms(content, category);
      this.categories.set(category, terms);
      
      // 전체 용어 맵에 추가
      terms.forEach(term => {
        this.termDefinitions.set(term.id, {
          ...term,
          category
        });
      });
    }
    
    console.log(`📖 ${this.termDefinitions.size}개 용어 정의 로드 완료`);
  }

  /**
   * 마크다운에서 용어 정의 파싱
   * @implements parse-markdown-terms
   * @memberof api-terms
   * @since 1.0.0
   */
  parseMarkdownTerms(content, category) {
    const terms = [];
    const sections = content.split(/\\n## /).slice(1); // 첫 번째는 헤더이므로 제외
    
    sections.forEach(section => {
      const lines = section.split('\\n');
      const title = lines[0].trim();
      const id = this.titleToId(title);
      
      let definition = '';
      let usageContext = [];
      let keyCharacteristics = [];
      let relatedTerms = [];
      
      let currentSection = '';
      let collectingList = false;
      
      lines.slice(1).forEach(line => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('**Definition**:')) {
          definition = trimmed.replace('**Definition**:', '').trim();
          currentSection = 'definition';
        } else if (trimmed.startsWith('**Usage Context**:')) {
          currentSection = 'usage';
          collectingList = true;
        } else if (trimmed.startsWith('**Key Characteristics**:') || trimmed.startsWith('**Key Methods**:') || trimmed.startsWith('**Key Features**:')) {
          currentSection = 'characteristics';
          collectingList = true;
        } else if (trimmed.startsWith('**Related Terms**:')) {
          currentSection = 'related';
          // Related Terms 파싱
          const relatedText = trimmed.replace('**Related Terms**:', '').trim();
          relatedTerms = this.parseRelatedTerms(relatedText);
        } else if (collectingList && trimmed.startsWith('- ')) {
          const item = trimmed.substring(2).trim();
          if (currentSection === 'usage') {
            usageContext.push(item);
          } else if (currentSection === 'characteristics') {
            keyCharacteristics.push(item);
          }
        } else if (trimmed === '' || trimmed.startsWith('---')) {
          collectingList = false;
        }
      });
      
      terms.push({
        id,
        title,
        definition,
        usageContext,
        keyCharacteristics,
        relatedTerms,
        category
      });
    });
    
    return terms;
  }

  /**
   * 제목을 ID로 변환
   * @implements title-to-id
   * @memberof api-terms
   * @since 1.0.0
   */
  titleToId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Related Terms 파싱
   * @implements parse-related-terms
   * @memberof api-terms
   * @since 1.0.0
   */
  parseRelatedTerms(text) {
    const terms = [];
    const linkPattern = /\\[([^\\]]+)\\]\\(([^)]+)\\)/g;
    let match;
    
    while ((match = linkPattern.exec(text)) !== null) {
      const [, title, link] = match;
      const id = this.extractIdFromLink(link);
      terms.push({
        title: title.trim(),
        id,
        link: link.trim()
      });
    }
    
    return terms;
  }

  /**
   * 링크에서 ID 추출
   * @implements extract-id-from-link
   * @memberof api-terms
   * @since 1.0.0
   */
  extractIdFromLink(link) {
    if (link.startsWith('#')) {
      return link.substring(1);
    } else if (link.includes('#')) {
      return link.split('#')[1];
    }
    return this.titleToId(link);
  }

  /**
   * 구현 매핑 로드
   * @implements load-implementations
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadImplementations() {
    const mappingsPath = path.join(this.dataPath, 'mappings.json');
    const content = await fs.readFile(mappingsPath, 'utf-8');
    const data = JSON.parse(content);
    
    Object.entries(data.terms).forEach(([termId, implementations]) => {
      this.implementations.set(termId, implementations.map(impl => ({
        ...impl,
        termId,
        // 관련 용어들 추출
        relatedTerms: (impl.implements || []).filter(term => term !== termId)
      })));
    });
    
    console.log(`🔗 ${Object.keys(data.terms).length}개 용어의 구현 매핑 로드 완료`);
  }

  /**
   * 관계성 추출
   * @implements extract-relationships
   * @memberof api-terms
   * @since 1.0.0
   */
  async extractRelationships() {
    // 1. 정의 기반 관계성 (Related Terms)
    this.termDefinitions.forEach((term, termId) => {
      if (!this.relationships.has(termId)) {
        this.relationships.set(termId, {
          references: [], // 이 용어가 참조하는 용어들
          referencedBy: [], // 이 용어를 참조하는 용어들
          coImplemented: [], // 함께 구현된 용어들
          sameCategory: [], // 같은 카테고리 용어들
          implementations: [] // 구현체들
        });
      }
      
      const rel = this.relationships.get(termId);
      
      // Related Terms 관계 추가
      term.relatedTerms.forEach(relatedTerm => {
        rel.references.push({
          type: 'semantic_reference',
          targetId: relatedTerm.id,
          targetTitle: relatedTerm.title,
          source: 'term_definition'
        });
        
        // 역방향 관계도 추가
        if (!this.relationships.has(relatedTerm.id)) {
          this.relationships.set(relatedTerm.id, {
            references: [],
            referencedBy: [],
            coImplemented: [],
            sameCategory: [],
            implementations: []
          });
        }
        
        const reverseRel = this.relationships.get(relatedTerm.id);
        reverseRel.referencedBy.push({
          type: 'semantic_reference',
          sourceId: termId,
          sourceTitle: term.title,
          source: 'term_definition'
        });
      });
    });
    
    // 2. 구현 기반 관계성 (co-implementation)
    this.implementations.forEach((impls, termId) => {
      if (!this.relationships.has(termId)) {
        this.relationships.set(termId, {
          references: [],
          referencedBy: [],
          coImplemented: [],
          sameCategory: [],
          implementations: []
        });
      }
      
      const rel = this.relationships.get(termId);
      
      impls.forEach(impl => {
        // 구현체 정보 추가
        rel.implementations.push({
          file: impl.file,
          name: impl.name,
          type: impl.type,
          line: impl.line,
          description: impl.description
        });
        
        // 함께 구현된 용어들 (co-implementation)
        if (impl.implements && impl.implements.length > 1) {
          impl.implements.forEach(coTerm => {
            if (coTerm !== termId) {
              rel.coImplemented.push({
                type: 'co_implementation',
                targetId: coTerm,
                file: impl.file,
                implementation: impl.name,
                strength: impl.implements.length // 함께 구현된 용어 수가 많을수록 강한 관계
              });
            }
          });
        }
      });
    });
    
    // 3. 카테고리 기반 관계성
    this.categories.forEach((terms, category) => {
      terms.forEach(term => {
        const rel = this.relationships.get(term.id);
        if (rel) {
          rel.sameCategory = terms
            .filter(t => t.id !== term.id)
            .map(t => ({
              type: 'same_category',
              targetId: t.id,
              targetTitle: t.title,
              category
            }));
        }
      });
    });
    
    console.log(`🕸️ ${this.relationships.size}개 용어의 관계성 추출 완료`);
  }

  /**
   * 의존성 그래프 구축
   * @implements build-dependency-graph
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildDependencyGraph() {
    this.relationships.forEach((rel, termId) => {
      const dependencies = [];
      const dependents = [];
      
      // 의미적 참조를 의존성으로 간주
      rel.references.forEach(ref => {
        if (ref.type === 'semantic_reference') {
          dependencies.push({
            id: ref.targetId,
            type: 'semantic',
            strength: 1
          });
        }
      });
      
      rel.referencedBy.forEach(ref => {
        if (ref.type === 'semantic_reference') {
          dependents.push({
            id: ref.sourceId,
            type: 'semantic',
            strength: 1
          });
        }
      });
      
      // 공동 구현 관계를 약한 의존성으로 간주
      rel.coImplemented.forEach(coImpl => {
        dependencies.push({
          id: coImpl.targetId,
          type: 'co_implementation',
          strength: 1 / coImpl.strength // 함께 구현된 용어가 많을수록 약한 의존성
        });
      });
      
      this.dependencyGraph.set(termId, {
        dependencies, // 이 용어가 의존하는 용어들
        dependents,   // 이 용어에 의존하는 용어들
        depth: 0,     // 의존성 깊이 (나중에 계산)
        level: 0      // 계층 레벨 (나중에 계산)
      });
    });
    
    // 의존성 깊이 계산
    this.calculateDependencyDepths();
    
    console.log(`📊 ${this.dependencyGraph.size}개 용어의 의존성 그래프 구축 완료`);
  }

  /**
   * 의존성 깊이 계산
   * @implements calculate-dependency-depths
   * @memberof api-terms
   * @since 1.0.0
   */
  calculateDependencyDepths() {
    const visited = new Set();
    const calculating = new Set();
    
    const calculateDepth = (termId) => {
      if (calculating.has(termId)) {
        // 순환 의존성 감지
        return 0;
      }
      
      if (visited.has(termId)) {
        return this.dependencyGraph.get(termId)?.depth || 0;
      }
      
      calculating.add(termId);
      
      const node = this.dependencyGraph.get(termId);
      if (!node) {
        calculating.delete(termId);
        return 0;
      }
      
      let maxDepth = 0;
      node.dependencies.forEach(dep => {
        const depDepth = calculateDepth(dep.id);
        maxDepth = Math.max(maxDepth, depDepth + 1);
      });
      
      node.depth = maxDepth;
      visited.add(termId);
      calculating.delete(termId);
      
      return maxDepth;
    };
    
    // 모든 용어의 깊이 계산
    this.dependencyGraph.forEach((_, termId) => {
      calculateDepth(termId);
    });
  }

  /**
   * 구조적 분석 결과 생성
   * @implements generate-structural-analysis
   * @memberof api-terms
   * @since 1.0.0
   */
  async generateStructuralAnalysis() {
    const analysis = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        totalTerms: this.termDefinitions.size,
        totalImplementations: Array.from(this.implementations.values()).reduce((sum, impls) => sum + impls.length, 0),
        totalRelationships: Array.from(this.relationships.values()).reduce((sum, rel) => 
          sum + rel.references.length + rel.coImplemented.length, 0)
      },
      
      // 카테고리 분석
      categories: this.analyzeCategoryStructure(),
      
      // 관계성 분석
      relationships: this.analyzeRelationshipPatterns(),
      
      // 의존성 분석
      dependencies: this.analyzeDependencyStructure(),
      
      // 구현 분석
      implementations: this.analyzeImplementationPatterns(),
      
      // 중심성 분석 (가장 연결된 용어들)
      centrality: this.analyzeCentrality(),
      
      // 클러스터 분석 (관련 용어 그룹)
      clusters: this.analyzeClusters()
    };
    
    return analysis;
  }

  /**
   * 카테고리 구조 분석
   * @implements analyze-category-structure
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeCategoryStructure() {
    const categoryAnalysis = {};
    
    this.categories.forEach((terms, category) => {
      const implementations = terms.reduce((count, term) => {
        const impls = this.implementations.get(term.id);
        return count + (impls ? impls.length : 0);
      }, 0);
      
      const relationships = terms.reduce((count, term) => {
        const rel = this.relationships.get(term.id);
        return count + (rel ? rel.references.length + rel.coImplemented.length : 0);
      }, 0);
      
      categoryAnalysis[category] = {
        termCount: terms.length,
        implementationCount: implementations,
        relationshipCount: relationships,
        implementationRate: implementations / terms.length,
        averageRelationships: relationships / terms.length,
        
        // 카테고리 간 연결성
        crossCategoryReferences: this.analyzeCrossCategoryReferences(category, terms)
      };
    });
    
    return categoryAnalysis;
  }

  /**
   * 카테고리 간 참조 분석
   * @implements analyze-cross-category-references
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeCrossCategoryReferences(category, terms) {
    const crossRefs = {};
    
    terms.forEach(term => {
      const rel = this.relationships.get(term.id);
      if (rel) {
        rel.references.forEach(ref => {
          const targetTerm = this.termDefinitions.get(ref.targetId);
          if (targetTerm && targetTerm.category !== category) {
            crossRefs[targetTerm.category] = (crossRefs[targetTerm.category] || 0) + 1;
          }
        });
      }
    });
    
    return crossRefs;
  }

  /**
   * 관계성 패턴 분석
   * @implements analyze-relationship-patterns
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeRelationshipPatterns() {
    const patterns = {
      semanticReferences: 0,
      coImplementations: 0,
      stronglyConnected: [], // 강하게 연결된 용어들
      weaklyConnected: []    // 약하게 연결된 용어들
    };
    
    this.relationships.forEach((rel, termId) => {
      const totalConnections = rel.references.length + rel.referencedBy.length + rel.coImplemented.length;
      
      patterns.semanticReferences += rel.references.filter(r => r.type === 'semantic_reference').length;
      patterns.coImplementations += rel.coImplemented.length;
      
      if (totalConnections >= 5) {
        patterns.stronglyConnected.push({
          id: termId,
          connections: totalConnections,
          types: {
            semantic: rel.references.filter(r => r.type === 'semantic_reference').length,
            coImplemented: rel.coImplemented.length,
            referenced: rel.referencedBy.length
          }
        });
      } else if (totalConnections <= 1) {
        patterns.weaklyConnected.push({
          id: termId,
          connections: totalConnections
        });
      }
    });
    
    // 연결성에 따라 정렬
    patterns.stronglyConnected.sort((a, b) => b.connections - a.connections);
    
    return patterns;
  }

  /**
   * 의존성 구조 분석
   * @implements analyze-dependency-structure
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeDependencyStructure() {
    const depthMap = new Map();
    const levelCounts = {};
    
    this.dependencyGraph.forEach((node, termId) => {
      const depth = node.depth;
      depthMap.set(termId, depth);
      levelCounts[depth] = (levelCounts[depth] || 0) + 1;
    });
    
    return {
      maxDepth: Math.max(...depthMap.values()),
      levelDistribution: levelCounts,
      
      // 최상위 용어들 (의존성이 가장 적은)
      topLevel: Array.from(depthMap.entries())
        .filter(([, depth]) => depth === 0)
        .map(([termId]) => termId),
      
      // 가장 깊은 의존성을 가진 용어들
      deepest: Array.from(depthMap.entries())
        .filter(([, depth]) => depth === Math.max(...depthMap.values()))
        .map(([termId]) => termId),
      
      // 순환 의존성 감지
      circularDependencies: this.detectCircularDependencies()
    };
  }

  /**
   * 순환 의존성 감지
   * @implements detect-circular-dependencies
   * @memberof api-terms
   * @since 1.0.0
   */
  detectCircularDependencies() {
    const visited = new Set();
    const recStack = new Set();
    const cycles = [];
    
    const hasCycle = (termId, path = []) => {
      if (recStack.has(termId)) {
        const cycleStart = path.indexOf(termId);
        cycles.push(path.slice(cycleStart).concat([termId]));
        return true;
      }
      
      if (visited.has(termId)) {
        return false;
      }
      
      visited.add(termId);
      recStack.add(termId);
      path.push(termId);
      
      const node = this.dependencyGraph.get(termId);
      if (node) {
        for (const dep of node.dependencies) {
          if (hasCycle(dep.id, [...path])) {
            // 사이클 발견했지만 계속 탐색
          }
        }
      }
      
      recStack.delete(termId);
      return false;
    };
    
    this.dependencyGraph.forEach((_, termId) => {
      if (!visited.has(termId)) {
        hasCycle(termId);
      }
    });
    
    return cycles;
  }

  /**
   * 구현 패턴 분석
   * @implements analyze-implementation-patterns
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeImplementationPatterns() {
    const patterns = {
      byType: {},
      byFile: {},
      multipleImplementations: [],
      singleImplementations: [],
      noImplementations: []
    };
    
    // 구현 타입별 분석
    this.implementations.forEach((impls, termId) => {
      impls.forEach(impl => {
        patterns.byType[impl.type] = (patterns.byType[impl.type] || 0) + 1;
        
        const dir = path.dirname(impl.file);
        patterns.byFile[dir] = (patterns.byFile[dir] || 0) + 1;
      });
      
      if (impls.length > 1) {
        patterns.multipleImplementations.push({
          id: termId,
          count: impls.length,
          files: impls.map(impl => impl.file)
        });
      } else {
        patterns.singleImplementations.push(termId);
      }
    });
    
    // 구현되지 않은 용어들
    this.termDefinitions.forEach((term, termId) => {
      if (!this.implementations.has(termId)) {
        patterns.noImplementations.push(termId);
      }
    });
    
    return patterns;
  }

  /**
   * 중심성 분석 (네트워크 분석)
   * @implements analyze-centrality
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeCentrality() {
    const centrality = {};
    
    this.relationships.forEach((rel, termId) => {
      // Degree Centrality (연결 수)
      const degreeCentrality = rel.references.length + rel.referencedBy.length + rel.coImplemented.length;
      
      // Betweenness Centrality 계산 (간소화된 버전)
      const betweennessCentrality = this.calculateBetweennessCentrality(termId);
      
      centrality[termId] = {
        degree: degreeCentrality,
        betweenness: betweennessCentrality,
        // 구현 중심성 (구현이 많을수록 중요)
        implementation: this.implementations.get(termId)?.length || 0
      };
    });
    
    // 중심성 순으로 정렬
    const sortedByCentrality = Object.entries(centrality)
      .sort(([,a], [,b]) => (b.degree + b.betweenness + b.implementation) - (a.degree + a.betweenness + a.implementation))
      .slice(0, 10);
    
    return {
      rankings: sortedByCentrality,
      metrics: centrality
    };
  }

  /**
   * 간소화된 Betweenness Centrality 계산
   * @implements calculate-betweenness-centrality
   * @memberof api-terms
   * @since 1.0.0
   */
  calculateBetweennessCentrality(termId) {
    // 실제 betweenness centrality는 복잡하므로, 
    // 여기서는 간접 연결의 수를 기준으로 근사치 계산
    const rel = this.relationships.get(termId);
    if (!rel) return 0;
    
    let indirectConnections = 0;
    
    // 이 용어를 거쳐 연결되는 용어 쌍의 수 추정
    rel.references.forEach(ref => {
      const targetRel = this.relationships.get(ref.targetId);
      if (targetRel) {
        indirectConnections += targetRel.references.length;
      }
    });
    
    return indirectConnections;
  }

  /**
   * 클러스터 분석 (관련 용어 그룹)
   * @implements analyze-clusters
   * @memberof api-terms
   * @since 1.0.0
   */
  analyzeClusters() {
    const clusters = [];
    const visited = new Set();
    
    this.relationships.forEach((rel, termId) => {
      if (visited.has(termId)) return;
      
      const cluster = this.findCluster(termId, visited);
      if (cluster.length >= 3) { // 최소 3개 이상의 용어로 구성된 클러스터만
        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          terms: cluster,
          size: cluster.length,
          // 클러스터 내 연결 밀도
          density: this.calculateClusterDensity(cluster)
        });
      }
    });
    
    return clusters.sort((a, b) => b.density - a.density);
  }

  /**
   * 클러스터 찾기 (연결된 용어들)
   * @implements find-cluster
   * @memberof api-terms
   * @since 1.0.0
   */
  findCluster(startTermId, visited) {
    const cluster = [];
    const toVisit = [startTermId];
    
    while (toVisit.length > 0) {
      const termId = toVisit.pop();
      if (visited.has(termId)) continue;
      
      visited.add(termId);
      cluster.push(termId);
      
      const rel = this.relationships.get(termId);
      if (rel) {
        // 강한 연결 관계만 클러스터에 포함
        rel.references.forEach(ref => {
          if (!visited.has(ref.targetId) && ref.type === 'semantic_reference') {
            toVisit.push(ref.targetId);
          }
        });
        
        rel.coImplemented.forEach(coImpl => {
          if (!visited.has(coImpl.targetId) && coImpl.strength >= 0.5) {
            toVisit.push(coImpl.targetId);
          }
        });
      }
    }
    
    return cluster;
  }

  /**
   * 클러스터 밀도 계산
   * @implements calculate-cluster-density
   * @memberof api-terms
   * @since 1.0.0
   */
  calculateClusterDensity(cluster) {
    if (cluster.length < 2) return 0;
    
    const maxPossibleEdges = cluster.length * (cluster.length - 1) / 2;
    let actualEdges = 0;
    
    cluster.forEach(termId => {
      const rel = this.relationships.get(termId);
      if (rel) {
        rel.references.forEach(ref => {
          if (cluster.includes(ref.targetId)) {
            actualEdges++;
          }
        });
        
        rel.coImplemented.forEach(coImpl => {
          if (cluster.includes(coImpl.targetId)) {
            actualEdges++;
          }
        });
      }
    });
    
    return actualEdges / maxPossibleEdges;
  }

  /**
   * 분석 결과 저장
   * @implements save-analysis-results
   * @memberof api-terms
   * @since 1.0.0
   */
  async saveAnalysisResults(analysis) {
    // 1. 구조적 분석 결과 저장
    const analysisPath = path.join(this.dataPath, 'structural-analysis.json');
    await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
    
    // 2. 관계성 그래프 저장 (시각화용)
    const graphPath = path.join(this.dataPath, 'relationship-graph.json');
    const graphData = {
      nodes: Array.from(this.termDefinitions.entries()).map(([id, term]) => ({
        id,
        title: term.title,
        category: term.category,
        implementations: this.implementations.get(id)?.length || 0,
        connections: this.relationships.get(id) ? 
          (this.relationships.get(id).references.length + 
           this.relationships.get(id).referencedBy.length + 
           this.relationships.get(id).coImplemented.length) : 0
      })),
      edges: this.buildGraphEdges()
    };
    await fs.writeFile(graphPath, JSON.stringify(graphData, null, 2));
    
    // 3. 의존성 그래프 저장
    const depGraphPath = path.join(this.dataPath, 'dependency-graph.json');
    const depGraphData = Object.fromEntries(this.dependencyGraph);
    await fs.writeFile(depGraphPath, JSON.stringify(depGraphData, null, 2));
    
    console.log(`💾 분석 결과 저장 완료:`);
    console.log(`   📊 ${analysisPath}`);
    console.log(`   🕸️ ${graphPath}`);
    console.log(`   📈 ${depGraphPath}`);
  }

  /**
   * 그래프 엣지 구축
   * @implements build-graph-edges
   * @memberof api-terms
   * @since 1.0.0
   */
  buildGraphEdges() {
    const edges = [];
    
    this.relationships.forEach((rel, sourceId) => {
      rel.references.forEach(ref => {
        edges.push({
          source: sourceId,
          target: ref.targetId,
          type: ref.type,
          weight: 1
        });
      });
      
      rel.coImplemented.forEach(coImpl => {
        edges.push({
          source: sourceId,
          target: coImpl.targetId,
          type: coImpl.type,
          weight: coImpl.strength,
          file: coImpl.file
        });
      });
    });
    
    return edges;
  }
}

// CLI 실행
if (require.main === module) {
  const analyzer = new StructureAnalyzer();
  analyzer.analyze()
    .then(() => {
      console.log('🎉 구조적 분석 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 분석 중 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { StructureAnalyzer };