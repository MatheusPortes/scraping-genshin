import puppeteer from "puppeteer";
import { scraping } from "./scraping/intex";
import { terminal } from "./terminal";
import { common } from "./common";
import { url } from "./url";
import { file } from "./file";

const dateScraping = async (urls: string[]) => {
  const browser = await puppeteer.launch({ headless: false });
  let folderName: string;

  for (const url of urls) {
    const page = await browser.newPage();

    const selector = "div.entry-common-module.genshin.character.base-info";
    await common.startPage(page, url, selector);

    folderName = await scraping.onName(page);

    await common.changeLanguage(page, { selected: "PT", name: "Português" });

    const { baseInfo } = await scraping.onBaseInfo(page);
    const { constellations } = await scraping.onConstellation(page);
    const { ascension_materials } = await scraping.onAscensionMaterial(page);
    const { passiveTalents, skillTalents } = await scraping.onTalents(page);

    const __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/characters/${folderName}`;
    // const __dir = path.join(__dirname, `characters/${folder_name}`);
    const { vision_key, weapon_type, ...const_base_info } = baseInfo;
    const content = {
      ...const_base_info,
      skillTalents,
      passiveTalents,
      constellations,
      vision_key,
      weapon_type,
      ascension_materials,
    };

    file.save(__dir, JSON.stringify(content), "pt.json");

    await common.changeLanguage(page, { selected: "EN", name: "English" });
    console.log("# ", folderName, " finaly ✅");
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
