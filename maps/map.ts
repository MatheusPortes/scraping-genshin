import {
  weaponTypeMap as en,
  weaponTypeKeysMap as enKeysMap,
  regionMap as enRegionMap,
} from "./en";
import {
  weaponTypeMap as pt,
  weaponTypeKeysMap as ptKeysMap,
  regionMap as ptRegionMap,
} from "./pt";

export type Lang = "en" | "pt";

const weaponTypeMaps = { en, pt };
const weaponTypeKeysMap = { enKeysMap, ptKeysMap };
const regionMap = { enRegionMap, ptRegionMap };

export const includeWeaponTypeKey = (name: string, lang: Lang) => {
  const include = weaponTypeKeysMap[`${lang}KeysMap`];

  return include.includes(name as never);
};

export const includeRegion = (name: string, lang: Lang) => {
  const include = regionMap[`${lang}RegionMap`];

  return include.includes(name as never);
};

export const mapTheWeaponType = (
  name: string,
  lang: Lang
): string | undefined => {
  const map = weaponTypeMaps[lang];

  for (const element in map) {
    if (element.toLowerCase() === name) return map[element as keyof typeof map];
  }
};
