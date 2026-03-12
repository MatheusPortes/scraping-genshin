import { scraping } from "./src/scraping";

(async () => {
  await scraping.drop();
})();
