const net = require("net");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ""
});

rl.question("Elige tu nick: ", (nick) => {
    const client = net.createConnection({ port: 8000 }, () => {
        console.log(`Conectado al servidor como ${nick}`);
        client.write(nick);
        rl.setPrompt(`${nick}: `);
        rl.prompt();
    });

    client.on("data", (data) => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(data.toString().trim());
        rl.prompt(true);
    });

    client.on("error", (err) => {
        console.error("Error: ", err.message);
    });

    client.on("end", () => {
        console.log("Conexión cerrada por el servidor");
        rl.close();
    });

    rl.on("line", (line) => {
        if (!line.trim()) return rl.prompt();
        client.write(line);
        rl.prompt();
    });
});
