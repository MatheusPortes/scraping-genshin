import puppeteer, { Page } from "puppeteer";
import { scraping } from "./scraping/intex";
import { terminal } from "./terminal";
import { common } from "./common";
import { url } from "./url";
import { file } from "./file";
import { Lang } from "./maps/map";

const onScraping = async (
  page: Page,
  path: string,
  file_name: string,
  lang: Lang
) => {
  const { baseInfo } = await scraping.onBaseInfo(page, lang);
  const { constellations } = await scraping.onConstellation(page);
  const { ascension_materials } = await scraping.onAscensionMaterial(page);
  const { passiveTalents, skillTalents } = await scraping.onTalents(page, lang);

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

    const folderName = await scraping.onName(page);
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

(async () => {
  await terminal.start();

  let urls = await url.getFromFile();

  if (!urls) {
    urls = await url.get();
  }

  if (urls?.length) await dateScraping(urls);
})();
