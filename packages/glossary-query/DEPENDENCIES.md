# jq 기반 정보 조회 시스템 의존성 정의

## 📋 외부 의존성 (External Dependencies)

### 1. 기존 Context-Action 프레임워크 데이터 소스

#### 📁 용어 정의 파일들 (Required)
```
glossary/terms/
├── api-terms.md           # API 관련 용어 정의
├── architecture-terms.md  # 아키텍처 용어 정의  
├── core-concepts.md       # 핵심 개념 용어 정의
├── naming-conventions.md  # 네이밍 규칙 용어 정의
└── VALIDATION.md          # 검증 관련 용어 정의
```

**의존성 타입**: ✅ **필수 (Required)**
**형태**: Markdown 파일 모음
**구조**: `## 용어명` 섹션 기반
**역할**: 용어 제목, 정의, 설명 제공

#### 📄 구현체 매핑 데이터 (Optional)  
```
glossary/implementations/_data/mappings.json
```

**의존성 타입**: ⚠️ **선택적 (Optional)**
**형태**: JSON 파일
**구조**: `{ "terms": { "term-id": [구현체배열] } }`
**역할**: 용어별 실제 코드 구현체 정보 제공
**폴백**: 빈 구현체 배열로 처리

### 2. 시스템 의존성

#### jq (JSON 쿼리 도구)
**버전**: >=1.6.0
**설치**: `brew install jq` (macOS), `apt install jq` (Ubuntu)
**역할**: JSON 데이터 조회 및 필터링

#### Node.js
**버전**: >=14.0.0  
**역할**: 데이터 생성 스크립트 실행

---

## 🔍 데이터 의존성 세부사항

### 용어 정의 파일 구조 (Required)

#### 📝 예상 마크다운 형식
```markdown
# 카테고리명

카테고리 설명...

## 용어명 1

**Definition**: 용어 정의...

**Usage Context**: 
- 사용 맥락 1
- 사용 맥락 2

**Related Terms**: [관련용어1](#관련용어1), [관련용어2](#관련용어2)

## 용어명 2

**Definition**: 다른 용어 정의...
```

#### 🔄 파싱 로직
1. `## ` 기준으로 용어 섹션 분할
2. 첫 줄에서 용어 제목 추출
3. `**Definition**:` 라인에서 정의 추출
4. `**Related Terms**:` 라인에서 관련 용어 추출

### 매핑 데이터 구조 (Optional)

#### 📊 JSON 스키마
```json
{
  "terms": {
    "용어-id": [
      {
        "file": "파일경로",
        "name": "구현체명",
        "type": "구현체타입",
        "line": 라인번호,
        "description": "설명"
      }
    ]
  }
}
```

---

## ⚠️ 의존성 위험 요소

### 1. 용어 정의 파일 변경
- **위험도**: 🔴 **높음**
- **영향**: 새 용어 인식 실패, 정의 누락
- **완화책**: 파일 존재 확인, 파싱 오류 처리

### 2. 매핑 데이터 변경  
- **위험도**: 🟡 **중간**
- **영향**: 구현체 정보 누락
- **완화책**: Optional 처리, 폴백 메커니즘

### 3. 마크다운 형식 변경
- **위험도**: 🔴 **높음** 
- **영향**: 파싱 실패, 데이터 손실
- **완화책**: 유연한 파싱 로직, 오류 처리

---

## 🔧 의존성 관리 전략

### 1. 견고한 파일 시스템 접근
```javascript
// 파일 존재 확인
if (!fs.existsSync(termsDir)) {
  throw new Error(`용어 디렉토리가 존재하지 않습니다: ${termsDir}`);
}

// 개별 파일 오류 처리
termFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(termsDir, file), 'utf-8');
    const terms = parseTermsFromMarkdown(content, category);
  } catch (error) {
    console.warn(`⚠️ 파일 처리 실패: ${file}`, error.message);
    // 계속 진행
  }
});
```

### 2. 매핑 데이터 폴백
```javascript
// 매핑 데이터 선택적 로드
let mappings = {};
try {
  const mappingsContent = fs.readFileSync(mappingsPath, 'utf-8');
  mappings = JSON.parse(mappingsContent);
} catch (error) {
  console.warn('⚠️ 매핑 데이터 로드 실패, 빈 객체 사용');
  // 빈 객체로 계속 진행
}
```

### 3. 파싱 오류 복구
```javascript
// 용어 파싱 시 개별 처리
sections.forEach(section => {
  try {
    const term = parseTermSection(section);
    if (term.title && term.id) {
      terms.push(term);
    }
  } catch (error) {
    console.warn(`용어 파싱 실패: ${section.substring(0, 50)}...`);
    // 해당 용어만 스킵하고 계속
  }
});
```

---

## 📊 의존성 상태 체크

### 자동 검증 스크립트
```bash
#!/bin/bash
echo "🔍 의존성 상태 검사..."

# 1. jq 설치 확인
if ! command -v jq &> /dev/null; then
  echo "❌ jq가 설치되지 않음"
  exit 1
fi

# 2. 용어 파일 존재 확인  
TERMS_DIR="../../../glossary/terms"
if [ ! -d "$TERMS_DIR" ]; then
  echo "❌ 용어 디렉토리 없음: $TERMS_DIR"
  exit 1
fi

# 3. 필수 용어 파일 확인
REQUIRED_FILES=("core-concepts.md" "api-terms.md")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$TERMS_DIR/$file" ]; then
    echo "❌ 필수 파일 없음: $file"
    exit 1
  fi
done

# 4. 매핑 데이터 확인 (선택적)
MAPPING_FILE="../../../glossary/implementations/_data/mappings.json"
if [ -f "$MAPPING_FILE" ]; then
  echo "✅ 매핑 데이터 발견"
else
  echo "⚠️ 매핑 데이터 없음 (선택적)"
fi

echo "✅ 의존성 검사 완료"
```

---

## 🎯 의존성 최소화 원칙

1. **필수 vs 선택적 명확 구분**
   - 용어 정의: 필수
   - 구현체 매핑: 선택적

2. **실패 시 우아한 감소**
   - 일부 파일 실패 → 나머지로 계속
   - 매핑 데이터 없음 → 빈 구현체로 처리

3. **투명한 오류 보고**
   - 누락된 파일 목록 출력
   - 처리된/실패한 용어 수 표시

4. **독립적 실행 가능**
   - 최소 의존성으로 동작
   - 외부 서비스 의존성 없음