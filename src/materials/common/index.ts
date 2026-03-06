import { ElementHandle, Page } from "puppeteer";
import { common as tools } from "../../common";

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

const metadata = async (
  page: Page,
  element: ElementHandle<HTMLTableElement>,
) => {
  // const links =
  return await urls(element);

  // for (const links_ of links) {
  //   console.log(links_);
  //   await tools.startPage(
  //     page,
  //     `https://genshin-impact.fandom.com/wiki${links_.href}`,
  //     "table.nowraplinks.hlist.mw-collapsible.navbox-inner.mw-made-collapsible",
  //   );
  // }
};

// Character and Weapon Enhancement Materials
export const common = { metadata, scraping: () => {} };
