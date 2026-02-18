import mysql from 'mysql2/promise.js';

let pool;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'securitydb',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
};

async function initializeDatabase() {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL database");

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await conn.query(`USE \`${dbConfig.database}\``);

    // Users table
    await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      username    VARCHAR(100) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      email       VARCHAR(255),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Login logs table
    await conn.query(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT,
      username    VARCHAR(100),
      ip_address  VARCHAR(50),
      status      ENUM('success','failed') DEFAULT 'success',
      user_agent  TEXT,
      country     VARCHAR(100),
      city        VARCHAR(100),
      logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

    // Suspicious accounts table (updated by Lambda)
    await conn.query(`
        CREATE TABLE IF NOT EXISTS suspicious_accounts (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        username            VARCHAR(100),
        risk_score          INT DEFAULT 0,
        flags               JSON,
        last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lambda_processed    BOOLEAN DEFAULT FALSE,
        s3_report_key       VARCHAR(500)
        )
    `);
    // Seed demo users (Indian names)
    await conn.query(`
        INSERT IGNORE INTO users (username, password, email) VALUES
            ('aarav',   'demo123', 'aarav@example.com'),
            ('priya',   'demo123', 'priya@example.com'),
            ('rohan',   'demo123', 'rohan@example.com'),
            ('ananya',  'demo123', 'ananya@example.com'),
            ('vivek',   'demo123', 'vivek@example.com')
        `);

    // Seed some existing login logs for the demo (India-based)
    await conn.query(`
        INSERT IGNORE INTO login_logs (username, ip_address, status, country, city) VALUES
            ('aarav',   '49.36.120.10',  'success', 'IN', 'Mumbai'),
            ('aarav',   '49.36.121.22',  'success', 'IN', 'Delhi'),
            ('aarav',   '103.27.9.100',  'failed',  'IN', 'Bengaluru'),
            ('aarav',   '103.27.9.101',  'failed',  'IN', 'Bengaluru'),
            ('aarav',   '103.27.9.102',  'failed',  'IN', 'Bengaluru'),
            ('priya',   '122.160.45.5',  'success', 'IN', 'Pune'),
            ('rohan',   '106.51.32.1',   'failed',  'IN', 'Chennai'),
            ('rohan',   '106.51.32.2',   'failed',  'IN', 'Hyderabad'),
            ('rohan',   '106.51.32.3',   'failed',  'IN', 'Kolkata')
    `);

    conn.release();
    console.log("✅ Database initialized with tables and demo data");
}

function getPool() {
    return pool;
}

async function query(sql, params) {
    if (!pool) throw new Error("Database not initialized. Call initializeDatabase() first.");
    const [results] = await pool.query(sql, params);
    return results;
}

export { initializeDatabase, getPool, query };