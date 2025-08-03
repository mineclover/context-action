#!/bin/bash

# jq 기반 Context-Action 용어집 정보 조회 CLI
# Version: 2.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/glossary-data.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# 아이콘
ICON_CATEGORY="📂"
ICON_TERM="📌"
ICON_INFO="ℹ️"
ICON_SEARCH="🔍"
ICON_STATS="📊"
ICON_ERROR="❌"
ICON_SUCCESS="✅"
ICON_ARROW="→"

function print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🚀 Context-Action 용어집 정보 조회 CLI v2.0${NC}"
    echo -e "${GRAY}   jq 기반 고성능 정보 조회 시스템${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function print_usage() {
    cat << EOF

${YELLOW}💡 사용법:${NC}
  
${GREEN}🚀 기본 워크플로우:${NC}
  $0 categories                    ${GRAY}# 1단계: 카테고리 목록 보기${NC}
  $0 list <카테고리>               ${GRAY}# 2단계: 카테고리별 용어 목록${NC}
  $0 detail <용어명>               ${GRAY}# 3단계: 특정 용어 상세 정보${NC}

${GREEN}📋 목록 조회:${NC}
  $0 categories                    ${GRAY}# 모든 카테고리 목록${NC}
  $0 list                          ${GRAY}# 모든 용어 목록 (기본 10개)${NC}
  $0 list <카테고리>               ${GRAY}# 특정 카테고리 용어들${NC}
  $0 list <카테고리> --limit N     ${GRAY}# 제한된 개수로 조회${NC}

${GREEN}ℹ️ 상세 정보:${NC}
  $0 detail <용어명>               ${GRAY}# 용어 상세 정보${NC}
  $0 info <용어명>                 ${GRAY}# detail과 동일${NC}

${GREEN}🔍 키워드 조회:${NC}
  $0 keyword <키워드>              ${GRAY}# 키워드로 용어 찾기${NC}
  $0 alias <별칭>                  ${GRAY}# 별칭으로 용어 찾기${NC}

${GREEN}🔗 관련 용어 네트워크:${NC}
  $0 explore <용어명>              ${GRAY}# 관련 용어 네트워크 탐색${NC}
  $0 related <용어명> [깊이]       ${GRAY}# 관련 용어들 상세 정보${NC}

${GREEN}📊 시스템 정보:${NC}
  $0 stats                         ${GRAY}# 통계 정보${NC}
  $0 help                          ${GRAY}# 도움말${NC}

${YELLOW}예시:${NC}
  $0 categories
  $0 list core-concepts
  $0 detail "Action Pipeline System"
  $0 keyword action
  $0 alias 액션
  $0 explore "ActionRegister"
  $0 related "Action Pipeline System" 2

EOF
}

function check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}${ICON_ERROR} jq가 설치되지 않았습니다.${NC}"
        echo -e "${YELLOW}설치 방법:${NC}"
        echo -e "  ${GRAY}macOS:${NC} brew install jq"
        echo -e "  ${GRAY}Ubuntu:${NC} sudo apt install jq"
        echo -e "  ${GRAY}CentOS:${NC} sudo yum install jq"
        exit 1
    fi

    if [ ! -f "$DATA_FILE" ]; then
        echo -e "${RED}${ICON_ERROR} 데이터 파일이 없습니다: $DATA_FILE${NC}"
        echo -e "${YELLOW}데이터 생성:${NC} node generate-data.js"
        exit 1
    fi
}

function show_categories() {
    echo -e "\n${ICON_CATEGORY} ${GREEN}카테고리 목록:${NC}"
    
    jq -r '
        .categories | 
        to_entries | 
        map("\(.key):\(.value.termCount):\(.value.name):\(.value.description)") | 
        sort | 
        .[]
    ' "$DATA_FILE" | while IFS=: read -r key count name desc; do
        printf "  %2d. ${ICON_CATEGORY} %-20s (${CYAN}%s개${NC} 용어)\n" \
            $((++i)) "$name" "$count"
        echo -e "      ${GRAY}$desc${NC}"
        echo
    done

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 다음 단계:${NC}"
    echo -e "   $0 list <카테고리명>  ${ICON_ARROW} 해당 카테고리의 용어들 보기"
    echo -e "   예시: $0 list core-concepts"
    echo
}

function list_terms() {
    local category="$1"
    local limit="$2"
    
    if [ -z "$limit" ]; then
        limit=10
    fi
    
    echo -e "\n${ICON_TERM} ${GREEN}용어 목록:${NC}"
    
    if [ -n "$category" ]; then
        echo -e "${ICON_CATEGORY} 카테고리: ${YELLOW}$category${NC}"
        
        # 카테고리 존재 확인
        if ! jq -e ".categories[\"$category\"]" "$DATA_FILE" > /dev/null; then
            echo -e "${RED}${ICON_ERROR} 카테고리 '$category'를 찾을 수 없습니다.${NC}"
            echo -e "${YELLOW}사용 가능한 카테고리:${NC}"
            jq -r '.categories | keys[]' "$DATA_FILE" | sed 's/^/  - /'
            return 1
        fi
        
        term_ids=$(jq -r ".categories[\"$category\"].terms[:$limit][]" "$DATA_FILE")
    else
        echo -e "${ICON_CATEGORY} 카테고리: ${YELLOW}전체${NC}"
        term_ids=$(jq -r ".terms | keys[:$limit][]" "$DATA_FILE")
    fi
    
    echo -e "${ICON_STATS} 표시: ${CYAN}$limit개${NC} 용어"
    echo
    
    local count=0
    for term_id in $term_ids; do
        count=$((count + 1))
        
        term_info=$(jq -r ".terms[\"$term_id\"] | \"\(.title)|\(.category)|\(.definition // \"정의 없음\")|\(.implementations | length)\"" "$DATA_FILE")
        
        IFS='|' read -r title cat def impl_count <<< "$term_info"
        
        printf "%2d. ${ICON_TERM} ${GREEN}%s${NC}\n" "$count" "$title"
        printf "     🏷️  [${YELLOW}%s${NC}] | 구현: ${CYAN}%s개${NC}\n" "$cat" "$impl_count"
        
        # 정의 길이 제한
        if [ ${#def} -gt 60 ]; then
            def="${def:0:60}..."
        fi
        printf "     📄 ${GRAY}%s${NC}\n" "$def"
        echo
    done
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 다음 단계:${NC}"
    echo -e "   $0 detail <용어명>  ${ICON_ARROW} 용어 상세 정보 보기"
    echo -e "   예시: $0 detail \"Action Pipeline System\""
    echo
}

function show_detail() {
    local term_name="$1"
    
    if [ -z "$term_name" ]; then
        echo -e "${RED}${ICON_ERROR} 용어명을 입력해주세요.${NC}"
        echo -e "${YELLOW}사용법:${NC} $0 detail <용어명>"
        return 1
    fi
    
    # 1. 정확한 제목 매칭 시도
    local term_id=$(jq -r --arg name "$term_name" '
        .terms | 
        to_entries[] | 
        select(.value.title | test($name; "i")) | 
        .key
    ' "$DATA_FILE" | head -1)
    
    # 2. 별칭 검색 시도
    if [ -z "$term_id" ]; then
        term_id=$(search_by_alias "$term_name")
    fi
    
    # 3. 부분 매칭 시도 (퍼지 검색)
    if [ -z "$term_id" ]; then
        echo -e "${YELLOW}정확한 매칭을 찾지 못했습니다. 퍼지 검색을 시도합니다...${NC}"
        term_id=$(fuzzy_search_terms "$term_name" | head -1)
    fi
    
    # 4. 키워드 검색 시도
    if [ -z "$term_id" ]; then
        echo -e "${YELLOW}키워드 검색을 시도합니다...${NC}"
        term_id=$(search_by_keyword "$term_name" | head -1)
    fi
    
    if [ -z "$term_id" ]; then
        echo -e "${RED}${ICON_ERROR} '$term_name' 용어를 찾을 수 없습니다.${NC}"
        suggest_similar_terms "$term_name"
        return 1
    fi
    
    # 상세 정보 출력
    local term_data=$(jq -r ".terms[\"$term_id\"]" "$DATA_FILE")
    local title=$(echo "$term_data" | jq -r '.title')
    local category=$(echo "$term_data" | jq -r '.category')
    local definition=$(echo "$term_data" | jq -r '.definition // "정의 없음"')
    local impl_count=$(echo "$term_data" | jq -r '.implementations | length')
    
    echo -e "\n${ICON_TERM} ${GREEN}$title${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${ICON_INFO} ID: ${GRAY}$term_id${NC}"
    echo -e "🏷️  카테고리: ${YELLOW}$category${NC}"
    echo
    
    echo -e "${GREEN}📄 정의:${NC}"
    echo -e "   $definition"
    echo
    
    if [ "$impl_count" -gt 0 ]; then
        echo -e "${GREEN}🔧 구현체 ($impl_count개):${NC}"
        echo "$term_data" | jq -r '.implementations[] | "   • \(.name // "Unknown") (\(.file // "Unknown file"):\(.line // "?"))"'
        echo
    else
        echo -e "${GRAY}🔧 구현체: 없음${NC}"
        echo
    fi
    
    # 관련 용어
    local related=$(echo "$term_data" | jq -r '.relatedTerms[]?' 2>/dev/null)
    if [ -n "$related" ]; then
        echo -e "${GREEN}🔗 관련 용어:${NC}"
        for rel in $related; do
            local rel_title=$(jq -r ".terms[\"$rel\"].title // \"$rel\"" "$DATA_FILE")
            echo -e "   • $rel_title"
        done
        echo
    fi
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 다음 탐색:${NC}"
    echo -e "   $0 list           ${ICON_ARROW} 다른 용어들 보기"
    echo -e "   $0 detail <이름>  ${ICON_ARROW} 다른 용어 상세 정보"
    echo
}

function search_by_keyword() {
    local keyword="$1"
    jq -r --arg key "$keyword" '
        .index.byKeyword[$key][]?
    ' "$DATA_FILE"
}

function search_by_alias() {
    local alias="$1"
    jq -r --arg alias "$alias" '
        .index.byAlias[$alias] // empty
    ' "$DATA_FILE"
}

function fuzzy_search_terms() {
    local query="$1"
    local query_lower=$(echo "$query" | tr '[:upper:]' '[:lower:]')
    
    jq -r --arg query "$query_lower" '
        .terms | 
        to_entries[] | 
        select(.value.title | ascii_downcase | contains($query)) |
        .key
    ' "$DATA_FILE"
}

function suggest_similar_terms() {
    local query="$1"
    local query_lower=$(echo "$query" | tr '[:upper:]' '[:lower:]')
    
    echo -e "${YELLOW}💡 유사한 용어들:${NC}"
    
    # 1. 부분 매칭 시도
    local partial_matches=$(jq -r --arg query "$query_lower" '
        .terms | 
        to_entries[] | 
        select(.value.title | ascii_downcase | contains($query)) |
        "\(.value.title)|\(.value.category)"
    ' "$DATA_FILE" | head -5)
    
    if [ -n "$partial_matches" ]; then
        echo -e "${GREEN}📝 이름에 '$query'가 포함된 용어들:${NC}"
        echo "$partial_matches" | while IFS='|' read -r title category; do
            echo -e "   • $title [${YELLOW}$category${NC}]"
        done
        echo
    fi
    
    # 2. 키워드 기반 제안
    local keyword_matches=$(jq -r --arg query "$query_lower" '
        .index.byKeyword | 
        keys[] | 
        select(. | contains($query)) as $key |
        .index.byKeyword[$key][]
    ' "$DATA_FILE" | head -5)
    
    if [ -n "$keyword_matches" ]; then
        echo -e "${GREEN}🔍 관련 키워드로 찾은 용어들:${NC}"
        for term_id in $keyword_matches; do
            local title=$(jq -r ".terms[\"$term_id\"].title" "$DATA_FILE")
            local category=$(jq -r ".terms[\"$term_id\"].category" "$DATA_FILE")
            echo -e "   • $title [${YELLOW}$category${NC}]"
        done
        echo
    fi
    
    echo -e "${YELLOW}💡 추천 명령어:${NC}"
    echo -e "   $0 list           ${ICON_ARROW} 모든 용어 목록 보기"
    echo -e "   $0 keyword <키워드> ${ICON_ARROW} 키워드로 검색"
    echo -e "   $0 categories     ${ICON_ARROW} 카테고리별 탐색"
}

function show_keyword_search() {
    local keyword="$1"
    
    if [ -z "$keyword" ]; then
        echo -e "${RED}${ICON_ERROR} 키워드를 입력해주세요.${NC}"
        return 1
    fi
    
    echo -e "\n${ICON_SEARCH} ${GREEN}키워드 '$keyword' 검색 결과:${NC}"
    
    local results=$(search_by_keyword "$keyword")
    
    if [ -z "$results" ]; then
        echo -e "${RED}${ICON_ERROR} 키워드 '$keyword'와 매칭되는 용어가 없습니다.${NC}"
        return 1
    fi
    
    local count=0
    for term_id in $results; do
        count=$((count + 1))
        local title=$(jq -r ".terms[\"$term_id\"].title" "$DATA_FILE")
        local category=$(jq -r ".terms[\"$term_id\"].category" "$DATA_FILE")
        
        printf "%2d. ${ICON_TERM} ${GREEN}%s${NC} [${YELLOW}%s${NC}]\n" "$count" "$title" "$category"
    done
    
    echo
    echo -e "${YELLOW}💡 상세 정보:${NC} $0 detail <용어명>"
}

function show_alias_search() {
    local alias="$1"
    
    if [ -z "$alias" ]; then
        echo -e "${RED}${ICON_ERROR} 별칭을 입력해주세요.${NC}"
        return 1
    fi
    
    local term_id=$(search_by_alias "$alias")
    
    if [ -z "$term_id" ]; then
        echo -e "${RED}${ICON_ERROR} 별칭 '$alias'를 찾을 수 없습니다.${NC}"
        return 1
    fi
    
    echo -e "\n${ICON_SEARCH} ${GREEN}별칭 '$alias' → 용어 발견!${NC}"
    show_detail "$(jq -r ".terms[\"$term_id\"].title" "$DATA_FILE")"
}

function show_related_network() {
    local term_name="$1"
    local depth="${2:-1}"
    
    if [ -z "$term_name" ]; then
        echo -e "${RED}${ICON_ERROR} 용어명을 입력해주세요.${NC}"
        echo -e "${YELLOW}사용법:${NC} $0 explore <용어명> [깊이]"
        return 1
    fi
    
    # 1. 시작 용어 ID 찾기
    local term_id=$(jq -r --arg name "$term_name" '
        .terms | 
        to_entries[] | 
        select(.value.title | test($name; "i")) | 
        .key
    ' "$DATA_FILE" | head -1)
    
    # 2. 별칭 검색 시도
    if [ -z "$term_id" ]; then
        term_id=$(search_by_alias "$term_name")
    fi
    
    # 3. 퍼지 검색 시도
    if [ -z "$term_id" ]; then
        term_id=$(fuzzy_search_terms "$term_name" | head -1)
    fi
    
    if [ -z "$term_id" ]; then
        echo -e "${RED}${ICON_ERROR} '$term_name' 용어를 찾을 수 없습니다.${NC}"
        return 1
    fi
    
    local main_term=$(jq -r ".terms[\"$term_id\"].title" "$DATA_FILE")
    echo -e "\n🔗 ${GREEN}관련 용어 네트워크 탐색:${NC} ${CYAN}$main_term${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 중앙 용어 정보 출력
    echo -e "\n${ICON_TERM} ${GREEN}중심 용어:${NC}"
    show_term_summary "$term_id" "🎯"
    
    # 1단계 관련 용어들
    echo -e "\n${GREEN}🔗 직접 관련 용어들:${NC}"
    local related_terms=$(jq -r ".terms[\"$term_id\"].relatedTerms[]?" "$DATA_FILE" 2>/dev/null)
    
    if [ -z "$related_terms" ]; then
        echo -e "   ${GRAY}관련 용어가 없습니다.${NC}"
    else
        local count=0
        for related_id in $related_terms; do
            count=$((count + 1))
            show_term_summary "$related_id" "  $count."
        done
    fi
    
    # 2단계 관련 용어들 (depth가 2 이상인 경우)
    if [ "$depth" -ge 2 ] && [ -n "$related_terms" ]; then
        echo -e "\n${GREEN}🔗🔗 2단계 관련 용어들:${NC}"
        local second_level_terms=""
        
        for related_id in $related_terms; do
            local second_level=$(jq -r ".terms[\"$related_id\"].relatedTerms[]?" "$DATA_FILE" 2>/dev/null)
            for second_id in $second_level; do
                # 이미 출력된 용어들 제외
                if [ "$second_id" != "$term_id" ] && ! echo "$related_terms" | grep -q "$second_id"; then
                    if ! echo "$second_level_terms" | grep -q "$second_id"; then
                        second_level_terms="$second_level_terms $second_id"
                    fi
                fi
            done
        done
        
        if [ -z "$second_level_terms" ]; then
            echo -e "   ${GRAY}2단계 관련 용어가 없습니다.${NC}"
        else
            local count=0
            for second_id in $second_level_terms; do
                count=$((count + 1))
                show_term_summary "$second_id" "    $count."
            done
        fi
    fi
    
    # 같은 카테고리 용어들
    local category=$(jq -r ".terms[\"$term_id\"].category" "$DATA_FILE")
    echo -e "\n${GREEN}📂 같은 카테고리 (${category}) 용어들:${NC}"
    local category_terms=$(jq -r ".categories[\"$category\"].terms[]" "$DATA_FILE" | head -5)
    local count=0
    for cat_id in $category_terms; do
        if [ "$cat_id" != "$term_id" ]; then
            count=$((count + 1))
            if [ $count -le 5 ]; then
                show_term_summary "$cat_id" "  $count."
            fi
        fi
    done
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 사용법:${NC}"
    echo -e "   $0 detail <용어명>     ${ICON_ARROW} 특정 용어 상세 정보"
    echo -e "   $0 explore <용어명> 2  ${ICON_ARROW} 2단계 깊이로 탐색"
    echo
}

function show_term_summary() {
    local term_id="$1"
    local prefix="$2"
    
    local term_data=$(jq -r ".terms[\"$term_id\"]" "$DATA_FILE")
    local title=$(echo "$term_data" | jq -r '.title')
    local category=$(echo "$term_data" | jq -r '.category')
    local definition=$(echo "$term_data" | jq -r '.definition // "정의 없음"')
    local impl_count=$(echo "$term_data" | jq -r '.implementations | length')
    
    # 정의 길이 제한
    if [ ${#definition} -gt 80 ]; then
        definition="${definition:0:80}..."
    fi
    
    echo -e "$prefix ${ICON_TERM} ${GREEN}$title${NC} [${YELLOW}$category${NC}]"
    echo -e "     📄 $definition"
    echo -e "     🔧 구현체: ${CYAN}${impl_count}개${NC}"
    echo
}

function show_stats() {
    echo -e "\n${ICON_STATS} ${GREEN}시스템 통계:${NC}"
    
    local metadata=$(jq -r '.metadata' "$DATA_FILE")
    local total_terms=$(echo "$metadata" | jq -r '.totalTerms')
    local category_count=$(echo "$metadata" | jq -r '.categories | length')
    local generated=$(echo "$metadata" | jq -r '.generated')
    
    local keyword_count=$(jq -r '.index.byKeyword | keys | length' "$DATA_FILE")
    local alias_count=$(jq -r '.index.byAlias | keys | length' "$DATA_FILE")
    
    echo -e "📚 총 용어 수: ${CYAN}${total_terms}개${NC}"
    echo -e "📂 카테고리 수: ${CYAN}${category_count}개${NC}"
    echo -e "🔍 키워드 수: ${CYAN}${keyword_count}개${NC}"
    echo -e "🔗 별칭 수: ${CYAN}${alias_count}개${NC}"
    echo -e "⏰ 데이터 생성: ${GRAY}${generated}${NC}"
    echo
    
    echo -e "${GREEN}카테고리별 용어 수:${NC}"
    jq -r '.categories | to_entries | sort_by(.value.termCount) | reverse | .[] | "  \(.value.name): \(.value.termCount)개"' "$DATA_FILE"
    echo
}

# 메인 실행 로직
function main() {
    check_dependencies
    
    case "${1:-help}" in
        "categories"|"cat")
            print_header
            show_categories
            ;;
        "list"|"ls")
            print_header
            # 인수 파싱 개선
            local category=""
            local limit=""
            local i=2
            
            while [ $i -le $# ]; do
                case "${!i}" in
                    "--limit")
                        i=$((i + 1))
                        if [ $i -le $# ]; then
                            limit="${!i}"
                        fi
                        ;;
                    -*)
                        echo -e "${RED}${ICON_ERROR} 알 수 없는 옵션: ${!i}${NC}"
                        print_usage
                        exit 1
                        ;;
                    *)
                        if [ -z "$category" ]; then
                            category="${!i}"
                        else
                            echo -e "${RED}${ICON_ERROR} 너무 많은 인수입니다: ${!i}${NC}"
                            print_usage
                            exit 1
                        fi
                        ;;
                esac
                i=$((i + 1))
            done
            
            list_terms "$category" "$limit"
            ;;
        "detail"|"info")
            print_header
            show_detail "$2"
            ;;
        "keyword"|"search")
            print_header
            show_keyword_search "$2"
            ;;
        "alias")
            print_header
            show_alias_search "$2"
            ;;
        "explore"|"related"|"network")
            print_header
            show_related_network "$2" "$3"
            ;;
        "stats"|"status")
            print_header
            show_stats
            ;;
        "help"|"--help"|"-h")
            print_header
            print_usage
            ;;
        *)
            print_header
            echo -e "${RED}${ICON_ERROR} 알 수 없는 명령어: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"