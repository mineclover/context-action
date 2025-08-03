#!/bin/bash

# jq 기반 정보 조회 시스템 의존성 검증 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname $(dirname $SCRIPT_DIR))"
GLOSSARY_DIR="$BASE_DIR/glossary"
TERMS_DIR="$GLOSSARY_DIR/terms"
DATA_DIR="$GLOSSARY_DIR/implementations/_data"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 jq 기반 정보 조회 시스템 의존성 검사${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 전체 상태 추적
ALL_GOOD=true

echo -e "\n${YELLOW}1. 시스템 의존성 검사${NC}"

# jq 설치 확인
echo -n "   jq 도구: "
if command -v jq &> /dev/null; then
    JQ_VERSION=$(jq --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ 설치됨 ($JQ_VERSION)${NC}"
else
    echo -e "${RED}❌ 설치되지 않음${NC}"
    echo -e "${YELLOW}   설치 방법:${NC}"
    echo -e "     macOS: brew install jq"
    echo -e "     Ubuntu: sudo apt install jq" 
    echo -e "     CentOS: sudo yum install jq"
    ALL_GOOD=false
fi

# Node.js 확인
echo -n "   Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ 설치됨 ($NODE_VERSION)${NC}"
else
    echo -e "${RED}❌ 설치되지 않음${NC}"
    ALL_GOOD=false
fi

echo -e "\n${YELLOW}2. 데이터 소스 의존성 검사${NC}"

# 용어 디렉토리 확인
echo -n "   용어 디렉토리: "
if [ -d "$TERMS_DIR" ]; then
    echo -e "${GREEN}✅ 존재함 ($TERMS_DIR)${NC}"
else
    echo -e "${RED}❌ 없음 ($TERMS_DIR)${NC}"
    ALL_GOOD=false
fi

# 필수 용어 파일들 확인
REQUIRED_FILES=("core-concepts.md" "api-terms.md" "architecture-terms.md" "naming-conventions.md")
echo "   필수 용어 파일들:"

MISSING_COUNT=0
for file in "${REQUIRED_FILES[@]}"; do
    echo -n "     $file: "
    if [ -f "$TERMS_DIR/$file" ]; then
        # 파일 크기와 용어 수 확인
        SIZE=$(ls -lh "$TERMS_DIR/$file" | awk '{print $5}')
        TERM_COUNT=$(grep -c "^## " "$TERMS_DIR/$file" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ 존재 (${SIZE}, ${TERM_COUNT}개 용어)${NC}"
    else
        echo -e "${RED}❌ 없음${NC}"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        ALL_GOOD=false
    fi
done

if [ $MISSING_COUNT -gt 0 ]; then
    echo -e "   ${RED}❌ ${MISSING_COUNT}개 필수 파일 누락${NC}"
fi

# 선택적 파일들 확인
OPTIONAL_FILES=("VALIDATION.md")
echo "   선택적 용어 파일들:"

for file in "${OPTIONAL_FILES[@]}"; do
    echo -n "     $file: "
    if [ -f "$TERMS_DIR/$file" ]; then
        SIZE=$(ls -lh "$TERMS_DIR/$file" | awk '{print $5}')
        TERM_COUNT=$(grep -c "^## " "$TERMS_DIR/$file" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ 존재 (${SIZE}, ${TERM_COUNT}개 용어)${NC}"
    else
        echo -e "${YELLOW}⚠️ 없음 (선택적)${NC}"
    fi
done

# 매핑 데이터 확인 (선택적)
echo -n "   구현체 매핑 데이터: "
MAPPING_FILE="$DATA_DIR/mappings.json"
if [ -f "$MAPPING_FILE" ]; then
    SIZE=$(ls -lh "$MAPPING_FILE" | awk '{print $5}')
    TERM_COUNT=$(jq '.terms | keys | length' "$MAPPING_FILE" 2>/dev/null || echo "?")
    echo -e "${GREEN}✅ 존재 (${SIZE}, ${TERM_COUNT}개 용어)${NC}"
else
    echo -e "${YELLOW}⚠️ 없음 (선택적 - 빈 구현체로 처리됨)${NC}"
fi

echo -e "\n${YELLOW}3. 데이터 품질 검사${NC}"

if [ -d "$TERMS_DIR" ]; then
    TOTAL_FILES=$(find "$TERMS_DIR" -name "*.md" -not -name "index.md" | wc -l)
    TOTAL_TERMS=0
    
    for file in "$TERMS_DIR"/*.md; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "index.md" ]; then
            TERM_COUNT=$(grep -c "^## " "$file" 2>/dev/null || echo "0")
            TOTAL_TERMS=$((TOTAL_TERMS + TERM_COUNT))
        fi
    done
    
    echo "   전체 용어 파일: ${TOTAL_FILES}개"
    echo "   전체 용어 수: ${TOTAL_TERMS}개"
    
    if [ $TOTAL_TERMS -lt 10 ]; then
        echo -e "   ${YELLOW}⚠️ 용어 수가 적습니다 (${TOTAL_TERMS}개 < 10개)${NC}"
    else
        echo -e "   ${GREEN}✅ 충분한 용어 데이터${NC}"
    fi
fi

echo -e "\n${YELLOW}4. 생성된 데이터 확인${NC}"

GENERATED_DATA="$SCRIPT_DIR/glossary-data.json"
echo -n "   생성된 JSON 데이터: "
if [ -f "$GENERATED_DATA" ]; then
    SIZE=$(ls -lh "$GENERATED_DATA" | awk '{print $5}')
    TERM_COUNT=$(jq '.metadata.totalTerms' "$GENERATED_DATA" 2>/dev/null || echo "?")
    GENERATED_DATE=$(jq -r '.metadata.generated' "$GENERATED_DATA" 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ 존재 (${SIZE}, ${TERM_COUNT}개 용어, ${GENERATED_DATE})${NC}"
    
    # 데이터 무결성 검사
    if jq -e '.terms | length > 0' "$GENERATED_DATA" >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ 데이터 무결성 확인${NC}"
    else
        echo -e "   ${RED}❌ 데이터 무결성 문제${NC}"
        ALL_GOOD=false
    fi
else
    echo -e "${YELLOW}⚠️ 없음 (node generate-data.js 실행 필요)${NC}"
fi

echo -e "\n${YELLOW}5. CLI 실행 가능성 확인${NC}"

CLI_SCRIPT="$SCRIPT_DIR/jq-cli.sh"
echo -n "   CLI 스크립트: "
if [ -f "$CLI_SCRIPT" ] && [ -x "$CLI_SCRIPT" ]; then
    echo -e "${GREEN}✅ 실행 가능${NC}"
    
    # 간단한 실행 테스트
    if [ -f "$GENERATED_DATA" ]; then
        echo -n "   CLI 기능 테스트: "
        if "$CLI_SCRIPT" stats >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 정상 작동${NC}"
        else
            echo -e "${RED}❌ 실행 오류${NC}"
            ALL_GOOD=false
        fi
    fi
else
    echo -e "${RED}❌ 실행 불가능${NC}"
    ALL_GOOD=false
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ 모든 의존성 확인 완료! 시스템 사용 준비됨${NC}"
    echo -e "\n${BLUE}💡 사용 방법:${NC}"
    echo -e "   ./jq-cli.sh categories"
    echo -e "   ./jq-cli.sh list core-concepts"
    echo -e "   ./jq-cli.sh detail \"Action Pipeline System\""
    exit 0
else
    echo -e "${RED}❌ 일부 의존성 문제 발견${NC}"
    echo -e "\n${YELLOW}💡 해결 방법:${NC}"
    echo -e "   1. 누락된 도구 설치"
    echo -e "   2. 용어 파일 경로 확인"
    echo -e "   3. node generate-data.js 실행"
    exit 1
fi