# Local-First Verification Policy & Release Gate Contract

> **Grounded in:** Issue [#53](https://github.com/mineclover/google-workspace-toolkit/issues/53), Issue [#50](https://github.com/mineclover/google-workspace-toolkit/issues/50), Issue [#52](https://github.com/mineclover/google-workspace-toolkit/issues/52)  
> **Status:** Active / Enforced  
> **Repository:** `mineclover/context-action`  
> **Schema:** `local-verification-receipt/v1`

---

## 1. 개요 (Overview)

본 문서는 `context-action` 모노레포의 **로컬-퍼스트(Local-First) 검증 기본 정책**과 **GitHub Actions 최소 릴리즈 게이트 계약**을 정의합니다.

### 핵심 원칙
1. **GitHub Actions 중심 검증 지양**: CI를 개발 검증의 중심으로 두지 않고, 로컬 검증을 통과한 변경만 최소 릴리즈 게이트로 전송합니다.
2. **단일 로컬 엔트리포인트**: 모든 개발자는 `pnpm verify` (또는 빠른 확인용 `pnpm verify:quick`)를 단일 진입점으로 실행합니다.
3. **불변 실행 영수증 (Cryptographic Local Receipt)**: 로컬 검증 통과 시 RFC 8785 JSON Canonicalization Scheme (JCS) 기반의 SHA-256 서명 영수증(`.verification/local-receipt.json`)이 발급됩니다.
4. **CI Fail-Closed 차단**: PR 및 릴리즈 파이프라인은 로컬 영수증의 유효성(`status === 'passed'`), 커밋 일치성, 암호학적 다이제스트 무결성을 검증하며, 영수증이 누락되거나 변조/stale된 경우 릴리즈를 즉시 차단합니다.
5. **Actions 자원/비용 최적화**: 경로 필터(path filtering), 동시성 자동 취소(`cancel-in-progress: true`), 짧은 타임아웃(10분), Redis/PostgreSQL 서비스 컨테이너의 PR 실행 배제 및 release/main 통합 게이트 보존을 전면 적용합니다.

---

## 2. 로컬 검증 엔트리포인트 (Commands)

| 명령어 | 용도 | 소요 시간 | 산출물 |
|---|---|---|---|
| `pnpm verify` | **전체 로컬 검증 정본 실행** (13개 워크스페이스 Typecheck, 패키지 경계 검증 및 테스트, Context-Action 컨벤션/카탈로그, 코어/React 아티팩트 패리티/경계/격리, AI SDK/Tool Protocol 계약, React Aria 수화, 문서 스니펫, Durable Operations 스키마 테스트, V1 공급망 감사, 릴리즈 안전 회귀 스위트 194개) | ~80s | `.verification/local-receipt.json` |
| `pnpm verify:quick` | **빠른 스모크 검증** (Typecheck 전체 + 패키지 경계 + 컨벤션 + 아티팩트 패리티/경계 + Durable 증적 테스트) | ~11s | `.verification/local-receipt.json` |
| `pnpm verify:receipt` | **로컬 영수증 암호 무결성 감사** (CI 및 PR 게이트에서 호출) | <0.1s | 검증 성공 로그 (Exit 0 / 1) |

---

## 3. 실행 영수증 명세 (Receipt Contract)

영수증은 `.verification/local-receipt.json`에 저장되며 아래 스키마를 준수합니다:

```json
{
  "schemaVersion": "local-verification-receipt/v1",
  "timestamp": "2026-10-13T04:44:16.474Z",
  "commitSha": "c76001bf4e4f70012f73c0cfdbd25e49373ad68e",
  "branch": "main",
  "toolchain": {
    "node": "v24.20.0",
    "pnpm": "10.30.3",
    "platform": "darwin",
    "arch": "arm64"
  },
  "inputDigest": "sha256:d4517b56274f5113084ffc1955675a9f13e2f7ce0a19a7e5a0f5654cc26ec3e2",
  "suites": [
    {
      "name": "1. Monorepo Typecheck (13 projects)",
      "durationSec": 10.42,
      "status": "passed"
    },
    {
      "name": "13. Release Safety Regression Suite (194 tests)",
      "durationSec": 56.49,
      "status": "passed"
    }
  ],
  "status": "passed",
  "receiptDigest": "sha256:f7c4da0aabcde6e2ce9e06012f9b784538e3a63100a35862b02191091b80052a"
}
```

* `receiptDigest`는 `receiptDigest` 필드를 제외한 객체를 RFC 8785 JCS(UTF-16 코드 유닛 정렬, 불필요한 공백 제거)로 직렬화한 후 SHA-256 해시한 불변 증적입니다.

---

## 4. PR Required Checks vs Main/Release Checks 분리

| 구분 | PR Fast Gate (`pr-verify.yml`) | Main Integration Gate (`ci.yml`) | Release Publish Gate (`publish-*.yml`) |
|---|---|---|---|
| **트리거** | `pull_request` (코드 및 패키지 변경 경로 한정), `workflow_dispatch` | `push` (`main`, `develop`), `workflow_dispatch` | `push` 태그 `v*`, `workflow_dispatch` (immutable commit) |
| **타임아웃** | 최대 10분 | 최대 30분 | 최대 30분 |
| **동시성 제어** | 동일 PR 새 커밋 시 이전 실행 즉시 자동 취소 (`cancel-in-progress: true`) | 동일 ref 새 커밋 시 이전 실행 취소 | 개별 릴리즈 실행 보존 (`cancel-in-progress: false`) |
| **서비스 컨테이너** | 없음 (러너 가상머신만 사용) | Redis 7 + PostgreSQL 16 (durable-operation 검증) | Redis 7 + PostgreSQL 16 |
| **검증 항목** | 1. `pnpm run verify:receipt` (로컬 영수증 감사)<br>2. PR 변경 추적성 (`pnpm change:traceability`)<br>3. 패키지 경계 및 컨벤션 스모크<br>4. OSV Scanner 보안 감사 | 전체 통합 테스트 (`pnpm verify:all`), durable backend 스모크, React 호환성 매트릭스, 번들 사이즈 체크 | 불변 커밋 provenance 검증, 패키지 tarball 무결성, OIDC npm 서명 발행 |
| **소요 시간** | **~1.5분 - 2분** (기존 대비 85% 절감) | ~8분 - 10분 | ~12분 - 15분 |

---

## 5. 배포 의존성 및 거버넌스 보장

1. **GitHub Pages 배포 파이프라인 무결성**: `deploy-all.yml`은 `main` 브랜치에서 `CI` 워크플로가 성공 완료된 이벤트(`workflow_run`)를 수신하여 문서 및 데모 배포를 진행합니다. PR 단계의 경량화와 무관하게 `main` 브랜치에 머지되는 시점에 정규 `CI`가 실행되어 배포 트리거 계약이 완벽히 유지됩니다.
2. **문서 전용 변경 시 CI 실행 방지**: PR 경로 필터를 통해 `docs/**`, `*.md` 파일만 변경된 PR은 불필요한 Actions 러너를 소모하지 않고 즉시 검증을 완료합니다.
3. **Fail-Closed 원칙**: 비용 절감을 이유로 보안 점검, 타입체크, 입력/출력 해시 검증을 생략하거나 제거하지 않습니다.
