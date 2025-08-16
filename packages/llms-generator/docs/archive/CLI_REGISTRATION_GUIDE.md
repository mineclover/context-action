# CLI 등록 가이드

## 📋 **개요**

LLMS Generator CLI를 시스템에 등록하여 전역에서 사용할 수 있도록 하는 가이드입니다.

---

## 🚀 **CLI 등록 방법**

### **방법 1: npm/pnpm을 통한 전역 설치**

#### **1.1 패키지 빌드**
```bash
# 프로젝트 루트에서
cd packages/llms-generator
pnpm build
```

#### **1.2 전역 링크 생성**
```bash
# 개발 중인 패키지를 전역에 링크
pnpm link --global

# 또는 npm 사용 시
npm link
```

#### **1.3 사용 확인**
```bash
# 전역 명령어 사용 가능
npx @context-action/llms-generator --help
llms-generator --help  # 별칭이 설정된 경우
```

### **방법 2: 패키지 게시 후 설치**

#### **2.1 패키지 게시**
```bash
# 버전 업데이트
pnpm version patch  # 또는 minor, major

# npm 레지스트리에 게시
pnpm publish

# 또는 private registry 사용 시
pnpm publish --registry https://your-registry.com
```

#### **2.2 전역 설치**
```bash
# 게시된 패키지를 전역 설치
pnpm add -g @context-action/llms-generator

# 또는 npm 사용 시
npm install -g @context-action/llms-generator
```

### **방법 3: 직접 실행 스크립트 생성**

#### **3.1 실행 스크립트 생성**
```bash
# /usr/local/bin에 스크립트 생성 (macOS/Linux)
sudo nano /usr/local/bin/llms-generator
```

#### **3.2 스크립트 내용**
```bash
#!/bin/bash
# LLMS Generator CLI 실행 스크립트

# 절대 경로 설정 (실제 경로로 변경)
LLMS_GENERATOR_PATH="/Users/junwoobang/project/context-action/packages/llms-generator"

# CLI 실행
node "$LLMS_GENERATOR_PATH/dist/cli/index.js" "$@"
```

#### **3.3 실행 권한 부여**
```bash
sudo chmod +x /usr/local/bin/llms-generator
```

#### **3.4 사용 확인**
```bash
llms-generator --help
```

---

## 🔧 **Work Queue CLI 등록**

### **방법 1: 심볼릭 링크 생성**

```bash
# work queue CLI를 전역에서 사용 가능하도록 설정
sudo ln -s /Users/junwoobang/project/context-action/packages/llms-generator/wq /usr/local/bin/wq

# 사용 확인
wq --help
```

### **방법 2: PATH에 디렉토리 추가**

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
echo 'export PATH="$PATH:/Users/junwoobang/project/context-action/packages/llms-generator"' >> ~/.zshrc

# 설정 적용
source ~/.zshrc

# 사용 확인
wq status en
```

---

## 📦 **패키지 설정 확인**

### **package.json 확인**

```json
{
  "name": "@context-action/llms-generator",
  "version": "0.2.2",
  "bin": {
    "llms-generator": "./dist/cli/index.js",
    "@context-action/llms-generator": "./dist/cli/index.js"
  },
  "files": [
    "dist/**/*",
    "data/**/*",
    "*.json",
    "*.md"
  ],
  "scripts": {
    "build": "tsdown",
    "postbuild": "chmod +x dist/cli/index.js"
  }
}
```

### **CLI 진입점 확인**

```typescript
// src/cli/index.ts
#!/usr/bin/env node

import { program } from 'commander';
// ... CLI 구현
```

---

## 🏗️ **개발 환경 설정**

### **개발 중 빠른 테스트**

```bash
# 빌드 후 직접 실행
pnpm build
node dist/cli/index.js --help

# 또는 tsdown watch 모드 사용
pnpm build:watch  # tsdown.config.ts에서 watch 설정 시
```

### **TypeScript 개발 모드**

```bash
# ts-node를 사용한 직접 실행 (개발 시에만)
npx ts-node src/cli/index.ts --help

# 또는 tsx 사용
npx tsx src/cli/index.ts --help
```

---

## 🚦 **환경별 설정**

### **macOS**

```bash
# Homebrew를 통한 설치 스크립트 (선택사항)
# brew formula 생성 시 사용
brew tap your-org/llms-generator
brew install llms-generator
```

### **Linux**

```bash
# APT 패키지 생성 시 (고급)
sudo apt update
sudo apt install llms-generator
```

### **Windows**

```powershell
# PowerShell 스크립트 생성
# %USERPROFILE%\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1

function llms-generator {
    param($args)
    node "C:\path\to\llms-generator\dist\cli\index.js" @args
}
```

---

## 🔍 **문제 해결**

### **일반적인 문제**

#### **1. 권한 오류**
```bash
# 실행 권한 확인
ls -la /usr/local/bin/llms-generator

# 권한 부여
chmod +x /usr/local/bin/llms-generator
```

#### **2. PATH 인식 안됨**
```bash
# PATH 확인
echo $PATH

# 현재 디렉토리에서 실행 확인
./dist/cli/index.js --help
```

#### **3. Node.js 버전 호환성**
```bash
# Node.js 버전 확인
node --version

# 최소 요구 버전: Node.js 18+
nvm use 18  # nvm 사용 시
```

### **디버깅 팁**

```bash
# 1. 빌드 상태 확인
ls -la dist/cli/

# 2. 실행 권한 확인
ls -la dist/cli/index.js

# 3. shebang 확인
head -1 dist/cli/index.js

# 4. 직접 node로 실행 테스트
node dist/cli/index.js --help
```

---

## 📋 **체크리스트**

### **개발자용 체크리스트**

- [ ] `pnpm build` 성공적으로 완료
- [ ] `dist/cli/index.js` 파일 생성 확인
- [ ] 실행 권한 부여 (`chmod +x`)
- [ ] shebang 라인 확인 (`#!/usr/bin/env node`)
- [ ] `package.json`의 `bin` 필드 설정
- [ ] CLI 명령어 직접 실행 테스트

### **사용자용 체크리스트**

- [ ] Node.js 18+ 설치
- [ ] pnpm 또는 npm 설치
- [ ] 패키지 전역 설치 또는 링크
- [ ] CLI 명령어 실행 확인
- [ ] Work Queue CLI 등록 (선택사항)

---

## 🚀 **배포 자동화**

### **GitHub Actions 예시**

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Publish
        run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### **버전 관리**

```bash
# 버전 업데이트 및 태그 생성
pnpm version patch
git push origin main --tags

# 자동 배포 트리거
```

---

## 📚 **참고 자료**

### **관련 문서**
- [FEATURE_USAGE_GUIDELINES.md](./FEATURE_USAGE_GUIDELINES.md)
- [npm CLI 가이드](https://docs.npmjs.com/cli)
- [Commander.js 문서](https://github.com/tj/commander.js)

### **유용한 명령어**
```bash
# 현재 설치된 전역 패키지 확인
npm list -g --depth=0
pnpm list -g

# 패키지 정보 확인
npm info @context-action/llms-generator

# 로컬 링크 상태 확인
npm ls --link
```

이 가이드를 따라하면 LLMS Generator CLI를 시스템에 성공적으로 등록하고 사용할 수 있습니다.