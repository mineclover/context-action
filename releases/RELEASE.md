# 릴리즈 운영 가이드

이 문서는 현재 저장소의 보호된 릴리즈 경로를 설명합니다. 과거의 로컬
`npm publish`, `pnpm publish:*`, 일괄 버전 동기화 방식은 더 이상 지원하지
않습니다. `pnpm release`와 `pnpm release:patch`는 의도적으로 실패하도록
설정되어 있습니다.

릴리즈 기준 계약은 다음 문서를 함께 따릅니다.

- [`docs/releases/v1.0.0/semver-and-deprecation-policy.md`](../docs/releases/v1.0.0/semver-and-deprecation-policy.md)
- [`docs/releases/v1.0.0/scope.md`](../docs/releases/v1.0.0/scope.md)
- [`docs/releases/v1.0.0/publish-runbook.md`](../docs/releases/v1.0.0/publish-runbook.md)
- [`COORDINATED_STABLE_2026_08.md`](COORDINATED_STABLE_2026_08.md)

## 1. 변경 분류와 버전 결정

패키지는 독립적으로 버전이 관리됩니다. 모든 패키지 버전을 같은 값으로
맞추지 않습니다.

- `stable-1x` 계약을 보존하는 수정은 patch입니다.
- 하위 호환 공개 API 추가는 minor입니다.
- 문서화된 공개 API, 타입, 런타임 결과 또는 지원 범위를 바꾸면 major입니다.
- 아직 1.0 이전이며 v1 안정성 범위 밖인 패키지의 breaking 변경은 다음 minor
  경계에서 릴리즈합니다. 1.0.0 선택은 별도의 안정성 승격 결정입니다.

버전과 CHANGELOG 날짜를 확정하기 전에는 레지스트리 작업을 시작하지
않습니다. React의 런타임 의존성이 바뀌면 의존 패키지의 새 최소 버전과
consumer matrix를 함께 갱신합니다.

## 2. 로컬 사전 검증

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

`release:check`는 빌드, 타입 검사, 전체 테스트, 패키지 산출물, 외부 consumer,
릴리즈 안전성, 문서와 생성물 정합성을 검증합니다. 생성된 API 문서가 바뀌면
그 변경을 검토하고 릴리즈 커밋에 포함한 뒤 다시 실행합니다.

버전 준비가 필요할 때 `pnpm version:*`를 자동 배포 명령처럼 사용하지
마십시오. Lerna 버전 명령은 manifest, lockfile, Git 커밋과 태그를 변경할 수
있으므로 승인된 릴리즈 계획 안에서만 사용합니다.

## 3. 지원되는 보호 워크플로

| 목적 | 워크플로 | 레지스트리 동작 |
| --- | --- | --- |
| 안정 1.x patch | `publish-maintenance-patch.yml` | 검증된 `maintenance` 후보를 `latest`로 승격하고 실패 시 안전하게 롤백 |
| prerelease | `publish-prerelease.yml` | 명시한 prerelease tag만 갱신하며 `latest`는 변경하지 않음 |
| 일반 도구 패키지 cohort | `publish-packages.yml` | 고정 cohort를 `next`에 게시하고 consumer/evidence를 검증 |
| Mutative cohort | `publish-mutative.yml` | 두 패키지를 `next`에 게시하고 consumer/evidence를 검증 |
| Core 1.1 / React 2 state-management release | `publish-coordinated-stable-candidate.yml` → `promote-coordinated-stable.yml` | 후보를 `next`에 고정·검증한 뒤 검토된 Core/React cohort만 `latest`로 승격. Durable·ToolContext는 별도 개발 트랙 |

모든 워크플로는 승인된 immutable main commit, 정확한 버전, provenance,
consumer 검증과 레지스트리 evidence를 기준으로 fail closed 해야 합니다.
이미 존재하는 버전을 현재 소스의 산출물로 간주하거나 다른 커밋의 패키지에
새 dist-tag를 붙여 재사용하지 않습니다.

`publish-v1-stable-candidate.yml`은 이미 완료된 1.0.0 cohort에 고정된 역사적
경로입니다. 새로운 minor 또는 major 안정 릴리즈에 재사용하지 않습니다.

## 4. Coordinated stable 경로

새 Core minor, React major 또는 Durable pre-1 breaking 경계는 maintenance
workflow가 아니라 coordinated stable 경로를 사용합니다. 현재 승인된 cohort와
정확한 진행 순서는 [`COORDINATED_STABLE_2026_08.md`](COORDINATED_STABLE_2026_08.md)를
따릅니다. 이 경로는 다음 조건을 모두 강제합니다.

- immutable main commit과 정확한 package/version cohort 입력
- 후보 tag 게시 전 전체 cohort의 미게시 상태 또는 검증 가능한 재개 상태 확인
- provenance와 소스 커밋 결속
- packed/published consumer matrix
- `latest` 변경 전 rollback 대상의 신뢰할 수 있는 조회
- 승격 후 closure 검증, package별 evidence, 조건부 rollback

이 경로가 없는 상태에서 수동 `npm publish`, `npm dist-tag`, 개인 토큰 또는
기존 workflow의 임의 수정으로 우회하지 않습니다.

## 5. 실패와 재개

- 게시 전 실패: 원인을 수정하고 같은 immutable commit 기준으로 처음부터
  검증합니다.
- 일부 패키지가 게시된 뒤 실패: 레지스트리와 summary/evidence를 확인하고,
  해당 워크플로가 증명하는 재개 경로만 사용합니다.
- 승격 후 검증 실패: 워크플로가 현재 tag가 자신의 후보를 가리키는지 확인한
  경우에만 기록된 이전 tag로 롤백합니다.
- 실패를 숨기기 위해 Git 기록을 강제로 되돌리거나 이미 게시된 npm 버전을
  덮어쓰지 않습니다. npm 버전은 immutable입니다.

## 6. 완료 기준

- source와 packed CHANGELOG의 버전 및 실제 달력 날짜가 일치합니다.
- ESM/CJS 타입과 런타임 consumer 검증이 통과합니다.
- React 지원 버전 매트릭스와 관련 백엔드 smoke가 통과합니다.
- registry evidence가 실제 실행된 consumer 상태를 package별로 기록합니다.
- `latest` 또는 후보 tag가 승인된 소스 커밋의 산출물과 결속됩니다.
- 릴리즈 결과와 후속 조치가 변경 이력 및 운영 문서에 남습니다.
