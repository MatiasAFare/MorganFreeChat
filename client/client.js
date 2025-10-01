
const net = require("net");
const readline = require("readline");
let chalk;
import('chalk').then(mod => { chalk = mod.default; start(); });

function start() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ""
    });

    rl.question(chalk.cyanBright("Elige tu nick: "), (nick) => {
        const client = net.createConnection({ port: 8000 }, () => {
            console.log(chalk.greenBright(`Conectado al servidor como ${nick}`));
            client.write(nick);
            rl.setPrompt(chalk.yellow(`${nick}: `));
            rl.prompt();
        });

        client.on("data", (data) => {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            const msg = data.toString().trim();
            if (msg.startsWith("Bienvenido") || msg.includes("se ha unido") || msg.includes("salió del chat") || msg.includes("Adiós")) {
                console.log(chalk.blueBright(msg));
            } else if (msg.startsWith(nick + ":")) {
                console.log(chalk.yellowBright(msg));
            } else if (msg.startsWith("Error") || msg.startsWith("Comando desconocido")) {
                console.log(chalk.redBright(msg));
            } else {
                console.log(chalk.white(msg));
            }
            rl.prompt(true);
        });

        client.on("error", (err) => {
            console.error(chalk.red("Error: "), err.message);
        });

        client.on("end", () => {
            console.log(chalk.magenta("Conexión cerrada por el servidor"));
            rl.close();
        });

        rl.on("line", (line) => {
            if (!line.trim()) return rl.prompt();
            client.write(line);
            rl.prompt();
        });
    });
}
