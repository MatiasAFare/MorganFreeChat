// Cifrado AES-256-CBC para mensajes
const crypto = require("crypto");
const config = require("../config");

// Configuración del cifrado
const ALGORITHM = "aes-256-cbc";
// Derivar clave con SHA-256 para compatibilidad con Web Crypto en el navegador (PoC)
const SECRET_KEY = crypto.createHash("sha256").update(String(config.encryption.key)).digest();

/**
 * Cifra un mensaje y devuelve { encrypted, iv }
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

/**
 * Descifra un objeto { encrypted, iv }
 */
function decrypt(encryptedData) {
  try {
    const iv = Buffer.from(encryptedData.iv, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    const decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8") + decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Error al descifrar:", error);
    return "[Error al descifrar mensaje]";
  }
}

module.exports = { encrypt, decrypt };
