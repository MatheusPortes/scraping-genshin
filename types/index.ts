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
