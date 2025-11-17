// crypto-client.js (navegador) - PoC: deriva una clave de la passphrase y descifra AES-CBC
class ClientCrypto {
  constructor() {
    this.passphrase = window.__ENCRYPTION_PASSPHRASE__ || "MorganFreeChatAESKey2025Secret!";
    this.keyPromise = null;
  }

  _encode(str) {
    return new TextEncoder().encode(str);
  }

  async _getKey() {
    if (this.keyPromise) return this.keyPromise;
    this.keyPromise = (async () => {
      const passBuf = this._encode(this.passphrase);
      const hash = await crypto.subtle.digest("SHA-256", passBuf);
      return crypto.subtle.importKey("raw", hash, { name: "AES-CBC" }, false, ["decrypt"]);
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

      const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuf }, key, cipherBuf);
      const text = new TextDecoder().decode(plainBuf);
      return text;
    } catch (error) {
      console.error("Error decrypting message:", error);
      return "[Mensaje cifrado]";
    }
  }
}

const clientCrypto = new ClientCrypto();
