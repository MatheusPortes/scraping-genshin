import { Page } from "puppeteer";
import { CommonMaterials, CommonMaterialsMeta, metadade, noRecaptcha, urls } from "..";
import { toKebabCase } from "../../utility";
import { common as tools } from "../../common";

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

// Character Ascension Materials
const ascension = async () => {
    const config = { close: true, headless: false };

    const urlsData = await noRecaptcha(async (page) => {
        async function getTable(page: Page) {
            const [_, __, ___, ascension_el] = await page.$$("table.nowraplinks.mw-collapsible");

            return ascension_el;
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

export default ascension;
