import moment from "moment";
import fs from "fs";
import puppeteer, { Browser, Page } from "puppeteer";
import { common } from "../common";
import path from "path";

const autoScroll = async (page: Page) => {
  await page.waitForSelector(".genshin-show-character-wrapper");

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100; // pixels a cada scroll
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Para quando chegar no final ou após um limite (ex.: 10.000 pixels)
        if (totalHeight >= scrollHeight || totalHeight >= 10000) {
          clearInterval(timer);
          resolve({});
        }
      }, 250); // Intervalo entre scrolls (ms)
    });
  });
  console.log("Auto Scroll ✅");
};

const scraping = async (page: Page, browser: Browser) => {
  const elements = await page.$$("article.character-card");

  let navigationURLs = [] as string[];
  for (const el of elements) {
    // Espera por uma nova aba abrir ao clicar
    const [newPage] = await Promise.all([
      browser
        .waitForTarget((target) => target.opener() === page.target())
        .then((t) => t.page()),
      el.click(),
    ]);

    if (!newPage) return;

    // Espera a nova aba carregar
    await newPage.waitForNavigation({ timeout: 30000 });

    const newUrl = newPage.url();
    navigationURLs = [...navigationURLs, newUrl];

    await newPage.close(); // Fecha a aba se quiser
  }

  console.log("Scraping URLs ✅");
  const data = moment().format("MM-DD-YYYY");
  fs.writeFileSync(`logs/${data}.json`, JSON.stringify(navigationURLs));
  return navigationURLs;
};

const get = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await common.startPage(
    page,
    "https://wiki.hoyolab.com/pc/genshin/aggregate/2",
    ".genshin-show-character-wrapper"
  );

  await common.changeLanguage(page, { selected: "PT", name: "Português" });

  await autoScroll(page); // Executa o scroll

  return await scraping(page, browser);
};

const getFromFile = async () => {
  const data = moment().format("MM-DD-YYYY");
  const filePath = path.join(__dirname, "../logs", `${data}.json`);
  let urls: string[] | undefined;

  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath, { encoding: "utf8" });
    urls = JSON.parse(file);
  }

  return urls;
};

export const url = { get, scraping, autoScroll, getFromFile };
