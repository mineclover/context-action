#!/usr/bin/env node

/**
 * @fileoverview 관계형 데이터 모델 및 쿼리 엔진
 * @implements relational-data-model
 * @implements query-engine
 * @memberof glossary-tools
 * @version 1.0.0
 * 
 * 용어집 데이터를 관계형 모델로 변환하고 복잡한 쿼리를 지원하는 시스템
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * 관계형 데이터 모델 클래스
 * @implements relational-model-engine
 * @memberof core-concepts
 * @since 1.0.0
 */
class RelationalModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../implementations/_data');
    
    // 관계형 테이블들
    this.tables = {
      // 기본 엔티티 테이블들
      terms: new Map(),           // 용어 정보
      categories: new Map(),      // 카테고리 정보  
      implementations: new Map(), // 구현체 정보
      files: new Map(),          // 파일 정보
      
      // 관계 테이블들 (Many-to-Many)
      term_relationships: [],    // 용어 간 관계
      term_implementations: [],  // 용어-구현체 관계
      term_categories: [],       // 용어-카테고리 관계
      implementation_files: [],  // 구현체-파일 관계
      category_hierarchies: []   // 카테고리 계층
    };
    
    // 인덱스들 (빠른 검색용)
    this.indexes = {
      termsByCategory: new Map(),
      termsByImplementation: new Map(),
      implementationsByFile: new Map(),
      relationshipsByType: new Map(),
      termsByKeyword: new Map()
    };
  }

  /**
   * 데이터 로드 및 관계형 모델 구축
   * @implements load-and-build-model
   * @memberof api-terms
   * @since 1.0.0
   */
  async loadAndBuild() {
    console.log('📊 관계형 데이터 모델 구축 시작...');
    
    // 1. 구조적 분석 결과 로드
    const analysisPath = path.join(this.dataPath, 'structural-analysis.json');
    const analysis = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
    
    // 2. 매핑 데이터 로드
    const mappingsPath = path.join(this.dataPath, 'mappings.json');
    const mappings = JSON.parse(await fs.readFile(mappingsPath, 'utf-8'));
    
    // 3. 관계형 테이블 구축
    await this.buildEntityTables(analysis, mappings);
    await this.buildRelationshipTables(analysis, mappings);
    
    // 4. 인덱스 구축
    await this.buildIndexes();
    
    console.log('✅ 관계형 데이터 모델 구축 완료');
    return this.tables;
  }

  /**
   * 엔티티 테이블 구축
   * @implements build-entity-tables
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildEntityTables(analysis, mappings) {
    // 1. Terms 테이블
    Object.entries(analysis.categories).forEach(([categoryName, categoryData]) => {
      // 카테고리 정보도 저장
      this.tables.categories.set(categoryName, {
        id: categoryName,
        name: categoryData.name || this.formatCategoryName(categoryName),
        termCount: categoryData.termCount,
        implementationCount: categoryData.implementationCount,
        implementationRate: categoryData.implementationRate,
        averageRelationships: categoryData.averageRelationships
      });
    });

    // 용어 정보는 mappings에서 추출 (구현된 용어들)
    Object.entries(mappings.terms).forEach(([termId, implementations]) => {
      if (implementations.length > 0) {
        const firstImpl = implementations[0];
        this.tables.terms.set(termId, {
          id: termId,
          title: this.formatTermTitle(termId),
          description: firstImpl.description || '',
          category: firstImpl.memberOf?.[0] || 'uncategorized',
          implementationCount: implementations.length,
          createdAt: firstImpl.since || '1.0.0',
          lastModified: firstImpl.lastModified || new Date().toISOString()
        });
      }
    });

    // 2. Implementations 테이블
    let implId = 1;
    Object.entries(mappings.terms).forEach(([termId, implementations]) => {
      implementations.forEach(impl => {
        const id = `impl_${implId++}`;
        this.tables.implementations.set(id, {
          id,
          termId,
          name: impl.name,
          type: impl.type,
          signature: impl.signature || '',
          description: impl.description || '',
          line: impl.line || 0,
          file: impl.file,
          examples: impl.examples || [],
          since: impl.since || '1.0.0',
          lastModified: impl.lastModified || new Date().toISOString()
        });
      });
    });

    // 3. Files 테이블
    const fileSet = new Set();
    this.tables.implementations.forEach(impl => {
      fileSet.add(impl.file);
    });

    fileSet.forEach(filePath => {
      const id = this.generateFileId(filePath);
      this.tables.files.set(id, {
        id,
        path: filePath,
        directory: path.dirname(filePath),
        filename: path.basename(filePath),
        extension: path.extname(filePath),
        module: this.extractModuleName(filePath),
        package: this.extractPackageName(filePath)
      });
    });

    console.log(`📋 엔티티 테이블 구축 완료:`);
    console.log(`   📖 용어: ${this.tables.terms.size}개`);
    console.log(`   🏷️ 카테고리: ${this.tables.categories.size}개`);
    console.log(`   ⚙️ 구현체: ${this.tables.implementations.size}개`);
    console.log(`   📁 파일: ${this.tables.files.size}개`);
  }

  /**
   * 관계 테이블 구축
   * @implements build-relationship-tables
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildRelationshipTables(analysis, mappings) {
    let relId = 1;

    // 1. Term Relationships (용어 간 관계)
    if (analysis.relationships) {
      Object.entries(analysis.relationships).forEach(([termId, patterns]) => {
        // 의미적 참조 관계
        if (patterns.semanticReferences) {
          // 실제 분석에서는 더 구체적인 관계 데이터가 있을 것
          this.tables.term_relationships.push({
            id: `rel_${relId++}`,
            sourceTermId: termId,
            targetTermId: termId, // 실제로는 관련 용어 ID
            relationshipType: 'semantic_reference',
            strength: 1.0,
            bidirectional: false,
            source: 'term_definition'
          });
        }
      });
    }

    // 2. Term-Implementation 관계
    this.tables.implementations.forEach(impl => {
      this.tables.term_implementations.push({
        id: `ti_${relId++}`,
        termId: impl.termId,
        implementationId: impl.id,
        relationshipType: 'implements',
        primary: true // 주 구현체인지 여부
      });
    });

    // 3. Term-Category 관계
    this.tables.terms.forEach(term => {
      this.tables.term_categories.push({
        id: `tc_${relId++}`,
        termId: term.id,
        categoryId: term.category,
        relationshipType: 'belongs_to'
      });
    });

    // 4. Implementation-File 관계
    this.tables.implementations.forEach(impl => {
      const fileId = this.generateFileId(impl.file);
      this.tables.implementation_files.push({
        id: `if_${relId++}`,
        implementationId: impl.id,
        fileId: fileId,
        line: impl.line,
        relationshipType: 'located_in'
      });
    });

    // 5. Co-implementation 관계 (같은 파일에서 구현된 용어들)
    const fileImplementations = new Map();
    this.tables.implementations.forEach(impl => {
      if (!fileImplementations.has(impl.file)) {
        fileImplementations.set(impl.file, []);
      }
      fileImplementations.get(impl.file).push(impl);
    });

    fileImplementations.forEach(impls => {
      if (impls.length > 1) {
        for (let i = 0; i < impls.length; i++) {
          for (let j = i + 1; j < impls.length; j++) {
            this.tables.term_relationships.push({
              id: `rel_${relId++}`,
              sourceTermId: impls[i].termId,
              targetTermId: impls[j].termId,
              relationshipType: 'co_implementation',
              strength: 1.0 / impls.length, // 함께 구현된 용어가 많을수록 약한 관계
              bidirectional: true,
              source: 'implementation',
              file: impls[i].file
            });
          }
        }
      }
    });

    console.log(`🔗 관계 테이블 구축 완료:`);
    console.log(`   🕸️ 용어 관계: ${this.tables.term_relationships.length}개`);
    console.log(`   ⚙️ 용어-구현체: ${this.tables.term_implementations.length}개`);
    console.log(`   🏷️ 용어-카테고리: ${this.tables.term_categories.length}개`);
    console.log(`   📁 구현체-파일: ${this.tables.implementation_files.length}개`);
  }

  /**
   * 인덱스 구축
   * @implements build-indexes
   * @memberof api-terms
   * @since 1.0.0
   */
  async buildIndexes() {
    // 1. 카테고리별 용어 인덱스
    this.tables.term_categories.forEach(tc => {
      if (!this.indexes.termsByCategory.has(tc.categoryId)) {
        this.indexes.termsByCategory.set(tc.categoryId, []);
      }
      this.indexes.termsByCategory.get(tc.categoryId).push(tc.termId);
    });

    // 2. 구현체별 용어 인덱스
    this.tables.term_implementations.forEach(ti => {
      if (!this.indexes.termsByImplementation.has(ti.implementationId)) {
        this.indexes.termsByImplementation.set(ti.implementationId, []);
      }
      this.indexes.termsByImplementation.get(ti.implementationId).push(ti.termId);
    });

    // 3. 파일별 구현체 인덱스
    this.tables.implementation_files.forEach(ifRel => {
      if (!this.indexes.implementationsByFile.has(ifRel.fileId)) {
        this.indexes.implementationsByFile.set(ifRel.fileId, []);
      }
      this.indexes.implementationsByFile.get(ifRel.fileId).push(ifRel.implementationId);
    });

    // 4. 관계 타입별 인덱스
    this.tables.term_relationships.forEach(rel => {
      if (!this.indexes.relationshipsByType.has(rel.relationshipType)) {
        this.indexes.relationshipsByType.set(rel.relationshipType, []);
      }
      this.indexes.relationshipsByType.get(rel.relationshipType).push(rel);
    });

    // 5. 키워드별 용어 인덱스 (검색용)
    this.tables.terms.forEach(term => {
      const keywords = this.extractKeywords(term.title + ' ' + term.description);
      keywords.forEach(keyword => {
        if (!this.indexes.termsByKeyword.has(keyword)) {
          this.indexes.termsByKeyword.set(keyword, []);
        }
        this.indexes.termsByKeyword.get(keyword).push(term.id);
      });
    });

    console.log(`📇 인덱스 구축 완료:`);
    console.log(`   🏷️ 카테고리별: ${this.indexes.termsByCategory.size}개`);
    console.log(`   ⚙️ 구현체별: ${this.indexes.termsByImplementation.size}개`);
    console.log(`   📁 파일별: ${this.indexes.implementationsByFile.size}개`);
    console.log(`   🔗 관계별: ${this.indexes.relationshipsByType.size}개`);
    console.log(`   🔍 키워드별: ${this.indexes.termsByKeyword.size}개`);
  }

  /**
   * 관계형 쿼리 엔진
   * @implements relational-query-engine
   * @memberof api-terms
   * @since 1.0.0
   */
  query() {
    return new QueryBuilder(this);
  }

  // 유틸리티 메서드들
  formatCategoryName(categoryId) {
    const names = {
      'core-concepts': '핵심 개념',
      'api-terms': 'API 용어',
      'architecture-terms': '아키텍처 용어',
      'naming-conventions': '네이밍 규칙'
    };
    return names[categoryId] || categoryId;
  }

  formatTermTitle(termId) {
    return termId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  generateFileId(filePath) {
    return filePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  extractModuleName(filePath) {
    const parts = filePath.split('/');
    if (parts.includes('packages')) {
      const pkgIndex = parts.indexOf('packages');
      return parts[pkgIndex + 1] || 'unknown';
    }
    return 'example';
  }

  extractPackageName(filePath) {
    if (filePath.includes('packages/')) {
      return filePath.split('packages/')[1].split('/')[0];
    }
    return 'example';
  }

  extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\\s]/g, ' ')
      .split(/\\s+/)
      .filter(word => word.length >= 3)
      .filter(word => !['the', 'and', 'for', 'with', 'that', 'this'].includes(word));
  }
}

/**
 * 쿼리 빌더 클래스 (SQL-like 인터페이스)
 * @implements query-builder
 * @memberof core-concepts
 * @since 1.0.0
 */
class QueryBuilder {
  constructor(model) {
    this.model = model;
    this.reset();
  }

  reset() {
    this.selectFields = [];
    this.fromTable = '';
    this.joinClauses = [];
    this.whereConditions = [];
    this.orderByFields = [];
    this.limitCount = null;
    this.offsetCount = 0;
  }

  /**
   * SELECT 절
   * @implements query-select
   * @memberof api-terms
   * @since 1.0.0
   */
  select(...fields) {
    this.selectFields = fields.length > 0 ? fields : ['*'];
    return this;
  }

  /**
   * FROM 절
   * @implements query-from
   * @memberof api-terms
   * @since 1.0.0
   */
  from(table) {
    this.fromTable = table;
    return this;
  }

  /**
   * JOIN 절
   * @implements query-join
   * @memberof api-terms
   * @since 1.0.0
   */
  join(table, condition) {
    this.joinClauses.push({ type: 'INNER', table, condition });
    return this;
  }

  leftJoin(table, condition) {
    this.joinClauses.push({ type: 'LEFT', table, condition });
    return this;
  }

  /**
   * WHERE 절
   * @implements query-where
   * @memberof api-terms
   * @since 1.0.0
   */
  where(field, operator, value) {
    this.whereConditions.push({ field, operator, value, logic: 'AND' });
    return this;
  }

  orWhere(field, operator, value) {
    this.whereConditions.push({ field, operator, value, logic: 'OR' });
    return this;
  }

  /**
   * ORDER BY 절
   * @implements query-order
   * @memberof api-terms
   * @since 1.0.0
   */
  orderBy(field, direction = 'ASC') {
    this.orderByFields.push({ field, direction });
    return this;
  }

  /**
   * LIMIT 절
   * @implements query-limit
   * @memberof api-terms
   * @since 1.0.0
   */
  limit(count) {
    this.limitCount = count;
    return this;
  }

  offset(count) {
    this.offsetCount = count;
    return this;
  }

  /**
   * 쿼리 실행
   * @implements execute-query
   * @memberof api-terms
   * @since 1.0.0
   */
  execute() {
    try {
      let results = this.getBaseData();
      
      // JOIN 처리
      results = this.processJoins(results);
      
      // WHERE 처리
      results = this.processWhere(results);
      
      // ORDER BY 처리
      results = this.processOrderBy(results);
      
      // LIMIT/OFFSET 처리
      results = this.processLimitOffset(results);
      
      // SELECT 처리 (필드 선택)
      results = this.processSelect(results);
      
      return results;
    } finally {
      this.reset();
    }
  }

  /**
   * 기본 데이터 가져오기
   * @implements get-base-data
   * @memberof api-terms
   * @since 1.0.0
   */
  getBaseData() {
    const table = this.model.tables[this.fromTable];
    if (!table) {
      throw new Error(`Table '${this.fromTable}' not found`);
    }

    if (table instanceof Map) {
      return Array.from(table.values());
    } else if (Array.isArray(table)) {
      return table;
    } else {
      throw new Error(`Invalid table type for '${this.fromTable}'`);
    }
  }

  /**
   * JOIN 처리
   * @implements process-joins
   * @memberof api-terms
   * @since 1.0.0
   */
  processJoins(results) {
    // 간소화된 JOIN 처리 (실제로는 더 복잡)
    this.joinClauses.forEach(join => {
      const joinTable = this.model.tables[join.table];
      if (joinTable) {
        // 조건에 따른 JOIN 로직 구현
        // 여기서는 기본적인 구현만
      }
    });
    return results;
  }

  /**
   * WHERE 조건 처리
   * @implements process-where
   * @memberof api-terms
   * @since 1.0.0
   */
  processWhere(results) {
    if (this.whereConditions.length === 0) return results;

    return results.filter(item => {
      let matches = true;
      let lastLogic = 'AND';

      for (const condition of this.whereConditions) {
        const fieldValue = this.getFieldValue(item, condition.field);
        const conditionMatch = this.evaluateCondition(fieldValue, condition.operator, condition.value);

        if (lastLogic === 'AND') {
          matches = matches && conditionMatch;
        } else { // OR
          matches = matches || conditionMatch;
        }

        lastLogic = condition.logic;
      }

      return matches;
    });
  }

  /**
   * 조건 평가
   * @implements evaluate-condition
   * @memberof api-terms
   * @since 1.0.0
   */
  evaluateCondition(fieldValue, operator, value) {
    switch (operator) {
      case '=':
      case '==':
        return fieldValue === value;
      case '!=':
      case '<>':
        return fieldValue !== value;
      case '>':
        return fieldValue > value;
      case '>=':
        return fieldValue >= value;
      case '<':
        return fieldValue < value;
      case '<=':
        return fieldValue <= value;
      case 'LIKE':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'IN':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'NOT IN':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * 필드 값 가져오기
   * @implements get-field-value
   * @memberof api-terms
   * @since 1.0.0
   */
  getFieldValue(item, field) {
    const parts = field.split('.');
    let value = item;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  /**
   * ORDER BY 처리
   * @implements process-order-by
   * @memberof api-terms
   * @since 1.0.0
   */
  processOrderBy(results) {
    if (this.orderByFields.length === 0) return results;

    return results.sort((a, b) => {
      for (const order of this.orderByFields) {
        const aVal = this.getFieldValue(a, order.field);
        const bVal = this.getFieldValue(b, order.field);
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (order.direction === 'DESC') {
          comparison *= -1;
        }
        
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  }

  /**
   * LIMIT/OFFSET 처리
   * @implements process-limit-offset
   * @memberof api-terms
   * @since 1.0.0
   */
  processLimitOffset(results) {
    const start = this.offsetCount;
    const end = this.limitCount ? start + this.limitCount : undefined;
    return results.slice(start, end);
  }

  /**
   * SELECT 처리 (필드 선택)
   * @implements process-select
   * @memberof api-terms
   * @since 1.0.0
   */
  processSelect(results) {
    if (this.selectFields.includes('*')) return results;

    return results.map(item => {
      const selected = {};
      this.selectFields.forEach(field => {
        selected[field] = this.getFieldValue(item, field);
      });
      return selected;
    });
  }

  // 편의 메서드들

  /**
   * 용어별 구현체 조회
   * @implements find-implementations-by-term
   * @memberof api-terms
   * @since 1.0.0
   */
  findImplementationsByTerm(termId) {
    return this.model.query()
      .select('*')
      .from('implementations')
      .where('termId', '=', termId)
      .execute();
  }

  /**
   * 카테고리별 용어 조회
   * @implements find-terms-by-category
   * @memberof api-terms
   * @since 1.0.0
   */
  findTermsByCategory(categoryId) {
    const termIds = this.model.indexes.termsByCategory.get(categoryId) || [];
    return termIds.map(id => this.model.tables.terms.get(id)).filter(Boolean);
  }

  /**
   * 관련 용어 조회
   * @implements find-related-terms
   * @memberof api-terms
   * @since 1.0.0
   */
  findRelatedTerms(termId, relationshipType = null) {
    let relationships = this.model.tables.term_relationships.filter(rel => 
      rel.sourceTermId === termId || (rel.bidirectional && rel.targetTermId === termId)
    );

    if (relationshipType) {
      relationships = relationships.filter(rel => rel.relationshipType === relationshipType);
    }

    return relationships.map(rel => {
      const relatedTermId = rel.sourceTermId === termId ? rel.targetTermId : rel.sourceTermId;
      return {
        term: this.model.tables.terms.get(relatedTermId),
        relationship: rel
      };
    });
  }

  /**
   * 키워드 검색
   * @implements search-by-keyword
   * @memberof api-terms
   * @since 1.0.0
   */
  searchByKeyword(keyword) {
    const termIds = this.model.indexes.termsByKeyword.get(keyword.toLowerCase()) || [];
    return termIds.map(id => this.model.tables.terms.get(id)).filter(Boolean);
  }
}

// CLI 실행 부분
if (require.main === module) {
  const model = new RelationalModel();
  
  model.loadAndBuild()
    .then(async (tables) => {
      console.log('\\n🎯 관계형 모델 테스트...');
      
      // 테스트 쿼리들
      console.log('\\n📊 전체 용어 수:', tables.terms.size);
      console.log('📊 전체 구현체 수:', tables.implementations.size);
      console.log('📊 전체 관계 수:', tables.term_relationships.length);
      
      // 쿼리 예제
      const query = model.query();
      
      // 1. 카테고리별 용어 조회
      const coreTerms = query.findTermsByCategory('core-concepts');
      console.log(`\\n🎯 핵심 개념 용어: ${coreTerms.length}개`);
      
      // 2. 구현체가 많은 용어 조회
      const termsWithManyImpls = Array.from(tables.terms.values())
        .filter(term => term.implementationCount > 1)
        .sort((a, b) => b.implementationCount - a.implementationCount);
      
      console.log('\\n🏆 구현체가 많은 용어들:');
      termsWithManyImpls.slice(0, 5).forEach(term => {
        console.log(`   ${term.title}: ${term.implementationCount}개 구현`);
      });
      
      // 3. 관계형 데이터 저장
      const modelPath = path.join(model.dataPath, 'relational-model.json');
      const modelData = {
        metadata: {
          createdAt: new Date().toISOString(),
          tablesCount: Object.keys(tables).length,
          totalRecords: Object.values(tables).reduce((sum, table) => {
            if (table instanceof Map) return sum + table.size;
            if (Array.isArray(table)) return sum + table.length;
            return sum;
          }, 0)
        },
        schema: {
          entities: ['terms', 'categories', 'implementations', 'files'],
          relationships: ['term_relationships', 'term_implementations', 'term_categories', 'implementation_files'],
          indexes: Object.keys(model.indexes)
        },
        // 실제 데이터는 크기 때문에 메타데이터만 저장
        statistics: {
          terms: tables.terms.size,
          categories: tables.categories.size,
          implementations: tables.implementations.size,
          files: tables.files.size,
          relationships: tables.term_relationships.length
        }
      };
      
      await fs.writeFile(modelPath, JSON.stringify(modelData, null, 2));
      console.log(`\\n💾 관계형 모델 메타데이터 저장: ${modelPath}`);
      
      console.log('\\n🎉 관계형 데이터 모델 구축 완료!');
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { RelationalModel, QueryBuilder };