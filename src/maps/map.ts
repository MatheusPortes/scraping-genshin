import {
  weaponTypeMap as en,
  weaponTypeKeysMap as enKeysMap,
  regionMap as enRegionMap,
  secondaryAttributesMap as enSecondaryAttributesMap,
} from "./en";
import {
  weaponTypeMap as pt,
  weaponTypeKeysMap as ptKeysMap,
  regionMap as ptRegionMap,
  secondaryAttributesMap as ptSecondaryAttributesMap,
} from "./pt";

export type Lang = "en" | "pt";

const weaponTypeMaps = { en, pt };
const secondaryAttributesMaps = {
  en: enSecondaryAttributesMap,
  pt: ptSecondaryAttributesMap,
};
const weaponTypeKeysMap = { enKeysMap, ptKeysMap };
const regionMap = { enRegionMap, ptRegionMap };

const vision = ["Geo", "Anemo", "Cryo", "Dendro", "Electro", "Hydro", "Pyro"];

export const includeWeaponTypeKey = (name: string, lang: Lang) => {
  const include = weaponTypeKeysMap[`${lang}KeysMap`];

  return include.includes(name as never);
};

export const includeRegion = (name: string, lang: Lang) => {
  const include = regionMap[`${lang}RegionMap`];

  return include.includes(name as never);
};

export const includeVision = (name: string) => {
  return vision.includes(name as never);
};

export const mapTheWeaponType = (
  name: string,
  lang: Lang
): string | undefined => {
  const map = weaponTypeMaps[lang];

  for (const element in map) {
    if (element.toLowerCase() === name.toLowerCase())
      return map[element as keyof typeof map];
  }
};

export const mapSecondaryAttribute = (
  name: string,
  lang: Lang
): string | undefined => {
  const map = secondaryAttributesMaps[lang];

  for (const attribute of map) {
    if (attribute === name) return attribute;
  }
};
