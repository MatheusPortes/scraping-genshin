import { Page } from "puppeteer";
import { CommonMaterials, CommonMaterialsMeta, metadade, noRecaptcha, urls } from "..";
import { toKebabCase } from "../../utility";
import { common as tools } from "../../common";

const group = async (page: Page, path?: string | null): Promise<string[]> => {
    if (!path) return [];

    await tools.startPage(page, `https://genshin-impact.fandom.com${path}`, "div.dynamicCarousel__wrapper");

    const related = page.$$eval("h2", (el) => {
        function nextElement(el: Element | null) {
            return el?.nextElementSibling ?? null;
        }

        let nextElement_: Element | null = null;
        for (const element of el) {
            nextElement_ = nextElement(element);

            if (nextElement_?.nodeName === "UL") break;
        }

        const li_el = nextElement_?.querySelectorAll("li");

        if (!li_el) return [];

        let related: string[] = [];
        for (const element of li_el) {
            related.push(element.textContent.trim());
        }
        return related;
    });

    console.log("Close page 🛑");
    return related;
};

const levelUp = async () => {
    const config = { close: true, headless: false };

    const urlsData = await noRecaptcha(async (page) => {
        async function getTable(page: Page) {
            const [_, common_el, level_up_el] = await page.$$("table.nowraplinks.mw-collapsible");

            return level_up_el;
        }

        return urls(page, getTable);
    }, config);

    let commonMaterialsMeta: CommonMaterialsMeta[] = [];
    let commonMaterials: CommonMaterials[] = [];

    for (const [index, urls] of urlsData.entries()) {
        console.log(`Etapa 1 => ${index}`);
        const data = await noRecaptcha((page) => urls.href && metadade(page, urls, false), config);

        data && commonMaterialsMeta.push(data);
    }

    for (const [index, { nextPage, ...rest }] of commonMaterialsMeta.entries()) {
        console.log(`Etapa 2 => ${index} # ${nextPage}`);

        if (!nextPage) {
            commonMaterials.push({ ...rest, id: toKebabCase(rest.name) });
            continue;
        }

        const data = await noRecaptcha((page) => group(page, nextPage), config);

        const related = data?.filter((name) => name !== rest.name).map((name) => toKebabCase(name)) ?? [];

        commonMaterials.push({ ...rest, related, id: toKebabCase(rest.name) });
    }

    return commonMaterials;
};

// Character Level-Up Materials
export default levelUp;
