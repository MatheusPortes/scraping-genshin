import puppeteer from "puppeteer";
import {
  Card,
  CardList,
  DropCards,
  ListBeing,
  ListLivingBeing,
  MetadadeEl,
} from "../../types";
import { common } from "../../common";
import { toKebabCase } from "../../utility";
import fs from "fs";
import { file } from "../../file";
import path from "path";

const save = (beings: ListBeing[], __dir: string, file_?: string) => {
  beings.forEach(({ position, list, ...content }) => {
    fs.mkdirSync(`${__dir}/${content.id}`, { recursive: true });

    file.save(`${__dir}/${content.id}`, JSON.stringify(content), file_);
  });
};

const group = async (beings: ListLivingBeing[]) => {
  const browser = await puppeteer.launch({ headless: false });

  let list_living_being = [] as ListBeing[];

  for (const { link, ...rest } of beings) {
    const page = await browser.newPage();

    let selector = "div.rail-module.recent-images-module";
    await common.startPage(page, link, selector);

    let jump = "up" as "up" | "down";

    selector = "div#toc.toc";
    let toc_el = await page.$(selector);

    if (!toc_el) {
      selector =
        "aside.portable-infobox.pi-background.pi-border-color.pi-theme-wikia.pi-layout-default";
      toc_el = await page.$(selector);
      jump = "down";
    }

    if (!toc_el) throw new Error("element not fount" + selector);

    const description = await toc_el.evaluate((el, jump) => {
      function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
        let text = "";

        const tags_list = ["#text", "SPAN", "EM", "A", "I", "B"];

        for (const [index, element] of childNodes.entries()) {
          if (tags_list.includes(element.nodeName)) {
            text = `${text}${element.textContent}`;
          } else if (childNodes[index].nodeName === "BR") {
            text = `${text}\n`;
          }
        }

        return text;
      }
      function jumpsBetweenElements(el: Element, jump: "up" | "down") {
        return jump === "up"
          ? el.previousElementSibling
          : (el.nextElementSibling as Element | null | undefined);
      }

      let element = jumpsBetweenElements(el, jump);
      let text = undefined as undefined | string;
      let info_el = [] as MetadadeEl[];

      do {
        if (!element)
          throw new Error("element not fount" + "previousElementSibling");

        if (element.tagName === "P") {
          text = extractTextSingleTag(element.childNodes);

          if (text.length)
            info_el = [...info_el, { tag: element.tagName, text }];
        }

        element = jumpsBetweenElements(element, jump);
      } while (
        jump === "up" ? element?.tagName !== "ASIDE" : element?.tagName !== "H2"
      );

      info_el = info_el.reverse();

      let description = "";
      info_el.forEach(({ text }) => {
        description = `${description} ${text}`;
      });

      return description;
    }, jump);

    selector = "div.description-content";
    const description_el = await page.$(selector);

    const adventurer_handbook = await description_el?.evaluate((el) =>
      el.textContent?.trim()
    );

    list_living_being = [
      ...list_living_being,
      { ...rest, description, adventurer_handbook },
    ];

    console.log("Group", rest.name + " completed ✅");
    await page.close();
  }

  let __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/living-being/groups/`;
  save(list_living_being, __dir, "en.json");

  __dir = path.join(__dirname, "../../../logs/being");
  file.save(__dir, JSON.stringify(list_living_being), "group.json");

  return list_living_being;
};

const family = async (beings: ListLivingBeing[]) => {
  const browser = await puppeteer.launch({ headless: false });

  let list_living_being = [] as ListBeing[];
  for (const { link, ...rest } of beings) {
    const page = await browser.newPage();

    let selector = "div.rail-module.recent-images-module";
    await common.startPage(page, link, selector);

    selector = "div#toc.toc";
    let toc_el = await page.$(selector);

    if (!toc_el) throw new Error("element not fount" + selector);

    const description = await toc_el.evaluate((el) => {
      function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
        let text = "";

        const tags_list = ["#text", "SPAN", "EM", "A", "I", "B"];

        for (const [index, element] of childNodes.entries()) {
          if (tags_list.includes(element.nodeName)) {
            text = `${text}${element.textContent}`;
          } else if (childNodes[index].nodeName === "BR") {
            text = `${text}\n`;
          }
        }

        return text;
      }
      function jumpsBetweenElements(el: Element, jump: "up" | "down") {
        return jump === "up"
          ? el.previousElementSibling
          : (el.nextElementSibling as Element | null | undefined);
      }

      let element = jumpsBetweenElements(el, "up");
      let text = undefined as undefined | string;
      let info_el = [] as MetadadeEl[];

      do {
        if (!element)
          throw new Error("element not fount" + "previousElementSibling");

        if (element.tagName === "P") {
          text = extractTextSingleTag(element.childNodes);

          if (text.length)
            info_el = [...info_el, { tag: element.tagName, text }];
        }

        if (element.tagName === "OL") {
          const li_el = element.querySelectorAll("li");

          for (const [index, element] of li_el.entries()) {
            const new_text = extractTextSingleTag(element.childNodes);

            text = `${text ?? ""}${index + 1} - ${new_text}\n`;
          }

          if (text?.length)
            info_el = [...info_el, { tag: element.tagName, text }];
        }

        element = jumpsBetweenElements(element, "up");
      } while (element?.tagName !== "ASIDE");

      info_el = info_el.reverse();

      let description = "";
      info_el.forEach(({ text }) => {
        description = `${description} ${text}`;
      });

      return description;
    });

    selector = "div.description-content";
    const description_el = await page.$(selector);

    const adventurer_handbook = await description_el?.evaluate((el) =>
      el.textContent?.trim()
    );

    list_living_being = [
      ...list_living_being,
      { ...rest, description, adventurer_handbook },
    ];

    console.log("Family", rest.name + " completed ✅");
    await page.close();
  }

  let __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/living-being/families/`;
  save(list_living_being, __dir, "en.json");

  __dir = path.join(__dirname, "../../../logs/being");
  file.save(__dir, JSON.stringify(list_living_being), "family.json");

  return list_living_being;
};

const type = async (beings: ListLivingBeing[]) => {
  function objectToArray(drop_card: DropCards[]) {
    let obj = {} as { [key: string]: { name: string; artefact: any[] } };

    for (const drop of drop_card) {
      if (!drop.enemy) drop.enemy = "all";

      const { enemy, ...rest } = drop;
      const att = toKebabCase(enemy);

      if (!obj[att]) obj[att] = { name: "", artefact: [] as Card[] };

      obj[att].name = enemy;
      obj[att].artefact = [...obj[att].artefact, rest];
    }

    let list = [] as any[];
    for (const key in obj) {
      list = [...list, obj[key]];
    }

    return list as CardList[];
  }

  const browser = await puppeteer.launch({ headless: false });

  beings.splice(beings.length - 1);

  let list_living_being = [] as ListBeing[];

  for (const { link, ...rest } of beings) {
    const page = await browser.newPage();

    let selector = "div.rail-module.recent-images-module";
    await common.startPage(page, link, selector);

    selector =
      "aside.portable-infobox.pi-background.pi-border-color.pi-theme-wikia.pi-layout-default";
    const aside_el = await page.$(selector);

    if (!aside_el) throw new Error("element not fount" + selector);

    const description = await aside_el.evaluate((el) => {
      function extractTextSingleTag(childNodes: NodeListOf<ChildNode>) {
        let text = "";

        const tags_list = ["#text", "SPAN", "EM", "A", "I", "B"];

        for (const [index, element] of childNodes.entries()) {
          if (tags_list.includes(element.nodeName)) {
            text = `${text}${element.textContent}`;
          } else if (childNodes[index].nodeName === "BR") {
            text = `${text}\n`;
          }
        }

        return text;
      }
      function jumpsBetweenElements(el: Element, jump: "up" | "down") {
        return jump === "up"
          ? el.previousElementSibling
          : (el.nextElementSibling as Element | null | undefined);
      }

      let element = jumpsBetweenElements(el, "down");
      let text = undefined as undefined | string;
      let info_el = [] as MetadadeEl[];

      do {
        if (!element)
          throw new Error("element not fount" + "previousElementSibling");

        if (element.tagName === "P") {
          text = extractTextSingleTag(element.childNodes);

          if (text.length)
            info_el = [...info_el, { tag: element.tagName, text }];
        }

        element = jumpsBetweenElements(element, "down");
      } while (element?.tagName !== "H2");

      let description = "";
      info_el.forEach(({ text }) => {
        description = `${description} ${text}`;
      });

      return description;
    });

    const spans_el = await page.$$("span.card-set-container");

    let drop_card = [] as DropCards[];
    if (spans_el.length) {
      for (const element of spans_el) {
        const drop = await element.evaluate((el) => {
          function getLink(el: HTMLElement | null | undefined) {
            return el?.querySelector("a")?.getAttribute("href");
          }
          function getRarity(class_: DOMTokenList) {
            let num = "";

            for (const str of class_) {
              const replace_num = str.replace(/\D+/g, "");

              num = `${num}${!num.includes(replace_num) ? replace_num : ""}`;
            }

            return num.split("").map((str) => Number(str));
          }
          function getEnemy(el: HTMLSpanElement) {
            let class_name: DOMTokenList | undefined = undefined;
            let parent_element = el.parentElement as
              | HTMLElement
              | null
              | undefined;
            let enemy = undefined as string | undefined;
            let break_ = { limit: 0, check: "" };

            do {
              class_name = parent_element?.classList;
              const tag = parent_element?.tagName;

              class_name?.forEach((item) => {
                break_.check = item;
              });

              if (tag === "TR") {
                const card_container_el =
                  parent_element?.querySelector("div.card-container");

                enemy = card_container_el
                  ?.querySelector("span.card-caption")
                  ?.textContent?.trim();
              }

              parent_element = parent_element?.parentElement;
              break_.limit++;
            } while (break_.check !== "wikitable" && break_.limit < 20);

            return enemy;
          }

          const great_grandmother_el =
            el.parentElement?.parentElement?.parentElement;

          const link = getLink(great_grandmother_el);

          const class_ = great_grandmother_el?.querySelector(
            "span.card-image-container"
          )?.classList;

          if (!class_) throw new Error("element not fount" + class_);

          const card_caption_el =
            great_grandmother_el.querySelector("span.card-caption");

          const name = card_caption_el?.textContent?.trim();
          const rarity = getRarity(class_);
          const enemy = getEnemy(el);

          return { name, rarity, link, enemy };
        });

        drop_card = [...drop_card, drop];
      }
    }

    const list = objectToArray(drop_card);

    list_living_being = [...list_living_being, { ...rest, description, list }];

    console.log("Type", rest.name + " completed ✅");
    await page.close();
  }

  let __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/living-being/types/`;
  save(list_living_being, __dir, "en.json");

  __dir = path.join(__dirname, "../../../logs/being");
  file.save(__dir, JSON.stringify(list_living_being), "type.json");

  return list_living_being;
};

export const beings = { family, group, type };
