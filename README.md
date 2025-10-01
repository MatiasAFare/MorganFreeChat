# MorganFreeChat

Aplicación de chat multiusuario en tiempo real con autenticación JWT y cifrado de mensajes.

## Descripción

MorganFreeChat es una aplicación de chat que permite comunicación en tiempo real entre múltiples usuarios. Implementa WebSockets para comunicación instantánea, autenticación segura mediante JWT y cifrado AES para los mensajes.

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js, WebSockets
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Base de datos**: SQLite3
- **Autenticación**: JSON Web Tokens (JWT)
- **Cifrado**: AES-256 para mensajes
- **Logging**: Winston para logs del sistema

## Instalación

### Requisitos previos
- Node.js 18 o superior
- npm 9 o superior

### Instalación
```bash
git clone https://github.com/MatiasAFare/MorganFreeChat.git
cd MorganFreeChat
npm install
```

## Configuración

El archivo `.env` ya está incluido con la configuración básica. Para producción, modifica las siguientes variables:

```bash
JWT_SECRET=tu_clave_secreta_jwt
ENCRYPTION_KEY=tu_clave_de_cifrado_aes
```

## Uso

### Iniciar el servidor
```bash
npm start
```

### Acceso
- **Cliente web**: http://localhost:3000
- **WebSocket server**: ws://localhost:8080

### Registro y autenticación
1. Abrir http://localhost:3000 en el navegador
2. Crear una cuenta nueva o iniciar sesión
3. Comenzar a chatear con otros usuarios conectados

## Arquitectura

La aplicación sigue una arquitectura MVC con separación clara de responsabilidades:

### Componentes principales
- **src/services/**: Servidores HTTP y WebSocket
- **src/controllers/**: Lógica de negocio (chat, autenticación)
- **src/models/**: Modelos de datos (base de datos SQLite)
- **src/client/**: Cliente web (HTML, CSS, JavaScript)
- **src/utils/**: Utilidades (logging, cifrado)
- **src/config/**: Configuración centralizada

## Funcionalidades

### Autenticación
- Registro e inicio de sesión de usuarios
- Autenticación con JWT tokens
- Cifrado de contraseñas con bcrypt
- Gestión de sesiones

### Chat en tiempo real
- Comunicación instantánea via WebSockets
- Mensajes cifrados con AES-256
- Sistema de comandos (/nick, /lista, /help, /salir)
- Reconexión automática
- Desconexión al cerrar ventana/pestaña

### Logging
- Registro completo de actividad del chat
- Logs almacenados en `src/logs/chat-messages.log`

## API

### Endpoints REST
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión

### Comandos de chat
- `/nick <nombre>` - Cambiar nombre de usuario
- `/lista` - Ver usuarios conectados  
- `/help` - Mostrar ayuda
- `/salir` - Salir del chat

## Estructura del proyecto

```
src/
├── client/          # Cliente web (HTML, CSS, JS)
├── config/          # Configuración centralizada
├── controllers/     # Controladores (chat, autenticación)
├── data/           # Base de datos SQLite
├── logs/           # Archivos de log
├── models/         # Modelos de datos
├── services/       # Servicios (HTTP, WebSocket)
└── utils/          # Utilidades (logging, cifrado)
```

## Licencia

Este proyecto está bajo la Licencia ISC. 
