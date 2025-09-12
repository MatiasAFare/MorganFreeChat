// funcion que verifica si un nick ya está en uso. Para el /nick ( Cuando se modifica el nick )

for (let n of clients.values()) {
    if (n === user) {
        socket.write("Ese nick ya está en uso. Intenta con otro.\n");
        return; // no desconectamos, cliente puede reintentar
    }
}