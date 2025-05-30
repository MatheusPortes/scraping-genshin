export interface BaseInfo {
  name: string;
  title: string;
  vision: string;
  weapon: string;
  gender: string;
  nation: string;
  affiliation: string;
  rarity: number;
  release: string;
  constellation: string;
  birthday: string;
  description: string;
  vision_key: string;
  weapon_type: string;
  specialDish: string;
}

export interface BaseConstellations {
  name: string;
  unlock: string;
  description: string;
  level: number;
}

export interface Level {
  // level: string;
  name: string;
  value: number;
}

export interface AscensionData {
  AscensionPhase: number;
  Level: string;
  BaseHP: number;
  BaseAtk: number;
  BaseDef: number;
  elementalMastery: number;
}

export interface AscensionMaterials {
  level_20: Level[];
  level_40: Level[];
  level_50: Level[];
  level_60: Level[];
  level_70: Level[];
  level_80: Level[];
  ascension_data: AscensionData[];
}

export type AttackType =
  | "NORMAL_ATTACK"
  | "ELEMENTAL_SKILL"
  | "ELEMENTAL_BURST";

export interface Power {
  level: number;
  value: string;
}

export interface Upgrade {
  name: string;
  power: Power[];
}

export interface SkillTalent {
  name: string;
  unlock: string;
  description: string;
  upgrades: Upgrade[];
  type: AttackType;
}

export interface PassiveTalent {
  name: string;
  unlock: string;
  description: string;
  level?: number;
}

export type ValidPatchVersion =
  | "1.0"
  | "1.1"
  | "1.2"
  | "1.3"
  | "1.4"
  | "1.5"
  | "1.6"
  | "2.0"
  | "2.1"
  | "2.2"
  | "2.3"
  | "2.4"
  | "2.5"
  | "2.6"
  | "2.7"
  | "2.8"
  | "3.0"
  | "3.1"
  | "3.2"
  | "3.3"
  | "3.4"
  | "3.5"
  | "3.6"
  | "3.7"
  | "3.8"
  | "4.0"
  | "4.1"
  | "4.2"
  | "4.3"
  | "4.4"
  | "4.5"
  | "4.6"
  | "4.7"
  | "4.8"
  | "4.9"
  | "5.0"
  | "5.1"
  | "5.2"
  | "5.3"
  | "5.4"
  | "5.5"
  | "5.6"
  | "5.7"
  | "5.8";

// export type PatchDates = {
//   [K in ValidPatchVersion]: string;
// };
