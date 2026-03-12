import readline from "readline";

const ask = (pergunta: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      rl.close();
      resolve(resposta);
    });
  });
};

const start = async () => {
  const resposta = await ask("Deseja continuar? (s/n): ");

  if (resposta.toLowerCase() === "s") {
    console.log("Executando...");

    return;
  } else {
    process.exit();
  }
};

export const terminal = { start };
