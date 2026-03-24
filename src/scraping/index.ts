import puppeteer, { ElementHandle, Page } from "puppeteer";
import moment from "moment";
import path from "path";
import fs from "fs";

import { scraping as scrapingCharacter } from "./character/intex";
import { scraping as scrapingWeapon } from "./weapon";

import { collections } from "./collection/collection";
import { ListBeing, Metadade } from "../types";
import { beings } from "./beings/intex";
import { terminal } from "../terminal";
import { metadata } from "./metadata";
import { release } from "./release";
import { enemies } from "./enemies";
import { common } from "../common";
import { file } from "../file";
import { url } from "../url";
import { CommonMaterials, materials } from "../materials";
import { toKebabCase } from "../utility";

const character = async () => {
    await terminal.start();

    let urls = await url.getFromFile("character");

    if (!urls) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await common.startPage(
            page,
            "https://wiki.hoyolab.com/pc/genshin/aggregate/2",
            ".genshin-show-character-wrapper",
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
            "div.genshin-show-weapon-wrapper",
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

const metadade = async () => {
    await terminal.start();

    metadata.processing();
};

const drop = async () => {
    await terminal.start();
    console.log("Drops Scraping ✅");
    console.log("Scraping common materials ✅");

    let filePath = path.join(__dirname, `../../logs/materials`);
    let commonMaterials = file.get<CommonMaterials[]>(filePath, "common.json");

    if (!commonMaterials) {
        commonMaterials = await materials.common();

        file.save(filePath, JSON.stringify(commonMaterials), "common.json");
        console.log("Scraping common materials end 📌");
    }

    console.log("Scraping level Up materials ✅");
    filePath = path.join(__dirname, `../../logs/materials`);
    let levelUpMaterials = file.get<CommonMaterials[]>(filePath, "level-up.json");

    if (!levelUpMaterials) {
        levelUpMaterials = await materials.character.levelUp();

        file.save(filePath, JSON.stringify(levelUpMaterials), "level-up.json");
        console.log("Scraping level Up materials end 📌");
    }

    console.log("Scraping talent materials ✅");
    filePath = path.join(__dirname, `../../logs/materials`);
    let talentMaterials = file.get<CommonMaterials[]>(filePath, "talent.json");

    if (!talentMaterials) {
        talentMaterials = await materials.character.ascension();

        file.save(filePath, JSON.stringify(talentMaterials), "talent.json");
        console.log("Scraping talent materials end 📌");
    }

    const mora: CommonMaterials = {
        id: toKebabCase("Mora"),
        name: "Mora",
        image: "https://static.wikia.nocookie.net/gensin-impact/images/8/84/Item_Mora.png/revision/latest/scale-to-width-down/74?cb=20210106073715",
        descrition: undefined,
        enimies: [],
        quality: undefined,
    };
    const exp: CommonMaterials = {
        id: toKebabCase("Character EXP"),
        name: "Character EXP",
        image: "https://static.wikia.nocookie.net/gensin-impact/images/3/34/Item_Character_EXP.png/revision/latest/scale-to-width-down/74?cb=20201116045223",
        descrition: undefined,
        enimies: [],
        quality: undefined,
    };

    const allDrops = [...commonMaterials, ...levelUpMaterials, ...talentMaterials, exp, mora];

    let directory = ``;
    if (process.platform === "win32")
        directory = "/Users/porte/OneDrive/Documentos/Development/Genshin-Builder/api/assets/data/materials/drop";
    else if (process.platform === "linux")
        directory = "/home/matheus-portes/Documentos/0 - Genshin-Builder/api/assets/data/materials/drop";

    allDrops.forEach(({ image, ...drop }) => {
        file.save(path.join(directory, `${drop.id}`), JSON.stringify(drop), "en.json");
    });

    allDrops.forEach(({ image, ...drop }) => {
        if (image) {
            directory = directory.replace("data", "images");
            materials.downloadAndSave(image, path.join(directory, `${drop.id}`), `icon`);
        }
    });

    allDrops.forEach(({ image, ...drop }) => {
        if (image) {
            directory = path.join(__dirname, `../../logs/images/drops`);
            materials.downloadAndSave(image, directory, drop.id);
        }
    });

    // materials.character.talent();
    // materials.character.ascension();
    // materials.weapon.ascension();
    // materials.weapon.refinement();

    console.log("Drops Scraping end 📌");
};

export const scraping = {
    character,
    weapon,
    release,
    enemy,
    collection,
    metadade,
    drop,
};
