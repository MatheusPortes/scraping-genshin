import path from "path";
import fs from "fs";
import { file } from "../../file";
import {
  DropCards,
  Figure,
  Infos,
  Metadade,
  ProcessingData,
  ProcessingDrop,
  Vision,
} from "../../types";
import { toKebabCase } from "../../utility";
import { httpsDownload } from "../../url";

const downloadAndSave = (figure: Figure, directory: string) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  for (const property in figure) {
    const file_path = path.join(directory, property);
    const url = figure[property as keyof Figure];
    const file = fs.createWriteStream(file_path);

    if (!url) return;

    httpsDownload(file, url, file_path);
  }
};

const extractDamageType = (infos: Infos[]) => {
  let damage_type = [] as Vision[];

  for (const { key, values } of infos) {
    if (["Damage Types", "Damage Type"].includes(key.name)) {
      damage_type = values.map(({ name }) => name) as Vision[];
    }
  }

  return damage_type;
};

const extractCategory = (infos: Infos[]) => {
  let living_being_category = [] as string[];

  for (const { key, values } of infos) {
    if (
      [
        "Living Being Type",
        "Living Being Family",
        "Living Being Group",
      ].includes(key.name)
    ) {
      const _living_being_category = values.map(({ name }) =>
        toKebabCase(name)
      ) as Vision[];
      living_being_category = [
        ...living_being_category,
        ..._living_being_category,
      ];
    }
  }

  return living_being_category;
};

const extractFaction = (infos: Infos[]) => {
  let faction = [] as string[];

  for (const { key, values } of infos) {
    if ("Faction" === key.name) {
      faction = values.map(({ name }) => name);
    }
  }

  return faction;
};

const extractDrops = (drops: DropCards[]) => {
  let drop = [] as ProcessingDrop[];

  for (const { rarity, name, ...rest } of drops) {
    if (rest.enemy || rest.link) {
      console.log(rest);
    }

    drop = [...drop, { rarity, name: name ?? "" }];
  }

  return drop;
};

const processing = async () => {
  let directory = path.join(__dirname, "../../../logs/metadata");
  let metadades = [] as Metadade[];

  const files_name = fs.readdirSync(directory, { encoding: "utf-8" });

  for (const name of files_name) {
    const data = file.get<Metadade>(directory, name);

    if (data) metadades = [...metadades, data];
  }

  for (const metadade of metadades) {
    const data = {} as ProcessingData;
    const { info, name, description, element, drop, resistance } = metadade;

    data.id = toKebabCase(name);
    data.name = name;
    data.resistance = resistance;
    data.description = description;
    data.element = element;
    data.damageType = extractDamageType(info.infos);
    data.livingBeingCategory = extractCategory(info.infos);
    data.faction = extractFaction(info.infos);

    if (drop) data.drop = extractDrops(drop);

    let directory = `/home/matheus/Documentos/Matheus/Genshin-Builder/api/assets/data/living-being/enemies/${data.id}/`;

    file.save(directory, JSON.stringify(data), "en.json");

    directory = directory.replace("data", "images");

    downloadAndSave(info.figure, directory);

    directory = path.join(__dirname, `../../../logs/images/${data.id}`);

    downloadAndSave(info.figure, directory);
  }

  console.log("Processing finish!!! ✅");
};

export const metadata = { processing };
