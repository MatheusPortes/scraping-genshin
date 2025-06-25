export type WeaponTypeKeysMap =
  | "claymore"
  | "polearm"
  | "bow"
  | "catalyst"
  | "sword";

export const weaponTypeKeysMap: WeaponTypeKeysMap[] = [
  "claymore",
  "polearm",
  "bow",
  "catalyst",
  "sword",
];

export const weaponTypeMap = {
  claymore: "CLAYMORE",
  polearm: "POLEARM",
  bow: "BOW",
  catalyst: "CATALYST",
  sword: "SWORD",
};

export const regionMap = [
  "Mondstadt",
  "Liyue Harbor",
  "Inazuma City",
  "Snezhnaya",
  "Sumeru",
  "Fontaine",
  "Natlan",
];

export type SecondaryAttributesMap =
  | "CRIT Rate"
  | "CRIT DMG"
  | "Physical DMG Bonus"
  | "Elemental Mastery"
  | "Energy Recharge"
  | "HP Percentage"
  | "DEF Percentage"
  | "ATK Percentage";

export const secondaryAttributesMap: SecondaryAttributesMap[] = [
  "CRIT Rate",
  "CRIT DMG",
  "Physical DMG Bonus",
  "Elemental Mastery",
  "Energy Recharge",
  "HP Percentage",
  "DEF Percentage",
  "ATK Percentage",
];
