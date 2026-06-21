// 캐릭터 설정 — 단일 진실 소스(Single Source of Truth)
// 타마고치 유니처럼 캐릭터마다 성격·행동·성장 조건이 다르다.
// 이 데이터는 docs/characters.md 문서와 1:1로 대응한다.

export type CharacterId = "beanCat" | "purdy" | "ember" | "dewy" | "luna";
export type CareKind = "feed" | "sleep" | "medicine" | "wash" | "pet" | "play";
export type GaugeKey = "hunger" | "energy" | "health" | "cleanliness" | "affection";
export type LifeStage = "egg" | "baby" | "child" | "teen" | "adult" | "elder";

export const CARE_LABELS: Record<CareKind, string> = {
  feed: "밥 주기",
  sleep: "재우기",
  medicine: "약 주기",
  wash: "씻기기",
  pet: "쓰다듬기",
  play: "놀아주기"
};

export const GAUGE_LABELS: Record<GaugeKey, string> = {
  hunger: "배고픔",
  energy: "기운",
  health: "건강",
  cleanliness: "청결",
  affection: "애정"
};

// 성장 분기: 어떤 시그널이 우세하면 어떤 형태로 자라는가
export type EvolutionBranch = {
  id: string;
  label: string; // 형태 이름
  condition: string; // 사람이 읽는 분기 조건
  signal: string; // 코드 연결용 핵심 시그널 키
};

export type CharacterProfile = {
  id: CharacterId;
  name: string;
  line: string;
  emoji: string;
  personality: string;
  traits: string[]; // 행동 특성
  // 게이지가 빨리/느리게 닳는 성향 (명시 안 한 게이지는 보통)
  statTendency: Partial<Record<GaugeKey, "fast" | "slow">>;
  likes: CareKind[]; // 좋아하는 돌봄(보너스/호감)
  dislikes: CareKind[]; // 싫어하는 돌봄(효과 반감/시무룩)
  growthAxis: string; // 성장의 핵심 축
  hatchHint: string; // 우수 개체 조건 힌트
  adultBranches: [EvolutionBranch, EvolutionBranch];
  elderBranches: [EvolutionBranch, EvolutionBranch];
  reactions: {
    idle: string;
    focusStart: string;
    focusDone: string;
    fed: string;
    neglected: string;
  };
};

export const CHARACTER_PROFILES: Record<CharacterId, CharacterProfile> = {
  beanCat: {
    id: "beanCat",
    name: "콩냥이",
    line: "민트 고양이 · 만개",
    emoji: "🐱",
    personality: "조용하고 호기심 많은 식물 고양이 — 돌봄을 받으면 꽃처럼 밝아진다",
    traits: [
      "콩처럼 동글한 몸으로 조용히 집중 시간을 지켜본다",
      "씻기와 쓰다듬기를 받으면 볼이 말랑하게 붉어진다",
      "집중이 쌓일수록 머리 위 씨앗이 새싹, 꽃봉오리, 만개 꽃으로 자란다"
    ],
    statTendency: { cleanliness: "slow", affection: "slow" },
    likes: ["pet", "wash"],
    dislikes: ["medicine"],
    growthAxis: "씨앗 → 새싹 → 꽃봉오리 → 만개",
    hatchHint: "첫 집중을 마치면 씨앗 콩냥이로 부화하고, 누적 집중으로 꽃이 핀다",
    adultBranches: [
      {
        id: "bean-cat-bloom",
        label: "만개 콩냥이",
        condition: "집중을 꾸준히 이어가고 애정을 높게 유지",
        signal: "focusSteady+affectionHigh"
      },
      {
        id: "bean-cat-nap",
        label: "낮잠 콩냥이",
        condition: "휴식과 수면을 많이 챙김",
        signal: "restCare"
      }
    ],
    elderBranches: [
      {
        id: "bean-cat-garden",
        label: "정원 콩냥이",
        condition: "만개 경로 유지",
        signal: "bloomKept"
      },
      {
        id: "bean-cat-dream",
        label: "꿈꾸는 콩냥이",
        condition: "낮잠 경로 유지",
        signal: "napKept"
      }
    ],
    reactions: {
      idle: "콩냥이가 작은 씨앗을 품고 꾸벅꾸벅 졸고 있어요.",
      focusStart: "콩냥이가 조용히 앉아 함께 집중해요.",
      focusDone: "집중의 햇살을 받아 콩냥이가 한 단계 자랐어요.",
      fed: "냠냠, 콩냥이가 든든해졌어요.",
      neglected: "콩냥이가 심심해 보여요. 살짝 쓰다듬어 주세요."
    }
  },

  purdy: {
    id: "purdy",
    name: "푸름이",
    line: "식물 · 거목",
    emoji: "🌱",
    personality: "느긋한 대기만성형 — 서두르지 않고 꾸준하다",
    traits: [
      "졸음이 많아 대기 중 자주 꾸벅꾸벅",
      "집중 중엔 잎이 살랑이며 차분히 흔들림",
      "생명력이 강해 방치해도 잘 아프지 않음"
    ],
    statTendency: { energy: "slow", cleanliness: "fast" },
    likes: ["wash", "sleep"],
    dislikes: ["medicine"],
    growthAxis: "애정 vs 우직 — 마음을 쏟으면 꽃나무, 묵묵히 키우면 고목",
    hatchHint: "끊김 없는 첫 25분 집중 시 우수 개체(튼튼한 뿌리)",
    adultBranches: [
      {
        id: "purdy-bloom",
        label: "꽃 핀 청년목",
        condition: "애정을 높게 유지 + 집중 품질 우수",
        signal: "affectionHigh+cleanFocus"
      },
      {
        id: "purdy-stout",
        label: "잎 무성한 고목",
        condition: "청결·기운 위주로 우직하게 돌봄, 애정 낮음",
        signal: "careUtility"
      }
    ],
    elderBranches: [
      {
        id: "purdy-sakura",
        label: "벚꽃 거목",
        condition: "만개 경로 유지",
        signal: "bloomKept"
      },
      {
        id: "purdy-spirit",
        label: "이끼 낀 신령목",
        condition: "고목 경로 유지",
        signal: "stoutKept"
      }
    ],
    reactions: {
      idle: "푸름이가 햇볕 아래 꾸벅꾸벅 졸고 있어요.",
      focusStart: "푸름이가 천천히 잎을 펼치며 함께 집중해요.",
      focusDone: "뿌리에 영양이 돌았어요. 푸름이가 한 뼘 자랐어요.",
      fed: "냠냠, 푸름이가 든든해졌어요.",
      neglected: "흙이 말랐어요… 푸름이가 시들시들."
    }
  },

  ember: {
    id: "ember",
    name: "불씨",
    line: "불 · 화룡",
    emoji: "🔥",
    personality: "열정 스프린터형 — 급하고 경쟁심 강한 에너지 폭발형",
    traits: [
      "대기 중에도 들썩이며 가만히 못 있음",
      "집중하면 격하게 통통 튀며 몰입",
      "배고프면 기분이 급격히 시무룩"
    ],
    statTendency: { energy: "fast", hunger: "fast" },
    likes: ["feed", "play"],
    dislikes: ["sleep"],
    growthAxis: "강도 vs 변덕 — 굵게 몰입하면 화룡, 자주 끊기면 도깨비불",
    hatchHint: "한 번에 길고 강한 집중(50분+)으로 끊김 없이 부화 시 우수 개체",
    adultBranches: [
      {
        id: "ember-dragon",
        label: "늠름한 화룡",
        condition: "긴 세션 위주 + 집중 품질 우수",
        signal: "longSession+cleanFocus"
      },
      {
        id: "ember-wisp",
        label: "장난꾸러기 도깨비불",
        condition: "일시정지·이탈이 잦음",
        signal: "manyBreaks"
      }
    ],
    elderBranches: [
      {
        id: "ember-sage",
        label: "현자의 잔불",
        condition: "꾸준한 누적 + 안정",
        signal: "steadyKept"
      },
      {
        id: "ember-wander",
        label: "떠돌이 불씨",
        condition: "변덕 경로 유지",
        signal: "wispKept"
      }
    ],
    reactions: {
      idle: "불씨가 안절부절, 빨리 집중하고 싶어 들썩여요.",
      focusStart: "불씨가 활활! 신나게 몰입을 시작해요.",
      focusDone: "불꽃이 더 커졌어요! 불씨가 의기양양.",
      fed: "와앙! 불씨가 게걸스럽게 먹었어요.",
      neglected: "배가 고파요… 불씨의 불꽃이 시들해졌어요."
    }
  },

  dewy: {
    id: "dewy",
    name: "방울이",
    line: "물 · 고래",
    emoji: "💧",
    personality: "다정 케어형 — 상냥하고 정이 많아 교감을 좋아함",
    traits: [
      "대기 중 둥실둥실 떠다니며 안정적",
      "집중하면 잔잔히 흔들리며 곁을 지킴",
      "외로움을 많이 타 애정이 빨리 닳음"
    ],
    statTendency: { affection: "fast", cleanliness: "slow" },
    likes: ["pet", "wash"],
    dislikes: ["play"],
    growthAxis: "교감 — 애정을 채우면 큰 고래, 외롭게 두면 여린 해파리",
    hatchHint: "부화까지 자주 쓰다듬어 애정을 채우면 우수 개체",
    adultBranches: [
      {
        id: "dewy-whale",
        label: "큰 고래",
        condition: "애정을 꾸준히 만점 유지",
        signal: "affectionMax"
      },
      {
        id: "dewy-jelly",
        label: "여린 해파리",
        condition: "애정이 자주 바닥",
        signal: "affectionLow"
      }
    ],
    elderBranches: [
      {
        id: "dewy-coral",
        label: "산호 두른 거수",
        condition: "다정 경로 유지",
        signal: "whaleKept"
      },
      {
        id: "dewy-lantern",
        label: "심해의 조용한 등불",
        condition: "여림 경로 유지",
        signal: "jellyKept"
      }
    ],
    reactions: {
      idle: "방울이가 둥실, 곁에 누가 있어 주길 기다려요.",
      focusStart: "방울이가 잔잔히 곁을 지키며 함께해요.",
      focusDone: "방울이가 보글보글, 함께라 행복해 보여요.",
      fed: "방울이가 방긋, 마음이 차올랐어요.",
      neglected: "혼자라 외로워요… 방울이가 투명해졌어요."
    }
  },

  luna: {
    id: "luna",
    name: "달밤이",
    line: "별달 · 신수",
    emoji: "🌙",
    personality: "신비 루틴형 — 조용하고 예민하며 규칙적인 걸 좋아함",
    traits: [
      "대기 중 반짝이며 조용히 떠 있음",
      "규칙이 깨지면 컨디션이 쉽게 난조",
      "예민해서 건강이 빨리 닳지만 약을 주면 빨리 회복"
    ],
    statTendency: { health: "fast" },
    likes: ["sleep", "medicine"],
    dislikes: ["play"],
    growthAxis: "규칙성 — 매일 꾸준하면 별자리 신수, 컨디션을 방치하면 그림자 짐승",
    hatchHint: "이탈 없이 차분히 집중하고 컨디션을 챙기면 우수 개체",
    adultBranches: [
      {
        id: "luna-divine",
        label: "별자리 신수",
        condition: "연속 집중일(스트릭) 높음 + 컨디션 관리 양호",
        signal: "streakHigh+goodCondition"
      },
      {
        id: "luna-shadow",
        label: "그림자 짐승",
        condition: "아픔·더러움 등 컨디션 방치 잦음",
        signal: "conditionNeglect"
      }
    ],
    elderBranches: [
      {
        id: "luna-elder-divine",
        label: "성좌를 두른 노수",
        condition: "신수 경로 유지",
        signal: "divineKept"
      },
      {
        id: "luna-elder-cold",
        label: "식어버린 별",
        condition: "그림자 경로 유지",
        signal: "shadowKept"
      }
    ],
    reactions: {
      idle: "달밤이가 조용히 반짝이며 밤을 음미해요.",
      focusStart: "달밤이가 별빛을 모으며 차분히 함께해요.",
      focusDone: "별빛이 한 점 늘었어요. 달밤이가 은은히 빛나요.",
      fed: "달밤이가 살며시 미소 지었어요.",
      neglected: "리듬이 흐트러졌어요… 달밤이가 어두워졌어요."
    }
  }
};

// 현재 비주얼이 구현된 캐릭터 (확장 시 선택/랜덤으로 변경)
export const ACTIVE_CHARACTER_ID: CharacterId = "beanCat";

export function getCharacterProfile(id: CharacterId = ACTIVE_CHARACTER_ID): CharacterProfile {
  return CHARACTER_PROFILES[id];
}
