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

export interface BaseDamage {
  attack: number;
  subStat: number;
}
export interface WeaponInfo {
  name: string;
  description: string;
  type: string;
  rarity: number;
  baseAttack: number;
  subStat: string;
  passiveName: string;
  passiveDesc: string;
  location: string;
  ascensionMaterial: string;
  baseDamage: Partial<BaseDamage>;
}

export interface Key {
  name: string;
  link: string;
}

export interface Value {
  name: string;
  link: string;
}

export interface Infos {
  key: Key;
  values: Value[];
}

export interface DropCards {
  name?: string;
  rarity: number[];
}

export interface Resistance {
  name: string;
  value: string;
}

export interface Stage {
  name: string;
  resistance: Resistance[];
}

export interface Drop {
  phase?: string;
  stages: Stage[];
}

export interface Metadade {
  name: string | undefined;
  info: {
    figure: {
      icon: string | undefined;
      portrait: string | null | undefined;
    };
    infos: Infos[];
  };
  drop: DropCards[] | undefined;
  resistance: Drop[];
  description: string | undefined;
  element: string | undefined;
}

export type WeaponTypeKeysMap =
  | "espadão"
  | "lança"
  | "arco"
  | "catalisador"
  | "espada";

export type SecondaryAttributesMap =
  | "Recarga de Energia"
  | "Bônus de Dano Físico"
  | "Dano Crítico"
  | "Proficiência Elemental"
  | "Taxa Crítica"
  | "Porcentagem de Vida"
  | "Porcentagem de DEF"
  | "Porcentagem de ATQ";

export type AttackType =
  | "NORMAL_ATTACK"
  | "ELEMENTAL_SKILL"
  | "ELEMENTAL_BURST";

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

export type Vision =
  | "Geo"
  | "Anemo"
  | "Cryo"
  | "Dendro"
  | "Electro"
  | "Hydro"
  | "Pyro";

// export type PatchDates = {
//   [K in ValidPatchVersion]: string;
// };
