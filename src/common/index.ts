import { Page } from "puppeteer";

const startPage = async (page: Page, url: string, selector: string) => {
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.setViewport({ width: 1920, height: 1080 });

    await page.waitForSelector(selector);
    console.log("Start Page ✅");
};

const changeLanguage = async (page: Page, target: { selected: string; name: string }) => {
    const languageButton = await page.$(".language-selector.c-selector");
    const languageSelectedEl = await languageButton?.$("span.c-selector-btn-name");

    const languageSelected = await languageSelectedEl?.evaluate((el) => el.textContent?.trim(), languageSelectedEl);

    if (languageSelected !== target.selected) {
        languageButton?.click();

        await page.waitForSelector(".popper-container");

        const languageButtonList = await page.$$("div.c-selector-list-item.genshin");

        for (const el of languageButtonList) {
            const language = await page.evaluate((e) => {
                const selector = "span.c-selector-list-item-name";
                return e.querySelector(selector)?.textContent?.trim();
            }, el);

            if (language === target.name) el.click();
        }

        await page.waitForNavigation({ waitUntil: "load" });
    }

    console.log("Change Language ✅");
};

export const common = { startPage, changeLanguage };
