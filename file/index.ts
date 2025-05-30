import fs from "fs";

type Content = string | NodeJS.ArrayBufferView;

const get = <T>(path: string, file: string = "pt.json") => {
  if (!fs.existsSync(`${path}/${file}`)) return;

  const archive = fs.readFileSync(`${path}/${file}`, "utf8");

  return JSON.parse(archive) as T;
};

const save = (path: string, content: Content, file: string = "pt.json") => {
  if (fs.existsSync(path)) {
    fs.writeFileSync(`${path}/${file}`, content);
    return;
  }

  fs.mkdirSync(path);
  fs.writeFileSync(`${path}/${file}`, content, { encoding: "utf8" });
};

export const file = { save, get };
