import { terminal } from "../terminal";
import { common } from "../common";
import { url } from "../url";
import { scraping as scrapingCharacter } from "./character/intex";
import { scraping as scrapingWeapon } from "./weapon";
import puppeteer from "puppeteer";
import moment from "moment";
import fs from "fs";
import { release } from "./release";
import { enemies } from "./enemies";
import path from "path";
import { ListBeing, Metadade } from "../types";
import { file } from "../file";
import { collections } from "./collection/collection";
import { beings } from "./beings/intex";

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

const enemy = async () => {
  await terminal.start();

  let urls = await url.getFromFile("enemy");

  if (!urls) {
    urls = await enemies.urls();

    const data = moment().format("MM-DD-YYYY");
    fs.writeFileSync(`logs/enemy/${data}.json`, JSON.stringify(urls));
  }

  const enemies_metadade = await enemies.metadade(urls);

  console.log(enemies_metadade);
};

const collection = async () => {
  let diretorio = path.join(__dirname, "../../logs/metadata");
  let metadades = [] as Metadade[];

  const file_name = fs.readdirSync(diretorio, { encoding: "utf-8" });

  for (const name of file_name) {
    const data = file.get<Metadade>(diretorio, name);

    if (data) metadades = [...metadades, data];
  }

  const { family, group, type } = await collections.groupingEnemies(metadades);

  diretorio = path.join(__dirname, "../../logs/being");

  let beings_group = file.get<ListBeing[]>(`${diretorio}`, "group.json");
  if (!beings_group) beings_group = await beings.group(group);

  let beings_family = file.get<ListBeing[]>(`${diretorio}`, "family.json");
  if (!beings_family) beings_family = await beings.family(family);

  let beings_type = file.get<ListBeing[]>(`${diretorio}`, "type.json");
  if (!beings_type) beings_type = await beings.type(type);

  return { beings_family, beings_group, beings_type };
};

export const scraping = {
  character,
  weapon,
  release,
  enemy,
  collection,
};
