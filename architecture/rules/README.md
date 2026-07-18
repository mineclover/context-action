# Architecture Policy Sets

각 JSON 파일은 독립적인 `ArchitecturePolicySet`이며 `registry.json`의 `policyFiles` 배열로
합성한다.

패키지 ownership과 신규 패키지·병합·분리 기준은
[`Package Boundary and Codebase Management Convention`](../../docs/en/context-layered/package-boundary-convention.md)이
정의하고, 이 디렉터리는 그중 기계적으로 검사할 dependency 방향만 선언한다.

- `package-boundaries.json`: package manifest에 선언된 dependency 관계
- `impact-boundaries.json`: sem top-level entity의 dependency 관계

현재 package boundary에는 `@context-action/sem-doc`과
`@context-action/architecture-governance` 사이의 runtime coupling을 금지하는 규칙도 포함한다.
두 도구는 SEM/Foundation primitive을 공유할 수 있지만 같은 목적의 단일 library로 합치지 않는다.
책임 선택은 [sem-doc과 Architecture Governance 경계 가이드](../../docs/en/context-layered/architecture/sem-doc-architecture-governance-boundary.md)를 따른다.

규칙 파일은 하나의 증거 원천과 변경 책임만 갖는 것을 기본으로 한다. 공통 preset이 필요하면
같은 Schema를 따르는 별도 JSON 파일로 추가하고 여러 registry에서 명시적으로 참조한다.
암묵적 상속이나 merge 우선순위는 사용하지 않는다.

verified capability가 연결한 impact rule은 source entity가 하나도 없거나 project SEM 분석이
누락된 상태를 검증 성공으로 간주하지 않도록 `missingEvidenceSeverity: "error"`를 사용한다.
의도적으로 점진 도입하는 규칙만 warning/info를 선택한다.
package boundary의 `require`도 선언된 dependency field에 대상 package가 없으면
`PACKAGE_DEPENDENCY_REQUIRED`로 실패한다. 존재 여부는 source import 추정이 아니라 해당
`package.json`의 명시적 dependency 선언을 기준으로 한다.
