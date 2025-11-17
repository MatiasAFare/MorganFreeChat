// Cifrado AES-256-CBC para mensajes
const crypto = require("crypto");
const config = require("../config");

// Configuración del cifrado
const ALGORITHM = "aes-256-cbc";

/**
 * Derivar clave desde la passphrase usando SHA-256
 * Usada tanto en servidor como en cliente
 */
function deriveKey(passphrase) {
  return crypto.createHash("sha256").update(String(passphrase)).digest();
}

// Crear la clave derivada una sola vez
const SECRET_KEY = deriveKey(config.encryption.key);

console.log(
  "[CRYPTO] Clave derivada (32 bytes):",
  SECRET_KEY.toString("hex")
);

/**
 * Obtener la clave en formato base64 para inyectar en el cliente
 */
function getKeyForClient() {
  const b64 = SECRET_KEY.toString("base64");
  console.log("[CRYPTO] Clave inyectada en cliente (B64):", b64);
  return b64;
}

/**
 * Cifra un mensaje y devuelve { encrypted, iv }
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  console.log("[CRYPTO] Mensaje cifrado:", {
    original: text,
    encrypted: encrypted,
    iv: iv.toString("hex"),
  });
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

module.exports = { encrypt, decrypt, getKeyForClient };
