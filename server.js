import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
dotenv.config();


// serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// health check (for EB)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});



app.get('/create-db', async (req, res) => {
  try {
    // simple protection key (change this value)
    const secret = req.query.key;
    if (secret !== "mySuperSecret123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
      // ⚠️ no database selected
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS app_database`);

    await connection.end();

    res.json({ success: true, message: "Database created or already exists" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Test DB route
app.get('/check-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({
      success: true,
      message: "Database connected",
      result: rows[0].result
    });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Insert login record (for your project)
app.post('/login', (req, res) => {
  const { username } = req.body;
  const ip = req.ip;

  db.query(
    'INSERT INTO login_logs (username, ip_address) VALUES (?, ?)',
    [username, ip],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Login recorded successfully" });
    }
  );
});


// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})