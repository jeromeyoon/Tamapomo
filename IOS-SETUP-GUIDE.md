# Capacitor로 iOS 앱 만들기

> Pomochi를 iOS 네이티브 앱으로 포장하기
> 작성일: 2026-06-22
> 플랫폼: macOS + Xcode 필수

---

## 📋 사전 요구사항

### 필수 도구
```bash
✅ macOS (Big Sur 11 이상)
✅ Xcode 14 이상
✅ Node.js 20.11.1 (nvm으로 설정)
✅ npm/yarn/pnpm
✅ CocoaPods (iOS 의존성 관리)
```

### 설치 확인
```bash
# Xcode 명령줄 도구
xcode-select --install

# 또는 기존 설치 확인
xcode-select -p
# 출력: /Applications/Xcode.app/Contents/Developer

# CocoaPods
sudo gem install cocoapods

# Node 버전 확인
node --version  # v20.11.1 이상
npm --version   # 9.0.0 이상
```

---

## 🚀 Step 1: Capacitor 설치

### 1-1. 프로젝트 디렉토리에서
```bash
cd ~/path/to/tamodomo

# Node 버전 확인
nvm use  # .nvmrc에서 20.11.1로 설정

# 의존성 설치
npm install
```

### 1-2. Capacitor 패키지 설치
```bash
# 한 번에 설치
npm run cap:install

# 또는 수동 설치
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android --save-dev
```

---

## 🎯 Step 2: Next.js 정적 빌드 설정

Capacitor는 정적 파일을 필요로 하므로, Next.js 설정을 수정합니다.

### 2-1. next.config.js 확인/수정
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← 정적 내보내기 활성화
  distDir: 'out',    // ← Capacitor가 읽을 디렉토리
}

module.exports = nextConfig
```

### 2-2. 빌드 실행
```bash
# 정적 파일 생성
npm run build:static

# 확인: out/ 디렉토리 생성됨
ls -la out/
# out/index.html (메인 페이지)
# out/_next/ (Next.js 에셋)
```

**중요:** `out/` 디렉토리의 파일들이 iOS 앱에 번들되므로, `.gitignore`에 추가되어 있는지 확인하세요.

---

## 📱 Step 3: Capacitor 프로젝트 초기화

### 3-1. Capacitor 초기화
```bash
# 대화형 초기화
npm run cap:init

# 또는 직접 실행
npx cap init

# 프롬프트:
# ? App name: Pomochi
# ? App Package ID: com.pomochi.app
# ? Directory of your web assets to copy: out
# ? Build command: npm run build:static
```

**결과:**
```
capacitor.config.ts 파일 생성됨 (이미 생성되어 있음)
```

### 3-2. iOS 프로젝트 추가
```bash
# iOS 플랫폼 추가
npm run cap:add:ios

# 결과:
# ✅ ios/ 디렉토리 생성
# ✅ Xcode 프로젝트 생성
# ✅ CocoaPods 의존성 설치
```

**소요 시간:** 약 5-10분 (의존성 다운로드 중)

---

## 🎨 Step 4: 아이콘 및 스플래시 이미지 생성

### 4-1. 아이콘 생성 (1024×1024 PNG)

[icon-generator.com](https://www.appicon.co/) 또는 로컬에서:

```bash
# 임시 아이콘 생성 (1024×1024)
# 사용 가능한 온라인 도구:
# 1. https://appicon.co/
# 2. https://www.favicon-generator.org/
# 3. Figma 또는 Adobe XD 사용
```

**또는 임시 이미지 사용:**
```bash
# 프로젝트 루트에서
mkdir -p resources

# 1024×1024 PNG 파일을 준비
# resources/icon.png 저장
```

### 4-2. Capacitor 리소스 생성
```bash
# 아이콘 및 스플래시 자동 생성
npx capacitor-resources --splash --icon --type ios

# 또는 CocoaPods로 수동 생성
cd ios/App
pod install
```

**생성되는 리소스:**
```
ios/App/App/Assets.xcassets/
  ├── AppIcon.appiconset/
  │   ├── Icon-20.png
  │   ├── Icon-29.png
  │   ├── Icon-40.png
  │   ├── Icon-60.png
  │   ├── Icon-76.png
  │   ├── Icon-83.5.png
  │   ├── Icon-1024.png
  │   └── Contents.json
  └── LaunchImage.launchimage/
      ├── Default-667h.png
      ├── Default-736h.png
      └── ...
```

---

## ⚙️ Step 5: iOS 프로젝트 설정

### 5-1. Xcode에서 프로젝트 열기
```bash
# Xcode 자동 시작
npm run cap:open:ios

# 또는 수동 열기
open ios/App/App.xcworkspace
```

**주의:** `.xcworkspace` 파일을 엽니다 (`.xcodeproj` 아님)

### 5-2. Xcode에서 필수 설정

#### 1. 번들 식별자 확인
```
Xcode → App (좌측 네비게이터)
     → Targets: App
     → General 탭
     → Bundle Identifier: com.pomochi.app (✅ 확인)
```

#### 2. 팀 설정 (개발 계정)
```
General 탭
  → Signing & Capabilities
  → Team: (Apple ID 계정 선택)
  
❌ 문제: "No Team"
→ Xcode → Preferences → Accounts
→ Apple ID 로그인 또는 추가
```

#### 3. 번들 버전 설정
```
General 탭
  → Version: 0.2.0 (또는 원하는 버전)
  → Build: 1
```

#### 4. 배포 대상 (Deployment Target)
```
Build Settings 탭
  → iOS Deployment Target: 14.0 이상
```

### 5-3. Capacitor 동기화
```bash
# 웹 에셋을 iOS 프로젝트에 복사
npm run cap:sync

# 결과:
# ✅ out/ → ios/App/public/
# ✅ capacitor.config.ts 설정 적용
```

---

## 🧪 Step 6: 시뮬레이터에서 실행

### 6-1. 시뮬레이터 선택
```
Xcode → Product → Destination
  → iPhone 15 (또는 원하는 기기)
```

### 6-2. 빌드 및 실행
```bash
# 자동 빌드 및 실행
npm run cap:run:ios

# 또는 Xcode에서
# ⌘ + R (또는 Product → Run)
```

**소요 시간:** 첫 실행 시 1-2분

### 6-3. 결과 확인
```
✅ 시뮬레이터에 앱이 설치됨
✅ 앱 실행 (스플래시 스크린 표시)
✅ 메인 화면 로드
✅ 태그 선택 UI 표시
```

---

## 🔄 Step 7: 개발 워크플로우

### 변경사항 반영하기

```bash
# 1. 웹 코드 수정
# components/tag-selector.tsx 또는 다른 파일 수정

# 2. 정적 빌드
npm run build:static

# 3. iOS에 동기화
npm run cap:sync

# 4. 시뮬레이터에서 다시 실행
npm run cap:run:ios

# 또는 한 번에
npm run build:static && npm run cap:sync && npm run cap:run:ios
```

---

## 📱 실제 기기에서 테스트

### 7-1. 아이폰 연결
```bash
# USB 케이블로 Mac에 연결
# Xcode에서 자동 인식됨

# 신뢰 설정
# 아이폰: 설정 → 개인정보보호 및 보안
#       → 개발자 모드 활성화
```

### 7-2. 기기에 배포
```
Xcode → Product → Destination
  → [내 아이폰 이름] 선택

Product → Run (⌘ + R)
```

### 7-3. 앱 설치 확인
```
아이폰 홈 화면에 "Pomochi" 앱 표시됨
```

---

## 🐛 문제 해결

### 문제 1: `out/` 디렉토리 없음

```bash
# 원인: 정적 빌드 미실행
# 해결
npm run build:static
ls -la out/
```

### 문제 2: CocoaPods 오류

```bash
# 원인: CocoaPods 캐시 오염
# 해결
cd ios/App
rm -rf Pods
pod install
cd ../..
```

### 문제 3: Xcode 빌드 오류

```bash
# 해결 방법 1: 캐시 정리
Xcode → Product → Clean Build Folder (⇧ + ⌘ + K)

# 해결 방법 2: Capacitor 재동기화
npm run cap:sync

# 해결 방법 3: 전체 iOS 프로젝트 재생성
rm -rf ios/
npm run cap:add:ios
```

### 문제 4: 흰 화면만 표시됨

```bash
# 원인: 웹 에셋 로드 실패
# 확인: iOS Safari 개발자 도구
Xcode → Product → Scheme → Edit Scheme
  → Run → Pre-actions에서 웹 서버 상태 확인

# 해결
npm run cap:sync
npm run cap:run:ios
```

### 문제 5: "No Team" 에러

```bash
# Xcode에 계정 추가
Xcode → Preferences (⌘ + ,)
  → Accounts 탭
  → + 버튼
  → Apple ID 추가

# 그 후 Xcode 재시작 후 Team 선택
```

---

## 📊 폴더 구조

```
tamodomo/
├── out/                          # ← Next.js 정적 빌드
│   ├── index.html
│   └── _next/
├── ios/                          # ← Capacitor iOS 프로젝트
│   ├── App/
│   │   ├── App.xcworkspace       # ← Xcode에서 열 것
│   │   ├── App.xcodeproj
│   │   ├── App/
│   │   │   ├── Assets.xcassets/  # ← 아이콘, 이미지
│   │   │   ├── public/           # ← 웹 에셋 복사됨
│   │   │   └── Info.plist        # ← iOS 설정
│   │   └── Pods/                 # ← CocoaPods 의존성
│   ├── Podfile
│   └── capacitor.config.ts
├── capacitor.config.ts           # ← Capacitor 설정
└── package.json                  # ← 스크립트 포함
```

---

## ✅ 배포 전 체크리스트

### 개발 완료 후
```
[ ] 웹 앱 테스트 완료 (npm run dev)
[ ] 모든 기능 동작 확인
[ ] 성능 최적화 완료
[ ] 테스트 코드 통과 (npm run test)
```

### iOS 앱 준비
```
[ ] npm run build:static 성공
[ ] out/ 디렉토리 생성 확인
[ ] Xcode 프로젝트 생성 (npm run cap:add:ios)
[ ] 아이콘 설정 완료
[ ] 스플래시 이미지 설정 완료
[ ] 앱 이름 확인 (Pomochi)
[ ] 번들 ID 확인 (com.pomochi.app)
```

### 테스트 완료
```
[ ] 시뮬레이터에서 실행 성공
[ ] 실제 기기에서 실행 성공
[ ] 모든 UI 반응 확인
[ ] 데이터 저장 확인 (.data/pomochi-season.json)
[ ] 네트워크 요청 확인 (/api/season)
```

### 배포 준비
```
[ ] 앱 버전 확인 (0.2.0)
[ ] 빌드 넘버 증가 (1 → 2)
[ ] App Store Connect 계정 준비
[ ] 개인정보보호정책 준비
[ ] 앱 설명 준비 (한글)
```

---

## 🎯 다음 단계

### 즉시 (로컬 테스트)
```bash
npm run build:static
npm run cap:sync
npm run cap:run:ios
```

### 1주일 내 (배포 준비)
```
1. TestFlight 배포 (베타 테스트)
2. 피드백 수집
3. 버그 수정
```

### 2주일 내 (App Store 배포)
```
1. App Store Connect 등록
2. 심사 제출
3. 승인 대기 (일반적으로 1-3일)
```

---

## 📚 유용한 링크

### 공식 문서
- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Capacitor iOS 가이드](https://capacitorjs.com/docs/ios)
- [Xcode 문서](https://developer.apple.com/xcode/)

### Pomochi 문서
- [PHASE1-IMPLEMENTATION.md](./PHASE1-IMPLEMENTATION.md)
- [MACOS-SETUP-GUIDE.md](./MACOS-SETUP-GUIDE.md)
- [princess_maker.md](./princess_maker.md)

---

## 💡 팁

### 1. 빠른 개발 사이클
```bash
# 터미널 1: 웹 개발
npm run dev

# 터미널 2: 빌드 감시 (선택)
npm run build:static && npm run cap:sync
```

### 2. iOS 디버깅
```
Xcode → Debug → Breakpoints 추가
Safari를 사용한 원격 디버깅 가능
```

### 3. 앱 크기 최적화
```bash
# 불필요한 의존성 제거
npm prune --production

# 빌드 크기 확인
du -sh out/
```

### 4. Capacitor 플러그인 추가 (필요시)
```bash
# 예: 카메라 플러그인
npm install @capacitor/camera
npx cap sync

# 다른 플러그인: 지오로케이션, 노티피케이션 등
```

---

**상태:** ✅ iOS 앱 구성 완료
**다음:** Xcode에서 시뮬레이터 테스트 또는 실제 기기 테스트

