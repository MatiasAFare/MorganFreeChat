class ClientCrypto {
    decrypt(encryptedData) {
        try {
            return atob(encryptedData.encrypted);
        } catch (error) {
            console.error('Error decrypting:', error);
            return '[Mensaje cifrado]';
        }
    }
}

const clientCrypto = new ClientCrypto();