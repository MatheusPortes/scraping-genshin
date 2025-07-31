import puppeteer, { Page } from "puppeteer";
import { toKebabCase } from "../../utility";
import { common } from "../../common";
import { file } from "../../file";
import {
  includeWeaponTypeKey,
  Lang,
  mapSecondaryAttribute,
  mapTheWeaponType,
} from "../../maps/map";
import { BaseDamage, WeaponInfo } from "../../types";

const onHeader = async (
  page: Page,
  lang: Lang,
  weapon_info: Partial<WeaponInfo> = {}
) => {
  let selector =
    "div.et-text-tiptap-wrapper.detail-header-common-describe-wrapper.ENTRY_SHARE_DESC_SELECTOR";

  await page.waitForSelector(selector);
  const describeEl = await page.$(selector);

  const describe = await page.evaluate(
    (element) => element?.querySelector("p")?.textContent?.trim(),
    describeEl
  );

  weapon_info.description = describe;

  selector = "div.c-entry-tag-item.active.pc.genshin";
  await page.waitForSelector(selector);
  const tagsEl = await page.$$(selector);

  for (const element of tagsEl) {
    const text = await page.evaluate((el) => el.innerHTML.trim(), element);

    let textTabs = text.toLocaleLowerCase();

    if (includeWeaponTypeKey(textTabs, lang)) weapon_info.type = text;

    const numero = textTabs.replace(/\D/g, "");
    const rarity = parseInt(numero, 10);

    if (!isNaN(rarity)) weapon_info.rarity = rarity;

    if (mapSecondaryAttribute(text, lang)) weapon_info.subStat = text;
  }

  console.log("Scraping On Header ✅");
};

const onAttributeTable = async (
  page: Page,
  weapon_info: Partial<WeaponInfo> = {}
) => {
  await page.waitForSelector("div.base-info-content");

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
      if (key === "Nome" || key === "Name") weapon_info.name = value;

      if (key === "Fonte" || key === "Source") weapon_info.location = value;

      if (key === "Atributo Secundário" || key === "Secondary Attributes")
        weapon_info.subStat = value;

      if (value.length > 70) {
        weapon_info.passiveName = key;
        weapon_info.passiveDesc = value;
      }
    }
  }

  console.log("Scraping On Attribute Table ✅");
};

const onName = async (page: Page) => {
  const selector = "div.detail-header-common-name.genshin";
  const baseInfoNameEl = await page.$(selector);

  const name = await baseInfoNameEl?.evaluate(
    (el) => el.querySelector("span")?.textContent?.trim(),
    baseInfoNameEl
  );

  if (!name) throw new Error(`selector ${selector} not exist!`);

  //   return toKebabCase(checkingFolderName(name));
  return toKebabCase(name);
};

const onAscensionMaterial = async (
  page: Page,
  weapon_info: Partial<WeaponInfo> = {}
) => {
  const ascensionkeyEL = await page.$("table.d-ascension-tb");

  const baseDamage = await page.evaluate(async (el) => {
    const ascension = el?.querySelectorAll("tr.d-ascension-tr");
    let baseDamage = {
      attack: undefined,
      subStat: undefined,
    } as Partial<BaseDamage>;

    if (!ascension || ascension.length < 2 || ascension[1].children.length < 3)
      return baseDamage;

    const attackEl = ascension![1].children[1];
    const subStatEl = ascension![1].children[2];

    baseDamage.attack = Number(attackEl.textContent?.trim());
    baseDamage.subStat = Number(
      subStatEl.textContent!.trim().replace(/\D/g, "")
    );
    return baseDamage;
  }, ascensionkeyEL);

  weapon_info.baseAttack = baseDamage.attack;
  weapon_info.baseDamage = baseDamage;

  console.log("Scraping On Ascension Material ✅");
};

const dateScraping = async (
  page: Page,
  path: string,
  file_name: string,
  lang: Lang
) => {
  let weapon_info = {} as Partial<WeaponInfo>;

  await onHeader(page, lang, weapon_info);
  await onAttributeTable(page, weapon_info);
  await onAscensionMaterial(page, weapon_info);

  const existing_content = file.get<any>(path, file_name);

  weapon_info = {
    name: weapon_info.name,
    type: weapon_info.type,
    rarity: weapon_info.rarity,
    baseAttack: weapon_info.baseAttack,
    subStat: weapon_info.subStat,
    passiveName: weapon_info.passiveName,
    passiveDesc: weapon_info.passiveDesc,
    location: weapon_info.location,
    ascensionMaterial: existing_content?.ascensionMaterial,
    baseDamage: weapon_info.baseDamage,
    description: weapon_info.description,
  };

  return weapon_info;
};

// const onScraping = async (urls: string[]) => {
//   const browser = await puppeteer.launch({ headless: false });
//   const test_url = ["https://wiki.hoyolab.com/pc/genshin/entry/6548"];

//   for (const url of urls) {
//     const page = await browser.newPage();

//     const selector = "article.hoyowiki-slider.pc.d-ascension-info.noMap";
//     await common.startPage(page, url, selector);

//     const folderName = await onName(page);
//     console.log("❇️-#-#-#", folderName, "#-#-#-❇️");
//     const __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/weapons/${folderName}`;

//     if (!file.exists(__dir, "en.json")) {
//       let base_info = await dateScraping(page, __dir, "en.json", "en");

//       file.save(__dir, JSON.stringify(base_info), "en.json");
//       console.log("# ", folderName, "en.json finaly ✅");
//     }

//     await common.changeLanguage(page, { selected: "PT", name: "Português" });

//     const base_info = await dateScraping(page, __dir, "pt.json", "pt");

//     file.save(__dir, JSON.stringify(base_info), "pt.json");

//     await common.changeLanguage(page, { selected: "EN", name: "English" });
//     console.log("# ", folderName, "pt.json finaly ✅");

//     await page.close();
//   }
// };

const onScraping = async (urls: string[]) => {
  const browser = await puppeteer.launch({ headless: false });
  const test_url = ["https://wiki.hoyolab.com/pc/genshin/entry/6548"];

  for (const url of urls) {
    const page = await browser.newPage();

    const selector = "article.hoyowiki-slider.pc.d-ascension-info.noMap";
    await common.startPage(page, url, selector);

    const folderName = await onName(page);
    console.log("❇️ -#-#-#", folderName, "#-#-#-❇️");

    await page.close();

    const langs = ["en", "es", "fr", "jp", "pt", "ru", "de"] as Lang[];

    let weapon_type = undefined as string | undefined;
    for (const lang of langs) {
      const __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/weapons/${folderName}`;

      if (file.exists(__dir, `${lang}.json`)) {
        const existing_content = file.get<any>(__dir, `${lang}.json`);

        if (!weapon_type) {
          weapon_type = mapTheWeaponType(existing_content.type, lang);
        }

        if (weapon_type) {
          existing_content.weapon_type = weapon_type;
        }

        file.save(__dir, JSON.stringify(existing_content), `${lang}.json`);

        console.log("# ", folderName, `${lang}.json`, "finaly ✅");
      }
    }
  }
};

export const scraping = {
  onAscensionMaterial,
  onAttributeTable,
  onScraping,
  onHeader,
  onName,
};
