import { ElementHandle } from "puppeteer";

export interface CommonUrls {
  href: string | null;
  img_url: string | null;
}

const urls = async (
  element: ElementHandle<HTMLTableElement>,
): Promise<CommonUrls[]> => {
  const cards_el = await element.$$("div.card-container.mini-card");

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

  return urls;
};

// Character and Weapon Enhancement Materials
const common = {
  urls,
  scraping: () => {},
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
