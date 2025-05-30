import { error } from "console";

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
  const mes = partes[0].padStart(2, "0"); // Garante 2 dígitos (06)
  const dia = partes[1].padStart(2, "0"); // Garante 2 dígitos (08)

  // Criar nova data no formato ISO com ano 0000
  return `0000-${mes}-${dia}`;
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
