// Cifrado AES-256-CBC para mensajes
const crypto = require("crypto");
const config = require("../config");

// Configuración del cifrado
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.scryptSync(config.encryption.key, "salt", 32);
const IV = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");

  return { encrypted };
}

function decrypt(encryptedData) {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
    const decrypted =
      decipher.update(encryptedData.encrypted, "hex", "utf8") +
      decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error al descifrar:", error);
    return "[Error al descifrar mensaje]";
  }
}

module.exports = { encrypt, decrypt };
