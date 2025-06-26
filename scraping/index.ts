import { terminal } from "../terminal";
import { common } from "../common";
import { url } from "../url";
import { scraping as scrapingCharacter } from "./character/intex";
import { scraping as scrapingWeapon } from "./weapon";
import puppeteer from "puppeteer";
import moment from "moment";
import fs from "fs";
import { release } from "./release";

const character = async () => {
  await terminal.start();

  let urls = await url.getFromFile("character");

  if (!urls) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await common.startPage(
      page,
      "https://wiki.hoyolab.com/pc/genshin/aggregate/2",
      ".genshin-show-character-wrapper"
    );

    await common.changeLanguage(page, { selected: "PT", name: "Português" });

    await url.autoScroll(page, ".genshin-show-character-wrapper", 10000); // Executa o scroll

    urls = await url.scraping(page, browser, "article.character-card");

    const data = moment().format("MM-DD-YYYY");
    fs.writeFileSync(`logs/character/${data}.json`, JSON.stringify(urls));
  }

  if (urls?.length) await scrapingCharacter.dateScraping(urls);
};

const weapon = async () => {
  await terminal.start();

  let urls = await url.getFromFile("weapon");

  if (!urls) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await common.startPage(
      page,
      "https://wiki.hoyolab.com/pc/genshin/aggregate/4",
      "div.genshin-show-weapon-wrapper"
    );

    await common.changeLanguage(page, { selected: "PT", name: "Português" });

    await url.autoScroll(page, "div.genshin-show-weapon", 12000); // Executa o scroll

    urls = await url.scraping(page, browser, "div.weapon-card.pc");

    const data = moment().format("MM-DD-YYYY");
    fs.writeFileSync(`logs/weapon/${data}.json`, JSON.stringify(urls));
  }

  if (urls?.length) await scrapingWeapon.onScraping(urls);
};

export const scraping = {
  character,
  weapon,
  release,
};
