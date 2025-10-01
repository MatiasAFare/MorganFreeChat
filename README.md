
<div align="center">
  <img src="server/images/MorganOh.png" alt="MorganFreeChat" width="120"/>
  
  # 🗨️ MorganFreeChat
  
  <b>Chat multiusuario por consola usando Node.js y TCP</b>
</div>

---

## 📚 Consignas

Cada estudiante debe entregar:
- Código fuente completo, con la implementación realizada en clase.
- Documentación del proyecto, incluyendo:
  - Explicación del funcionamiento del sistema.
  - Instrucciones para ejecutar el servidor y conectarse como cliente.
  - Ejemplos de uso y pruebas realizadas.

---

## 🚀 ¿Cómo funciona?

MorganFreeChat es un chat multiusuario por consola, donde los clientes se conectan a un servidor TCP y pueden:
- Enviar mensajes a todos los usuarios conectados
- Cambiar su nick (`/nick`)
- Ver la lista de usuarios (`/lista`)
- Salir del chat (`/salir`)
Todos los mensajes y eventos quedan registrados en logs.

---

## ⚡ Instalación y ejecución

1. Clona el repositorio:
	```bash
	git clone https://github.com/MatiasAFare/MorganFreeChat.git
	cd MorganFreeChat
	```
2. Instala Node.js (v14+ recomendado).
3. Instala dependencias (si las hubiera):
	```bash
	npm install
	```
4. Inicia el servidor:
	```bash
	npm start
	```
5. En otra terminal, ejecuta el cliente:
	```bash
	npm run client
	```

---

## 💻 Ejemplo de uso

```
Elige tu nick: Carlos
Conectado al servidor como Carlos
Carlos: Hola a todos!
```

Comandos disponibles:
- `/nick NUEVO_NICK` — Cambia tu nick
- `/lista` — Muestra los usuarios conectados
- `/salir` — Salir del chat

---

## 📝 Logs y pruebas

Todos los mensajes y eventos quedan registrados en `logs/chat.log` y `logs/chat.md`.

Ejemplo de log:
```
[2025-10-01T15:46:58.951Z] Carlos se ha unido al chat
```

---

## 📄 Autor

Fagove — 2025