const clients = new Map(); // socket -> { id, nick }
let clientIdCounter = 1;


function addClient(socket) {
    const id = clientIdCounter++;
    const nick = `User${id}`;
    clients.set(socket, { id, nick });
    return clients.get(socket);
}


function removeClient(socket) {
    clients.delete(socket);
}


function getClient(socket) {
    return clients.get(socket);
}


function listNicks() {
    return Array.from(clients.values()).map(c => c.nick);
}


function broadcast(message) {
    for (const [sock] of clients.entries()) {
        try {
            sock.write(message + ' ');
        } catch (err) {
            console.error('Error enviando a un cliente:', err.message);
        }
    }
    console.log('Broadcast:', message);
}


module.exports = { addClient, removeClient, getClient, listNicks, broadcast, clients };