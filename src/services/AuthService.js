const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('../models/Database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'morgan_free_chat_super_secret_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const db = new Database();

async function hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

async function registerUser(username, password) {
    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        if (username.length < 3 || username.length > 20) {
            throw new Error('Username must be between 3 and 20 characters');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const existingUser = await db.getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        const hashedPassword = await hashPassword(password);

        const user = await db.createUser(username, hashedPassword);

        console.log(`Usuario registrado: ${username}`);

        return {
            success: true,
            message: 'User registered successfully',
            username
        };

    } catch (error) {
        console.error(`Error registering user ${username}:`, error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

async function authenticateUser(username, password) {
    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const user = await db.getUserByUsername(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.is_active) {
            throw new Error('User account is inactive');
        }

        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const sessionId = require('crypto').randomUUID();
        const payload = {
            username: user.username,
            userId: user.id,
            sessionId,
            loginTime: Date.now()
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await db.updateLastLogin(user.id);

        await db.createSession(user.id, sessionId);

        console.log(`Usuario autenticado: ${username}`);

        return {
            success: true,
            token,
            user: {
                username: user.username,
                sessionId
            }
        };

    } catch (error) {
        console.error(`Error authenticating user ${username}:`, error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

async function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const session = await db.getActiveSession(decoded.sessionId);
        if (!session || session.user_id !== decoded.userId) {
            return null;
        }

        await db.updateSessionActivity(decoded.sessionId);

        return decoded;
    } catch (error) {
        console.error('Invalid token:', error.message);
        return null;
    }
}

async function getActiveUsers() {
    try {
        return await db.getActiveUsers();
    } catch (error) {
        console.error('Error getting active users:', error);
        return [];
    }
}

async function cleanExpiredSessions() {
    try {
        await db.cleanExpiredSessions(30); // 30 minutos
        console.log('Cleaned expired sessions');
    } catch (error) {
        console.error('Error cleaning expired sessions:', error);
    }
}

setInterval(cleanExpiredSessions, 5 * 60 * 1000);

async function closeDatabase() {
    await db.close();
}

process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
});

module.exports = {
    registerUser,
    authenticateUser,
    verifyToken,
    getActiveUsers,
    cleanExpiredSessions,
    closeDatabase
};