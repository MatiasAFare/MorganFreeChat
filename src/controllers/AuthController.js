// Controlador de Autenticación - Manejo de login/registro
const { registerUser, authenticateUser } = require('../services/AuthService');
const logger = require('../utils/logger');

class AuthController {
    // Manejar registro de usuario
    static async handleRegister(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username y password son requeridos'
                });
            }

            const result = await registerUser(username, password);
            const statusCode = result.success ? 201 : 400;

            logger.info('Intento de registro', {
                username,
                success: result.success
            });

            res.status(statusCode).json(result);

        } catch (error) {
            logger.error('Error en registro', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Manejar login de usuario
    static async handleLogin(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username y password son requeridos'
                });
            }

            const result = await authenticateUser(username, password);
            const statusCode = result.success ? 200 : 401;

            logger.info('Intento de login', {
                username,
                success: result.success
            });

            res.status(statusCode).json(result);

        } catch (error) {
            logger.error('Error en login', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;