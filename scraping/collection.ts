import { ListLivingBeing, Metadade, Value } from "../types";
import { similarity } from "../url";
import { toKebabCase } from "../utility";

const grouping = (
  values: Value,
  index: number,
  living_being: ListLivingBeing[],
  enemy_id: string
) => {
  const name = values.name;
  const id = toKebabCase(values.name);
  const link = `https://genshin-impact.fandom.com${values.link}`;

  const index_ = living_being.findIndex(
    (item) => name === item.name || similarity(name, item.name) > 0.9
  );

  if (!living_being[index_]) {
    living_being = [
      ...living_being,
      { id, name, link, position: [index], enemies: [enemy_id] },
    ];
  }

  if (living_being[index_]) {
    if (!living_being[index_].position || !living_being[index_].enemies) {
      living_being[index_].position = [index];
      living_being[index_].enemies = [enemy_id];
    }

    if (living_being[index_].position) {
      living_being[index_].position = [...living_being[index_].position, index];
      living_being[index_].enemies = [
        ...living_being[index_].enemies,
        enemy_id,
      ];
    }
  }

  return living_being;
};

const groupingEnemies = async (metadades: Metadade[]) => {
  let group = [] as ListLivingBeing[];
  let type = [] as ListLivingBeing[];
  let family = [] as ListLivingBeing[];

  for (const [index, data] of metadades.entries()) {
    const infos = data.info.infos;
    const id = toKebabCase(metadades[index].name);
    let enter = false;

    for (const { key, values } of infos) {
      if (key.name === "Living Being Group") {
        enter = true;

        group = grouping(values[0], index, group, id);
      }

      if (key.name === "Living Being Type") {
        enter = true;

        type = grouping(values[0], index, type, id);
      }

      if (key.name === "Living Being Family") {
        enter = true;

        family = grouping(values[0], index, family, id);
      }
    }

    if (!enter) console.log("Obss!!!" + "*** " + data.name + " ***");
  }

  return {
    group,
    type,
    family,
  };
};

export const collections = { groupingEnemies };
