class ChatApp {
  constructor() {
    this.currentUser = null;
    this.isLoggedIn = false;

    this.authScreen = document.getElementById("auth-screen");
    this.chatScreen = document.getElementById("chat-screen");
    this.loginForm = document.getElementById("login-form");
    this.registerForm = document.getElementById("register-form");
    this.messagesContainer = document.getElementById("messages-container");
    this.messageInput = document.getElementById("message-input");
    this.usernameDisplay = document.getElementById("username-display");
    this.authError = document.getElementById("auth-error");
    this.modal = document.getElementById("modal");

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupWebSocketEvents();
    this.checkStoredCredentials();
  }

  setupEventListeners() {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById("registerForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    document.getElementById("show-register").addEventListener("click", (e) => {
      e.preventDefault();
      this.showRegisterForm();
    });

    document.getElementById("show-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    document.getElementById("message-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      this.logout();
    });

    document.getElementById("modal-ok").addEventListener("click", () => {
      this.closeModal();
    });
  }

  setupWebSocketEvents() {
    wsClient.on("auth_success", (data) => {
      this.updateConnectionStatus("connected");
      this.handleAuthSuccess(data);
    });

    wsClient.on("chat_message", async (data) => {
      let content;
      if (data.encrypted) {
        // 🔒 Mostrar mensaje cifrado en consola
        console.log("%c📩 Mensaje recibido cifrado:", "color: #f59e0b; font-weight: bold");
        console.log("   Usuario:", data.username);
        console.log("   Encrypted:", data.content.encrypted);
        console.log("   IV:", data.content.iv);
        
        try {
          content = await clientCrypto.decrypt(data.content);
          
          // 🔓 Mostrar mensaje descifrado
          console.log("%c   ✅ Descifrado:", "color: #10b981; font-weight: bold", content);
          console.log("---");
        } catch (err) {
          console.error("Error decrypting message in client:", err);
          content = "[Mensaje cifrado]";
        }
      } else {
        content = data.content;
      }
      this.addMessage(data.username, content, "chat", data.timestamp);
    });

    wsClient.on("system", (data) => {
      this.addMessage("Sistema", data.message, "system");
    });

    wsClient.on("user_joined", (data) => {
      this.addMessage("Sistema", data.message, "user-event");
    });

    wsClient.on("user_left", (data) => {
      this.addMessage("Sistema", data.message, "user-event");
    });

    wsClient.on("kicked", (data) => {
      this.logout();
      this.showModal(
        "Desconectado",
        data.reason || "Se ha iniciado sesión desde otra ubicación."
      );
    });

    wsClient.ws?.addEventListener("close", () => {
      this.updateConnectionStatus("reconnecting");
    });

    wsClient.ws?.addEventListener("open", () => {
      if (this.isLoggedIn) {
        this.updateConnectionStatus("connected");
      }
    });
  }

  async handleLogin() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      this.showAuthError("Por favor, completa todos los campos");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("morgan_chat_token", result.token);
        localStorage.setItem("morgan_chat_username", result.user.username);
        this.currentUser = result.user.username;
        this.connectWebSocket(result.token);
      } else {
        this.showAuthError(result.message || "Error de autenticación");
      }
    } catch (error) {
      this.showAuthError("Error de conexión con el servidor");
    }
  }

  async handleRegister() {
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm").value;

    if (!username || !password || !confirmPassword) {
      this.showAuthError("Por favor, completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.showModal(
          "¡Registro exitoso!",
          "Tu cuenta ha sido creada. Ahora puedes iniciar sesión."
        );
        this.showLoginForm();
        document.getElementById("login-username").value = username;
      } else {
        this.showAuthError(result.message || "Error en el registro");
      }
    } catch (error) {
      this.showAuthError("Error de conexión con el servidor");
    }
  }

  connectWebSocket(token) {
    wsClient.connect(token);
  }

  handleAuthSuccess(data) {
    this.isLoggedIn = true;
    this.usernameDisplay.textContent = data.username;
    this.showChatScreen();
    this.enableChatInput();
    this.clearForms();
    localStorage.removeItem("morgan_chat_intentional_disconnect");
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content) return;

    const success = wsClient.sendChatMessage(content);
    if (success) {
      this.messageInput.value = "";
    }
  }

  addMessage(username, content, type = "chat", timestamp = null) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;

    const time = timestamp ? new Date(timestamp) : new Date();
    const timeStr = time.toLocaleTimeString();

    messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-username">${this.escapeHtml(
                  username
                )}</span>
                <span class="message-timestamp">${timeStr}</span>
            </div>
            <div class="message-content">${this.escapeHtml(content)}</div>
        `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showAuthScreen() {
    this.authScreen.classList.add("active");
    this.chatScreen.classList.remove("active");
  }

  showChatScreen() {
    this.authScreen.classList.remove("active");
    this.chatScreen.classList.add("active");
    this.messageInput.focus();
  }

  showLoginForm() {
    this.loginForm.classList.add("active");
    this.registerForm.classList.remove("active");
    this.hideAuthError();
  }

  showRegisterForm() {
    this.loginForm.classList.remove("active");
    this.registerForm.classList.add("active");
    this.hideAuthError();
  }

  showAuthError(message) {
    this.authError.textContent = message;
    this.authError.classList.add("active");
  }

  hideAuthError() {
    this.authError.classList.remove("active");
  }

  showModal(title, message) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = `<p>${this.escapeHtml(
      message
    )}</p>`;
    this.modal.classList.add("active");
  }

  closeModal() {
    this.modal.classList.remove("active");
  }

  enableChatInput() {
    this.messageInput.disabled = false;
    document.getElementById("send-btn").disabled = false;
  }

  clearForms() {
    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();
  }

  checkStoredCredentials() {
    const token = localStorage.getItem("morgan_chat_token");
    const username = localStorage.getItem("morgan_chat_username");
    const intentionalDisconnect = localStorage.getItem(
      "morgan_chat_intentional_disconnect"
    );

    if (intentionalDisconnect === "true") {
      localStorage.removeItem("morgan_chat_intentional_disconnect");
      localStorage.removeItem("morgan_chat_token");
      localStorage.removeItem("morgan_chat_username");
      return;
    }

    if (token && username) {
      this.currentUser = username;
      this.connectWebSocket(token);
    }
  }

  logout() {
    localStorage.setItem("morgan_chat_intentional_disconnect", "true");
    localStorage.removeItem("morgan_chat_token");
    localStorage.removeItem("morgan_chat_username");
    this.currentUser = null;
    this.isLoggedIn = false;
    wsClient.disconnect();
    this.showAuthScreen();
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById("connection-status");
    if (statusElement) {
      statusElement.className = `status-${status}`;
      statusElement.textContent =
        {
          connected: "🟢",
          disconnected: "🔴",
          reconnecting: "🟡",
        }[status] || "🔴";
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new ChatApp();

  window.addEventListener("beforeunload", (event) => {
    if (app.isLoggedIn && app.currentUser) {
      localStorage.setItem("morgan_chat_intentional_disconnect", "true");
      if (wsClient.ws && wsClient.ws.readyState === WebSocket.OPEN) {
        wsClient.ws.send(JSON.stringify({ type: "logout" }));
      }
      wsClient.shouldReconnect = false;
    }
  });

  window.addEventListener("unload", () => {
    if (app.isLoggedIn && wsClient.ws) {
      wsClient.ws.close();
    }
  });
});
