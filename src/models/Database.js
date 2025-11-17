const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const config = require("../config");

class Database {
  constructor() {
    const dbPath = config.database.path;
    const dataDir = path.dirname(dbPath);

    const fs = require("fs");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database");
        this.initTables();
      }
    });
  }

  initTables() {
    const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        `;

    const createSessionsTable = `
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error("Error creating users table:", err.message);
      } else {
        console.log("Users table ready");
      }
    });

    this.db.run(createSessionsTable, (err) => {
      if (err) {
        console.error("Error creating sessions table:", err.message);
      } else {
        console.log("Sessions table ready");
      }
    });
  }

  // Crear usuario
  async createUser(username, passwordHash) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO users (username, password_hash)
                VALUES (?, ?)
            `);

      stmt.run([username.toLowerCase(), passwordHash], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username });
        }
      });

      stmt.finalize();
    });
  }

  // Obtener usuario por username
  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
                SELECT * FROM users 
                WHERE username = ? AND is_active = 1
            `,
        [username.toLowerCase()],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Actualizar último login
  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = ?
            `,
        [userId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Crear sesión
  async createSession(userId, sessionId) {
    return new Promise((resolve, reject) => {
      // Primero desactivar sesiones anteriores del usuario
      this.db.run(
        `
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE user_id = ?
            `,
        [userId],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Crear nueva sesión
          const stmt = this.db.prepare(`
                    INSERT INTO user_sessions (user_id, session_id)
                    VALUES (?, ?)
                `);

          stmt.run([userId, sessionId], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ id: this.lastID });
            }
          });

          stmt.finalize();
        }
      );
    });
  }

  // Obtener sesión activa
  async getActiveSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
                SELECT s.*, u.username 
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_id = ? AND s.is_active = 1
            `,
        [sessionId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Obtener sesión activa por ID de usuario
  async getActiveSessionByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
                SELECT * FROM user_sessions 
                WHERE user_id = ? AND is_active = 1
            `,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Actualizar actividad de sesión
  async updateSessionActivity(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
                UPDATE user_sessions 
                SET last_activity = CURRENT_TIMESTAMP 
                WHERE session_id = ? AND is_active = 1
            `,
        [sessionId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Desactivar sesión (logout)
  async deactivateSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE session_id = ?
            `,
        [sessionId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Obtener usuarios activos (con sesiones activas)
  async getActiveUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
                SELECT DISTINCT u.username, u.last_login, s.last_activity
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.is_active = 1
                ORDER BY s.last_activity DESC
            `,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Limpiar sesiones expiradas
  async cleanExpiredSessions(minutesAgo = 60) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
                UPDATE user_sessions 
                SET is_active = 0 
                WHERE is_active = 1 
                AND datetime(last_activity) < datetime('now', '-${minutesAgo} minutes')
            `,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
        } else {
          console.log("Database connection closed");
        }
        resolve();
      });
    });
  }
}

module.exports = Database;
