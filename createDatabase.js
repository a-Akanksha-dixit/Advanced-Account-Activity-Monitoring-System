import mysql from 'mysql2/promise';
import 'dotenv/config';

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
      // ⚠️ DO NOT put database here
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS app_database`);

    console.log("✅ Database 'app_database' created or already exists");

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating database:", error);
    process.exit(1);
  }
}

createDatabase();
