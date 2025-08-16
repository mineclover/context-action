# 의존성 기반 문서 선택 알고리즘 설계

## 📊 알고리즘 개요

**목표**: 카테고리, 태그, 의존성을 종합적으로 고려하여 제한된 문자 수 내에서 최적의 문서 조합을 선택하는 알고리즘

## 🧮 핵심 알고리즘 구성 요소

### 1. 문서 점수 계산 시스템

```typescript
interface DocumentScore {
  baseScore: number;           // 기본 우선순위 점수 (1-100)
  categoryScore: number;       // 카테고리 적합성 점수
  tagAffinityScore: number;    // 태그 연관성 점수
  dependencyScore: number;     // 의존성 가중치 점수
  contextualScore: number;     // 맥락적 연관성 점수
  finalScore: number;          // 최종 가중 점수
  confidence: number;          // 선택 신뢰도 (0-1)
}

class DocumentScorer {
  calculateScore(
    document: DocumentMetadata,
    context: SelectionContext,
    strategy: CompositionStrategy
  ): DocumentScore {
    const weights = strategy.weights;
    
    // 1. 기본 점수 (정규화)
    const baseScore = document.priority.score / 100;
    
    // 2. 카테고리 점수
    const categoryScore = this.calculateCategoryScore(document, context);
    
    // 3. 태그 연관성 점수
    const tagAffinityScore = this.calculateTagAffinity(document, context);
    
    // 4. 의존성 점수
    const dependencyScore = this.calculateDependencyScore(document, context);
    
    // 5. 맥락적 점수
    const contextualScore = this.calculateContextualScore(document, context);
    
    // 6. 최종 가중 점수
    const finalScore = (
      baseScore * weights.priorityWeight +
      categoryScore * weights.categoryWeight +
      tagAffinityScore * weights.tagWeight +
      dependencyScore * weights.dependencyWeight +
      contextualScore * weights.contextualWeight
    );
    
    // 7. 신뢰도 계산
    const confidence = this.calculateConfidence(document, context);
    
    return {
      baseScore,
      categoryScore,
      tagAffinityScore,
      dependencyScore,
      contextualScore,
      finalScore,
      confidence
    };
  }
  
  private calculateCategoryScore(
    document: DocumentMetadata,
    context: SelectionContext
  ): number {
    if (!context.targetCategory) return 0.5; // 중립적
    
    if (document.document.category === context.targetCategory) {
      return 1.0; // 완전 일치
    }
    
    // 카테고리 간 연관성 확인
    const affinity = document.composition?.categoryAffinity?.[context.targetCategory];
    return affinity || 0.3; // 기본 낮은 점수
  }
  
  private calculateTagAffinity(
    document: DocumentMetadata,
    context: SelectionContext
  ): number {
    if (!context.targetTags || context.targetTags.length === 0) {
      return 0.5; // 중립적
    }
    
    const documentTags = new Set([
      ...document.tags.primary,
      ...document.tags.secondary
    ]);
    
    let totalAffinity = 0;
    let weightSum = 0;
    
    for (const targetTag of context.targetTags) {
      const tagWeight = context.tagWeights[targetTag] || 1.0;
      weightSum += tagWeight;
      
      if (documentTags.has(targetTag)) {
        // 직접 일치
        totalAffinity += tagWeight * 1.0;
      } else {
        // 호환성 확인
        const compatibility = this.checkTagCompatibility(
          Array.from(documentTags),
          targetTag
        );
        totalAffinity += tagWeight * compatibility;
      }
    }
    
    return weightSum > 0 ? totalAffinity / weightSum : 0;
  }
  
  private calculateDependencyScore(
    document: DocumentMetadata,
    context: SelectionContext
  ): number {
    let score = 0.5; // 기본 점수
    
    // 선행 문서 확인
    if (context.selectedDocuments.some(selected => 
      document.dependencies.prerequisites.some(prereq => 
        prereq.documentId === selected.document.id
      )
    )) {
      score += 0.3; // 선행 조건 충족 보너스
    }
    
    // 참조 관계 확인
    const referenceBonus = document.dependencies.references
      .filter(ref => context.selectedDocuments.some(selected => 
        selected.document.id === ref.documentId
      ))
      .reduce((sum, ref) => sum + (ref.relevance || 0.5), 0) * 0.1;
    
    score += Math.min(referenceBonus, 0.3);
    
    // 충돌 확인 (페널티)
    const conflictPenalty = document.dependencies.conflicts
      .filter(conflict => context.selectedDocuments.some(selected => 
        selected.document.id === conflict.documentId
      ))
      .reduce((penalty, conflict) => {
        switch (conflict.severity) {
          case 'major': return penalty + 0.5;
          case 'moderate': return penalty + 0.3;
          case 'minor': return penalty + 0.1;
          default: return penalty + 0.2;
        }
      }, 0);
    
    score -= Math.min(conflictPenalty, 0.8);
    
    return Math.max(0, Math.min(1, score));
  }
}
```

### 2. 의존성 해결 알고리즘

```typescript
class DependencyResolver {
  resolveDependencies(
    candidateDocuments: DocumentMetadata[],
    availableSpace: number,
    strategy: CompositionStrategy
  ): DependencyResolutionResult {
    const result: DependencyResolutionResult = {
      requiredDocuments: [],
      recommendedDocuments: [],
      conflictingDocuments: [],
      complementaryDocuments: [],
      totalSpaceNeeded: 0,
      dependencyChains: []
    };
    
    // 1. 필수 의존성 해결
    this.resolveRequiredDependencies(candidateDocuments, result);
    
    // 2. 충돌 감지 및 해결
    this.detectAndResolveConflicts(candidateDocuments, result, strategy);
    
    // 3. 권장 문서 추가 (공간 허용 시)
    this.addRecommendedDocuments(candidateDocuments, result, availableSpace);
    
    // 4. 보완 문서 추가 (공간 허용 시)
    this.addComplementaryDocuments(candidateDocuments, result, availableSpace);
    
    return result;
  }
  
  private resolveRequiredDependencies(
    documents: DocumentMetadata[],
    result: DependencyResolutionResult
  ): void {
    const processedDependencies = new Set<string>();
    const dependencyQueue: DependencyNode[] = [];
    
    // 초기 의존성 수집
    for (const doc of documents) {
      for (const prereq of doc.dependencies.prerequisites) {
        if (prereq.importance === 'required' && !processedDependencies.has(prereq.documentId)) {
          dependencyQueue.push({
            documentId: prereq.documentId,
            requiredBy: doc.document.id,
            depth: 1,
            reason: prereq.reason
          });
          processedDependencies.add(prereq.documentId);
        }
      }
    }
    
    // BFS를 사용한 의존성 체인 해결
    while (dependencyQueue.length > 0) {
      const dependency = dependencyQueue.shift()!;
      
      if (dependency.depth > this.maxDependencyDepth) {
        continue; // 무한 의존성 방지
      }
      
      result.requiredDocuments.push(dependency);
      
      // 이 의존성 문서의 의존성도 확인
      const depDocument = this.findDocumentById(dependency.documentId, documents);
      if (depDocument) {
        for (const nestedPrereq of depDocument.dependencies.prerequisites) {
          if (nestedPrereq.importance === 'required' && 
              !processedDependencies.has(nestedPrereq.documentId)) {
            dependencyQueue.push({
              documentId: nestedPrereq.documentId,
              requiredBy: dependency.documentId,
              depth: dependency.depth + 1,
              reason: nestedPrereq.reason
            });
            processedDependencies.add(nestedPrereq.documentId);
          }
        }
      }
    }
  }
  
  private detectAndResolveConflicts(
    documents: DocumentMetadata[],
    result: DependencyResolutionResult,
    strategy: CompositionStrategy
  ): void {
    const conflicts: DocumentConflict[] = [];
    
    // 충돌 감지
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const docA = documents[i];
        const docB = documents[j];
        
        // A가 B와 충돌하는지 확인
        const conflictAB = docA.dependencies.conflicts.find(
          conflict => conflict.documentId === docB.document.id
        );
        
        if (conflictAB) {
          conflicts.push({
            documentA: docA.document.id,
            documentB: docB.document.id,
            severity: conflictAB.severity,
            reason: conflictAB.reason,
            scoreA: this.getDocumentScore(docA),
            scoreB: this.getDocumentScore(docB)
          });
        }
      }
    }
    
    // 충돌 해결
    for (const conflict of conflicts) {
      switch (strategy.conflictResolution) {
        case 'higher-score-wins':
          const loser = conflict.scoreA > conflict.scoreB ? 
            conflict.documentB : conflict.documentA;
          result.conflictingDocuments.push(loser);
          break;
          
        case 'exclude-both':
          result.conflictingDocuments.push(conflict.documentA, conflict.documentB);
          break;
          
        case 'manual-review':
          // 수동 검토 필요 표시
          result.conflictingDocuments.push(`${conflict.documentA}:${conflict.documentB}:REVIEW`);
          break;
      }
    }
  }
}
```

### 3. 적응형 문서 선택 알고리즘

```typescript
class AdaptiveDocumentSelector {
  selectOptimalDocuments(
    availableDocuments: DocumentMetadata[],
    constraints: SelectionConstraints,
    strategy: CompositionStrategy
  ): SelectionResult {
    // 1. 초기 후보 필터링
    const candidates = this.filterCandidates(availableDocuments, constraints);
    
    // 2. 의존성 해결
    const dependencyResult = this.dependencyResolver.resolveDependencies(
      candidates, constraints.maxCharacters, strategy
    );
    
    // 3. 최적화된 조합 생성
    const optimizedSelection = this.optimizeSelection(
      candidates, dependencyResult, constraints, strategy
    );
    
    return optimizedSelection;
  }
  
  private optimizeSelection(
    candidates: DocumentMetadata[],
    dependencyResult: DependencyResolutionResult,
    constraints: SelectionConstraints,
    strategy: CompositionStrategy
  ): SelectionResult {
    // 동적 프로그래밍을 사용한 배낭 문제 해결
    const items: SelectionItem[] = candidates.map(doc => ({
      document: doc,
      score: this.scorer.calculateScore(doc, constraints.context, strategy).finalScore,
      space: this.estimateDocumentSpace(doc, constraints.targetCharacterLimit),
      category: doc.document.category
    }));
    
    // 카테고리 다양성 제약 조건 적용
    const selection = this.solveConstrainedKnapsack(
      items,
      constraints.maxCharacters,
      strategy.constraints
    );
    
    // 의존성 필수 문서 추가
    this.addRequiredDependencies(selection, dependencyResult);
    
    // 최종 검증 및 조정
    this.validateAndAdjustSelection(selection, constraints);
    
    return {
      selectedDocuments: selection.documents,
      totalCharacters: selection.totalSpace,
      spaceUtilization: selection.totalSpace / constraints.maxCharacters,
      categoryDistribution: this.calculateCategoryDistribution(selection.documents),
      qualityScore: this.calculateOverallQuality(selection.documents),
      dependencyChains: dependencyResult.dependencyChains
    };
  }
  
  private solveConstrainedKnapsack(
    items: SelectionItem[],
    maxSpace: number,
    constraints: StrategyConstraints
  ): KnapsackSolution {
    const n = items.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(maxSpace + 1).fill(0));
    const solution: boolean[] = Array(n).fill(false);
    
    // 동적 프로그래밍으로 최적해 계산
    for (let i = 1; i <= n; i++) {
      for (let w = 1; w <= maxSpace; w++) {
        const item = items[i - 1];
        
        if (item.space <= w) {
          const includeValue = item.score + dp[i - 1][w - item.space];
          const excludeValue = dp[i - 1][w];
          
          // 카테고리 다양성 보너스 적용
          const diversityBonus = this.calculateDiversityBonus(
            item, solution, constraints
          );
          
          dp[i][w] = Math.max(includeValue + diversityBonus, excludeValue);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }
    
    // 역추적으로 선택된 아이템 찾기
    let w = maxSpace;
    for (let i = n; i > 0 && w > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        solution[i - 1] = true;
        w -= items[i - 1].space;
      }
    }
    
    return {
      documents: items.filter((_, index) => solution[index]).map(item => item.document),
      totalSpace: items.filter((_, index) => solution[index])
        .reduce((sum, item) => sum + item.space, 0),
      totalScore: dp[n][maxSpace]
    };
  }
  
  private calculateDiversityBonus(
    item: SelectionItem,
    currentSolution: boolean[],
    constraints: StrategyConstraints
  ): number {
    if (!constraints.requireCategoryDiversity) return 0;
    
    const selectedCategories = new Set();
    currentSolution.forEach((selected, index) => {
      if (selected) {
        selectedCategories.add(items[index].category);
      }
    });
    
    // 새로운 카테고리면 보너스
    if (!selectedCategories.has(item.category)) {
      return constraints.diversityBonus || 0.1;
    }
    
    // 같은 카테고리가 너무 많으면 페널티
    const categoryCount = Array.from(selectedCategories).filter(
      cat => cat === item.category
    ).length;
    
    if (categoryCount >= constraints.maxDocumentsPerCategory) {
      return -(constraints.redundancyPenalty || 0.2);
    }
    
    return 0;
  }
}
```

### 4. 품질 평가 및 최적화

```typescript
class QualityEvaluator {
  evaluateSelectionQuality(
    selection: DocumentMetadata[],
    context: SelectionContext
  ): QualityMetrics {
    return {
      completeness: this.evaluateCompleteness(selection, context),
      coherence: this.evaluateCoherence(selection),
      diversity: this.evaluateDiversity(selection),
      relevance: this.evaluateRelevance(selection, context),
      dependency_coverage: this.evaluateDependencyCoverage(selection),
      overall_score: 0 // 나중에 계산
    };
  }
  
  private evaluateCompleteness(
    selection: DocumentMetadata[],
    context: SelectionContext
  ): number {
    // 필수 주제가 모두 다뤄졌는지 확인
    const requiredTopics = context.requiredTopics || [];
    const coveredTopics = new Set();
    
    for (const doc of selection) {
      for (const keyword of doc.keywords.primary) {
        coveredTopics.add(keyword);
      }
    }
    
    const coverage = requiredTopics.filter(topic => 
      coveredTopics.has(topic)
    ).length / requiredTopics.length;
    
    return coverage;
  }
  
  private evaluateCoherence(selection: DocumentMetadata[]): number {
    // 문서들 간의 논리적 흐름 평가
    let coherenceScore = 0;
    
    for (let i = 0; i < selection.length - 1; i++) {
      for (let j = i + 1; j < selection.length; j++) {
        const docA = selection[i];
        const docB = selection[j];
        
        // 의존성 관계가 있으면 보너스
        if (this.hasDirectDependency(docA, docB)) {
          coherenceScore += 0.2;
        }
        
        // 공통 태그가 있으면 보너스
        const commonTags = this.getCommonTags(docA, docB);
        coherenceScore += commonTags.length * 0.1;
        
        // 같은 카테고리면 보너스
        if (docA.document.category === docB.document.category) {
          coherenceScore += 0.05;
        }
      }
    }
    
    return Math.min(1, coherenceScore / selection.length);
  }
}
```

## 🎯 알고리즘 구현 전략

### Phase 1: 기본 점수 계산 시스템
1. **DocumentScorer 클래스** 구현
2. **기본적인 가중치 계산** 로직
3. **카테고리 및 태그 연관성** 계산

### Phase 2: 의존성 해결 시스템
1. **DependencyResolver 클래스** 구현
2. **BFS 기반 의존성 체인** 해결
3. **충돌 감지 및 해결** 로직

### Phase 3: 최적화 알고리즘
1. **제약 조건이 있는 배낭 문제** 솔버
2. **카테고리 다양성** 보장 로직
3. **동적 공간 할당** 시스템

### Phase 4: 품질 평가 시스템
1. **QualityEvaluator 클래스** 구현
2. **다차원 품질 메트릭** 계산
3. **피드백 기반 개선** 시스템

## 📈 성능 목표

- **선택 속도**: 100개 문서 기준 <100ms
- **메모리 효율성**: O(n) 공간 복잡도
- **품질 점수**: 평균 85% 이상
- **공간 활용률**: 95% 이상

이 알고리즘은 단순한 우선순위 기반 선택을 넘어서 복잡한 의존성과 맥락을 고려한 지능적인 문서 큐레이션을 가능하게 합니다.