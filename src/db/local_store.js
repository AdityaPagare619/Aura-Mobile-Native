import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

export class LocalDatabase {
    sqlite;
    db;

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    async init() {
        try {
            console.log('Initializing Aura Local Database...');
            this.db = await this.sqlite.createConnection(
                "aura_db",
                false,
                "no-encryption",
                1,
                false
            );

            await this.db.open();

            await this.db.execute(`
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          thought TEXT NOT NULL,
          type TEXT DEFAULT 'SHADOW',
          revealed INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await this.db.execute(`
        CREATE TABLE IF NOT EXISTS flow_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          time TEXT NOT NULL,
          status TEXT DEFAULT 'PENDING'
        );
      `);

            console.log('Database initialized successfully.');
            return true;
        } catch (err) {
            console.error('Database Init Error:', err);
            return false;
        }
    }

    async addThought(thought, type = 'SHADOW') {
        if (!this.db) return;
        const query = `INSERT INTO interactions (thought, type) VALUES ('${thought}', '${type}')`;
        await this.db.execute(query);
    }

    async getThoughts() {
        if (!this.db) return [];
        try {
            const result = await this.db.query("SELECT * FROM interactions ORDER BY id DESC");
            return result.values || [];
        } catch {
            return [];
        }
    }
}

export const dbService = new LocalDatabase();
