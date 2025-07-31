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

export const weaponTypeKeysMap: WeaponTypeKeysMap[] = [
  "espadão",
  "lança",
  "arco",
  "catalisador",
  "espada",
];

export const weaponTypeMap = {
  espadão: "CLAYMORE",
  lança: "POLEARM",
  arco: "BOW",
  catalisador: "CATALYST",
  espada: "SWORD",
};

export const regionMap = [
  "Sumeru",
  "Fontaine",
  "Natlan",
  "Porto de Liyue",
  "Cidade de Inazuma",
  "Snezhnaya",
  "Mondstadt",
];

export const secondaryAttributesMap: SecondaryAttributesMap[] = [
  "Recarga de Energia",
  "Bônus de Dano Físico",
  "Dano Crítico",
  "Proficiência Elemental",
  "Taxa Crítica",
  "Porcentagem de Vida",
  "Porcentagem de DEF",
  "Porcentagem de ATQ",
];
