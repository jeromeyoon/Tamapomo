# iOS 앱 빠른 시작 (5분)

> macOS에서 즉시 Pomochi iOS 앱을 실행하는 가이드
> 전체 상세 가이드: [IOS-SETUP-GUIDE.md](./IOS-SETUP-GUIDE.md)

---

## ✅ 사전 확인 (1분)

```bash
# macOS 확인
sw_vers

# Xcode 설치 확인
xcode-select -p
# 출력: /Applications/Xcode.app/Contents/Developer (✅ OK)

# Node 버전 확인
node --version  # v20.11.1 이상 필요
```

---

## 🚀 5단계로 iOS 앱 실행

### Step 1: Capacitor 설치 (1분)
```bash
cd ~/path/to/tamodomo
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android --save-dev
```

### Step 2: iOS 프로젝트 생성 (3분)
```bash
# 한 번만 실행
npx cap init
# 입력:
# ? App name: Pomochi
# ? App Package ID: com.pomochi.app
# ? Directory of your web assets: out
# ? Build command: npm run build:static

# iOS 플랫폼 추가
npx cap add ios
```

### Step 3: 정적 빌드 (1분)
```bash
npm run build:static

# 확인
ls -la out/
```

### Step 4: Xcode에서 열기
```bash
npx cap open ios
# Xcode가 자동으로 열림
```

### Step 5: 실행 (1분)
```
Xcode에서:
1. Product → Destination → iPhone 15 선택
2. ⌘ + R (또는 Product → Run)
3. 시뮬레이터에서 앱 실행 (약 30초 대기)
```

---

## ✨ 완료!

```
✅ Pomochi iOS 앱이 시뮬레이터에서 실행 중
✅ 태그 선택 UI 표시됨
✅ 데이터 저장 기능 작동
```

---

## 🔄 다음 번 수정 후 앱에 반영

```bash
# 1. 웹 코드 수정
# (components/ 또는 lib/ 파일 수정)

# 2. 빌드 및 동기화
npm run build:static && npx cap sync

# 3. Xcode에서 Run (⌘ + R)
```

---

## 📱 실제 iPhone에서 테스트

```bash
# USB 연결 후
# Xcode → Product → Destination → [내 iPhone]
# ⌘ + R
```

---

## ❓ 문제 발생?

### `out/` 디렉토리 없음
```bash
npm run build:static
```

### Xcode 빌드 실패
```bash
rm -rf ios/
npx cap add ios
```

### 다른 문제는
[IOS-SETUP-GUIDE.md](./IOS-SETUP-GUIDE.md)의 **문제 해결** 섹션 참고

---

## 📚 상세 가이드

- [전체 설정 가이드](./IOS-SETUP-GUIDE.md)
- [Capacitor 공식 문서](https://capacitorjs.com/docs/ios)
- [Xcode 가이드](https://developer.apple.com/xcode/)

---

**준비 완료!** 🚀 Step 1부터 시작하세요!

