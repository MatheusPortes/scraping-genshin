import puppeteer, { LaunchOptions, Page } from "puppeteer";
import { common } from "./common";

const noRecaptcha = async <T>(
  callback: (page: Page) => T,
  options?: LaunchOptions,
) => {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  const response = await callback(page);

  browser.close();
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
