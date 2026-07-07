// Result page display assets — image paths and display metadata only.
// No logic, no scoring, no judgment.
//
// Folder layout on disk:
//   characters/           → character artwork per typeId
//   badges/tribes/        → 8 tribe badge PNGs
//   badges/specialists/   → 5 specialist badge PNGs
//
// ────────────────────────────────────────────────────────────────
// Per-type display assets
// ────────────────────────────────────────────────────────────────

export interface TypeDisplayAssets {
  /** Path from /public root */
  characterImage: string;
  /** Japanese animal type label, e.g. "ワシミミズクタイプ" */
  animalType: string;
  /** Display English name shown in FV — may differ from types.json englishName */
  displayEnglishName: string;
  /** Optional punchy one-liner for FV catch copy (falls back to type.shareCatch if absent) */
  oneLiner?: string;
}

const BASE_CHAR = "/images/diagnoses/business-skills/characters";

export const TYPE_DISPLAY_ASSETS: Record<string, TypeDisplayAssets> = {
  "vision-architect": {
    characterImage: `${BASE_CHAR}/vision-architect.png`,
    animalType: "ワシミミズクタイプ",
    displayEnglishName: "Vision Architect",
    oneLiner: "知略と構想で未来に中指を立てるフクロウ",
  },
  "win-hunter": {
    characterImage: `${BASE_CHAR}/winning-strategist.png`,
    animalType: "ハヤブサタイプ",
    displayEnglishName: "Winning Strategist",
  },
  "strategy-commander": {
    characterImage: `${BASE_CHAR}/strategy-mastermind.png`,
    animalType: "キツネタイプ",
    displayEnglishName: "Strategy Mastermind",
  },
  "siege-advisor": {
    characterImage: `${BASE_CHAR}/breakthrough-tactician.png`,
    animalType: "オオカミタイプ",
    displayEnglishName: "Breakthrough Tactician",
  },
  "solo-inventor": {
    characterImage: `${BASE_CHAR}/original-inventor.png`,
    animalType: "アライグマタイプ",
    displayEnglishName: "Original Inventor",
  },
  "precision-sniper": {
    characterImage: `${BASE_CHAR}/insight-sniper.png`,
    animalType: "黒猫タイプ",
    displayEnglishName: "Insight Sniper",
  },
  "structure-hacker": {
    characterImage: `${BASE_CHAR}/structure-hacker.png`,
    animalType: "ワタリガラスタイプ",
    displayEnglishName: "Structure Hacker",
  },
  "fortress-guardian": {
    characterImage: `${BASE_CHAR}/castle-guardian.png`,
    animalType: "サイタイプ",
    displayEnglishName: "Castle Guardian",
  },
  "assault-creator": {
    characterImage: `${BASE_CHAR}/vanguard-creator.png`,
    animalType: "イノシシタイプ",
    displayEnglishName: "Vanguard Creator",
  },
  "sales-monster": {
    characterImage: `${BASE_CHAR}/sales-beast.png`,
    animalType: "トラタイプ",
    displayEnglishName: "Sales Beast",
  },
  "producer": {
    characterImage: `${BASE_CHAR}/momentum-igniter.png`,
    animalType: "ボーダーコリータイプ",
    displayEnglishName: "Momentum Igniter",
  },
  "frontline-commander": {
    characterImage: `${BASE_CHAR}/frontline-commander.png`,
    animalType: "ライオンタイプ",
    displayEnglishName: "Frontline Commander",
  },
  "lone-crafter": {
    characterImage: `${BASE_CHAR}/master-crafter.png`,
    animalType: "ビーバータイプ",
    displayEnglishName: "Master Crafter",
  },
  "closer": {
    characterImage: `${BASE_CHAR}/final-closer.png`,
    animalType: "ワニタイプ",
    displayEnglishName: "Final Closer",
  },
  "team-conductor": {
    characterImage: `${BASE_CHAR}/guild-harmonizer.png`,
    animalType: "雄鹿タイプ",
    displayEnglishName: "Guild Harmonizer",
  },
  "last-fortress": {
    characterImage: `${BASE_CHAR}/the-last-stand.png`,
    animalType: "バイソンタイプ",
    displayEnglishName: "The Last Stand",
  },
};

// ────────────────────────────────────────────────────────────────
// Tribe badge mappings  (key → image + display name)
// Judgment logic (which tribe to show) lives elsewhere.
// ────────────────────────────────────────────────────────────────

export interface TribeBadge {
  image: string;
  displayName: string;
}

const BASE_TRIBE  = "/images/diagnoses/business-skills/badges/tribes";
const BASE_SPEC   = "/images/diagnoses/business-skills/badges/specialists";

export const TRIBE_BADGES: Record<string, TribeBadge> = {
  think:      { image: `${BASE_TRIBE}/think.png`,      displayName: "思考族"     },
  act:        { image: `${BASE_TRIBE}/act.png`,         displayName: "行動族"     },
  offense:    { image: `${BASE_TRIBE}/offense.png`,     displayName: "攻め族"     },
  stability:  { image: `${BASE_TRIBE}/stability.png`,   displayName: "安定族"     },
  individual: { image: `${BASE_TRIBE}/individual.png`,  displayName: "個人突破族" },
  group:      { image: `${BASE_TRIBE}/group.png`,       displayName: "組織推進族" },
  expand:     { image: `${BASE_TRIBE}/expand.png`,      displayName: "発散族"     },
  focus:      { image: `${BASE_TRIBE}/focus.png`,       displayName: "収束族"     },
};

// ────────────────────────────────────────────────────────────────
// Specialist badge mappings  (ability key → image + display names)
// Judgment logic (threshold, which key fires) lives elsewhere.
// ────────────────────────────────────────────────────────────────

export interface SpecialistBadge {
  image: string;
  displayNameJp: string;
  displayNameEn: string;
}

export const SPECIALIST_BADGES: Record<string, SpecialistBadge> = {
  logic:      { image: `${BASE_SPEC}/logic-specialist.png`,      displayNameJp: "論理特化個体", displayNameEn: "LOGIC SPECIALIST"      },
  execution:  { image: `${BASE_SPEC}/execution-specialist.png`,  displayNameJp: "実行特化個体", displayNameEn: "EXECUTION SPECIALIST"  },
  sales:      { image: `${BASE_SPEC}/sales-specialist.png`,      displayNameJp: "営業特化個体", displayNameEn: "SALES SPECIALIST"      },
  creativity: { image: `${BASE_SPEC}/creative-specialist.png`,   displayNameJp: "創造特化個体", displayNameEn: "CREATIVE SPECIALIST"   },
  management: { image: `${BASE_SPEC}/management-specialist.png`, displayNameJp: "管理特化個体", displayNameEn: "MANAGEMENT SPECIALIST" },
};
