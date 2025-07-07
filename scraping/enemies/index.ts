import puppeteer, { Page } from "puppeteer";
import { common } from "../../common";
import fs from "fs";
import { toKebabCase } from "../../utility";

const urls = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await common.startPage(
    page,
    "https://genshin-impact.fandom.com/wiki/Enemy/List",
    "div.mw-content-ltr.mw-parser-output"
  );

  await page.waitForSelector("div button#onetrust-accept-btn-handler");

  const button_modal = await page.$("div button#onetrust-accept-btn-handler");

  await button_modal?.click();

  const card_list = await page.$$("span.card-list-container");

  let navigationURLs = [] as string[];
  for (const element of card_list) {
    const cards_el = await element.$$("div.card-container");

    for (const element of cards_el) {
      const el_for_click = await element.$("a");

      if (!el_for_click)
        throw new Error("element not exist!element:" + el_for_click);

      await el_for_click.evaluate((el) => {
        const mouseEvent = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
          button: 1, // Middle button code
        });
        el.dispatchEvent(mouseEvent);
      });

      const [tab] = await Promise.all<Page | null>([
        new Promise((resolve) =>
          browser.once("targetcreated", async (target) => {
            await new Promise((res) => setTimeout(res, 3000));
            resolve(target.page());
          })
        ),
      ]);

      if (!tab) throw new Error("tab not exist!\ntab: " + tab);

      // Espera a nova aba carregar
      await tab.waitForSelector("div div.widget-header");

      const newUrl = tab.url();
      navigationURLs = [...navigationURLs, newUrl];

      await tab.close(); // Fecha a aba se quiser
    }
  }
  browser.close();

  console.log("Scraping URLs ✅");
  return navigationURLs;
};

const onName = async (page: Page) => {
  const selector = "span.mw-page-title-main";
  const name_el = await page.$(selector);

  if (!name_el)
    throw new Error("element not exist for name!element:" + name_el);

  console.log("Scraping enemy name ✅");
  return await name_el?.evaluate((el) => el.textContent?.trim(), name_el);
};

export interface Key {
  name: string;
  link: string;
}

export interface Value {
  name: string;
  link: string;
}

export interface Infos {
  key: Key;
  values: Value[];
}

const onInfobox = async (page: Page) => {
  let selector =
    "aside.portable-infobox.pi-background.pi-border-color.pi-theme-wikia.pi-layout-default";
  const table_infobox_el = await page.$(selector);

  selector = "a.image.image-thumbnail";
  const a_el = await table_infobox_el?.$(selector);

  const portrait = await a_el?.evaluate((el) => el.getAttribute("href"), a_el);

  const figure = { icon: "", portrait };

  selector = "div.wds-tab__content.wds-is-current";
  const div_infobox_el = await page.$(selector);
  selector = "div.pi-item.pi-data.pi-item-spacing.pi-border-color";
  const infos_el = await div_infobox_el?.$$(selector);

  if (!infos_el) throw new Error("infos_el" + infos_el);

  let infos = [] as Infos[];
  for (const element of infos_el) {
    let key = {} as Key;

    const h3_el = await element.$("h3");

    if (!h3_el) throw new Error("h3_el " + h3_el);

    key = await h3_el.evaluate((el) => {
      const name = el.textContent?.trim() ?? "";
      const a_el = el.querySelector("a");
      const link = a_el?.getAttribute("href") ?? "";

      return { name, link } as Key;
    }, h3_el);

    const div_el = await element.$("div");

    if (!div_el) throw new Error("div_el" + div_el);

    const values = await div_el.evaluate((el) => {
      let name: string | undefined;
      let link: string | null | undefined;
      let values = [] as Value[];

      const as_el = el.querySelectorAll("a");
      const span_el = el.querySelector("span");

      if (as_el.length) {
        for (const element of as_el) {
          name = element.textContent?.trim();
          link = element.getAttribute("href");

          if (!name) continue;

          values = [...values, { name, link } as Value];
        }

        return values;
      }

      if (span_el) {
        name = span_el.innerHTML;
        link = span_el.getAttribute("href");

        return [{ name, link } as Value];
      }

      name = el?.textContent?.trim();

      link = el?.getAttribute("href");

      return [{ name, link } as Value];
    }, element);

    infos = [...infos, { key, values }];
  }

  console.log("Scraping onInfobox ✅");
  return { figure, infos };
};

export interface DropCards {
  name?: string;
  rarity: number[];
}

const onDrop = async (page: Page) => {
  const dropCards = async (selector: string) => {
    const cards = await page.$$(selector);

    let drop_card = [] as DropCards[];
    let list_name = [] as string[];
    for (const card of cards) {
      const drop_name = await card.evaluate(
        (el) => el.textContent?.trim(),
        card
      );

      if (!drop_name || list_name.includes(drop_name)) continue;

      list_name = [...list_name, drop_name];

      const drop_rarity = await card.evaluate((el) => {
        const image_container = el.querySelector("span.card-image-container");
        const class_ = image_container?.classList;

        if (!class_) return;

        let num = "";
        for (const str of class_) {
          num = `${num}${str.replace(/\D+/g, "")}`;
        }

        return num.split("").map((str) => Number(str));
      }, card);

      if (!drop_rarity) return;

      if (drop_rarity.length > 1) {
      }

      drop_card = [...drop_card, { name: drop_name, rarity: drop_rarity }];
    }
    return drop_card;
  };

  const dropTable = async (selector: string) => {
    const drop_table_el = await page.$(selector);

    selector = "div.card-container.mini-card";
    const card_container_el = await drop_table_el?.$$(selector);

    if (!card_container_el) return;

    let drop_card = [] as DropCards[];
    for (const element of card_container_el) {
      const name = await element.evaluate(
        (el) => el.textContent?.trim(),
        element
      );

      const ignore = ["Mora", "Character EXP"];

      if (name && ignore.includes(name)) continue;

      const image_container = await element.$("span.card-image-container");

      if (!image_container) continue;

      const rarity = await image_container.evaluate((el) => {
        const class_ = el.classList;

        let num = "";
        for (const str of class_) {
          num = `${num}${str.replace(/\D+/g, "")}`;
        }

        return num.split("").map((str) => Number(str));
      }, image_container);

      drop_card = [...drop_card, { name, rarity }];
    }

    return drop_card;
  };

  let drops = await dropCards("div.card-container.mini-card");

  if (!drops) drops = await dropTable("table.fandom-table");

  console.log("Scraping enemy drops ✅");
  return drops;
};

interface Resistance {
  name: string;
  value: string;
}

interface Stage {
  name: string;
  resistance: Resistance[];
}

interface Drop {
  phase?: string;
  stages: Stage[];
}

const onResistance = async (page: Page) => {
  const selector = "tbody tr th";
  const els = await page.$$(selector);

  let drops = [] as Drop[];
  for (const element of els) {
    const drop = await element.evaluate((el): Drop | undefined => {
      const text = el.textContent?.trim();

      if (text === "RES") {
        const table_el = el.offsetParent;
        const previous_el = table_el?.previousElementSibling;
        const span_el = previous_el?.querySelector("span.mw-headline");
        const phase = span_el?.textContent?.trim();
        const trs_el = table_el?.querySelectorAll("tr");

        if (!trs_el) return;

        let td_list = [] as NodeListOf<HTMLTableCellElement>[];
        for (const element of trs_el) {
          const tds = element.querySelectorAll("td");

          if (tds.length) td_list = [...td_list, tds];
        }

        const has_state = !!td_list[0][0].textContent?.trim();

        let stages = [] as Stage[];
        for (const [x, tds] of td_list.entries()) {
          if (x === 0) continue;

          let obj = {} as Stage;
          let name_atr = "";
          let resistances = [] as Resistance[];
          for (const [j, td] of tds.entries()) {
            const text = td.textContent?.trim();

            if (!text) return;
            if (j === 0) name_atr = has_state ? text : "base";
            if (j === 0 && has_state) continue;

            const resistance = {} as Resistance;
            const img_el = td_list[0][j].querySelector("img");
            const res_name = img_el?.getAttribute("alt")?.toLowerCase();
            const value = td.textContent?.trim();

            if (!res_name || !value) return;

            resistance.name = res_name;
            resistance.value = value;

            resistances = [...resistances, resistance];
          }

          obj.resistance = resistances;
          obj.name = name_atr;
          stages = [...stages, obj];
        }

        return { phase, stages };
      }
    });

    if (drop) drops = [...drops, drop];
  }

  console.log("Scraping enemy resistances ✅");
  return drops;
};

const onDescription = async (page: Page) => {
  const selector = "div.description-source";
  const archive_el = await page.$(selector);

  const description = archive_el?.evaluate((el) => {
    function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
      let text = "";

      const tags_list = ["#text", "SPAN", "EM", "A", "I"];

      for (const [index, element] of childNodes.entries()) {
        if (tags_list.includes(element.nodeName)) {
          text = `${text}${element.textContent}`;
        } else if (childNodes[index].nodeName === "BR") {
          text = `${text}\n`;
        }
      }

      return text;
    }

    const parent = el.parentElement;

    const description_child_nodes_el = parent?.querySelector(
      "div.description-content"
    )?.childNodes;

    if (!description_child_nodes_el) return;

    return extractTextSingleTag(description_child_nodes_el);
  });

  console.log("Scraping enemy description ✅");
  return description;
};

const onGallery = async (page: Page) => {
  const selector = "div.lightbox-caption";
  const lightbox_el = await page.$$(selector);

  for (const element of lightbox_el) {
    const link = await element.evaluate((el) => {
      const text = el.textContent?.trim();

      if (!text && text !== "icon") return;

      const parent_el = el.parentElement;

      const img_el = parent_el?.querySelector("img");

      return img_el?.getAttribute("data-src");
    });

    console.log("Scraping enemy gallery ✅");
    if (link) return link;
  }
};

interface Metadade {
  name: string | undefined;
  info: {
    figure: {
      icon: string | undefined;
      portrait: string | null | undefined;
    };
    infos: Infos[];
  };
  drop: DropCards[] | undefined;
  resistance: Drop[];
  description: string | undefined;
}

const metadade = async (urls: string[], callback?: (obj: Metadade) => void) => {
  const browser = await puppeteer.launch({ headless: false });
  const ts = [
    "https://genshin-impact.fandom.com/wiki/Tenebrous_Papilla",
    // "https://genshin-impact.fandom.com/wiki/Hydro_Hilichurl_Rogue",
    "https://genshin-impact.fandom.com/wiki/Childe",
  ];

  let metadades = [] as Metadade[];
  for (const url of urls) {
    const page = await browser.newPage();

    let selector = "span.widget-header-count";
    await common.startPage(page, url, selector);

    const name = await onName(page);
    let info = await onInfobox(page);
    const drop = await onDrop(page);
    const resistance = await onResistance(page);
    const description = await onDescription(page);
    const gallery = await onGallery(page);

    page.close();
    info.figure.icon = gallery ?? "";

    const metadade = { name, info, drop, resistance, description };

    metadades = [...metadades, metadade];

    const path = "metadata";
    const folder_name = toKebabCase(metadade.name ?? "");

    fs.writeFileSync(
      `${path}/${folder_name}.metadade.json`,
      JSON.stringify(metadade)
    );
  }

  return metadades;
};

const scraping = async () => {};

export const enemies = { urls, scraping, metadade };
