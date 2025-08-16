# YAML Frontmatter 기반 요약 파일 생성 기능 강화 PRD

## 📋 개요

현재 llms-generator는 텍스트 기반 요약 파일을 생성하지만, 문서 결합 시 적절한 경계선과 메타데이터가 부족합니다. 이를 해결하기 위해 **YAML frontmatter를 포함한 markdown 형식**의 요약 파일 생성 기능을 추가합니다.

## 🎯 목표

1. **문서 경계 구분**: 결합된 문서에서 각 섹션을 명확히 구분
2. **메타데이터 보존**: 제목, 경로, 우선순위 정보 유지  
3. **호환성 확보**: 기존 minimum/origin 형식과 호환
4. **자동화**: 수동 작업 없이 자동으로 YAML frontmatter 생성

## 🔄 현재 상태 분석

### 기존 요약 파일 형식
```
# 액션 핸들러

[100자 요약 - 우선순위: 90/essential]

이 문서는 guide 카테고리의 액션 핸들러에 대한 내용입니다.

추출 전략: concept-fir...
```

### 기존 YAML 템플릿 (LLMSTXT_TEMPLATE.yaml)
```yaml
document:
  path: "ko/guide/action-handlers.md"
  title: "액션 핸들러"
  id: "guide-action-handlers"
  category: "guide"

priority:
  score: 90
  tier: "essential"

summary:
  character_limit: 100
  focus: "핸들러 기본 개념"
  strategy: "concept-first"
  language: "ko"

content: |
  실제 요약 내용...
```

## 💡 제안하는 새로운 형식

### 향상된 Markdown + YAML Frontmatter 형식
```markdown
---
document:
  path: "ko/guide/action-handlers.md"
  title: "액션 핸들러"
  id: "guide-action-handlers"
  category: "guide"
priority:
  score: 90
  tier: "essential"
summary:
  character_limit: 100
  focus: "핸들러 기본 개념"
  strategy: "concept-first"
  language: "ko"
generated:
  from: "minimum"
  timestamp: "2025-08-15T10:30:00Z"
  source_type: "priority_based"
---

# 액션 핸들러

액션 핸들러는 비즈니스 로직을 포함하며 useActionHandler + useEffect 패턴으로 효과적으로 구현, 등록, 관리할 수 있습니다.
```

## 🏗️ 기술 사양

### 1. 파일 형식 변경
- **기존**: `guide-action-handlers-100.txt`
- **신규**: `guide-action-handlers-100.md` (YAML frontmatter 포함)

### 2. YAML Frontmatter 스키마
```yaml
# 필수 메타데이터
document:
  path: string          # 원본 문서 경로
  title: string         # 문서 제목
  id: string           # 문서 ID
  category: string     # 카테고리 (guide, api, concept, etc.)

# 우선순위 정보 (priority.json에서 가져옴)
priority:
  score: number        # 0-100 우선순위 점수
  tier: string        # critical, essential, important, reference, supplementary

# 요약 메타데이터
summary:
  character_limit: number    # 글자 수 제한
  focus: string             # 포커스 설명
  strategy: string          # 추출 전략
  language: string          # 언어 코드

# 생성 정보 (새로 추가)
generated:
  from: "minimum" | "origin" | "adaptive"   # 생성 방식
  timestamp: string                          # ISO 8601 생성 시간
  source_type: "priority_based" | "content_based"  # 소스 타입
  character_count: number                    # 실제 글자 수
```

### 3. 생성 방식별 구현

#### A) Minimum 기반 생성
- **소스**: minimum 형식 (navigation links)의 문서 정보
- **내용**: 간단한 설명과 링크 정보
- **활용**: 목차 및 네비게이션용

#### B) Origin 기반 생성  
- **소스**: origin 형식 (complete documents)의 원본 내용
- **내용**: 원본 문서의 요약 추출
- **활용**: 실제 콘텐츠 조합용

## 🔧 구현 계획

### Phase 1: 코어 인프라 구축
1. **YAML Frontmatter 파서/생성기**
   - frontmatter 추출/삽입 유틸리티
   - 메타데이터 검증 스키마

2. **새로운 SummaryGenerator 클래스**
   ```typescript
   class SummaryGenerator {
     generateFromMinimum(doc: DocumentInfo, limit: number): MarkdownWithFrontmatter
     generateFromOrigin(doc: DocumentContent, limit: number): MarkdownWithFrontmatter
     extractSummaryFromContent(content: string, limit: number): string
   }
   ```

3. **AdaptiveComposer 업데이트**
   - `.md` 파일 읽기 지원
   - YAML frontmatter 파싱
   - 메타데이터 기반 조합

### Phase 2: 생성 로직 구현
1. **Minimum 기반 요약 생성**
   ```typescript
   // LLMSGenerator.generateMinimum() 기반
   const navigationData = await this.generateMinimum(language);
   const summaries = this.extractSummariesFromNavigation(navigationData);
   ```

2. **Origin 기반 요약 생성**
   ```typescript
   // LLMSGenerator.generateOrigin() 기반  
   const fullContent = await this.generateOrigin(language);
   const summaries = this.extractSummariesFromFullContent(fullContent);
   ```

3. **자동 글자 수 맞춤**
   - 설정된 character limits에 맞춰 자동 트리밍
   - 문장 단위 자연스러운 끊기

### Phase 3: CLI 통합
```bash
# 기존 텍스트 형식 (하위 호환)
npx llms-generator extract ko --chars=100 --format=txt

# 새로운 마크다운 형식  
npx llms-generator extract ko --chars=100 --format=md --source=minimum
npx llms-generator extract ko --chars=100 --format=md --source=origin

# 일괄 변환
npx llms-generator migrate-to-markdown ko --backup
```

## 📊 예상 효과

### 1. 문서 결합 시 명확한 구분
```markdown
---
document: { title: "액션 핸들러", path: "ko/guide/action-handlers.md" }
priority: { score: 90, tier: "essential" }
---
# 액션 핸들러 내용...

---
document: { title: "스토어 패턴", path: "ko/guide/store-patterns.md" }  
priority: { score: 85, tier: "essential" }
---
# 스토어 패턴 내용...
```

### 2. 자동화된 메타데이터 관리
- 수동 YAML 파일 제거 (guide-action-handlers-100.yaml 불필요)
- priority.json 기반 자동 메타데이터 생성
- 일관된 형식과 구조

### 3. 향상된 조합 품질
- 각 문서의 출처와 우선순위 추적 가능
- 적절한 섹션 구분으로 가독성 향상
- LLM이 문서 경계를 명확히 인식

## 🛡️ 호환성 및 마이그레이션

### 기존 코드 호환성
```typescript
// AdaptiveComposer.ts - 기존 로직 확장
private async loadDocumentContents(language: string): Promise<DocumentContent[]> {
  // 기존: *.txt 파일만 읽기
  // 신규: *.md 파일도 읽기, frontmatter 파싱
  const txtPath = path.join(documentDir, `${documentId}-${limit}.txt`);
  const mdPath = path.join(documentDir, `${documentId}-${limit}.md`);
  
  // .md 파일 우선, 없으면 .txt 파일 사용
  const filePath = existsSync(mdPath) ? mdPath : txtPath;
}
```

### 점진적 마이그레이션
1. **Phase 1**: .md 형식 생성 기능 추가
2. **Phase 2**: 기존 .txt 파일과 병행 운영  
3. **Phase 3**: .txt 파일 deprecated, .md 파일로 완전 전환

## 🎯 성공 지표

1. **자동화율**: 수동 YAML 파일 생성 제거 (100%)
2. **메타데이터 정확도**: priority.json과 100% 일치
3. **문서 품질**: 적절한 경계선으로 구분된 결합 문서
4. **개발자 경험**: 단일 명령으로 모든 형식 생성

## 📅 타임라인

- **Week 1**: Phase 1 구현 (인프라)
- **Week 2**: Phase 2 구현 (생성 로직)  
- **Week 3**: Phase 3 구현 (CLI 통합)
- **Week 4**: 테스트 및 문서화

## 🔄 다음 단계

이 PRD 승인 후 상세 기술 설계서와 구현 계획을 작성하여 개발을 시작합니다.