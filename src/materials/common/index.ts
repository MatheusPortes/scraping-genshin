import { Page } from "puppeteer";
import { common as tools } from "../../common";
import { noRecaptcha } from "..";
import { toKebabCase } from "../../utility";

export interface CommonUrls {
    href: string | null;
    img_url: string | null;
}

interface CommonMaterialsBase {
    name: string;
    descrition: string | undefined;
    enimies: string[];
    quality: string | number | null | undefined;
}

interface CommonMaterialsMeta extends CommonMaterialsBase {
    nextPage?: string | null | undefined;
}

interface CommonMaterials extends CommonMaterialsBase {
    id: string;
    related: string[];
}

const urls = async (page: Page) => {
    await tools.startPage(
        page,
        "https://genshin-impact.fandom.com/wiki/Tile_of_Decarabian%27s_Tower",
        "table.nowraplinks.hlist.mw-collapsible.navbox-inner.mw-made-collapsible",
    );

    const [_, common_el] = await page.$$("table.nowraplinks.mw-collapsible");

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

const materials = async (page: Page, urls: CommonUrls) => {
    await tools.startPage(page, `https://genshin-impact.fandom.com${urls.href}`, "div.dynamicCarousel__wrapper");

    const { nextPage, quality } = await page.$$eval("div.pi-item.pi-data.pi-item-spacing.pi-border-color", (el) => {
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
                quality = Number(alt?.replace(/\D/g, ""));
                if (quality) Number(quality);
            }
        }

        return { quality, nextPage };
    });

    if (!nextPage) return;

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

const group = async (page: Page, path?: string | null) => {
    if (!path) return;

    await tools.startPage(page, `https://genshin-impact.fandom.com${path}`, "div.dynamicCarousel__wrapper");

    const related = page.$eval("table.article-table.alternating-colors-table", (el) => {
        const trs_el = el.querySelectorAll("tr");

        let related: string[] = [];
        for (const [index, element] of trs_el.entries()) {
            if (index === 0) continue;

            related.push(element.textContent.trim());
        }
        return related;
    });

    console.log("Close page 🛑");
    return related;
};

const common = async () => {
    const urlsData = await noRecaptcha(urls, { headless: false, close: true });

    let commonMaterialsMeta: CommonMaterialsMeta[] = [];
    let commonMaterials: CommonMaterials[] = [];

    for (const [index, urls] of urlsData.entries()) {
        console.log(`Etapa 1 => ${index}`);
        const data = await noRecaptcha((page) => urls.href && materials(page, urls), { close: true, headless: false });

        data && commonMaterialsMeta.push(data);
    }

    for (const [index, { nextPage, ...rest }] of commonMaterialsMeta.entries()) {
        console.log(`Etapa 2 => ${index}`);
        const data = await noRecaptcha((page) => group(page, nextPage), { close: true, headless: false });

        const related = data?.filter((name) => name !== rest.name).map((name) => toKebabCase(name)) ?? [];

        commonMaterials.push({ ...rest, related, id: toKebabCase(rest.name) });
    }

    return commonMaterials;
};

// Character and Weapon Enhancement Materials
export default common;
