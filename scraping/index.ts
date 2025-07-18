import { terminal } from "../terminal";
import { common } from "../common";
import { similarity, url } from "../url";
import { scraping as scrapingCharacter } from "./character/intex";
import { scraping as scrapingWeapon } from "./weapon";
import puppeteer from "puppeteer";
import moment from "moment";
import fs from "fs";
import { release } from "./release";
import { enemies } from "./enemies";
import path from "path";
import { Metadade } from "../types";
// import { collections } from "./collection";
import { file } from "../file";
import { toKebabCase } from "../utility";
import { collections } from "./collection";

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
  let diretorio = path.join(__dirname, "../metadata");
  let metadades = [] as Metadade[];

  const file_name = fs.readdirSync(diretorio, { encoding: "utf-8" });

  for (const name of file_name) {
    const data = file.get<Metadade>(diretorio, name);

    if (data) metadades = [...metadades, data];
  }

  collections.groupingEnemies(metadades);
  // interface List {
  //   name: string;
  //   link: string;
  //   position?: number[];
  // }

  // let living_being_group = [] as List[];
  // let living_being_type = [] as List[];
  // let living_being_family = [] as List[];

  // let living_being_group_position = [] as number[];
  // let living_being_type_position = [] as number[];
  // let living_being_family_position = [] as number[];
  // for (const [index, data] of metadades.entries()) {
  //   const infos = data.info.infos;
  //   console.log("*** " + data.name + " ***");

  //   let enter = false;
  //   for (const { key, values } of infos) {
  //     const name = toKebabCase(values[0].name);
  //     const link = `https://genshin-impact.fandom.com${values[0].link}`;

  //     if (key.name === "Living Being Group") {
  //       enter = true;

  //       // const group = living_being_group.find(
  //       //   (item) => name === item.name || similarity(name, item.name) > 0.9
  //       // );

  //       // if (!group) {
  //       //   living_being_group = [
  //       //     ...living_being_group,
  //       //     { name, link, position: [index] },
  //       //   ];
  //       // }

  //       // if (group) {
  //       //   if (!group.position) group.position = [index];

  //       //   if (group.position) group.position = [...group.position, index];
  //       // }
  //       collections.groupingEnemies()

  //       living_being_group_position = [...living_being_group_position, index];
  //     }

  //     if (key.name === "Living Being Type") {
  //       enter = true;

  //       const type = living_being_type.find((item) => name === item.name);
  //       if (!type) {
  //         living_being_type = [
  //           ...living_being_type,
  //           { name, link, position: [index] },
  //         ];
  //       }

  //       if (type) {
  //         if (!type.position) {
  //           type.position = [];
  //           type.position = [...type.position, index];
  //         }

  //         if (type.position) type.position = [...type.position, index];
  //       }

  //       living_being_type_position = [...living_being_type_position, index];
  //     }

  //     if (key.name === "Living Being Family") {
  //       enter = true;

  //       const family = living_being_family.find((item) => name === item.name);
  //       if (!family) {
  //         living_being_family = [
  //           ...living_being_family,
  //           { name, link, position: [index] },
  //         ];
  //       }

  //       if (family) {
  //         if (!family.position) {
  //           family.position = [];
  //           family.position = [...family.position, index];
  //         }

  //         if (family.position) family.position = [...family.position, index];
  //       }

  //       living_being_family_position = [...living_being_family_position, index];
  //     }
  //   }

  //   if (!enter) console.log("Obss!!!");
  // }

  // // console.log(metadades[212].info.infos[4]);
  // console.log(metadades[216]);
  // console.log("living_being_group", living_being_group);
  // console.log("living_being_type", living_being_type);
  // console.log("living_being_family", living_being_family);
};

export const scraping = {
  character,
  weapon,
  release,
  enemy,
  collection,
};
