import mysql from 'mysql2';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // RDS endpoint
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
}).promise();

// Optional: Test connection at startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to RDS MySQL");
    connection.release();
  } catch (error) {
    console.error("❌ RDS Connection failed:", error);
  }
})();

export default pool;
