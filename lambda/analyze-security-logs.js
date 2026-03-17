/**
 * Lambda Function: analyze-security-logs
 *
 * Trigger: Amazon EventBridge (Scheduled Rule)
 *
 * Schedule:
 *   rate(1 day) or cron(0 0 * * ? *) for daily analysis
 *
 * Purpose:
 *   Performs automated security analytics on user login activity.
 *   Detects suspicious behavior such as multiple IP logins and
 *   repeated failed login attempts.
 *
 * Flow:
 *   1. EventBridge triggers the Lambda every day once at midnight
 *   2. Lambda connects to Amazon RDS
 *   3. Queries the login_logs table for recent activity
 *   4. Aggregates login metrics per user
 *   5. Detects suspicious patterns
 *   6. Calculates a risk score
 *   7. Updates the suspicious_accounts table
 *
 * Data Sources:
 *   Amazon RDS
 *     └── login_logs (raw login activity)
 *
 * Data Output:
 *   Amazon RDS
 *     └── suspicious_accounts (risk analysis results)
 *
 * Security Analytics Rules:
 *   • Multiple successful logins from different IPs within 1 day
 *   • Multiple failed login attempts
 *
 * Example Detection Scenario:
 *
 *   User: alice
 *   Login 1 → Mumbai
 *   Login 2 → Delhi
 *   Login 3 → Bangalore
 *
 *   Result:
 *   risk_score = 50
 *   flags = ["Multiple IPs detected"]
 *
 * Environment Variables:
 *   DB_HOST       — RDS endpoint
 *   DB_USER       — database username
 *   DB_PASSWORD   — database password
 *   DB_NAME       — database name
 *
 * AWS Services Used:
 *   • Amazon EventBridge (scheduled trigger)
 *   • AWS Lambda (serverless analytics)
 *   • Amazon RDS (data storage and analysis)
 *   • Amazon CloudWatch Logs (monitoring)
 */

const mysql = require("mysql2/promise");

let connection;

exports.handler = async () => {
  try {

    if (!connection || connection.connection._closing) {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
    }

    console.log("🔍 Running security analytics...");

    const [results] = await connection.execute(`
      SELECT
        username,
        COUNT(DISTINCT CASE WHEN status='success' THEN ip_address END) AS unique_ips,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_logins
      FROM login_logs
      WHERE logged_at >= NOW() - INTERVAL INTERVAL 1 DAY
      GROUP BY username
    `);

    console.log(`Users analyzed: ${results.length}`);

    for (const row of results) {

      let flags = [];
      let riskScore = 0;

      if (row.unique_ips >= 2) {
        flags.push(`Multiple IPs (${row.unique_ips})`);
        riskScore += 50;
      }

      if (row.failed_logins >= 3) {
        flags.push(`${row.failed_logins} failed login attempts`);
        riskScore += row.failed_logins * 10;
      }

      if (flags.length > 0) {

        await connection.execute(
          `INSERT INTO suspicious_accounts
          (username, risk_score, flags)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            risk_score=?,
            flags=?,
            last_updated=NOW()`,
          [
            row.username,
            riskScore,
            JSON.stringify(flags),
            riskScore,
            JSON.stringify(flags)
          ]
        );

        console.log(`⚠️ Suspicious user: ${row.username}`);
      }
    }

    console.log("✅ Analytics completed");

    return { statusCode: 200 };

  } catch (err) {
    console.error("Lambda error:", err);
    return { statusCode: 500 };
  }
};