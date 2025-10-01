class WebSocketClient {
    constructor() {
        this.ws = null;
        this.token = null;
        this.isAuthenticated = false;
        this.serverUrl = this.getWebSocketUrl();
        this.eventHandlers = {};
        this.reconnectInterval = 5000;
        this.shouldReconnect = false;

        this.handleOpen = this.handleOpen.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = 8080;
        return `${protocol}//${host}:${port}`;
    }

    on(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(callback);
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => callback(data));
        }
    }

    connect(token) {
        if (this.ws) {
            this.disconnect();
        }

        this.token = token;
        this.shouldReconnect = true;

        try {
            this.ws = new WebSocket(this.serverUrl);
            this.ws.addEventListener('open', this.handleOpen);
            this.ws.addEventListener('message', this.handleMessage);
            this.ws.addEventListener('close', this.handleClose);
            this.ws.addEventListener('error', this.handleError);
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            this.attemptReconnect();
        }
    }

    handleOpen() {
        console.log('WebSocket connected');

        // Enviar token de autenticación
        if (this.token) {
            this.sendRaw({
                type: 'authenticate',
                token: this.token
            });
        }
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.emit(message.type, message.data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    handleClose(event) {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isAuthenticated = false;

        if (this.shouldReconnect && event.code !== 1000) {
            this.attemptReconnect();
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
    }

    sendRaw(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Error sending message:', error);
                return false;
            }
        }
        return false;
    }

    sendChatMessage(content) {
        return this.sendRaw({
            type: 'chat_message',
            content: content
        });
    }

    attemptReconnect() {
        if (this.shouldReconnect && this.token) {
            console.log('Attempting reconnection in', this.reconnectInterval / 1000, 'seconds...');
            setTimeout(() => {
                if (this.shouldReconnect) {
                    this.connect(this.token);
                }
            }, this.reconnectInterval);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close(1000);
            this.ws = null;
            this.token = null;
            this.isAuthenticated = false;
        }
    }
}

// Instancia global del cliente WebSocket
const wsClient = new WebSocketClient();