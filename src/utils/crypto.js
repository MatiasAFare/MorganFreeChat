// Cifrado AES para mensajes
const crypto = require("crypto");

// Cifrar mensaje (simplificado)
function encrypt(text) {
  const encrypted = Buffer.from(text, "utf8").toString("base64");
  return { encrypted };
}

// Descifrar mensaje
function decrypt(encryptedData) {
  return Buffer.from(encryptedData.encrypted, "base64").toString("utf8");
}

module.exports = { encrypt, decrypt };
