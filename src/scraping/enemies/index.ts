import puppeteer, { ElementHandle, Page } from "puppeteer";
import { common } from "../../common";
import fs from "fs";
import { toKebabCase } from "../../utility";
import {
  Drop,
  DropCards,
  Infos,
  Key,
  Metadade,
  Resistance,
  Stage,
  Value,
  Vision,
} from "../../types";
import { file } from "../../file";

const modalEvade = async (page: Page) => {
  await page.waitForSelector("div button#onetrust-accept-btn-handler");

  const button_modal = await page.$("div button#onetrust-accept-btn-handler");

  await button_modal?.click();
};

const urls = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await common.startPage(
    page,
    "https://genshin-impact.fandom.com/wiki/Enemy/List",
    "div.mw-content-ltr.mw-parser-output"
  );

  await modalEvade(page);

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
      // div.rail-module.recent-images-module
      // div div.widget-header
      await tab.waitForSelector("div.rail-module.recent-images-module");

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
  const selector = "h1.page-header__title";
  const name_el = await page.$(selector);

  if (!name_el)
    throw new Error("element not exist for name!element:" + name_el);

  const name = await name_el?.evaluate((el) => el.textContent?.trim(), name_el);

  if (!name) throw new Error("name not exist for name!element:" + name);

  console.log("Scraping enemy name ✅");
  return name;
};

const onInfobox = async (page: Page) => {
  let selector =
    "aside.portable-infobox.pi-background.pi-border-color.pi-theme-wikia.pi-layout-default";
  const table_infobox_el = await page.$(selector);

  selector = "a.image.image-thumbnail";
  const a_el = await table_infobox_el?.$(selector);

  const portrait = await a_el?.evaluate((el) => el.getAttribute("href"), a_el);

  const figure = { icon: "", portrait };

  selector = "section.pi-item.pi-panel.pi-border-color.wds-tabber";
  const section_infobox_el = await page.$(selector);

  selector = "div.wds-tab__content.wds-is-current";
  const div_infobox_el = await section_infobox_el?.$(selector);

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

  console.log("Scraping enemy info ✅");
  return { figure, infos };
};

const onDrop = async (page: Page) => {
  const drop = async (cards: ElementHandle<Element>[]) => {
    let drop_card = [] as DropCards[];
    let list_name = [] as string[];

    for (const card of cards) {
      const drop_name = await card.evaluate((el) => {
        const card_text_el = el.querySelector("span.card-caption");

        return card_text_el?.textContent?.trim();
      }, card);

      if (!drop_name || list_name.includes(drop_name)) continue;

      list_name = [...list_name, drop_name];

      const image_container = await card.$("span.card-image-container");

      if (!image_container) continue;

      const rarity = await image_container.evaluate((el) => {
        const class_ = el.classList;

        let num = "";
        for (const str of class_) {
          num = `${num}${str.replace(/\D+/g, "")}`;
        }

        return num.split("").map((str) => Number(str));
      }, image_container);

      if (!rarity) return;

      drop_card = [...drop_card, { name: drop_name, rarity }];
    }

    return drop_card;
  };

  const cards = await page.$$("div.card-container.mini-card");

  let drops = await drop(cards);

  if (!drops || !drops.length) {
    let selector = "table.fandom-table";
    const drop_table_el = await page.$(selector);

    selector = "div.card-container.mini-card";
    const cards = await drop_table_el?.$$(selector);

    if (cards?.length) drops = await drop(cards);
  }

  if (!drops || !drops.length) {
    const cards = await page.$$("div.card-container");

    drops = await drop(cards);
  }

  console.log("Scraping enemy drops ✅");
  return drops;
};

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

  let description = archive_el?.evaluate((el) => {
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

    if (description_child_nodes_el)
      return extractTextSingleTag(description_child_nodes_el);
  });

  if (!description) {
    const description_content_el = await page.$("div.description-content");

    description = description_content_el?.evaluate((el) => {
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

      return extractTextSingleTag(el.childNodes);
    });
  }

  console.log("Scraping enemy description ✅");
  return description;
};

const onGallery = async (page: Page) => {
  const selector = "div.lightbox-caption";
  const lightbox_el = await page.$$(selector);

  for (const element of lightbox_el) {
    const link = await element.evaluate((el) => {
      const text = el.textContent?.trim().toLocaleLowerCase();

      if (text && text !== "icon") return;

      const parent_el = el.parentElement;

      const img_el = parent_el?.querySelector("img");

      return img_el?.getAttribute("data-src");
    });

    console.log("Scraping enemy gallery ✅");
    if (link) return link;
  }
};

const onEnergyType = async (page: Page) => {
  const selector = "tbody tr th";
  const els = await page.$$(selector);

  let energy_type = undefined as string | undefined;
  for (const element of els) {
    energy_type = await element.evaluate((el) => {
      const text = el.textContent?.trim();

      if (text === "Energy Drops") {
        const table_el = el.offsetParent;
        const trs_el = table_el?.querySelectorAll("tr");
        const td_el = trs_el?.[2].querySelector("td");

        if (td_el?.textContent?.trim()) return td_el?.textContent?.trim();
      }
    });

    if (energy_type) return energy_type;
  }

  console.log("Scraping enemy energy type ✅");
  return energy_type;
};

const metadade = async (urls: string[]) => {
  const browser = await puppeteer.launch({ headless: false });
  const ts = [];

  let metadades = [] as Metadade[];
  for (const url of urls) {
    console.log("##===>\n", url);
    const page = await browser.newPage();

    try {
      let selector = "div.rail-module.recent-images-module";

      await common.startPage(page, url, selector);
    } catch (error) {
      await modalEvade(page);
    }

    const name = await onName(page);
    let info = await onInfobox(page);
    const drop = await onDrop(page);
    const resistance = await onResistance(page);
    const description = await onDescription(page);
    const gallery = await onGallery(page);

    const element = (await onEnergyType(page)) as Vision;

    page.close();
    info.figure.icon = gallery ?? "";

    const metadade = { name, info, drop, resistance, description, element };

    metadades = [...metadades, metadade];

    const path = "logs/metadata";
    const folder_name = toKebabCase(metadade.name ?? "");

    file.save(path, JSON.stringify(metadade), `${folder_name}.metadade.json`);
  }

  return metadades;
};

export const enemies = { urls, metadade };
