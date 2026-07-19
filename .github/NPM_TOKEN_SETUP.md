# NPM Token Setup Guide for GitHub Actions

이 저장소의 npm 배포는 `Publish Packages` 워크플로의 OIDC(Trusted Publishing)를
기본 경로로 사용합니다. `NPM_TOKEN`은 OIDC를 사용할 수 없을 때의 명시적 fallback과
`Publish Mutative Packages` 실행에만 사용합니다.

## 🔐 NPM Token 생성 및 GitHub Secrets 등록 가이드

### 1. NPM Access Token 생성

1. **npmjs.com에 로그인**
   - https://www.npmjs.com/ 접속
   - 본인 계정으로 로그인

2. **Access Token 생성**
   - 우측 상단 프로필 클릭 → **Access Tokens** 선택
   - **Generate New Token** → **Granular Access Token** 선택
   - Token 설정:
     - **Name**: `github-actions-context-action` (식별 가능한 이름)
     - **Packages and scopes**: 필요한 `@context-action/*` 패키지만 선택
     - **Permission**: 배포 fallback이므로 **Read and write**
     - **Bypass two-factor authentication**: 자동 publish에 필요한 경우에만 선택
     - **Expiration**: 짧은 만료 기간을 선택하고 만료 전에 수동 rotation

   Legacy/Classic token은 현재 CI 배포용으로 사용하지 않습니다. npm은 2025년 11월부터
   Legacy access token을 제거했으므로, 새 토큰은 반드시 Granular Access Token으로
   생성해야 합니다.

3. **Token 복사**
   - 생성된 토큰을 안전한 곳에 복사 (한 번만 표시됨)
   - 형식: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. GitHub Repository Secrets 등록

1. **GitHub 저장소로 이동**
   - https://github.com/your-username/context-action 이동

2. **Settings 메뉴 접근**
   - 저장소 상단의 **Settings** 탭 클릭

3. **Secrets and variables 설정**
   - 좌측 사이드바에서 **Secrets and variables** → **Actions** 선택

4. **New repository secret 생성**
   - **New repository secret** 버튼 클릭
   - **Name**: `NPM_TOKEN` (정확히 이 이름 사용)
   - **Secret**: 앞서 복사한 NPM 토큰 값 붙여넣기
   - **Add secret** 버튼으로 저장

### 3. 워크플로 인증 방식 확인

`publish-packages.yml`은 `publish_auth=oidc`를 기본값으로 사용합니다. OIDC 경로에서는
장기 토큰을 주입하지 않고, GitHub Actions의 `id-token: write` 권한으로 npm Trusted
Publishing을 수행합니다. 각 npm 패키지에 저장소와
`.github/workflows/publish-packages.yml`을 Trusted Publisher로 등록해야 합니다.

`publish_auth=token`을 선택한 수동 실행과 `publish-mutative.yml`은
`NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}`을 사용합니다. `setup-node`가 registry 설정을
생성하므로 저장소에 실제 토큰이 포함된 `.npmrc`를 추가할 필요가 없습니다.

### 3.1 배포 안정화 동작

- `Publish Packages`와 `Publish Mutative Packages`는 같은 `npm-publish` concurrency group을 사용해
  같은 시점에 두 publish가 실행되지 않습니다.
- tag 기반 publish는 tag가 `origin/main`에서 도달 가능한 commit인지 먼저 확인합니다.
- Lerna publish는 일시적인 registry/network 오류에 한해 최대 3회 재시도합니다. 일부 버전이 먼저
  등록된 뒤 재시도해도 `from-package`가 등록 완료 버전을 건너뛰므로 재실행할 수 있습니다.
- 변경된 패키지가 없는 재실행도 빈 summary(`[]`)를 남기므로 consumer 검증과 artifact 업로드가
  동일한 계약으로 동작합니다.
- publish 후에는 summary artifact를 저장하고 `@context-action/sem-doc`을 임시 consumer에 설치해
  `sem-doc version`까지 확인합니다. npm metadata 전파 지연은 polling으로 흡수합니다.
- post-publish 검증만 실패한 경우 같은 workflow를 재실행할 수 있습니다. 이미 publish된 버전은
  덮어쓰지 않고 현재 registry 버전을 검증합니다.

### 4. 문제 해결

#### 403 Forbidden 에러가 계속 발생하는 경우:

1. **Token 권한 확인**
   - Granular Token에 대상 패키지의 `Read and write` 권한이 있는지 확인
   - 자동 publish에서 2FA 프롬프트가 발생하면 `Bypass two-factor authentication` 설정 확인

2. **GitHub Secrets 확인**
   - Secret 이름이 정확히 `NPM_TOKEN`인지 확인
   - 토큰 값에 불필요한 공백이나 문자가 없는지 확인

3. **Registry URL 확인**
   - `registry-url: 'https://registry.npmjs.org'`가 설정되어 있는지 확인

4. **pnpm 버전 확인**
   - pnpm 10을 사용하고 있는지 확인

5. **401 Unauthorized**
   - `Publish Packages`의 `publish_auth=token` 또는 `Publish Mutative Packages`에서
     발생하면 secret 값이 만료·폐기되었거나 package scope 권한이 부족한 것입니다.
   - OIDC 실행에서 `npm whoami`를 별도로 호출하지 마십시오. npm Trusted Publishing은
     publish 시점의 OIDC 교환으로 인증되므로 `npm whoami`로 OIDC 상태를 검증할 수 없습니다.

### 5. 보안 참고사항

- ❌ **절대 하지 말 것**: 토큰을 코드에 직접 포함
- ❌ **절대 하지 말 것**: 토큰을 공개 저장소에 커밋
- ✅ **권장사항**: 토큰은 반드시 GitHub Secrets 사용
- ✅ **권장사항**: 최소 권한 원칙 적용 (필요한 패키지 scope만 read/write)
- ✅ **권장사항**: 만료 전에 Granular Token을 재발급하고 GitHub secret을 교체

### 6. 테스트

설정 완료 후:
1. 새로운 커밋을 푸시
2. GitHub Actions 탭에서 워크플로우 실행 확인
3. `pnpm install` 단계에서 403 에러가 해결되었는지 확인

### 7. NPM_TOKEN 갱신 정책

`NPM_TOKEN`은 GitHub에서 자동으로 갱신되는 refresh token이 아닙니다. npm에서 새
Granular Token을 발급한 뒤 GitHub Actions secret을 교체하는 수동 rotation이 필요합니다.
따라서 코드에 자동 갱신 로직을 추가하는 대신, OIDC를 기본 경로로 두고 token fallback에만
만료·권한 검증을 적용합니다.

```bash
# 토큰 값은 셸 히스토리나 로그에 남기지 말고 안전한 입력으로 전달합니다.
gh secret set NPM_TOKEN --repo mineclover/context-action
```

위 명령은 입력을 숨긴 상태로 새 값을 받습니다. 갱신 후에는 다음 workflow 중 하나를
수동 실행해 인증과 publish 전 검증을 확인합니다.

- `Publish Packages` — `publish_auth=token`
- `Publish Mutative Packages`

새 npm 패키지에 Trusted Publisher가 등록되어 있다면 장기 토큰 대신 `Publish Packages`의
기본 `publish_auth=oidc` 경로를 사용하십시오. OIDC를 사용하면 토큰 rotation이 필요하지 않지만,
각 npm 패키지에 repository와 `.github/workflows/publish-packages.yml`을 정확히 등록해야 합니다.

---

## 📞 지원

설정에 문제가 있는 경우:
1. GitHub Actions 로그 확인
2. NPM 토큰 권한 재확인
3. Secret 이름 및 값 재확인
