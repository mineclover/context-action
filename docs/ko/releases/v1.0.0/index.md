# Context-Action v1.0.0 릴리스 문서

한국어 release roadmap이 의미 기준 문서이며, 영문 릴리스 문서는 그 상태를
반영합니다. v1 stable surfaces는 이미 `latest`로 승격됐고, 현재 상태는
[`status.md`](../../../releases/v1.0.0/status.md)와
[`release-manifest.json`](../../../releases/v1.0.0/release-manifest.json)에 기록됩니다.

현재 국문 릴리스 안내는 다음을 보장합니다.

- 릴리스 로드맵의 revision, milestone, gate, 이슈 ID는 영문 번역 문서와
  `pnpm release:roadmap:check`로 동기화합니다.
- 공개 계약·버전·마이그레이션의 실제 약속은 한국어 기준 로드맵과 승인된
  `release-manifest.json`을 따릅니다.
- 승격된 `stable-1x` 계약의 breaking 변경은 major 버전을 사용합니다. 1.0
  이전이면서 안정 범위 밖인 패키지는 새 minor 호환성 경계와 Breaking Changes,
  마이그레이션, packed-consumer 검증을 사용하며, `1.0.0`은 명시적인 안정성
  승격에만 사용합니다.
- 이후 maintenance 변경 시 영문 번역본은 한국어 기준 문서와 함께 검토·갱신해야 합니다.

영문 참조 문서:

- [현재 상태](../../../releases/v1.0.0/status.md)
- [범위와 버전 후보](../../../releases/v1.0.0/scope.md)
- [SemVer 및 deprecation 정책](../../../releases/v1.0.0/semver-and-deprecation-policy.md)
- [마이그레이션 가이드](../../../releases/v1.0.0/migration.md)
- [준비도 보고서](../../../releases/v1.0.0/readiness.md)
- [감사 프로토콜](../../../releases/v1.0.0/audit-protocol.md)
- [Publish 및 복구 runbook](../../../releases/v1.0.0/publish-runbook.md)
