import puppeteer, { ElementHandle, Page } from "puppeteer";
import {
  AscensionMaterials,
  BaseConstellations,
  BaseInfo,
  Level,
  PassiveTalent,
  Power,
  SkillTalent,
  Upgrade,
  ValidPatchVersion,
} from "../../types";
import {
  checkTwoArrays,
  formatBirthday,
  getGenshinPatchDate,
  toKebabCase,
} from "../../utility";
import {
  includeRegion,
  includeVision,
  includeWeaponTypeKey,
  Lang,
  mapTheWeaponType,
} from "../../maps/map";
import { file } from "../../file";
import { common } from "../../common";

const getUpgrade = async (
  talentContent: ElementHandle<HTMLDivElement>[],
  lang: Lang = "en"
) => {
  let upgrades = [] as Upgrade[];
  for (const [key, element] of talentContent.entries()) {
    if (key === 0) continue;

    const thEl = await element.$("th");
    const name = await thEl?.evaluate((el) => el.textContent?.trim(), thEl);
    let test: string;

    lang === "en"
      ? (test = "Talent Level-Up Materials")
      : (test = "Material de Elevação de Talento");
    if (name === test) continue;

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
  upgradeContent: ElementHandle<HTMLDivElement>[],
  lang: Lang = "en"
) => {
  let skillTalent = {} as Partial<SkillTalent>;

  const title = await page.evaluate(
    (el) => el?.querySelector("div.d-talent-title div")?.textContent?.trim(),
    talentContent
  );
  skillTalent.name = title;

  const etText = await page.evaluate((el) => {
    function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
      let text = "";

      for (const [index, element] of childNodes.entries()) {
        if (
          element.nodeName === "#text" ||
          element.nodeName === "SPAN" ||
          element.nodeName === "EM"
        ) {
          text = `${text}${element.textContent}`;
        } else if (childNodes[index].nodeName === "BR") {
          text = `${text}\n`;
        }
      }

      return text;
    }

    function extractTextMultipleTags(childNodes: NodeListOf<ChildNode>) {
      let text = "";

      for (const [index, element] of childNodes.entries()) {
        let isSingleTag = false;

        element.childNodes.forEach((child) => {
          if (child.nodeName === "BR") isSingleTag = true;
        });

        if (isSingleTag) {
          text = `${text}${extractTextSingleTag(element.childNodes)}`;
          continue;
        }

        text = `${text}${element.textContent}`;

        if (index + 1 !== childNodes.length) text = `${text}\n`;
      }
      return text;
    }
    //
    const divEl = el?.querySelector("div.et-text-tiptap-editor div");
    const childNodes = divEl?.childNodes;
    let text = "";

    if (childNodes) {
      if (childNodes.length > 1) {
        text = extractTextMultipleTags(childNodes);
      } else {
        const child = childNodes[0].childNodes;

        text = extractTextSingleTag(child);
      }
    }

    return text;
  }, talentContent);

  const NORMAL_ATTACK = lang === "en" ? "Normal Attack" : "Ataque Normal";
  const ELEMENTAL_SKILL =
    lang === "en" ? "Elemental Skill" : "Habilidade Elemental";
  const ELEMENTAL_BURST =
    lang === "en" ? "Elemental Burst" : "Explosão Elemental";
  const AUTOMATICALLY_ACTIVATED =
    lang === "en" ? "Automatically activated" : "Ativado automaticamente";

  skillTalent.unlock =
    key === 0
      ? NORMAL_ATTACK
      : key === 1
      ? ELEMENTAL_SKILL
      : key === 2
      ? ELEMENTAL_BURST
      : key === 3
      ? AUTOMATICALLY_ACTIVATED
      : AUTOMATICALLY_ACTIVATED;

  skillTalent.description = etText;

  const upgrades = await getUpgrade(upgradeContent, lang);

  if (upgrades.length) skillTalent.upgrades = upgrades;

  skillTalent.type =
    key === 0
      ? "NORMAL_ATTACK"
      : key === 1
      ? "ELEMENTAL_SKILL"
      : key === 2
      ? "ELEMENTAL_BURST"
      : key === 3
      ? undefined
      : undefined;

  console.log("Scraping On Skills ✅");
  return skillTalent as SkillTalent;
};

const getPassives = async (
  key: number,
  talentContent: ElementHandle<HTMLDivElement>,
  page: Page,
  keyLength: number,
  lang: Lang = "en"
) => {
  let passiveTalent = {} as Partial<PassiveTalent>;

  const title = await page.evaluate(
    (el) => el?.querySelector("div.d-talent-title div")?.textContent?.trim(),
    talentContent
  );
  passiveTalent.name = title;

  const check_unlocked_1 = keyLength !== 7 ? 3 : 4;
  const check_unlocked_2 = keyLength !== 7 ? 4 : 5;
  const check_unlocked_3 = keyLength !== 7 ? 5 : 6;

  let unlock = "";
  let level: number | undefined;
  if (key === check_unlocked_1) {
    level = 1;
    unlock =
      lang === "en" ? "Unlocked at Ascension 1" : "Desbloqueado na Ascenção 1";
  }

  if (key === check_unlocked_2) {
    level = 4;
    unlock =
      lang === "en" ? "Unlocked at Ascension 4" : "Desbloqueado na Ascenção 4";
  }

  if (key === check_unlocked_3) unlock = "Desbloqueado automaticamente";

  passiveTalent.unlock = unlock;

  const etText = await page.evaluate((el) => {
    function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
      let text = "";

      for (const [index, element] of childNodes.entries()) {
        if (
          element.nodeName === "#text" ||
          element.nodeName === "SPAN" ||
          element.nodeName === "EM"
        ) {
          text = `${text}${element.textContent}`;
        } else if (childNodes[index].nodeName === "BR") {
          text = `${text}\n`;
        }
      }

      return text;
    }

    function extractTextMultipleTags(childNodes: NodeListOf<ChildNode>) {
      let text = "";

      for (const [index, element] of childNodes.entries()) {
        let isSingleTag = false;

        element.childNodes.forEach((child) => {
          if (child.nodeName === "BR") isSingleTag = true;
        });

        if (isSingleTag) {
          text = `${text}${extractTextSingleTag(element.childNodes)}`;
          continue;
        }

        text = `${text}${element.textContent}`;

        if (index + 1 !== childNodes.length) text = `${text}\n`;
      }
      return text;
    }
    //
    const divEl = el?.querySelector("div.et-text-tiptap-editor div");
    const childNodes = divEl?.childNodes;
    let text = "";

    if (childNodes) {
      if (childNodes.length > 1) {
        text = extractTextMultipleTags(childNodes);
      } else {
        const child = childNodes[0].childNodes;
        text = extractTextSingleTag(child);
      }
    }

    return text;
  }, talentContent);
  passiveTalent.description = etText;

  passiveTalent.level = level;

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

      if (
        key === "Version Released" ||
        key === "Disponível na Versão" ||
        key === "Versão de Lançamento"
      )
        base_info.release = getGenshinPatchDate(value as ValidPatchVersion);

      if (
        key === "Vision" ||
        key === "Visão" ||
        key === "Gnosis" ||
        key === "Elemento" ||
        key === "Element"
      ) {
        base_info.vision = value;
        base_info.vision_key = value?.toUpperCase();
      }
    }
  }

  console.log("Scraping On Attribute Table ✅");
};

const header = async (
  page: Page,
  base_info: Partial<BaseInfo>,
  lang: "pt" | "en"
) => {
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

    if (includeWeaponTypeKey(textTabs, lang)) {
      base_info.weapon = text;
      base_info.weapon_type = mapTheWeaponType(textTabs, lang);
    }

    const numero = textTabs.replace(/\D/g, "");
    const rarity = parseInt(numero, 10);

    if (!isNaN(rarity)) base_info.rarity = rarity;

    if (includeRegion(text, lang))
      base_info.nation = includeRegion(text, lang) ? text : "Snezhnaya";

    if (includeVision(text)) {
      base_info.vision = text;
      base_info.vision_key = text.toUpperCase();
    }
  }

  console.log("Scraping On Header ✅");
};

const onBaseInfo = async (page: Page, lang: Lang) => {
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
  await header(page, baseInfo, lang);

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

    const constellation_describe = await page.evaluate((el) => {
      function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
        let text = "";

        for (const [index, element] of childNodes.entries()) {
          if (
            element.nodeName === "#text" ||
            element.nodeName === "SPAN" ||
            element.nodeName === "EM"
          ) {
            text = `${text}${element.textContent}`;
          } else if (childNodes[index].nodeName === "BR") {
            text = `${text}\n`;
          }
        }

        return text;
      }

      function extractTextMultipleTags(childNodes: NodeListOf<ChildNode>) {
        let text = "";

        for (const [index, element] of childNodes.entries()) {
          let isSingleTag = false;

          element.childNodes.forEach((child) => {
            if (child.nodeName === "BR") isSingleTag = true;
          });

          if (isSingleTag) {
            text = `${text}${extractTextSingleTag(element.childNodes)}`;
            continue;
          }

          text = `${text}${element.textContent}`;

          if (index + 1 !== childNodes.length) text = `${text}\n`;
        }
        return text;
      }
      //
      const childNodes = el.querySelector(
        "div.et-text-tiptap-wrapper.describe-text-item-desc div div div"
      )?.childNodes;

      let text = "";
      if (childNodes) {
        if (childNodes.length > 1) {
          text = extractTextMultipleTags(childNodes);
        } else {
          const child = childNodes[0].childNodes;
          text = extractTextSingleTag(child);
        }
      }
      return text;
    }, element);

    constellation.unlock = `Constelação Lv. ${index + 1}`;
    constellation.description = constellation_describe;
    constellation.level = index + 1;

    baseConstellations = [...baseConstellations, constellation];
  }

  console.log("Scraping On Constellations ✅");
  return { constellations: baseConstellations };
};

const onAscensionMaterial = async (page: Page) => {
  await page.waitForSelector("div.d-talent-keys-icon.default-img-wrapper");

  // await new Promise((res) => setTimeout(res, 2000));

  await page.waitForFunction(async () => {
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
      if (checkTwoArrays(array, [1, 3, 3]) || checkTwoArrays(array, [1, 3, 3]))
        return 2;
      if (
        checkTwoArrays(array, [3, 2, 10, 15]) ||
        checkTwoArrays(array, [3, 10, 15])
      )
        return 4;
      if (
        checkTwoArrays(array, [6, 4, 20, 12]) ||
        checkTwoArrays(array, [6, 20, 12])
      )
        return 5;
      if (
        checkTwoArrays(array, [3, 8, 30, 18]) ||
        checkTwoArrays(array, [3, 30, 18])
      )
        return 6;
      if (
        checkTwoArrays(array, [6, 12, 45, 12]) ||
        checkTwoArrays(array, [6, 45, 13])
      )
        return 7;
      if (
        checkTwoArrays(array, [6, 20, 60, 24]) ||
        checkTwoArrays(array, [6, 60, 24])
      )
        return 8;

      return 2;
    }

    let array = [] as number[];
    let position = 0;

    if (materialItemEl[0].name === "Mora") position++;

    if (materialItemEl[position]) {
      array = [...array, materialItemEl[position].value];
      position++;
    }
    if (materialItemEl[position]) {
      array = [...array, materialItemEl[position].value];
      position++;
    }
    if (materialItemEl[position]) {
      array = [...array, materialItemEl[position].value];
      position++;
    }
    if (materialItemEl[position]) {
      array = [...array, materialItemEl[position].value];
      position++;
    }

    ascensionMaterials[`level_${checkAscenderLevel(array)}0`] = materialItemEl;
  }

  // await getAscensionData(page);

  console.log("Scraping On Ascension Material ✅");
  return { ascension_materials: ascensionMaterials };
};

const onTalents = async (page: Page, lang: Lang) => {
  await page.waitForSelector("div.d-talent-keys-wrapper");

  const talentKeys = await page.$$(
    "div.default-img-wrapper.d-talent-keys-icon"
  );

  let skillTalents = [] as SkillTalent[];
  let passiveTalents = [] as PassiveTalent[];
  for (const [key, element] of talentKeys.entries()) {
    let divider = 3;
    if (talentKeys.length > 6) divider = 4;
    await page.waitForSelector("div.d-talent-keys-wrapper.active");

    element.click();
    await new Promise((res) => setTimeout(res, 100));

    const selector = "div.d-talent-content-top";
    const talentContent = await page.$(selector);
    if (!talentContent) throw new Error(`selector ${selector} not exist`);

    const percentTable = await page.$$("tr.m-d-talent-tr.pc");

    if (key < divider) {
      skillTalents = [
        ...skillTalents,
        await getSkills(key, page, talentContent, percentTable, lang),
      ];

      continue;
    }

    passiveTalents = [
      ...passiveTalents,
      await getPassives(key, talentContent, page, talentKeys.length, lang),
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

const onScraping = async (
  page: Page,
  path: string,
  file_name: string,
  lang: Lang
) => {
  const { baseInfo } = await onBaseInfo(page, lang);
  const { constellations } = await onConstellation(page);
  const { ascension_materials } = await onAscensionMaterial(page);
  const { passiveTalents, skillTalents } = await onTalents(page, lang);

  const { vision_key, weapon_type, ...const_base_info } = baseInfo;

  const existing_content = file.get<any>(path, file_name);

  return {
    ...const_base_info,
    gender: existing_content?.gender ?? undefined,
    skillTalents,
    passiveTalents,
    constellations,
    vision_key,
    weapon_type,
    outfits: existing_content?.outfits ?? undefined,
    ascension_materials,
  };
};

const dateScraping = async (urls: string[]) => {
  const browser = await puppeteer.launch({ headless: false });
  const ts = ["https://wiki.hoyolab.com/pc/genshin/entry/7627"];
  for (const url of urls) {
    const page = await browser.newPage();

    const selector = "div.entry-common-module.genshin.character.base-info";
    await common.startPage(page, url, selector);

    const folderName = await onName(page);
    const __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/characters/${folderName}`;
    // const __dir = path.join(__dirname, `characters/${folder_name}`);

    if (!file.exists(__dir, "en.json")) {
      const base_info = await onScraping(page, __dir, "en.json", "en");

      file.save(__dir, JSON.stringify(base_info), "en.json");
      console.log("# ", folderName, "en.json finaly ✅");
    }

    await common.changeLanguage(page, { selected: "PT", name: "Português" });

    const base_info = await onScraping(page, __dir, "pt.json", "pt");

    file.save(__dir, JSON.stringify(base_info), "pt.json");

    await common.changeLanguage(page, { selected: "EN", name: "English" });
    console.log("# ", folderName, "pt.json finaly ✅");

    await page.close();
  }
};

export const scraping = {
  onAscensionMaterial,
  onConstellation,
  onBaseInfo,
  onTalents,
  onName,
  dateScraping,
};
