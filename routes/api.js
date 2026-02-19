import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { s3, PUBLIC_BUCKET, PRIVATE_BUCKET } from '../config/aws.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
// ─────────────────────────────────────────────
// POST /api/login — Demo login handler
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Get real IP (EBS puts it in X-Forwarded-For)
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0')
    .split(',')[0].trim();

  // Randomize IP slightly for demo variety so the detection logic fires
  const demoIPs = [
    '49.36.' + Math.floor(Math.random() * 255) + '.10',
    '103.21.' + Math.floor(Math.random() * 255) + '.5',
    '122.160.' + Math.floor(Math.random() * 255) + '.20',
    '157.48.' + Math.floor(Math.random() * 255) + '.30',
    '223.190.' + Math.floor(Math.random() * 255) + '.15',
  ];

  const demoCities = [
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad'
  ];
  const randomIdx = Math.floor(Math.random() * demoIPs.length);
  const fakeIP = demoIPs[randomIdx];
  const fakeCountry = 'IN';
  const fakeCity = demoCities[Math.floor(Math.random() * demoCities.length)];

  try {
    // Check if user exists with matching password (plain text — demo only)
    const users = await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    const status = users.length > 0 ? 'success' : 'failed';

    // Insert log
    await query(
      `INSERT INTO login_logs (user_id, username, ip_address, status, user_agent, country, city)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        users[0]?.id || null,
        username,
        fakeIP,
        status,
        req.headers['user-agent'] || 'unknown',
        fakeCountry,
        fakeCity,
      ]
    );

    // Check for suspicious behavior after insert
    if (status === 'success') {
      await checkAndFlagSuspicious(username);
    }

    return res.json({
      success: status === 'success',
      message: status === 'success'
        ? `✅ Welcome back, ${username}!`
        : '❌ Invalid username or password',
      ip: fakeIP,
      location: `${fakeCity}, ${fakeCountry}`,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ─────────────────────────────────────────────
// Suspicious detection logic
// ─────────────────────────────────────────────
async function checkAndFlagSuspicious(username) {
  const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');

  // 1. Multiple IPs in 10 minutes
  const recentIPs = await query(
    `SELECT DISTINCT ip_address FROM login_logs
     WHERE username = ? AND status = 'success' AND logged_at >= ?`,
    [username, TEN_MINUTES_AGO]
  );

  // 2. Failed login count (total)
  const failedLogins = await query(
    `SELECT COUNT(*) as cnt FROM login_logs
     WHERE username = ? AND status = 'failed'`,
    [username]
  );

  const flags = [];
  let riskScore = 0;

  if (recentIPs.length >= 2) {
    flags.push(`Multiple IPs in 10 min (${recentIPs.length} IPs)`);
    riskScore += 50;
  }
  if (failedLogins[0].cnt >= 3) {
    flags.push(`${failedLogins[0].cnt} failed login attempts`);
    riskScore += failedLogins[0].cnt * 10;
  }

  if (flags.length > 0) {
    // Upsert suspicious_accounts
    await query(
      `INSERT INTO suspicious_accounts (username, risk_score, flags)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         risk_score = ?, flags = ?, last_updated = NOW(), lambda_processed = FALSE`,
      [username, riskScore, JSON.stringify(flags), riskScore, JSON.stringify(flags)]
    );
    console.log(`⚠️  Flagged ${username} as suspicious. Score: ${riskScore}`);
  }
}

// ─────────────────────────────────────────────
// GET /api/stats — Dashboard stats
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalLogins] = await query('SELECT COUNT(*) as cnt FROM login_logs');
    const [failedLogins] = await query("SELECT COUNT(*) as cnt FROM login_logs WHERE status = 'failed'");
    const [suspiciousAcc] = await query('SELECT COUNT(*) as cnt FROM suspicious_accounts');
    const [activeUsers] = await query('SELECT COUNT(DISTINCT username) as cnt FROM login_logs');
    res.json({
      totalLogins: totalLogins.cnt,
      failedLogins: failedLogins.cnt,
      suspiciousAcc: suspiciousAcc.cnt,
      activeUsers: activeUsers.cnt,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/recent-logins — Last 20 login events
// ─────────────────────────────────────────────
router.get('/recent-logins', async (req, res) => {
  try {
    const rows = await query(
      `SELECT username, ip_address, status, country, city,
              DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i:%s') as logged_at
       FROM login_logs
       ORDER BY logged_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/suspicious — Suspicious accounts
// ─────────────────────────────────────────────
router.get('/suspicious', async (req, res) => {
  try {
    // First try to read the Lambda-processed report from private S3
    const s3Report = await getPrivateS3Report();
    if (s3Report) {
      return res.json({ source: 'lambda-processed', data: s3Report });
    }

    // Fallback: read directly from RDS
    const rows = await query(
      `SELECT username, risk_score, flags, lambda_processed,
              DATE_FORMAT(last_updated, '%Y-%m-%d %H:%i:%s') as last_updated
       FROM suspicious_accounts
       ORDER BY risk_score DESC`
    );
    res.json({ source: 'rds-direct', data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getPrivateS3Report() {
  try {
    const data = await s3.getObject({
      Bucket: PRIVATE_BUCKET,
      Key: 'processed/suspicious_report.json',
    }).promise();
    return JSON.parse(data.Body.toString());
  } catch (e) {
    return null; // file doesn't exist yet
  }
}

// ─────────────────────────────────────────────
// POST /api/upload — Upload log file to public S3
// ─────────────────────────────────────────────
router.post('/upload', upload.single('logfile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const key = `logs/${uuidv4()}-${req.file.originalname}`;

  try {
    await s3.putObject({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }).promise();

    console.log(`📁 Uploaded to S3: s3://${PUBLIC_BUCKET}/${key}`);

    res.json({
      success: true,
      message: '✅ File uploaded to S3! SQS event triggered → Lambda will process it.',
      bucket: PUBLIC_BUCKET,
      key: key,
      size: req.file.size,
    });
  } catch (err) {
    console.error('S3 upload error:', err);
    res.status(500).json({
      success: false,
      message: 'S3 upload failed: ' + err.message,
      hint: 'Make sure S3_PUBLIC_BUCKET env var is set and IAM role has s3:PutObject permission',
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/login-chart — Data for chart (last 7 days)
// ─────────────────────────────────────────────
router.get('/login-chart', async (req, res) => {
  try {
    const rows = await query(
      `SELECT DATE(logged_at) as date,
              SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
              SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) as failed
       FROM login_logs
       WHERE logged_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(logged_at)
       ORDER BY date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

