import { error } from "console";
import { ValidPatchVersion } from "../types";

export function refactorExceptions(exception: string) {
  if (exception === "-") return "0/0";

  const regexFormat = /^\d+\/\d+$/;
  if (regexFormat.test(exception)) {
    return exception;
  }

  const regex = /(\d{1,2}) de ([\p{L}çÇ]+)/iu;
  const match = exception.match(regex);

  if (!match) return exception;

  const dia = parseInt(match[1], 10);
  const mes = match[2].toLowerCase();

  switch (mes) {
    case "-":
      return "0/0";

    case "janeiro":
      return `${dia}/1`;

    case "fevereiro":
      return `${dia}/2`;

    case "março":
      return `${dia}/3`;

    case "abril":
      return `${dia}/4`;

    case "maio":
      return `${dia}/5`;

    case "junho":
      return `${dia}/6`;

    case "julho":
      return `${dia}/7`;

    case "agosto":
      return `${dia}/8`;

    case "setembro":
      return `${dia}/9`;

    case "outubro":
      return `${dia}/10`;

    case "novembro":
      return `${dia}/11`;

    case "dezembro":
      return `${dia}/12`;

    default:
      return exception;
  }
}

export function formatBirthday(dataOriginal: string) {
  dataOriginal = refactorExceptions(dataOriginal);
  // Dividir a string no formato m/d
  const partes = dataOriginal.split("/");
  const mes = partes[1].padStart(2, "0"); // Garante 2 dígitos (06)
  const dia = partes[0].padStart(2, "0"); // Garante 2 dígitos (08)

  // Criar nova data no formato ISO com ano 0000
  return `${dia}-${mes}-0000`;
}

export function checkAscenderLevel(array: number[]) {
  const jsonArray = JSON.stringify([array]);
  if (JSON.stringify([1, 3, 3]) === jsonArray) return 2;
  if (JSON.stringify([3, 2, 10, 15]) === jsonArray) return 4;
  if (JSON.stringify([6, 4, 20, 12]) === jsonArray) return 5;
  if (JSON.stringify([3, 8, 30, 18]) === jsonArray) return 6;
  if (JSON.stringify([6, 12, 45, 12]) === jsonArray) return 7;
  if (JSON.stringify([6, 20, 60, 24]) === jsonArray) return 8;

  throw error;
}

export function toKebabCase(str: string) {
  return str
    .toLowerCase() // Converte tudo para minúsculas
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/[^a-z0-9-]/g, ""); // Remove caracteres especiais (exceto letras, números e hífens)
}

export function getGenshinPatchDate(version: ValidPatchVersion) {
  const patchDates = {
    "1.0": "28-09-2020",
    "1.1": "20-10-2020",
    "1.2": "23-12-2020",
    "1.3": "02-03-2021",
    "1.4": "28-04-2021",
    "1.5": "26-05-2021",
    "1.6": "23-06-2021",

    "2.0": "01-07-2021",
    "2.1": "15-09-2021",
    "2.2": "13-10-2021",
    "2.3": "08-12-2021",
    "2.4": "19-01-2022",
    "2.5": "02-03-2022",
    "2.6": "12-04-2022",
    "2.7": "26-05-2022",
    "2.8": "15-06-2022",

    "3.0": "28-08-2022",
    "3.1": "07-09-2022",
    "3.2": "12-10-2022",
    "3.3": "23-11-2022",
    "3.4": "11-01-2023",
    "3.5": "22-02-2023",
    "3.6": "08-04-2023",
    "3.7": "24-05-2023",
    "3.8": "09-08-2023",

    "4.0": "23-08-2023",
    "4.1": "20-09-2023",
    "4.2": "25-10-2023",
    "4.3": "06-12-2023",
    "4.4": "24-01-2024",
    "4.5": "14-03-2024",
    "4.6": "30-04-2024",
    "4.7": "22-05-2024",
    "4.8": "10-07-2024",
    "4.9": "04-09-2024",

    "5.0": "18-09-2024",
    "5.1": "23-10-2024",
    "5.2": "04-12-2024",
    "5.3": "22-01-2025",
    "5.4": "12-03-2025",
    "5.5": "30-04-2025",
    "5.6": "21-05-2025",
    "5.7": "10-07-2025",
    "5.8": "04-09-2025",
  };

  return patchDates[version] || "Versão não encontrada";
}
