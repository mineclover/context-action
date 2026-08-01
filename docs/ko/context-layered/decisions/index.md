# 아키텍처 결정 기록

결정 기록은 지속되는 아키텍처 선택을 해당 컨벤션 가까이에 보관합니다. 이는
runtime registry가 아니며 package README나 공개 가이드를 중복하지 않습니다.

## 산출물별 소유권

| 산출물 | 소유하는 것 | 대체하지 않는 것 |
| --- | --- | --- |
| decision record | 지속 경계를 선택한 이유, 대안, invariant, 되돌림 조건 | 구현 세부나 소비자 사용법 |
| package README | 발견 경로, public entry point, quickstart | 전체 동작 또는 아키텍처 계약 |
| 권위 가이드 | 현재 동작, 제한, 운영 안내 | 결정 이력 |
| 테스트와 집중 gate | 실행 가능한 증거 | 의도에 대한 설명 |

더 넓은 변경에서 어떤 문서 원본과 검증 명령을 선택할지는
[문서 및 개발 관리 컨벤션](/ko/concept/documentation-development-conventions)을 따릅니다.

## 작성 시점

package 소유권 또는 의존성 방향, provider/handler/store 경계, protocol 계약,
persistence·privacy 동작, 임시 compatibility 예외가 바뀌면 기록을 작성합니다.

파일명에는 `CA-TOOL-PROTOCOL-001.md`처럼 안정적인 ID를 사용합니다. 구현
경로가 바뀌어도 ID는 유지하고, 결정이 대체되면 후속 기록을 연결합니다.

## 필수 형식

```md
# CA-AREA-001: 짧은 결정 제목

**상태:** accepted | superseded | deprecated
**소유자:** package 또는 영역 소유자
**관련 이슈/스펙:** #123 또는 CA-SPEC-001

## 맥락

## 검토한 선택지

## 결정

## 결과와 invariant

## 검증 증거

## 되돌림 또는 migration 조건
```

구현, 집중 테스트, 권위 사용자 문서는 결정의 증거를 각각 소유합니다. 이
인덱스는 결정 자체의 지속되는 위치와 형식만 정의합니다.

결정을 accepted로 표시하기 전에는 owner, 안정적인 ID, 명시적인 non-goal 또는
기각한 대안, 구현·테스트 anchor, 계약이 바뀌는 package 또는 guide 링크를
확인합니다.

## 기존 참조 결정

- [PostgreSQL Durable Operation Adapter](../architecture/postgres-durable-operation-adapter.md)
