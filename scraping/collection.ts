import { ListLivingBeing, Metadade, Value } from "../types";
import { similarity } from "../url";
import { toKebabCase } from "../utility";

const grouping = (
  values: Value,
  index: number,
  living_being: ListLivingBeing[]
) => {
  const name = toKebabCase(values.name);
  const link = `https://genshin-impact.fandom.com${values.link}`;

  const index_ = living_being.findIndex(
    (item) => name === item.name || similarity(name, item.name) > 0.9
  );

  if (!living_being[index_]) {
    living_being = [...living_being, { name, link, position: [index] }];
  }

  if (living_being[index_]) {
    if (!living_being[index_].position) living_being[index_].position = [index];

    if (living_being[index_].position)
      living_being[index_].position = [...living_being[index_].position, index];
  }

  return living_being;
};

const groupingEnemies = async (metadades: Metadade[]) => {
  let living_being_group = [] as ListLivingBeing[];
  let living_being_type = [] as ListLivingBeing[];
  let living_being_family = [] as ListLivingBeing[];

  let living_being_group_position = [] as number[];
  let living_being_type_position = [] as number[];
  let living_being_family_position = [] as number[];

  for (const [index, data] of metadades.entries()) {
    const infos = data.info.infos;
    console.log("*** " + data.name + " ***");

    let enter = false;
    for (const { key, values } of infos) {
      if (key.name === "Living Being Group") {
        enter = true;

        living_being_group = grouping(values[0], index, living_being_group);

        living_being_group_position = [...living_being_group_position, index];
      }

      if (key.name === "Living Being Type") {
        enter = true;

        living_being_type = grouping(values[0], index, living_being_type);

        living_being_type_position = [...living_being_type_position, index];
      }

      if (key.name === "Living Being Family") {
        enter = true;

        living_being_family = grouping(values[0], index, living_being_family);

        living_being_family_position = [...living_being_family_position, index];
      }
    }

    if (!enter) console.log("Obss!!!");
  }

  console.log("living_being_group", living_being_group);
  console.log("living_being_type", living_being_type);
  console.log("living_being_family", living_being_family);
};

export const collections = { groupingEnemies };
