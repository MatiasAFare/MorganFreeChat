// crypto-client.js (navegador) - Descifra AES-CBC usando clave derivada (base64)
class ClientCrypto {
  constructor() {
    this.keyArrayBuf = null;
    this.keyPromise = null;
  }

  _ensureKeyLoaded() {
    // Validar que la clave esté inyectada por el servidor (lazy validation)
    if (!window.__ENCRYPTION_KEY_B64__) {
      throw new Error(
        "ENCRYPTION_KEY no está configurada. " +
        "El servidor debe inyectar window.__ENCRYPTION_KEY_B64__"
      );
    }
    
    // Convertir la clave de base64 a Uint8Array solo una vez
    if (!this.keyArrayBuf) {
      this.keyArrayBuf = this._base64ToArrayBuffer(window.__ENCRYPTION_KEY_B64__);
      console.log(
        "%c🔑 Clave recibida (B64):",
        "color: #8b5cf6; font-weight: bold",
        window.__ENCRYPTION_KEY_B64__
      );
      console.log(
        "%c   → Convertida a buffer de",
        "color: #8b5cf6",
        new Uint8Array(this.keyArrayBuf).length,
        "bytes"
      );
    }
  }

  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async _getKey() {
    if (this.keyPromise) return this.keyPromise;
    this._ensureKeyLoaded();
    this.keyPromise = (async () => {
      return crypto.subtle.importKey(
        "raw",
        this.keyArrayBuf,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
      );
    })();
    return this.keyPromise;
  }

  _hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }

  async decrypt(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv) {
        throw new Error("Formato de cifrado inválido");
      }

      const key = await this._getKey();
      const ivBuf = this._hexToBuffer(encryptedData.iv);
      const cipherBuf = this._hexToBuffer(encryptedData.encrypted);

      console.log(
        "%c🔐 Descifrando:",
        "color: #f59e0b; font-weight: bold",
        "IV size:",
        new Uint8Array(ivBuf).length,
        "bytes, Cipher size:",
        new Uint8Array(cipherBuf).length,
        "bytes"
      );

      const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuf }, key, cipherBuf);
      const text = new TextDecoder().decode(plainBuf);
      console.log(
        "%c✅ Descifrado OK:",
        "color: #10b981; font-weight: bold",
        text
      );
      return text;
    } catch (error) {
      console.error(
        "%c❌ Error al descifrar:",
        "color: #ef4444; font-weight: bold",
        error
      );
      return "[Mensaje cifrado]";
    }
  }
}

const clientCrypto = new ClientCrypto();
