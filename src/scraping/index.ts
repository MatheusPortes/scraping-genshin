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
import { materials } from "../materials";

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

    const commonMaterials = await materials.noRecaptcha(
        async (page) => {
            await common.startPage(
                page,
                "https://genshin-impact.fandom.com/wiki/Tile_of_Decarabian%27s_Tower",
                "table.nowraplinks.hlist.mw-collapsible.navbox-inner.mw-made-collapsible",
            );

            const [_, common_el] = await page.$$("table.nowraplinks.mw-collapsible");

            const enhancementMaterialsUrls = await materials.common.metadata(page, common_el);

            console.log("Close page 🛑");
            return {
                elements: [common_el],
                enhancementMaterialsUrls,
            };
        },
        { headless: false, close: true },
    );

    for (const [index, { href }] of [commonMaterials.enhancementMaterialsUrls[139]].entries()) {
        await materials.noRecaptcha(
            async (page) => {
                console.log("Index:" + index);
                await common.startPage(
                    page,
                    `https://genshin-impact.fandom.com${href}`,
                    "div.dynamicCarousel__wrapper",
                );

                const name = await page.$eval("h1.page-header__title", (el) => el.textContent.trim());

                const { descrition, enimies } = await page.$eval("div#toc", (el) => {
                    function getEnemies(el: Element | null) {
                        if (!el) return [] as string[];

                        const p_el = previousElement(el);

                        if (!p_el) return [] as string[];

                        const title_el = previousElement(p_el);

                        let enimies: string[] = [];
                        if (p_el.nodeName === "P" && title_el?.textContent.trim().includes("Drops")) {
                            const a_el = el?.querySelectorAll("span.card-caption.auto-width");
                            a_el?.forEach((el) => enimies.push(el.textContent.trim()));
                        }

                        return enimies;
                    }

                    function nextElement(el: Element | null) {
                        return el?.nextElementSibling ?? null;
                    }

                    function previousElement(el: Element | null) {
                        return el?.previousElementSibling ?? null;
                    }

                    let el_: Element | null = el;
                    do {
                        if (el_) el_ = nextElement(el_);
                    } while (!!el_ && el_.nodeName !== "SPAN");

                    const descrition_el = previousElement(el);

                    const enimies = getEnemies(el_);

                    return {
                        enimies,
                        descrition: descrition_el?.textContent.trim(),
                    };
                });

                const { nextPage, quality } = await page.$$eval(
                    "div.pi-item.pi-data.pi-item-spacing.pi-border-color",
                    (el) => {
                        let quality: number | string | null | undefined;
                        let nextPage: string | null | undefined;

                        for (const element of el) {
                            const key = element.firstElementChild?.textContent.trim();

                            if (key === "Item Group") {
                                const lastElementChild = element.lastElementChild?.querySelector("a");

                                nextPage = lastElementChild?.getAttribute("href");
                            }

                            if (key === "Quality") {
                                const lastElementChild = element.lastElementChild?.querySelector("img");
                                const alt = lastElementChild?.getAttribute("alt");
                                quality = alt?.replace(/\D/g, "");
                                if (quality) Number(quality);
                            }
                        }

                        return { quality, nextPage };
                    },
                );

                await page.$eval("div#toc", (el) => {
                    function getEnemies(el: Element | null) {
                        if (!el) return [] as string[];

                        const p_el = previousElement(el);

                        if (!p_el) return [] as string[];

                        const title_el = previousElement(p_el);

                        let enimies: string[] = [];
                        if (p_el.nodeName === "P" && title_el?.textContent.trim().includes("Drops")) {
                            const a_el = el?.querySelectorAll("span.card-caption.auto-width");
                            a_el?.forEach((el) => enimies.push(el.textContent.trim()));
                        }

                        return enimies;
                    }

                    function nextElement(el: Element | null) {
                        return el?.nextElementSibling ?? null;
                    }

                    function previousElement(el: Element | null) {
                        return el?.previousElementSibling ?? null;
                    }

                    let el_: Element | null = el;
                    do {
                        if (el_) el_ = previousElement(el_);
                    } while (!!el_ && el_.nodeName !== "SPAN");

                    const descrition_el = previousElement(el);

                    const enimies = getEnemies(el_);

                    return {
                        enimies,
                        descrition: descrition_el?.textContent.trim(),
                    };
                });

                console.log(name, descrition, enimies, quality, nextPage);

                console.log("Close page 🛑");
                return;
            },
            { close: false, headless: false },
        );
    }

    // urls = await enemies.urls();

    const data = moment().format("MM-DD-YYYY");
    // fs.writeFileSync(
    //   `logs/materials/common/urls/${data}.json`,
    //   JSON.stringify(urls),
    // );

    // materials.character.levelUp();
    // materials.character.talent();
    // materials.character.ascension();
    // materials.weapon.ascension();
    // materials.weapon.refinement();

    console.log("Drops Scraping ✅");
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
