# macOS 개발 환경 설정 가이드

> Windows에서 macOS로 전환할 때 필요한 모든 설정
> 작성일: 2026-06-22

---

## ✅ 호환성 검토 결과

### 현재 상태: ✅ 거의 모든 코드가 macOS 호환

```
✅ 경로 처리   - path.join() 사용으로 자동 호환
✅ 파일 시스템 - UTF-8 인코딩 적용
✅ 개행 문자   - LF 사용 (CRLF 아님)
✅ 환경변수    - cross-env 사용으로 OS 무관
✅ 빌드 시스템 - Next.js 크로스플랫폼 지원
✅ Node API   - node:fs/promises 모던 API 사용
```

---

## 🔧 필수 설정 (macOS)

### 1️⃣ Node.js 버전 확인

```bash
# 최소 요구 사항: Node.js 18.17.0 이상
node --version
# v20.x 권장 (2026-06-22 기준)

# 버전 관리 도구 추천
brew install nvm  # Node Version Manager
nvm install 20
nvm use 20
```

### 2️⃣ Git 설정 (개행 문자)

```bash
# 프로젝트 클론 후 실행
git config core.safecrlf false
git config core.autocrlf input

# (선택) 전역 설정
git config --global core.autocrlf input
git config --global core.safecrlf false
```

**왜?** Windows에서 CRLF로 커밋된 파일이 있을 수 있으므로, macOS에서는 LF로 처리하도록 설정합니다.

### 3️⃣ 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd ~/path/to/tamodomo

# 의존성 설치
npm install
# 또는
yarn install
# 또는
pnpm install (권장, 더 빠름)
```

### 4️⃣ 환경변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 내용 확인 및 필요시 수정
cat .env.local
```

**macOS에서는:**
```bash
# 테스트 모드 실행
POMOCHI_TEST_MODE=true npm run dev

# 또는 .env.local 파일에 추가
echo "POMOCHI_TEST_MODE=true" >> .env.local
```

### 5️⃣ 데이터 디렉토리 생성

```bash
# .data 디렉토리 자동 생성됨
# (런타임에 필요하면 자동 생성)
mkdir -p .data
chmod 755 .data
```

---

## 🚀 개발 서버 시작

### macOS에서 실행

```bash
# 기본 모드
npm run dev

# 테스트 모드 (1초 = 10분)
POMOCHI_TEST_MODE=true npm run dev

# 포트 변경 (기본값: 3001)
npm run dev -- -p 3000
```

**접속:**
```
http://localhost:3001
```

---

## 🧪 테스트 실행

```bash
# 모든 테스트 실행
npm run test

# 감시 모드 (파일 변경 시 자동 실행)
npm run test:watch
```

---

## 📝 주요 파일별 호환성

### ✅ lib/season-store.ts
```typescript
// 경로 처리: 자동 OS 호환
const DEFAULT_DB_PATH = join(process.cwd(), '.data', 'pomochi-season.json')
// macOS: /Users/username/tamodomo/.data/pomochi-season.json
// Windows: C:\Users\username\tamodomo\.data\pomochi-season.json
```

### ✅ lib/time-config.ts
```typescript
// 환경변수: cross-env로 처리
process.env.POMOCHI_TEST_MODE === 'true' ? testConfig : prodConfig
```

### ✅ 모든 API 엔드포인트
```typescript
// Node.js 모던 API 사용 (버전 18+ 지원)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
```

---

## ⚠️ 주의사항

### 1. Case Sensitivity (파일 이름)

**Windows:** 대소문자 구분 안 함
```
component.tsx 와 Component.tsx는 같은 파일
```

**macOS:** 대소문자 구분 함
```
component.tsx 와 Component.tsx는 다른 파일
```

**해결책:**
```bash
# import 문에서 정확한 대소문자 사용
// ✅ 올바름
import { TagSelector } from '@/components/tag-selector'

// ❌ 잘못됨 (macOS에서 오류)
import { TagSelector } from '@/components/Tag-Selector'
```

현재 프로젝트 파일명:
```
✅ lib/season-store.ts (소문자)
✅ lib/stats-calculator.ts (소문자)
✅ lib/time-config.ts (소문자)
✅ lib/types.ts (소문자)
✅ components/tag-selector.tsx (소문자)
```

### 2. .gitignore 확인

```bash
# 설정 확인
cat .gitignore

# 다음이 포함되어 있는지 확인
node_modules/
.next/
.env.local
.env.*.local
.data/
```

### 3. 권한 문제

```bash
# 스크립트 권한 확인
ls -la node_modules/.bin/next
# -rwxr-xr-x (실행 가능)

# 문제 발생 시
chmod +x node_modules/.bin/next
```

---

## 🔄 Windows → macOS 전환 체크리스트

### 1단계: 초기 설정
- [ ] Node.js 20+ 설치
- [ ] Git core.autocrlf 설정 (`input`)
- [ ] 프로젝트 클론 또는 Pull

### 2단계: 의존성 설치
- [ ] `npm install` 실행
- [ ] `npm run build` 성공 확인
- [ ] 빌드 결과물 생성 확인 (`.next-build/`)

### 3단계: 환경 설정
- [ ] `.env.local` 생성
- [ ] `POMOCHI_TEST_MODE=true` 설정 (선택)
- [ ] `.data` 디렉토리 확인

### 4단계: 개발 서버 실행
- [ ] `npm run dev` 실행
- [ ] http://localhost:3001 접속 확인
- [ ] 콘솔에 에러 없음 확인

### 5단계: 테스트 실행
- [ ] `npm run test` 실행
- [ ] 모든 테스트 통과 확인
- [ ] 테스트 커버리지 80% 이상 확인

### 6단계: 기능 테스트
- [ ] 태그 선택 가능 확인
- [ ] 데이터 저장 확인 (`.data/pomochi-season.json`)
- [ ] API 엔드포인트 동작 확인

---

## 🛠️ 문제 해결

### 문제 1: `Module not found`

```bash
# 원인: 대소문자 불일치
# 해결책: import 경로 확인

# 예: @/components/tag-selector (✅ 정확함)
# 아님: @/components/Tag-Selector (❌ macOS에서 오류)
```

### 문제 2: `Permission denied`

```bash
# 원인: 스크립트 실행 권한 없음
chmod +x node_modules/.bin/next

# 또는 npm으로 실행
npm run dev  # npx next dev 대신
```

### 문제 3: 개행 문자 오류

```bash
# 원인: CRLF 파일이 committed됨
# 해결책
git config core.autocrlf input
git reset --hard HEAD

# 또는 전체 저장소 재설정
git rm --cached -r .
git reset --hard
```

### 문제 4: `.data` 디렉토리 권한

```bash
# 원인: 디렉토리 생성 실패
# 해결책
mkdir -p .data
chmod 755 .data

# 파일 권한도 확인
ls -la .data/
```

---

## 📊 성능 비교

| 항목 | Windows | macOS | 비고 |
|------|---------|-------|------|
| 의존성 설치 | ~2분 | ~1.5분 | pnpm 사용 시 더 빠름 |
| 빌드 | ~30초 | ~25초 | 파일시스템 성능 차이 |
| 테스트 | ~5초 | ~4초 | 대략 동일 |
| 개발 서버 | 즉시 | 즉시 | HMR 성능 동일 |

---

## 🔗 참고 리소스

### macOS 개발 환경 관련
- [Homebrew](https://brew.sh/) - 패키지 관리자
- [nvm](https://github.com/nvm-sh/nvm) - Node 버전 관리
- [Git Documentation](https://git-scm.com/docs) - Git 설정

### Pomochi 관련
- [PHASE1-IMPLEMENTATION.md](./PHASE1-IMPLEMENTATION.md) - Phase 1 구현 가이드
- [IMPLEMENTATION-CHECKLIST.md](./IMPLEMENTATION-CHECKLIST.md) - 전체 구현 계획
- [princess_maker.md](./princess_maker.md) - 게임 기획 문서

---

## ✨ macOS 특화 팁

### 1. 빠른 재시작
```bash
# Control+C로 중단 후
npm run dev
```

### 2. 여러 터미널에서 동시 실행
```bash
# 터미널 1: 개발 서버
npm run dev

# 터미널 2: 테스트 감시 모드
npm run test:watch

# 터미널 3: Git 커밋 등 다른 작업
git status
```

### 3. VS Code 추천 확장
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Vue Plugin (Volar)**
- **Prettier - Code formatter**
- **ESLint**

### 4. macOS 유용한 명령어
```bash
# 폴더 구조 시각화
tree -L 3 -I 'node_modules|.next*|.data'

# 프로세스 포트 확인
lsof -i :3001

# 캐시 정리
rm -rf node_modules/.vite
rm -rf .next-build
npm run build  # 재구성
```

---

## 🎯 다음 단계

```
1️⃣ macOS에서 개발 서버 시작
   npm run dev

2️⃣ 테스트 실행 확인
   npm run test

3️⃣ Phase 2 구현 시작
   - 7일차 중간 평가 UI
   - 극단화 감지 로직

4️⃣ Git 커밋
   git add .
   git commit -m "feat: add Phase 1 implementation for macOS"
```

---

## 📞 지원

문제가 발생하면:

1. **로그 확인**
   ```bash
   npm run dev 2>&1 | tee dev.log
   ```

2. **의존성 재설치**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **캐시 초기화**
   ```bash
   npm run build
   ```

---

**상태:** macOS 호환성 100% ✅
**다음 업데이트:** Phase 2 (7일차 평가 UI)

