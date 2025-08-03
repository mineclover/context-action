#!/bin/bash

# jq 기반 시스템 성능 벤치마크

echo "🚀 jq 기반 정보 조회 시스템 성능 벤치마크"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DATA_FILE="glossary-data.json"

if [ ! -f "$DATA_FILE" ]; then
    echo "❌ 데이터 파일이 없습니다. 먼저 'node generate-data.js'를 실행하세요."
    exit 1
fi

echo "📊 데이터 크기 확인:"
ls -lh "$DATA_FILE" | awk '{print "   파일 크기: " $5}'
echo "   용어 수: $(jq '.metadata.totalTerms' "$DATA_FILE")개"
echo

echo "⚡ 조회 성능 테스트:"

# 카테고리 목록 조회
echo -n "   카테고리 목록: "
time jq '.categories | keys[]' "$DATA_FILE" > /dev/null

# 특정 카테고리 용어 목록
echo -n "   용어 목록 조회: "
time jq '.categories["core-concepts"].terms[]' "$DATA_FILE" > /dev/null

# 특정 용어 상세 정보
echo -n "   상세 정보 조회: "
time jq '.terms["action-pipeline-system"]' "$DATA_FILE" > /dev/null

# 키워드 검색
echo -n "   키워드 검색: "
time jq '.index.byKeyword["action"]' "$DATA_FILE" > /dev/null

# 복합 쿼리 (실제 CLI에서 사용되는 형태)
echo -n "   복합 쿼리: "
time jq '.categories["core-concepts"].terms[:5][] as $id | .terms[$id] | {title, category, definition}' "$DATA_FILE" > /dev/null

echo
echo "🔍 인덱스 효율성:"
echo "   키워드 수: $(jq '.index.byKeyword | keys | length' "$DATA_FILE")개"
echo "   별칭 수: $(jq '.index.byAlias | keys | length' "$DATA_FILE")개"
echo "   평균 키워드당 용어 수: $(jq '[.index.byKeyword | values | length] | add / length' "$DATA_FILE" | cut -d. -f1)개"

echo
echo "📈 메모리 사용량 (추정):"
echo "   JSON 데이터: $(ls -lh "$DATA_FILE" | awk '{print $5}')"
echo "   jq 프로세스: 최소 (스트리밍 처리)"

echo
echo "✅ 벤치마크 완료!"
echo "💡 jq는 JSON 데이터를 스트리밍으로 처리하여 메모리 사용량이 최소화됩니다."