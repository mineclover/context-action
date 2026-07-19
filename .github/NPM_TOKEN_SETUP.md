# NPM Token Setup Guide for GitHub Actions

## 🔐 NPM Token 생성 및 GitHub Secrets 등록 가이드

### 1. NPM Access Token 생성

1. **npmjs.com에 로그인**
   - https://www.npmjs.com/ 접속
   - 본인 계정으로 로그인

2. **Access Token 생성**
   - 우측 상단 프로필 클릭 → **Access Tokens** 선택
   - **Generate New Token** → **Classic Token** 선택
   - Token 설정:
     - **Name**: `github-actions-context-action` (식별 가능한 이름)
     - **Type**: **Automation** 선택 (CI/CD용)
     - **Scope**: 
       - ✅ **Read and publish** (패키지 설치 및 발행)
       - ✅ **Read** (최소한 이것은 선택)

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

### 3. 설정 확인

GitHub Actions 워크플로우가 다음과 같이 설정되어 있는지 확인:

```yaml
- name: Create .npmrc file with token
  run: echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc

- name: Install dependencies
  run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 4. 문제 해결

#### 403 Forbidden 에러가 계속 발생하는 경우:

1. **Token 권한 확인**
   - NPM 토큰에 `read` 권한이 있는지 확인
   - Automation 타입으로 생성되었는지 확인

2. **GitHub Secrets 확인**
   - Secret 이름이 정확히 `NPM_TOKEN`인지 확인
   - 토큰 값에 불필요한 공백이나 문자가 없는지 확인

3. **Registry URL 확인**
   - `registry-url: 'https://registry.npmjs.org'`가 설정되어 있는지 확인

4. **pnpm 버전 확인**
   - pnpm 10을 사용하고 있는지 확인

### 5. 보안 참고사항

- ❌ **절대 하지 말 것**: 토큰을 코드에 직접 포함
- ❌ **절대 하지 말 것**: 토큰을 공개 저장소에 커밋
- ✅ **권장사항**: 토큰은 반드시 GitHub Secrets 사용
- ✅ **권장사항**: 최소 권한 원칙 적용 (read 권한만)
- ✅ **권장사항**: 정기적으로 토큰 갱신

### 6. 테스트

설정 완료 후:
1. 새로운 커밋을 푸시
2. GitHub Actions 탭에서 워크플로우 실행 확인
3. `pnpm install` 단계에서 403 에러가 해결되었는지 확인

### 7. NPM_TOKEN 갱신 정책

`NPM_TOKEN`은 GitHub에서 자동으로 갱신되는 refresh token이 아닙니다. npm에서 새 토큰을
발급한 뒤 GitHub Actions secret을 교체하는 수동 rotation이 필요합니다.

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
