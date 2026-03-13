import puppeteer, { LaunchOptions, Page } from "puppeteer";
import common from "./common";

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

// Character Level-Up Materials
const levelUp = () => {};
// Character Ascension Materials
const ascension = () => {};
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
};
