# Account Activity Monitoring System — SecureWatch
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazonaws)](http://account-activity-monitor.us-east-1.elasticbeanstalk.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)]()
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-black?logo=githubactions)](https://github.com/features/actions)
[![CD](https://img.shields.io/badge/CD-GitHub%20Actions-black?logo=githubactions)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-blue)]()

> Scalable event-driven log monitoring system on AWS — detecting suspicious account activity in real time.

**Live:** `http://account-activity-monitor.us-east-1.elasticbeanstalk.com/` &nbsp;|&nbsp; `/health` &nbsp;·&nbsp; `/api/activity` &nbsp;·&nbsp; `/api/summary`

> **Try it:** Use the **SecureWatch Demo Login** on the dashboard — login events are stored in RDS and scored by the nightly analytics pipeline.

---

## Preview

![Dashboard](https://raw.githubusercontent.com/a-Akanksha-dixit/my-assets/main/screenshots/dashboard.png)
> Dashboard showing log upload, demo login form, and live risk scores.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER (Browser)                             │
│                      Elastic Beanstalk Dashboard                     │
│         Upload Logs · View Risk Scores · SecureWatch Demo Login      │
└────────────────┬───────────────────────────┬─────────────────────────┘
                 │ Upload Log                │ Demo Login
                 ▼                           ▼
┌────────────────────────┐       ┌───────────────────────────┐
│       Amazon S3        │       │         Amazon RDS        │
│  (Activity Log Store)  │       │  login_events (raw logs)  │
│  Versioning · Lifecycle│       └───────────────────────────┘
└───────┬────────────────┘                   ▲
        │ ObjectCreated   │ ObjectRemoved     │
        ▼                 ▼                  │ scores written back
  ┌──────────┐      ┌──────────┐             │
  │   SQS    │      │   SNS    │    ┌────────────────────────┐
  └────┬─────┘      └────┬─────┘    │  EventBridge           │
       │                 │          │  rate(1 day)           │
       ▼                 ▼          │  → Lambda              │
  ┌──────────┐    ┌──────────────┐  │  → scan last 24h logs  │
  │  Lambda  │    │    Lambda    │  │  → update risk scores  │
  │  Parser  │    │ Sec. Auditor │  └────────────────────────┘
  └────┬─────┘    └──────┬───────┘
       │                 │
       ▼                 ▼
  ┌──────────┐    ┌──────────────┐
  │   RDS    │    │   DynamoDB   │
  │  scores  │    │ audit events │
  └──────────┘    └──────────────┘

  CloudWatch     ── Logs · Metrics · Alarms · Dashboard
  GitHub Actions ── Push → Build/Test → Deploy to Beanstalk
```

---

## VPC Design

```
VPC (Multi-AZ)
 ├── Public  AZ1 → Elastic Beanstalk
 ├── Public  AZ2 → Elastic Beanstalk
 ├── Private AZ1 → RDS (Primary)
 └── Private AZ2 → RDS (Standby)
```

> RDS has no public access. Security groups allow only Beanstalk instances to connect.

---

## Services

| Layer | Services |
|---|---|
| Compute | Elastic Beanstalk (Node.js) |
| Storage | S3, RDS (MySQL), DynamoDB |
| Messaging | SQS, SNS |
| Serverless | Lambda |
| Automation | EventBridge |
| Monitoring | CloudWatch |
| Security | IAM, Secrets Manager, VPC/Security Groups |
| CI/CD | GitHub Actions |

---

## Pipelines

### Log Processing
```
Upload → S3 → SQS → Lambda → RDS (risk scores)
```

### Demo Login
```
SecureWatch Login Form → Beanstalk API → RDS (login_events table)
```

### Security Audit (Deletion Tracking)
```
Delete → S3 → SNS → Lambda → DynamoDB (audit record)
```

### Scheduled Analytics
```
EventBridge (rate: 1 day) → Lambda → scan last 24h login_events → update suspicious_accounts
```

---

## Risk Detection

The analytics Lambda scans `login_logs` and flags:

| Signal | Example | Risk |
|---|---|---|
| Multiple IPs in short window | Mumbai → Delhi → Bangalore | Account sharing / compromise |
| Repeated failed logins | 5 failures in 10 min | Brute force / credential stuffing |

Flagged accounts are written to `suspicious_accounts` with a risk score + flag list.

```json
{
  "username": "alice",
  "risk_score": 70,
  "flags": ["Multiple IPs detected", "5 failed login attempts"],
  "last_updated": "2026-03-12T14:20:00Z"
}
```

---

## S3 Lifecycle

| Age | Action |
|---|---|
| 30 days | → Standard-IA |
| 60 days | → Glacier |
| 365 days | Delete |

---

## CloudWatch Alarms

| Resource | Threshold |
|---|---|
| Beanstalk CPU | > 70% |
| RDS CPU | > 70% |
| Lambda Errors | Any |
| DynamoDB | Throttling |

---

## CI/CD — GitHub Actions

Two workflows live in `.github/workflows/`:

### CI — Build & Test (`ci.yml`)
Triggered on every pull request targeting `main`. Runs a Node.js matrix build across **18.x** and **20.x**.

```
PR opened/updated → install deps → build → npm test (Node 18.x & 20.x)
```

### CD — Deploy to Elastic Beanstalk (`cd.yml`)
Triggered when a PR is **merged** into `main`. Zips the application and deploys to EBS using `einaregilsson/beanstalk-deploy`.

```
PR merged → checkout → install → build → zip app → deploy to EBS
```

AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are stored as GitHub repository secrets — no credentials in code.

---

## Local Setup

```bash
git clone https://github.com/your-username/account-activity-monitor.git
cd account-activity-monitor
npm install
```

Create a `.env` file:
```env
DB_SECRET_NAME=your-secrets-manager-secret
AWS_REGION=us-east-1
S3_BUCKET=your-activity-logs-bucket
```

```bash
npm start
# → http://localhost:3000
```

> AWS credentials required. RDS must be reachable (use a tunnel or deploy to Beanstalk for full functionality).

---

## API

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `POST /api/activity` | Upload activity log to S3 |
| `GET /api/summary` | Fetch risk summaries from RDS |
| `POST /api/login` | SecureWatch demo login — stores event in RDS |
