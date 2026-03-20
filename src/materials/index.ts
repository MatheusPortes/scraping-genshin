import puppeteer, { ElementHandle, LaunchOptions, Page } from "puppeteer";
import common from "./common";
import levelUp from "./level-up";
import { common as tools } from "../common";
import { toKebabCase } from "../utility";
import ascension from "./ascension";
import path from "path";
import fs from "fs";
import { httpsDownload } from "../url";

interface Options extends LaunchOptions {
    close?: boolean;
}

export const noRecaptcha = async <T>(
    callback: (page: Page) => T,
    options: Options = { headless: false, close: false },
) => {
    const browser = await puppeteer.launch({
        ...options,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const response = await callback(page);

    options.close && browser.close();
    return response;
};

export interface CommonUrls {
    href: string | null;
    img_url: string | null;
}

interface CommonMaterialsBase {
    name: string;
    descrition: string | undefined;
    enimies: string[];
    quality: string | number | null | undefined;
    image: string | null;
}

export interface CommonMaterialsMeta extends CommonMaterialsBase {
    nextPage?: string | null | undefined;
}

export interface CommonMaterials extends CommonMaterialsBase {
    id: string;
    related?: string[];
}

export const urls = async (page: Page, callback: (page: Page) => Promise<ElementHandle<HTMLTableElement>>) => {
    await tools.startPage(
        page,
        "https://genshin-impact.fandom.com/wiki/Tile_of_Decarabian%27s_Tower",
        "aside.portable-infobox.pi-background",
    );

    const common_el = await callback(page);

    const cards_el = await common_el.$$("div.card-container.mini-card");

    let urls: { href: string | null; img_url: string | null }[] = [];

    for (const el of cards_el) {
        const a_el = await el.$("a");
        if (!a_el) throw new Error("element not found!");
        const href = await a_el.evaluate((el) => el.getAttribute("href"));

        const img_el = await el.$("img");
        if (!img_el) throw new Error("element not found!");
        const img_url = await img_el.evaluate((el) => el.getAttribute("data-src"));

        urls.push({ href, img_url });
    }

    console.log("Close page 🛑");
    return urls;
};

export const metadade = async (page: Page, urls: CommonUrls, useLink: boolean = true) => {
    await tools.startPage(page, `https://genshin-impact.fandom.com${urls.href}`, "div.dynamicCarousel__wrapper");

    const { nextPage, quality } = await page.$$eval("div.pi-item.pi-data.pi-item-spacing.pi-border-color", (el) => {
        let quality: number | string | null | undefined;
        let nextPage: string | null | undefined;

        for (const element of el) {
            const key = element.firstElementChild?.textContent.trim();

            if (key === "Item Group") {
                const value_name = element.lastElementChild?.textContent.trim();

                if (value_name !== "Normal Boss Drops") {
                    const lastElementChild = element.lastElementChild?.querySelector("a");

                    nextPage = lastElementChild?.getAttribute("href");
                }
            }

            if (key === "Quality") {
                const lastElementChild = element.lastElementChild?.querySelector("img");
                const alt = lastElementChild?.getAttribute("alt");
                quality = Number(alt?.replace(/\D/g, ""));
                if (quality) Number(quality);
            }
        }

        return { quality, nextPage };
    });

    if (useLink && !nextPage) return;

    const name = await page.$eval("h1.page-header__title", (el) => el.textContent.trim());

    const { descrition, enimies } = await page.$eval("div#toc", (el) => {
        function getEnemies(elements: Element[]) {
            let enimies: string[] = [];

            for (const el of elements) {
                if (!el) return [] as string[];

                const p_el = previousElement(el);

                if (!p_el) return [] as string[];

                if (p_el.nodeName === "P") {
                    const a_el = el?.querySelectorAll("span.card-caption.auto-width");
                    a_el?.forEach((el) => enimies.push(el.textContent.trim()));
                }
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
        let count = 0;
        let els_: Element[] = [];
        do {
            if (el_.nodeName === "SPAN" && el_.className === "card-list-container") els_.push(el_);
            if (el_.nodeName === "H2") count++;
            el_ = nextElement(el_);
        } while (!!el_ && count < 2);

        const descrition_el = previousElement(el);

        const enimies = getEnemies(els_);

        return {
            enimies,
            descrition: descrition_el?.textContent.trim(),
        };
    });

    console.log("Close page 🛑");
    return {
        name,
        descrition,
        enimies: enimies.map((enemi) => toKebabCase(enemi)),
        quality,
        nextPage,
        image: urls.img_url,
    };
};

const downloadAndSave = (url: string, directory: string) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const file = fs.createWriteStream(directory);

    httpsDownload(file, url, directory);
};

// Character Talent Materials
const talent = () => {};

// Weapon Materials
const ascensionWeapon = () => {};
const refinement = () => {};

const character = { levelUp, ascension, talent };
const weapon = { refinement, ascension: ascensionWeapon };

export const materials = {
    common,
    weapon,
    character,
    noRecaptcha,
    downloadAndSave,
};
