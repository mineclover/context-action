# 2026-08 Coordinated Stable Release Roadmap

## 결정

안정화 변경은 하나의 patch로 축소하지 않는다. 상태 관리 표면인 아래 두
패키지를 하나의 coordinated candidate로 검증하고, 검토 후 함께 `latest`로
승격한다.

| 패키지 | 승인 버전 | 경계 |
| --- | --- | --- |
| `@context-action/core` | `1.1.0` | 하위 호환 API 추가와 런타임 정정 |
| `@context-action/react` | `2.0.0` | Store·Action lifecycle 및 SSR 안정화 |

Durable Operations 0.2와 ToolContext 연계는 별도 개발 트랙으로 둔다. React 2
artifact에서는 `./tools` subpath를 제외하므로, 상태 관리 릴리즈가 미출시 Durable
의존성을 함께 배포하지 않는다.

## 실행 순서

1. manifest, CHANGELOG, API 문서, 이 로드맵을 포함한 main의 immutable SHA를
   `publish-coordinated-stable-candidate.yml`에 입력한다.
2. 후보 workflow는 `release:check`, release plan, packed cohort closure를 통과한
   뒤 두 immutable tarball을 `next`에만 게시한다. provenance, 외부 consumer,
   registry evidence를 모두 업로드한다.
3. evidence 승인 후 동일 SHA와 명시적 confirmation으로
   `promote-coordinated-stable.yml`을 실행한다. 이 경로는 `next`의 provenance와
   consumer를 다시 확인한 다음, package별 predecessor journal을 기록하고
   `latest`를 승격한다.
4. 승격 후 consumer/provenance/evidence가 실패하면 workflow가 현재 `latest`가
   자기 candidate를 가리킬 때만 journal의 predecessor로 복구한다. 다른 release가
   tag를 바꾼 경우에는 fail closed 한다.

## 하지 않는 일

- v1.0.0 역사 manifest나 `publish-v1-stable-candidate.yml`을 수정해 이번 버전을
  출하하지 않는다.
- maintenance patch, generic package, prerelease, Mutative workflow로 이 cohort를
  우회하지 않는다.
- 수동 `npm publish`/`npm dist-tag` 또는 이미 존재하는 다른 commit의 version을
  재사용하지 않는다.

정확한 machine-readable 계약은
[`coordinated-stable-2026-08.json`](coordinated-stable-2026-08.json)과
`pnpm verify:coordinated-stable-release-plan`이 소유한다.
