# 뽀모치 오리지널 캐릭터 시스템

> 대상: 중학생~대학생이 부담 없이 쓰는 타마고치 스타일 포모도로 앱.
> 목적: 디자이너와 개발자가 같은 규칙으로 캐릭터를 만들고, Expo React Native에서 바로 구현할 수 있게 한다.

---

## 1. 전체 캐릭터 스타일 가이드

### 1.1 디자인 목표

- 중학생~대학생이 공부 앱에서 부담 없이 받아들일 수 있는 귀엽고 친근한 인상.
- 무섭거나 징그럽지 않은 안전한 표정.
- 둥글고 말랑말랑한 형태.
- 큰 머리, 작은 몸, 짧은 팔다리.
- 단순한 점 눈 또는 반짝이는 눈.
- 작은 입, 연한 분홍색 볼터치.
- 앱의 따뜻한 베이지 배경과 어울리는 파스텔 색감.
- 작게 보여도 캐릭터 종류가 바로 읽히는 뚜렷한 실루엣.
- 장난감, 스티커, 학습 플래너 마스코트처럼 단순하고 부드러운 인상.
- 기존 유명 캐릭터를 직접 모방하지 않는 완전 오리지널 디자인.

### 1.2 공통 조형 규칙

| 항목 | 규칙 |
|---|---|
| 기준 캔버스 | `128 x 128 viewBox`, 투명 배경 |
| 머리 비율 | 전체 높이의 50~60% |
| 몸 비율 | 전체 높이의 25~35% |
| 팔다리 | 짧은 타원 또는 둥근 선 |
| 눈 | 진한 갈색/남색 점 눈 또는 작은 반짝 눈 |
| 입 | 작은 곡선, 과한 이빨 금지 |
| 볼 | 연한 핑크 원형/타원형 |
| 선 | 너무 두껍지 않은 부드러운 선, 또는 무선형 벡터 |
| 디테일 | 작은 화면에서 사라지는 장식은 제거 |

### 1.3 공통 SVG 레이어

모든 캐릭터 SVG는 같은 그룹 구조를 가진다.

```tsx
<Svg viewBox="0 0 128 128">
  <G id="shadow" />
  <G id="body" />
  <G id="accessory" />
  <G id="face" />
</Svg>
```

레이어 역할:

- `shadow`: 연한 베이지/회색 바닥 그림자.
- `body`: 머리, 몸, 귀, 꼬리, 날개 등 큰 실루엣.
- `accessory`: 새싹, 구름 귀, 버섯 모자, 별, 책, 안경, 시계/가방 등 식별 장식.
- `face`: 눈, 입, 볼터치, 졸림 `z` 표시.

---

## 2. 공통 색상 팔레트 HEX 코드

앱 배경이 따뜻한 베이지 계열이므로, 캐릭터는 부드러운 파스텔을 기본으로 한다.

| 토큰 | HEX | 용도 |
|---|---:|---|
| `warmBg` | `#F6F1EC` | 앱 배경 기준색 |
| `cream` | `#FFF4DC` | 배, 얼굴 안쪽, 알 껍질 |
| `softBeige` | `#E8D7BE` | 그림자, 연한 윤곽 |
| `softGray` | `#D9D7D0` | 중립 그림자 |
| `inkBrown` | `#4B3F36` | 눈, 입 |
| `inkNavy` | `#3D4A66` | 차분한 눈, 집중 표정 |
| `cheekPink` | `#F6A8B8` | 볼터치 |
| `mint` | `#A8E0C1` | 새싹, 민트 포인트 |
| `leaf` | `#7CCB8A` | 잎, 식물형 포인트 |
| `sky` | `#A9DFF3` | 구름/물 계열 |
| `lavender` | `#CFC2F2` | 꿈, 달팽이, 밤 느낌 |
| `butter` | `#FFE08A` | 별, 따뜻한 하이라이트 |
| `peach` | `#F9C6A5` | 살구색, 강아지/토끼 포인트 |
| `mushroomRed` | `#EFA5A0` | 버섯 모자 |
| `milkCoffee` | `#B98A68` | 커피콩 곰 |
| `cocoa` | `#7B5A45` | 부드러운 갈색 포인트 |

금지:

- 큰 면적의 순검정 `#000000`.
- 강한 원색 빨강/파랑.
- 공포, 독성, 공격성을 연상시키는 높은 대비.

---

## 3. 캐릭터별 컨셉 설명

| id | 이름 | 타입 | 한 줄 컨셉 | 성격 |
|---|---|---|---|---|
| `sproutCat` | 새싹 고양이 | `plant` | 머리 위 새싹이 자라는 조용한 고양이 | 호기심 많고 차분하게 집중 |
| `cloudBunny` | 구름 토끼 | `cloud` | 몽실몽실 구름 몸을 가진 낮잠 토끼 | 잠이 많고 휴식을 좋아함 |
| `mushroomPup` | 버섯 강아지 | `forest` | 작은 버섯 모자를 쓴 응원 강아지 | 충성스럽고 시작을 격려 |
| `starSquirrel` | 별 다람쥐 | `star` | 별처럼 말린 꼬리를 가진 밤 공부 친구 | 밤에 공부를 도와줌 |
| `dropPenguin` | 물방울 펭귄 | `water` | 물방울 실루엣의 깨끗한 펭귄 | 차분하고 정리된 집중 |
| `bookWorm` | 책벌레 | `study` | 애벌레 인형처럼 귀여운 책 친구 | 공부를 좋아하고 똑똑함 |
| `beanBear` | 커피콩 곰 | `bean` | 코코아처럼 따뜻한 콩 모양 곰 | 집중할 때 눈이 반짝임 |
| `snailTeacher` | 달팽이 선생님 | `teacher` | 책가방 껍질을 멘 느긋한 선생님 | 천천히 해도 괜찮다고 격려 |

---

## 4. 캐릭터별 외형 키워드

### 4.1 새싹 고양이

- 둥근 고양이 얼굴.
- 둥근 귀, 날카로운 귀 금지.
- 머리 위 작은 두 잎 새싹.
- 연한 초록색 몸 + 크림색 얼굴.
- 짧은 꼬리는 작은 잎 모양처럼 둥글게.

### 4.2 구름 토끼

- 몸이 구름 덩어리처럼 둥근 원 3~4개가 이어진 실루엣.
- 귀는 길지만 과하지 않게, 끝은 둥글게.
- 하늘색, 흰색, 연보라 포인트.
- 졸린 표정이 잘 어울리는 부드러운 인상.

### 4.3 버섯 강아지

- 둥근 강아지 얼굴.
- 머리 위 작은 버섯 모자.
- 버섯 무늬는 동그라미 3개 이하.
- 갈색 귀, 크림 얼굴, 살구색 몸.
- 응원하는 듯한 활짝 웃는 입.

### 4.4 별 다람쥐

- 큰 둥근 꼬리가 별 모양 느낌으로 말림.
- 꼬리 안쪽에 작은 별 장식.
- 노랑, 연갈색, 파스텔 주황.
- 밤 공부 친구 느낌이지만 어둡지 않게.

### 4.5 물방울 펭귄

- 전체 몸이 물방울 실루엣.
- 배 부분은 흰색/크림색 타원.
- 날개는 아주 작고 둥근 타원.
- 파스텔 블루, 민트, 흰색.
- 차분하고 깨끗한 집중을 상징.

### 4.6 책벌레

- 벌레지만 실제 벌레 느낌보다 구슬 인형 느낌.
- 둥근 몸통 구슬 3개.
- 작은 안경 또는 책.
- 연두색, 노란색, 크림색.
- 더듬이는 아주 짧고 둥글게.

### 4.7 커피콩 곰

- 커피가 아니라 따뜻한 콩/코코아 곰 느낌.
- 얼굴은 커피콩 타원, 중앙에 부드러운 곡선 홈.
- 둥근 곰 귀.
- 밀크커피, 크림, 코코아 색.
- focus 상태에서 눈에 작은 반짝임.

### 4.8 달팽이 선생님

- 귀엽고 느긋한 달팽이.
- 껍질은 책가방 또는 시계 모양.
- 작은 안경 가능.
- 연보라, 베이지, 민트.
- "천천히 해도 괜찮아"라는 부드러운 표정.

---

## 5. 캐릭터별 성장 단계 설명

공통 단계:

| stage | 의미 | 공통 규칙 |
|---|---|---|
| `egg` | 알 상태 | 정체를 완전히 드러내지 않고 대표 색 힌트만 표시 |
| `baby` | 아기 상태 | 머리가 크고 장식은 작게 |
| `adult` | 성장 상태 | 실루엣과 장식이 명확해짐 |

### 5.1 새싹 고양이

- `egg`: 크림색 알에 작은 초록 점 2개.
- `baby`: 둥근 고양이 얼굴, 머리 위 작은 새싹 1개.
- `adult`: 새싹이 두 잎으로 커지고 꼬리 끝도 잎처럼 보임.

### 5.2 구름 토끼

- `egg`: 구름처럼 둥근 흰 알, 하늘색 그림자.
- `baby`: 작은 구름 몸 + 짧은 토끼 귀.
- `adult`: 구름 덩어리가 풍성해지고 귀 끝에 연보라 포인트.

### 5.3 버섯 강아지

- `egg`: 크림 알 위에 작은 살구색 버섯 점.
- `baby`: 작은 강아지 얼굴 + 아주 작은 버섯 모자.
- `adult`: 버섯 모자가 선명해지고 귀와 발이 뚜렷해짐.

### 5.4 별 다람쥐

- `egg`: 노란 알에 작은 별 점.
- `baby`: 작은 다람쥐 몸 + 짧은 둥근 꼬리.
- `adult`: 꼬리가 별 모양으로 말리고 별 장식 추가.

### 5.5 물방울 펭귄

- `egg`: 물방울처럼 세로로 둥근 푸른 알.
- `baby`: 물방울 몸 + 작은 흰 배.
- `adult`: 펭귄 배와 작은 둥근 날개가 명확해짐.

### 5.6 책벌레

- `egg`: 연두색 알에 책갈피 같은 노란 줄.
- `baby`: 구슬 2개 몸통, 작은 책.
- `adult`: 구슬 3개 몸통, 안경과 책이 명확해짐.

### 5.7 커피콩 곰

- `egg`: 밀크커피색 타원 알에 부드러운 콩 홈.
- `baby`: 커피콩 모양 얼굴 + 작은 곰 귀.
- `adult`: 귀와 몸이 커지고 중앙 콩 홈이 아이콘처럼 읽힘.

### 5.8 달팽이 선생님

- `egg`: 연보라 알에 작은 시계 바늘 모양.
- `baby`: 작은 달팽이 몸 + 둥근 껍질.
- `adult`: 껍질이 책가방/시계처럼 보이고 작은 안경 추가.

---

## 6. 캐릭터별 감정 상태 설명

공통 감정:

| mood | 얼굴 | 몸짓 | 이펙트 |
|---|---|---|---|
| `idle` | 작은 미소 | 천천히 흔들림 | 없음 |
| `focus` | 눈 반짝 또는 진지한 점 눈 | 몸이 살짝 앞으로 | 작은 반짝임 |
| `rest` | 편한 미소 | 낮게 앉음 | 부드러운 숨표시 |
| `sleepy` | 닫힌 눈 | 아래로 처짐 | 작은 `z` |
| `happy` | 웃는 눈 | 통통 점프 | 별/하트/반짝 |

캐릭터별 차이:

| 캐릭터 | idle | focus | rest | sleepy | happy |
|---|---|---|---|---|---|
| 새싹 고양이 | 조용히 앉음 | 새싹이 위로 섬 | 꼬리 말고 쉼 | 잎이 아래로 처짐 | 새싹 주변 반짝 |
| 구름 토끼 | 몽실몽실 | 눈에 작은 별 | 구름처럼 낮아짐 | `z`와 닫힌 눈 | 구름이 통통 튐 |
| 버섯 강아지 | 꼬리 흔듦 | 진지한 응원 눈 | 앉아서 미소 | 귀가 아래로 | 버섯 점이 반짝 |
| 별 다람쥐 | 꼬리 감싸기 | 별눈 | 꼬리에 기대기 | 별이 작게 흐림 | 꼬리 별 반짝 |
| 물방울 펭귄 | 차분히 서 있음 | 눈 반짝 | 작은 날개 내림 | 물방울이 낮아짐 | 물방울 반짝 |
| 책벌레 | 책 들고 미소 | 안경 반짝 | 책 위에 기대기 | 책 옆에서 졸림 | 책 위 별표 |
| 커피콩 곰 | 따뜻한 미소 | 눈 반짝 | 코코아처럼 편안 | 둥글게 웅크림 | 콩 홈 주변 빛 |
| 달팽이 선생님 | 느긋한 미소 | 안경 반짝 | 껍질에 기대기 | 고개 숙임 | 시계/가방 반짝 |

---

## 7. Expo React Native용 react-native-svg 컴포넌트 코드

아래 코드는 Expo + `react-native-svg`에서 사용할 수 있는 구조 예시다. 실제 앱에서는 파일을 나누고, 각 캐릭터 컴포넌트를 개별 export한다.

```tsx
import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect, Text } from "react-native-svg";

export type CharacterId =
  | "sproutCat"
  | "cloudBunny"
  | "mushroomPup"
  | "starSquirrel"
  | "dropPenguin"
  | "bookWorm"
  | "beanBear"
  | "snailTeacher";

export type CharacterStage = "egg" | "baby" | "adult";
export type CharacterMood = "idle" | "focus" | "rest" | "sleepy" | "happy";

type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  cheek: string;
  ink: string;
  shadow: string;
  egg: string;
};

type CharacterSvgProps = {
  stage?: CharacterStage;
  mood?: CharacterMood;
  size?: number;
};

const palettes: Record<CharacterId, Palette> = {
  sproutCat: {
    primary: "#A8E0C1",
    secondary: "#FFF4DC",
    accent: "#7CCB8A",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#E8D7BE",
    egg: "#F4E8CE"
  },
  cloudBunny: {
    primary: "#DDF4FB",
    secondary: "#FFFFFF",
    accent: "#CFC2F2",
    cheek: "#F6A8B8",
    ink: "#3D4A66",
    shadow: "#D9D7D0",
    egg: "#EEF7FA"
  },
  mushroomPup: {
    primary: "#F9C6A5",
    secondary: "#FFF4DC",
    accent: "#EFA5A0",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#E8D7BE",
    egg: "#F6E2C7"
  },
  starSquirrel: {
    primary: "#F4B978",
    secondary: "#FFE08A",
    accent: "#FFD166",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#E8D7BE",
    egg: "#FFF0B8"
  },
  dropPenguin: {
    primary: "#A9DFF3",
    secondary: "#FFFFFF",
    accent: "#A8E0C1",
    cheek: "#F6A8B8",
    ink: "#3D4A66",
    shadow: "#D9D7D0",
    egg: "#DFF5FB"
  },
  bookWorm: {
    primary: "#BDEB8A",
    secondary: "#FFF4DC",
    accent: "#FFE08A",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#E8D7BE",
    egg: "#EAF7C8"
  },
  beanBear: {
    primary: "#B98A68",
    secondary: "#F6E0C8",
    accent: "#7B5A45",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#E8D7BE",
    egg: "#D8B28E"
  },
  snailTeacher: {
    primary: "#CFC2F2",
    secondary: "#F6E7CC",
    accent: "#A8E0C1",
    cheek: "#F6A8B8",
    ink: "#4B3F36",
    shadow: "#D9D7D0",
    egg: "#E8DEF8"
  }
};

function MoodFace({ mood, palette }: { mood: CharacterMood; palette: Palette }) {
  const eyeY = mood === "sleepy" || mood === "rest" ? 64 : 62;
  const mouthY = 76;

  if (mood === "sleepy") {
    return (
      <G id="face">
        <Path d="M49 63 Q53 66 57 63" stroke={palette.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path d="M71 63 Q75 66 79 63" stroke={palette.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path d="M61 76 Q64 78 67 76" stroke={palette.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={47} cy={72} r={4} fill={palette.cheek} opacity={0.75} />
        <Circle cx={81} cy={72} r={4} fill={palette.cheek} opacity={0.75} />
        <Text x={86} y={45} fill={palette.ink} fontSize={12} fontWeight="700">z</Text>
      </G>
    );
  }

  if (mood === "happy") {
    return (
      <G id="face">
        <Path d="M49 61 Q53 66 57 61" stroke={palette.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Path d="M71 61 Q75 66 79 61" stroke={palette.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Path d="M58 76 Q64 82 70 76" stroke={palette.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Circle cx={46} cy={72} r={4.5} fill={palette.cheek} opacity={0.85} />
        <Circle cx={82} cy={72} r={4.5} fill={palette.cheek} opacity={0.85} />
      </G>
    );
  }

  return (
    <G id="face">
      <Circle cx={53} cy={eyeY} r={mood === "focus" ? 3.6 : 3.2} fill={palette.ink} />
      <Circle cx={75} cy={eyeY} r={mood === "focus" ? 3.6 : 3.2} fill={palette.ink} />
      {mood === "focus" && (
        <>
          <Circle cx={54.2} cy={60.8} r={1} fill="#FFFFFF" />
          <Circle cx={76.2} cy={60.8} r={1} fill="#FFFFFF" />
        </>
      )}
      <Path d={mood === "rest" ? `M59 ${mouthY} Q64 79 69 ${mouthY}` : `M60 ${mouthY} Q64 78 68 ${mouthY}`} stroke={palette.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={46} cy={72} r={4} fill={palette.cheek} opacity={0.72} />
      <Circle cx={82} cy={72} r={4} fill={palette.cheek} opacity={0.72} />
    </G>
  );
}

function EggShape({ palette }: { palette: Palette }) {
  return (
    <G id="body">
      <Ellipse cx={64} cy={66} rx={31} ry={40} fill={palette.egg} />
      <Circle cx={52} cy={56} r={4} fill={palette.accent} opacity={0.45} />
      <Circle cx={76} cy={73} r={5} fill={palette.primary} opacity={0.35} />
      <Ellipse cx={53} cy={44} rx={8} ry={12} fill="#FFFFFF" opacity={0.38} />
    </G>
  );
}

function BaseBody({
  id,
  stage,
  palette
}: {
  id: CharacterId;
  stage: CharacterStage;
  palette: Palette;
}) {
  if (stage === "egg") return <EggShape palette={palette} />;

  const adult = stage === "adult";
  const headRx = adult ? 30 : 28;
  const headRy = adult ? 31 : 29;
  const bodyRy = adult ? 18 : 15;

  return (
    <G id="body">
      {id === "starSquirrel" && (
        <Path d="M86 78 C112 55 115 95 94 99 C104 85 92 79 86 78Z" fill={palette.secondary} />
      )}
      {id === "snailTeacher" && (
        <Circle cx={86} cy={75} r={24} fill={palette.secondary} />
      )}
      <Ellipse cx={64} cy={90} rx={adult ? 24 : 20} ry={bodyRy} fill={palette.primary} />
      <Ellipse cx={64} cy={60} rx={headRx} ry={headRy} fill={palette.primary} />

      {id === "cloudBunny" && (
        <>
          <Circle cx={47} cy={77} r={18} fill={palette.secondary} />
          <Circle cx={64} cy={80} r={22} fill={palette.secondary} />
          <Circle cx={82} cy={78} r={18} fill={palette.secondary} />
          <Ellipse cx={50} cy={33} rx={8} ry={21} fill={palette.primary} />
          <Ellipse cx={78} cy={33} rx={8} ry={21} fill={palette.primary} />
        </>
      )}

      {id === "sproutCat" && (
        <>
          <Circle cx={42} cy={39} r={10} fill={palette.primary} />
          <Circle cx={86} cy={39} r={10} fill={palette.primary} />
          <Ellipse cx={64} cy={65} rx={18} ry={15} fill={palette.secondary} opacity={0.95} />
          <Path d="M43 89 Q32 91 35 78" stroke={palette.accent} strokeWidth={7} fill="none" strokeLinecap="round" />
        </>
      )}

      {id === "mushroomPup" && (
        <>
          <Ellipse cx={40} cy={62} rx={9} ry={16} fill={palette.accent} opacity={0.72} />
          <Ellipse cx={88} cy={62} rx={9} ry={16} fill={palette.accent} opacity={0.72} />
          <Ellipse cx={64} cy={66} rx={18} ry={14} fill={palette.secondary} />
        </>
      )}

      {id === "dropPenguin" && (
        <>
          <Path d="M64 26 C86 49 91 70 78 91 C69 105 49 101 42 88 C31 67 43 45 64 26Z" fill={palette.primary} />
          <Ellipse cx={64} cy={76} rx={18} ry={24} fill={palette.secondary} />
          <Ellipse cx={38} cy={77} rx={7} ry={13} fill={palette.accent} />
          <Ellipse cx={90} cy={77} rx={7} ry={13} fill={palette.accent} />
        </>
      )}

      {id === "bookWorm" && (
        <>
          <Circle cx={44} cy={83} r={15} fill={palette.primary} />
          <Circle cx={64} cy={83} r={16} fill={palette.primary} />
          <Circle cx={84} cy={83} r={15} fill={palette.primary} />
          <Ellipse cx={64} cy={58} rx={25} ry={24} fill={palette.primary} />
        </>
      )}

      {id === "beanBear" && (
        <>
          <Circle cx={43} cy={43} r={10} fill={palette.primary} />
          <Circle cx={85} cy={43} r={10} fill={palette.primary} />
          <Path d="M64 35 C49 42 49 80 64 88 C79 80 79 42 64 35Z" stroke={palette.accent} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={64} cy={67} rx={16} ry={12} fill={palette.secondary} />
        </>
      )}

      {id === "starSquirrel" && (
        <>
          <Ellipse cx={64} cy={65} rx={17} ry={13} fill={palette.secondary} />
          <Circle cx={42} cy={42} r={8} fill={palette.primary} />
          <Circle cx={86} cy={42} r={8} fill={palette.primary} />
        </>
      )}

      {id === "snailTeacher" && (
        <>
          <Path d="M88 65 Q100 75 88 88 Q76 76 88 65Z" fill={palette.accent} opacity={0.55} />
          <Rect x={77} y={62} width={22} height={26} rx={8} fill="none" stroke={palette.ink} strokeWidth={2} opacity={0.5} />
          <Ellipse cx={53} cy={70} rx={24} ry={21} fill={palette.primary} />
        </>
      )}
    </G>
  );
}

function Accessory({ id, stage, palette }: { id: CharacterId; stage: CharacterStage; palette: Palette }) {
  if (stage === "egg") return null;

  return (
    <G id="accessory">
      {id === "sproutCat" && (
        <>
          <Rect x={62} y={24} width={4} height={14} rx={2} fill={palette.accent} />
          <Ellipse cx={57} cy={28} rx={8} ry={5} fill={palette.accent} transform="rotate(-25 57 28)" />
          <Ellipse cx={70} cy={27} rx={8} ry={5} fill={palette.accent} transform="rotate(25 70 27)" />
        </>
      )}
      {id === "mushroomPup" && (
        <>
          <Path d="M43 39 Q64 16 85 39 Z" fill={palette.accent} />
          <Rect x={56} y={35} width={16} height={10} rx={5} fill={palette.secondary} />
          <Circle cx={55} cy={34} r={3.5} fill={palette.secondary} />
          <Circle cx={66} cy={29} r={3.5} fill={palette.secondary} />
          <Circle cx={76} cy={35} r={3.5} fill={palette.secondary} />
        </>
      )}
      {id === "starSquirrel" && (
        <>
          <Path d="M93 69 L97 76 L105 77 L99 82 L101 90 L93 86 L86 90 L88 82 L82 77 L90 76 Z" fill={palette.accent} />
          <Path d="M61 29 L64 34 L70 35 L66 39 L67 45 L61 42 L56 45 L57 39 L53 35 L59 34 Z" fill={palette.secondary} />
        </>
      )}
      {id === "bookWorm" && (
        <>
          <Rect x={76} y={78} width={20} height={18} rx={3} fill={palette.secondary} />
          <Path d="M86 78 V96" stroke={palette.ink} strokeWidth={1.4} />
          <Path d="M47 55 H81" stroke={palette.ink} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={55} cy={62} r={8} fill="none" stroke={palette.ink} strokeWidth={2} />
          <Circle cx={73} cy={62} r={8} fill="none" stroke={palette.ink} strokeWidth={2} />
        </>
      )}
      {id === "snailTeacher" && (
        <>
          <Circle cx={55} cy={65} r={7} fill="none" stroke={palette.ink} strokeWidth={2} />
          <Circle cx={73} cy={65} r={7} fill="none" stroke={palette.ink} strokeWidth={2} />
          <Path d="M62 65 H66" stroke={palette.ink} strokeWidth={2} />
          <Path d="M88 70 L88 83" stroke={palette.ink} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
          <Path d="M88 76 L96 76" stroke={palette.ink} strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
        </>
      )}
      {id === "beanBear" && moodSparklePlaceholder(palette)}
    </G>
  );
}

function moodSparklePlaceholder(palette: Palette) {
  return <Circle cx={86} cy={36} r={3} fill={palette.secondary} opacity={0.75} />;
}

function MascotSvg({
  id,
  stage = "adult",
  mood = "idle",
  size = 128
}: CharacterSvgProps & { id: CharacterId }) {
  const palette = palettes[id];

  return (
    <Svg width={size} height={size} viewBox="0 0 128 128">
      <G id="shadow">
        <Ellipse cx={64} cy={105} rx={34} ry={7} fill={palette.shadow} opacity={0.55} />
      </G>
      <BaseBody id={id} stage={stage} palette={palette} />
      <Accessory id={id} stage={stage} palette={palette} />
      {stage !== "egg" && <MoodFace mood={mood} palette={palette} />}
    </Svg>
  );
}

export function SproutCatSvg(props: CharacterSvgProps) {
  return <MascotSvg id="sproutCat" {...props} />;
}

export function CloudBunnySvg(props: CharacterSvgProps) {
  return <MascotSvg id="cloudBunny" {...props} />;
}

export function MushroomPupSvg(props: CharacterSvgProps) {
  return <MascotSvg id="mushroomPup" {...props} />;
}

export function StarSquirrelSvg(props: CharacterSvgProps) {
  return <MascotSvg id="starSquirrel" {...props} />;
}

export function DropPenguinSvg(props: CharacterSvgProps) {
  return <MascotSvg id="dropPenguin" {...props} />;
}

export function BookWormSvg(props: CharacterSvgProps) {
  return <MascotSvg id="bookWorm" {...props} />;
}

export function BeanBearSvg(props: CharacterSvgProps) {
  return <MascotSvg id="beanBear" {...props} />;
}

export function SnailTeacherSvg(props: CharacterSvgProps) {
  return <MascotSvg id="snailTeacher" {...props} />;
}
```

주의: 위 코드는 문서용 베이스 컴포넌트다. 실제 구현에서는 `Accessory` 안에서 `mood`별 반짝임을 넣으려면 `mood`를 props로 전달하고, 캐릭터별 파일로 분리한다.

---

## 8. characterData.ts 예시

```ts
export type CharacterStage = "egg" | "baby" | "adult";
export type CharacterMood = "idle" | "focus" | "rest" | "sleepy" | "happy";

export type CharacterType =
  | "plant"
  | "cloud"
  | "forest"
  | "star"
  | "water"
  | "study"
  | "bean"
  | "teacher";

export type CareAction = "feed" | "sleep" | "medicine" | "wash" | "pet" | "play";
export type CareGauge = "hunger" | "energy" | "health" | "cleanliness" | "affection";

export type CharacterColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  cheek: string;
  ink: string;
  shadow: string;
  egg: string;
};

export type CharacterData = {
  id: string;
  name: string;
  type: CharacterType;
  stage: CharacterStage;
  mood: CharacterMood;
  colorPalette: CharacterColorPalette;
  unlockCondition: string;
  personality: {
    summary: string;
    likes: CareAction[];
    dislikes: CareAction[];
    statTendency: Partial<Record<CareGauge, "fast" | "slow">>;
    focusStyle: "quiet" | "restful" | "cheer" | "night" | "clean" | "study" | "warm" | "slow";
  };
  svgComponentName:
    | "SproutCatSvg"
    | "CloudBunnySvg"
    | "MushroomPupSvg"
    | "StarSquirrelSvg"
    | "DropPenguinSvg"
    | "BookWormSvg"
    | "BeanBearSvg"
    | "SnailTeacherSvg";
};

export const characterData: CharacterData[] = [
  {
    id: "sproutCat",
    name: "새싹 고양이",
    type: "plant",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#A8E0C1",
      secondary: "#FFF4DC",
      accent: "#7CCB8A",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#E8D7BE",
      egg: "#F4E8CE"
    },
    unlockCondition: "기본 지급",
    personality: {
      summary: "호기심 많고 조용히 집중하는 새싹 고양이.",
      likes: ["pet", "wash"],
      dislikes: ["medicine"],
      statTendency: { affection: "slow", cleanliness: "fast" },
      focusStyle: "quiet"
    },
    svgComponentName: "SproutCatSvg"
  },
  {
    id: "cloudBunny",
    name: "구름 토끼",
    type: "cloud",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#DDF4FB",
      secondary: "#FFFFFF",
      accent: "#CFC2F2",
      cheek: "#F6A8B8",
      ink: "#3D4A66",
      shadow: "#D9D7D0",
      egg: "#EEF7FA"
    },
    unlockCondition: "휴식 모드 5회 완료",
    personality: {
      summary: "잠이 많고 쉬는 시간을 좋아하는 몽실몽실 토끼.",
      likes: ["sleep", "pet"],
      dislikes: ["play"],
      statTendency: { energy: "fast", affection: "slow" },
      focusStyle: "restful"
    },
    svgComponentName: "CloudBunnySvg"
  },
  {
    id: "mushroomPup",
    name: "버섯 강아지",
    type: "forest",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#F9C6A5",
      secondary: "#FFF4DC",
      accent: "#EFA5A0",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#E8D7BE",
      egg: "#F6E2C7"
    },
    unlockCondition: "포모도로 시작 10회",
    personality: {
      summary: "포모도로 시작을 응원하는 충성스러운 강아지.",
      likes: ["feed", "play"],
      dislikes: ["medicine"],
      statTendency: { hunger: "fast" },
      focusStyle: "cheer"
    },
    svgComponentName: "MushroomPupSvg"
  },
  {
    id: "starSquirrel",
    name: "별 다람쥐",
    type: "star",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#F4B978",
      secondary: "#FFE08A",
      accent: "#FFD166",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#E8D7BE",
      egg: "#FFF0B8"
    },
    unlockCondition: "저녁 집중 3회 완료",
    personality: {
      summary: "밤 공부를 도와주는 반짝이는 다람쥐.",
      likes: ["play", "pet"],
      dislikes: ["sleep"],
      statTendency: { energy: "slow" },
      focusStyle: "night"
    },
    svgComponentName: "StarSquirrelSvg"
  },
  {
    id: "dropPenguin",
    name: "물방울 펭귄",
    type: "water",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#A9DFF3",
      secondary: "#FFFFFF",
      accent: "#A8E0C1",
      cheek: "#F6A8B8",
      ink: "#3D4A66",
      shadow: "#D9D7D0",
      egg: "#DFF5FB"
    },
    unlockCondition: "씻기 돌봄 5회",
    personality: {
      summary: "깨끗하고 차분한 집중을 상징하는 물방울 펭귄.",
      likes: ["wash", "sleep"],
      dislikes: ["play"],
      statTendency: { cleanliness: "slow", affection: "fast" },
      focusStyle: "clean"
    },
    svgComponentName: "DropPenguinSvg"
  },
  {
    id: "bookWorm",
    name: "책벌레",
    type: "study",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#BDEB8A",
      secondary: "#FFF4DC",
      accent: "#FFE08A",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#E8D7BE",
      egg: "#EAF7C8"
    },
    unlockCondition: "누적 집중 180분",
    personality: {
      summary: "책을 좋아하는 똑똑한 애벌레 인형 친구.",
      likes: ["pet", "feed"],
      dislikes: ["medicine"],
      statTendency: { energy: "slow", hunger: "fast" },
      focusStyle: "study"
    },
    svgComponentName: "BookWormSvg"
  },
  {
    id: "beanBear",
    name: "커피콩 곰",
    type: "bean",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#B98A68",
      secondary: "#F6E0C8",
      accent: "#7B5A45",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#E8D7BE",
      egg: "#D8B28E"
    },
    unlockCondition: "아침 집중 3회 완료",
    personality: {
      summary: "커피보다 코코아에 가까운 따뜻한 콩 곰.",
      likes: ["sleep", "feed"],
      dislikes: ["play"],
      statTendency: { energy: "slow" },
      focusStyle: "warm"
    },
    svgComponentName: "BeanBearSvg"
  },
  {
    id: "snailTeacher",
    name: "달팽이 선생님",
    type: "teacher",
    stage: "egg",
    mood: "idle",
    colorPalette: {
      primary: "#CFC2F2",
      secondary: "#F6E7CC",
      accent: "#A8E0C1",
      cheek: "#F6A8B8",
      ink: "#4B3F36",
      shadow: "#D9D7D0",
      egg: "#E8DEF8"
    },
    unlockCondition: "중단 없이 25분 집중 5회",
    personality: {
      summary: "천천히 해도 괜찮다고 알려주는 느긋한 선생님.",
      likes: ["pet", "sleep"],
      dislikes: ["play"],
      statTendency: { health: "slow", energy: "slow" },
      focusStyle: "slow"
    },
    svgComponentName: "SnailTeacherSvg"
  }
];
```

---

## 9. 파일 구조 예시

```text
src/
  characters/
    characterData.ts
    characterTypes.ts
    palettes.ts
    components/
      SproutCatSvg.tsx
      CloudBunnySvg.tsx
      MushroomPupSvg.tsx
      StarSquirrelSvg.tsx
      DropPenguinSvg.tsx
      BookWormSvg.tsx
      BeanBearSvg.tsx
      SnailTeacherSvg.tsx
    parts/
      MoodFace.tsx
      EggShape.tsx
      Shadow.tsx
      AccessoryLayer.tsx
    CharacterRenderer.tsx
```

권장 분리:

- `characterData.ts`: 캐릭터 이름, 성격, 색상, 획득 조건.
- `characterTypes.ts`: `CharacterStage`, `CharacterMood`, `CharacterData` 타입.
- `palettes.ts`: 공통 색상 토큰.
- `components/*Svg.tsx`: 캐릭터별 SVG.
- `parts/MoodFace.tsx`: 감정별 얼굴 공통 컴포넌트.
- `parts/EggShape.tsx`: 알 상태 공통 컴포넌트.
- `CharacterRenderer.tsx`: `svgComponentName`으로 실제 SVG 컴포넌트 선택.

---

## 10. 제작 QA 체크리스트

디자이너 확인:

- 64px 크기에서도 캐릭터 종류가 구분되는가?
- 눈, 입, 볼이 너무 작지 않은가?
- 실루엣이 서로 충분히 다른가?
- 유명 캐릭터와 직접적으로 닮지 않았는가?
- 무섭거나 징그러운 디테일이 없는가?

개발자 확인:

- 모든 SVG가 `128 x 128 viewBox`를 사용하는가?
- 배경이 투명한가?
- `shadow`, `body`, `accessory`, `face` 그룹이 분리되어 있는가?
- `circle`, `ellipse`, `rect`, 단순 `path` 위주로 구성되어 있는가?
- `stage`와 `mood`를 props로 바꿀 수 있는가?
- 작은 화면에서 색 대비가 충분한가?
