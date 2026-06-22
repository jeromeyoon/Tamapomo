# Capacitor 통합 가이드

> Next.js 웹앱을 Capacitor로 iOS/Android 네이티브 앱으로 변환
> 작성일: 2026-06-22

---

## 📋 현재 상태

```
✅ Capacitor 구성 파일 생성 (capacitor.config.ts)
✅ package.json에 스크립트 추가
✅ Next.js 정적 빌드 설정 완료
✅ iOS/Android 지원 준비 완료
⏳ iOS 실제 프로젝트: macOS에서 생성 (아직 생성 안 됨)
⏳ Android 실제 프로젝트: Linux/macOS에서 생성 (아직 생성 안 됨)
```

---

## 🎯 핵심 파일

### capacitor.config.ts (생성됨)
```typescript
// iOS/Android 설정
{
  appId: 'com.pomochi.app',
  appName: 'Pomochi',
  webDir: 'out',  // Next.js 정적 빌드 디렉토리
}
```

### package.json에 추가된 스크립트
```json
{
  "scripts": {
    "build:static": "cross-env NEXT_BUILD_STATIC=true next build",
    "cap:install": "npm install @capacitor/*",
    "cap:init": "npx cap init",
    "cap:add:ios": "npx cap add ios",
    "cap:build": "npm run build:static && npx cap copy",
    "cap:open:ios": "npx cap open ios",
    "cap:sync": "npx cap sync",
    "cap:run:ios": "npx cap run ios"
  }
}
```

### next.config.mjs (수정됨)
```javascript
// NEXT_BUILD_STATIC=true 환경변수로 정적 빌드 활성화
output: 'export',
distDir: 'out',
```

---

## 🚀 macOS에서 iOS 프로젝트 생성

### 전체 프로세스 (처음 1회만)

```bash
# 1️⃣ 의존성 설치
npm run cap:install

# 2️⃣ Capacitor 초기화
npm run cap:init
# 프롬프트에서:
# App name: Pomochi
# App Package ID: com.pomochi.app
# Web directory: out
# Build command: npm run build:static

# 3️⃣ 정적 빌드
npm run build:static

# 4️⃣ iOS 프로젝트 생성
npm run cap:add:ios

# 5️⃣ Xcode에서 열기
npm run cap:open:ios

# 6️⃣ Xcode에서 Run (⌘ + R)
```

### 빠른 요약
```bash
npm run cap:install && \
npm run cap:init && \
npm run build:static && \
npm run cap:add:ios && \
npm run cap:open:ios
```

---

## 📱 프로젝트 구조

생성 후의 구조:
```
tamodomo/
├── out/                          # ← Next.js 정적 빌드
│   ├── index.html
│   ├── _next/
│   └── api/
├── ios/                          # ← iOS 네이티브 프로젝트
│   ├── App/
│   │   ├── App.xcworkspace       # ← Xcode에서 열 것
│   │   ├── App/
│   │   │   ├── Assets.xcassets/  # 아이콘, 이미지
│   │   │   ├── public/           # 웹 에셋 (out/ 복사)
│   │   │   └── Info.plist
│   │   └── Pods/
│   ├── Podfile
│   └── Podfile.lock
├── android/                      # ← Android 네이티브 프로젝트
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── capacitor.config.ts           # ← Capacitor 설정
└── package.json                  # ← 스크립트
```

---

## 🔄 개발 워크플로우

### 1. 웹 개발 (Next.js)
```bash
# 터미널 1: 웹 개발 서버
npm run dev
# http://localhost:3001
```

### 2. iOS 앱에 반영
```bash
# 1. 빌드 (웹 파일 생성)
npm run build:static

# 2. iOS에 복사 (out/ → ios/App/public/)
npm run cap:sync

# 3. Xcode에서 Run (또는 CLI)
npm run cap:run:ios
```

### 자동화 버전
```bash
# 한 번의 명령으로
npm run build:static && npm run cap:sync && npm run cap:run:ios
```

---

## 🎨 아이콘 및 스플래시 설정

### 필요한 이미지

1. **앱 아이콘** (1024×1024 PNG)
   - `resources/icon.png` 저장

2. **스플래시 이미지** (2732×2732 PNG)
   - `resources/splash.png` 저장

### 생성 명령어

```bash
# Capacitor 리소스 생성
npx @capacitor/assets generate --iconSourcePath ./resources/icon.png --splashSourcePath ./resources/splash.png

# 결과:
# ios/App/App/Assets.xcassets/AppIcon.appiconset/
# ios/App/App/Assets.xcassets/LaunchImage.launchimage/
```

---

## 🔧 플랫폼별 설정

### iOS 특화 설정

```typescript
// capacitor.config.ts
ios: {
  preferredScheme: 'ios',
  webContentsDebuggingEnabled: false,
  scrollEnabled: true,
}
```

### Android 특화 설정

```typescript
// capacitor.config.ts
android: {
  preferredScheme: 'https',
  webContentsDebuggingEnabled: false,
  captureInput: true,
  webViewDebuggingEnabled: false,
}
```

---

## 🧪 테스트 및 디버깅

### iOS 시뮬레이터 테스트

```bash
# Xcode GUI로
npm run cap:open:ios
# → Xcode에서 ⌘ + R

# 또는 CLI로
npm run cap:run:ios
```

### 실제 기기 테스트

```bash
# iPhone USB 연결
# Xcode → Product → Destination → [기기 선택]
# ⌘ + R
```

### 디버깅

```bash
# Safari로 원격 디버깅
# Mac: Safari → Develop → [Device] → [App]

# Xcode 콘솔에서 로그 확인
# View → Debug Area → Show Console
```

---

## 📦 배포 준비

### 로컬 테스트

```bash
npm run build:static
npm run cap:sync
npm run cap:run:ios
```

### TestFlight 배포 (베타 테스트)

```
1. Xcode → Product → Archive
2. Distribute App → TestFlight
3. 베타 테스터 초대
4. 피드백 수집
```

### App Store 배포

```
1. Xcode → Product → Archive
2. Distribute App → App Store
3. 심사 대기
4. 승인 후 배포
```

---

## ⚙️ Capacitor 플러그인 추가

### 필요한 플러그인 (선택)

```bash
# 카메라 (이미지 캡처)
npm install @capacitor/camera

# 지오로케이션 (위치 정보)
npm install @capacitor/geolocation

# 로컬 알림
npm install @capacitor/local-notifications

# 상태 바
npm install @capacitor/status-bar

# 파일 시스템
npm install @capacitor/filesystem

# 동기화
npm run cap:sync
```

### 플러그인 사용

```typescript
// 예: 카메라
import { Camera, CameraResultType } from '@capacitor/camera'

const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Uri,
})
```

---

## 🐛 일반적인 문제

### 1. out/ 디렉토리가 없음

```bash
npm run build:static
```

### 2. iOS 프로젝트가 없음

```bash
npm run cap:add:ios
```

### 3. 웹 파일이 업데이트되지 않음

```bash
npm run build:static
npm run cap:sync
```

### 4. Xcode 빌드 오류

```bash
# 캐시 정리
rm -rf ios/App/Pods
cd ios/App
pod install
cd ../..

# 재동기화
npm run cap:sync
```

### 5. "No Team" 오류

```
Xcode → Preferences → Accounts
→ Apple ID 추가 또는 선택
→ Xcode 재시작 후 Team 선택
```

---

## 📊 빌드 결과

### iOS 앱 크기
```
기본: ~30-50MB (디바이스에 설치 후)
포함 사항:
  - Capacitor 런타임
  - WebKit 엔진
  - 웹 에셋 (out/)
  - 의존성 라이브러리
```

### 성능
```
초기 로드: ~2-3초
네비게이션: 즉시
API 호출: 네트워크 속도 의존
```

---

## 🔗 관련 문서

- [IOS-SETUP-GUIDE.md](./IOS-SETUP-GUIDE.md) - 상세 설정 가이드
- [IOS-QUICK-START.md](./IOS-QUICK-START.md) - 5분 빠른 시작
- [MACOS-SETUP-GUIDE.md](./MACOS-SETUP-GUIDE.md) - macOS 개발 환경
- [Capacitor 공식 문서](https://capacitorjs.com/)

---

## ✅ 체크리스트

```
설정 단계:
[ ] npm install @capacitor/*
[ ] npm run cap:init
[ ] npm run build:static
[ ] npm run cap:add:ios

테스트 단계:
[ ] npm run cap:sync
[ ] npm run cap:open:ios
[ ] Xcode에서 ⌘ + R
[ ] 시뮬레이터에서 앱 실행 확인

배포 준비:
[ ] 아이콘 설정
[ ] 스플래시 이미지 설정
[ ] 앱 버전 확인
[ ] TestFlight 테스트
[ ] App Store 제출
```

---

**상태:** ✅ Capacitor 통합 준비 완료
**다음:** macOS에서 `npm run cap:install` 시작

