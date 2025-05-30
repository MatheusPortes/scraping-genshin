import { ElementHandle, Page } from "puppeteer";
import {
  AscensionMaterials,
  BaseConstellations,
  BaseInfo,
  Level,
  PassiveTalent,
  Power,
  SkillTalent,
  Upgrade,
} from "../types";
import { formatBirthday, toKebabCase } from "../utility";
import {
  includeRegion,
  includeWeaponTypeKey,
  mapTheWeaponType,
} from "../maps/map";

const getUpgrade = async (talentContent: ElementHandle<HTMLDivElement>[]) => {
  let upgrades = [] as Upgrade[];
  for (const [key, element] of talentContent.entries()) {
    if (key === 0 || key === talentContent.length - 1) continue;

    const thEl = await element.$("th");
    const name = await thEl?.evaluate((el) => el.textContent?.trim(), thEl);

    let powers = [] as Power[];
    const tdEl = await element.$$("td");
    for (const [key, element] of tdEl.entries()) {
      const value = await element.evaluate(
        (el) => el.textContent?.trim(),
        element
      );

      if (value) powers = [...powers, { value, level: key + 1 }];
    }

    if (name) upgrades = [...upgrades, { name, power: powers }];
  }

  console.log("Scraping On Upgrades ✅");
  return upgrades;
};

const getSkills = async (
  key: number,
  page: Page,
  talentContent: ElementHandle<HTMLDivElement>,
  upgradeContent: ElementHandle<HTMLDivElement>[]
) => {
  let skillTalent = {} as Partial<SkillTalent>;

  const title = await page.evaluate(
    (el) => el?.querySelector("div.d-talent-title div")?.textContent?.trim(),
    talentContent
  );
  skillTalent.name = title;

  const etText = await page.evaluate(
    (el) =>
      el?.querySelector("div.et-text-tiptap-editor div p")?.textContent?.trim(),
    talentContent
  );
  skillTalent.description = etText;

  skillTalent.unlock =
    key === 0
      ? "Ataque Normal"
      : key === 1
      ? "Habilidade Elemental"
      : key === 2
      ? "Habilidade Elemental"
      : "Habilidade Elemental";

  skillTalent.type =
    key === 0
      ? "NORMAL_ATTACK"
      : key === 1
      ? "ELEMENTAL_SKILL"
      : key === 2
      ? "ELEMENTAL_BURST"
      : "ELEMENTAL_BURST";

  const upgrades = await getUpgrade(upgradeContent);

  if (upgrades.length) skillTalent.upgrades = upgrades;

  console.log("Scraping On Skills ✅");
  return skillTalent as SkillTalent;
};

const getPassives = async (
  key: number,
  talentContent: ElementHandle<HTMLDivElement>,
  page: Page
) => {
  let passiveTalent = {} as Partial<PassiveTalent>;

  const title = await page.evaluate(
    (el) => el?.querySelector("div.d-talent-title div")?.textContent?.trim(),
    talentContent
  );
  passiveTalent.name = title;

  const etText = await page.evaluate(
    (el) =>
      el?.querySelector("div.et-text-tiptap-editor div p")?.textContent?.trim(),
    talentContent
  );
  passiveTalent.description = etText;

  let unlock = "";
  if (key === 3) {
    passiveTalent.level = 1;
    unlock = "Desbloqueado na Ascenção 1";
  }

  if (key === 4) {
    passiveTalent.level = 4;
    unlock = "Desbloqueado na Ascenção 4";
  }

  if (key === 5) unlock = "Desbloqueado automaticamente";

  passiveTalent.unlock = unlock;

  console.log("Scraping On Passives ✅");
  return passiveTalent as PassiveTalent;
};

const attributeTable = async (page: Page, base_info: Partial<BaseInfo>) => {
  await page.waitForSelector("div.base-info-item");

  const baseInfoEl = await page.$$("div.base-info-item");

  for (const element of baseInfoEl) {
    const key = await page.evaluate((e) => {
      const selector = "div.base-info-item-key";
      return e.querySelector(selector)?.textContent?.trim();
    }, element);

    const value = await page.evaluate((e) => {
      const selector = "p";
      const textContent = e.querySelector(selector)?.textContent?.trim();

      if (!textContent) {
        const selector = "div.common-game-icon-bottom.pc.genshin.has-tooltip";
        return e.querySelector(selector)?.textContent?.trim();
      }
      return textContent;
    }, element);

    if (key && value) {
      if (key === "Nome" || key === "Name") base_info.name = value;

      if (key === "Birthday" || key === "Aniversário")
        base_info.birthday = formatBirthday(value);

      if (key === "Constellation" || key === "Constelação")
        base_info.constellation = value;

      if (key === "Title" || key === "Título") base_info.title = value;

      if (key === "Affiliation" || key === "Afiliação")
        base_info.affiliation = value;

      if (key === "Special Dish" || key === "Prato Especial")
        base_info.specialDish = value;

      if (key === "Version Released" || key === "Disponível na Versão")
        base_info.release = value;

      if (key === "Vision" || key === "Visão") {
        base_info.vision = value;
        base_info.vision_key = value?.toUpperCase();
      }
    }
  }

  console.log("Scraping On Attribute Table ✅");
};

const header = async (page: Page, base_info: Partial<BaseInfo>) => {
  let selector =
    "div.et-text-tiptap-wrapper.detail-header-cover-describe-wrapper.ENTRY_SHARE_DESC_SELECTOR";

  await page.waitForSelector(selector);
  const describeEl = await page.$(selector);

  const describe = await page.evaluate(
    (element) => element?.querySelector("p")?.textContent?.trim(),
    describeEl
  );

  base_info.description = describe;

  selector = "div.c-entry-tag-item.active.pc.genshin";
  await page.waitForSelector(selector);
  const tagsEl = await page.$$(selector);

  for (const element of tagsEl) {
    const text = await page.evaluate((el) => el.innerHTML.trim(), element);

    let textTabs = text.toLocaleLowerCase();

    if (includeWeaponTypeKey(textTabs, "pt")) {
      base_info.weapon = text;
      base_info.weapon_type = mapTheWeaponType(textTabs, "pt");
    }

    const numero = textTabs.replace(/\D/g, "");
    const rarity = parseInt(numero, 10);

    if (!isNaN(rarity)) base_info.rarity = rarity;

    if (includeRegion(text, "pt"))
      base_info.nation = includeRegion(text, "pt") ? text : "Snezhnaya";
  }

  console.log("Scraping On Header ✅");
};

const onBaseInfo = async (page: Page) => {
  const baseInfo = {
    name: undefined,
    title: undefined,
    vision: undefined,
    weapon: undefined,
    gender: undefined,
    nation: undefined,
    affiliation: undefined,
    rarity: undefined,
    release: undefined,
    constellation: undefined,
    birthday: undefined,
    description: undefined,
    vision_key: undefined,
    weapon_type: undefined,
    specialDish: undefined,
  };

  await attributeTable(page, baseInfo);
  await header(page, baseInfo);

  return { baseInfo };
};

const onConstellation = async (page: Page) => {
  await page.waitForSelector("div.describe-text-content");

  const constellationsEl = await page.$$("div.describe-text-item");

  let baseConstellations = [] as Partial<BaseConstellations>[];
  for (const [index, element] of constellationsEl.entries()) {
    let constellation = {} as Partial<BaseConstellations>;

    const constellation_name = await page.evaluate(
      (el) =>
        el.querySelector("div.describe-text-item-name")?.textContent?.trim(),
      element
    );
    constellation.name = constellation_name;

    const constellation_describe = await page.evaluate(
      (el) => el.querySelector("p")?.textContent?.trim(),
      element
    );
    constellation.description = constellation_describe;
    constellation.level = index + 1;
    constellation.unlock = `Constelação Lv. ${index + 1}`;

    baseConstellations = [...baseConstellations, constellation];
  }

  console.log("Scraping On Constellations ✅");
  return { constellations: baseConstellations };
};

const onAscensionMaterial = async (page: Page) => {
  await page.waitForSelector("div.d-talent-keys-icon.default-img-wrapper");
  await page.waitForFunction(() => {
    const element = document.querySelector("div.d-ascension-material-item");
    const el = element?.querySelector("div.common-game-icon-bottom");
    return el?.textContent?.trim() !== "";
  });

  const ascensionkeyEL = await page.$$("div.d-ascension-material");

  let ascensionMaterials = {} as AscensionMaterials;
  for (const element of ascensionkeyEL) {
    const materialItemEl = await page.evaluate(async (el) => {
      const materialItems = el.querySelectorAll(
        "div.d-ascension-material-item"
      );

      let ascensionMaterial = [] as Level[];
      for (const el of materialItems) {
        const name = el
          .querySelector("div.common-game-icon-bottom.pc.genshin")
          ?.textContent?.trim()!;

        const value = Number(
          el.querySelector("span")?.textContent?.trim().replace(/\D/g, "")
        );

        ascensionMaterial = [...ascensionMaterial, { name, value }];
      }

      return ascensionMaterial;
    }, element);

    function checkAscenderLevel(array: number[]) {
      const jsonArray = JSON.stringify(array);

      if (JSON.stringify([1, 3, 3]) === jsonArray) return 2;
      if (JSON.stringify([3, 2, 10, 15]) === jsonArray) return 4;
      if (JSON.stringify([6, 4, 20, 12]) === jsonArray) return 5;
      if (JSON.stringify([3, 8, 30, 18]) === jsonArray) return 6;
      if (JSON.stringify([6, 12, 45, 12]) === jsonArray) return 7;
      if (JSON.stringify([6, 20, 60, 24]) === jsonArray) return 8;

      return 2;
    }

    let array = [] as number[];

    if (materialItemEl[1]) array = [...array, materialItemEl[1].value];
    if (materialItemEl[2]) array = [...array, materialItemEl[2].value];
    if (materialItemEl[3]) array = [...array, materialItemEl[3].value];
    if (materialItemEl[4]) array = [...array, materialItemEl[4].value];

    ascensionMaterials[`level_${checkAscenderLevel(array)}0`] = materialItemEl;
  }

  // await getAscensionData(page);

  console.log("Scraping On Ascension Material ✅");
  return { ascension_materials: ascensionMaterials };
};

const onTalents = async (page: Page) => {
  await page.waitForSelector("div.d-talent-keys-wrapper");

  const talentKeys = await page.$$(
    "div.default-img-wrapper.d-talent-keys-icon"
  );

  let skillTalents = [] as SkillTalent[];
  let passiveTalents = [] as PassiveTalent[];
  for (const [key, element] of talentKeys.entries()) {
    await page.waitForSelector("div.d-talent-keys-wrapper.active");

    element.click();
    await new Promise((res) => setTimeout(res, 100));

    const selector = "div.d-talent-content-top";
    const talentContent = await page.$(selector);
    if (!talentContent) throw new Error(`selector ${selector} not exist`);

    const percentTable = await page.$$("tr.m-d-talent-tr.pc");

    if (key < 3) {
      skillTalents = [
        ...skillTalents,
        await getSkills(key, page, talentContent, percentTable),
      ];

      continue;
    }

    passiveTalents = [
      ...passiveTalents,
      await getPassives(key, talentContent, page),
    ];
  }

  console.log("Scraping On Talents ✅");
  return { passiveTalents, skillTalents };
};

const checkingFolderName = (key: string) => {
  switch (key) {
    case "Kujou Sara":
      return "Sara";

    case "Kamisato Ayato":
      return "Ayato";

    case "Kamisato Ayaka":
      return "Ayaka";

    case "Kaedehara Kazuha":
      return "Kazuha";

    case "Raiden Shogun":
      return "Raiden";

    case "Sangonomiya Kokomi":
      return "Kokomi";

    default:
      return key;
  }
};

const onName = async (page: Page) => {
  const selector = "div.detail-header-cover-name";
  const baseInfoNameEl = await page.$(selector);

  const name = await baseInfoNameEl?.evaluate(
    (el) => el.querySelector("span")?.textContent?.trim(),
    baseInfoNameEl
  );

  if (!name) throw new Error(`selector ${selector} not exist!`);

  return toKebabCase(checkingFolderName(name));
};

export const scraping = {
  onAscensionMaterial,
  onConstellation,
  onBaseInfo,
  onTalents,
  onName,
};
