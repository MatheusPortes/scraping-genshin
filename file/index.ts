import fs from "fs";

type Content = string | NodeJS.ArrayBufferView;

const save = (path: string, content: Content, file: string = "pt.json") => {
  if (fs.existsSync(path)) {
    fs.writeFileSync(`${path}/${file}`, content);
    return;
  }

  fs.mkdirSync(path);
  fs.writeFileSync(`${path}/${file}`, content);
};

export const file = { save };
