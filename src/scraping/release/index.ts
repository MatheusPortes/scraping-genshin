import puppeteer from "puppeteer";
import { common } from "../../common";
import { checkingFolderName, toKebabCase } from "../../utility";
import { file } from "../../file";
import moment from "moment";

const release = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await common.startPage(
    page,
    "https://genshin-impact.fandom.com/wiki/Character/List#Characters_by_Release_Date",
    "table.fandom-table.article-table.sortable.alternating-colors-table.jquery-tablesorter"
  );

  const tableEl = await page.$(
    "table.fandom-table.article-table.sortable.alternating-colors-table.jquery-tablesorter"
  );

  const tbody = await tableEl?.$("tbody");
  const TRs = await tbody?.$$("tr");

  if (!TRs) return;

  for (const tr of TRs) {
    const TDs = await tr.$$("td");

    if (!TDs) return;

    const name = await TDs[1].evaluate((el) => el.textContent?.trim(), TDs[1]);

    const release_date = await TDs[7].evaluate(
      (el) => el.textContent?.trim(),
      TDs[7]
    );

    if (!name || !release_date) return;
    if (!(name === "Skirk" || name === "Dahlia")) continue;

    const __dir = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/characters/${toKebabCase(
      checkingFolderName(name)
    )}`;

    if (!file.exists(__dir, "pt.json")) {
      console.log(__dir, "pt.json");
      continue;
    }

    const date = new Date(release_date);
    const rfc2822 = date.toUTCString(); // Converts to RFC 2822 format
    const existing_content = file.get<any>(__dir, "pt.json");

    existing_content.release = moment(rfc2822).format("YYYY-MM-DD");
    file.save(__dir, JSON.stringify(existing_content), "pt.json");
  }

  browser.close();
};

export { release };
