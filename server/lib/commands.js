const { getClient, listNicks, broadcast, removeClient } = require('./clients');
const { logToFile } = require('./logger');


function handleCommand(text, socket) {
    const [command, ...params] = text.split(' ');
    const info = getClient(socket);


    switch (command) {
        case '/nick': {
            const newNick = params.join(' ').trim();
            if (!newNick) {
                socket.write('Uso: /nick TU_NUEVO_NICK');
                return;
            }
            const oldNick = info.nick;
            info.nick = newNick;
            socket.write(`Tu nick ahora es ${newNick}
`);
            broadcast(`${oldNick} ahora se llama ${newNick}`);
            logToFile(`${oldNick} -> ${newNick}`);
            break;
        }
        case '/lista': {
            const names = listNicks().join(', ');
            socket.write(`Usuarios conectados: ${names}
`);
            break;
        }
        case '/salir': {
            socket.end('Adiós!');
            break;
        }
        default:
            socket.write('Comando desconocido. Comandos: /nick, /lista, /salir');
    }
}


module.exports = { handleCommand };