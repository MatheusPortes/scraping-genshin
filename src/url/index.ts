import moment from "moment";
import path from "path";
import fs, { WriteStream } from "fs";
import https from "https";
import { Browser, ElementHandle, Page } from "puppeteer";

const autoScroll = async (page: Page, selector: string, interval: number) => {
  await page.waitForSelector(selector);

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100; // pixels a cada scroll
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Para quando chegar no final ou após um limite (ex.: 10.000 pixels)
        if (totalHeight >= scrollHeight || totalHeight >= interval) {
          clearInterval(timer);
          resolve({});
        }
      }, 250); // Intervalo entre scrolls (ms)
    });
  });
  console.log("Auto Scroll ✅");
};

const scraping = async (
  page: Page,
  browser: Browser,
  selector: string,
  callback?: () => Promise<string[]>,
) => {
  const elements = await page.$$(selector);

  let navigationURLs = [] as string[];

  if (!callback) {
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
  }

  if (callback) {
    navigationURLs = await callback();
  }

  console.log("Scraping URLs ✅");

  return navigationURLs;
};

const getFromFile = async (folder: "character" | "weapon" | "enemy") => {
  const data = moment().format("MM-DD-YYYY");
  const filePath = path.join(__dirname, `../../logs/${folder}`, `${data}.json`);
  let urls: string[] | undefined;

  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath, { encoding: "utf8" });
    urls = JSON.parse(file);
  }

  return urls;
};

function levenshteinDistance(a: string, b: string) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export const similarity = (str1: string, str2: string) => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
};

export const httpsDownload = (file: WriteStream, url: string, path: string) => {
  https.get(url, (res) => {
    res.pipe(file);

    file
      .on("finish", () => {
        file.close();

        console.log(`Image downloaded successfully to ${path}`);
      })
      .on("error", (err) => {
        fs.unlink(path, () => {}); // Delete the file if there's an error
        console.error("Error downloading image:", err.message);
      });
  });
};

const scrapingNew = async (
  browser: Browser,
  elements: ElementHandle<Element>[],
) => {
  let navigationURLs = [] as string[];

  for (const element of elements) {
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
        }),
      ),
    ]);

    if (!tab) throw new Error("tab not exist!\ntab: " + tab);

    await tab.waitForSelector("div.rail-module.recent-images-module");

    const newUrl = tab.url();
    navigationURLs = [...navigationURLs, newUrl];

    await tab.close(); // Fecha a aba se quiser
  }

  console.log("Scraping URLs ✅");
  return navigationURLs;
};

const click = { scraping: scrapingNew };

export const url = { scraping, autoScroll, getFromFile, httpsDownload, click };
