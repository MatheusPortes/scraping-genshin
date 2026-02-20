import { Browser, ElementHandle } from "puppeteer";
import { url } from "../url";

// Character and Weapon Enhancement Materials
const common = async (
  element: ElementHandle<HTMLTableElement>,
  browser: Browser,
  urls?: string[],
) => {
  if (!urls || !urls.length) {
    const cards_el = await element.$$("div.card-container.mini-card");

    urls = await url.click.scraping(browser, cards_el);
    console.log(urls);
  }
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
};
