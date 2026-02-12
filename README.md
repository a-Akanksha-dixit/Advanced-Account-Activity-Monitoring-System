# Account Activity Monitoring & Password-Sharing Detection System  
**Scalable AWS Web Application with Monitoring & Automation**

## 📌 Objective
Develop and deploy a scalable web application on AWS with proper networking, security, monitoring, automation, and CI/CD practices.

This project demonstrates:
- AWS infrastructure design (VPC, subnets, security groups)
- Application deployment using Elastic Beanstalk
- Secure database access using Amazon RDS
- Event-driven architecture using S3, SQS, and Lambda
- Centralized logging and monitoring with CloudWatch
- CI/CD automation using GitHub Actions

---

## 🏗️ High-Level Architecture

**Flow Overview:**

User → Elastic Beanstalk (Node.js App)  
Elastic Beanstalk → RDS (Private Subnet)  
S3 (Activity Logs) → SQS → Lambda → CloudWatch Logs  
Cron Job → Risk Score Computation → RDS  
GitHub → CI/CD Pipeline → Elastic Beanstalk  

---

## 🧱 AWS Services Used

| Category | Services |
|-------|--------|
| Networking | VPC, Public Subnet, Private Subnet, IGW |
| Compute | Elastic Beanstalk (Node.js) |
| Database | Amazon RDS (db.t3.micro) |
| Storage | Amazon S3 |
| Messaging | Amazon SQS |
| Serverless | AWS Lambda |
| Monitoring | Amazon CloudWatch |
| CI/CD | GitHub Actions |
| Security | IAM, Security Groups |

---

## 📂 Repository Structure

```

.
├── server.js
├── package.json
├── routes/
├── dashboard/
├── cron/
├── lambda/
├── .github/workflows/
├── docs/
│   └── screenshots/
│       ├── day1/
│       ├── day2/
│       ├── ...
│       └── day10/
└── README.md

```

---

## 🖥️ Application Features

### Backend (Node.js + Express)
- `/health` – Elastic Beanstalk health checks
- `/api/activity` – Store user activity logs
- `/api/summary` – Fetch computed risk summaries
- Environment-based DB configuration

### Monitoring & Detection Logic
- Tracks concurrent sessions per user
- Calculates risk score for password sharing
- Runs periodically using Elastic Beanstalk cron jobs

---

## 🔐 Security Design

- RDS deployed in **private subnet**
- No public access to database
- RDS Security Group allows traffic **only from EB Security Group**
- IAM roles with least privilege (except assignment IAM admin user)

---

## 📊 Monitoring & Logging

- CloudWatch Logs:
  - Elastic Beanstalk application logs
  - Lambda execution logs
  - Cron job logs
- CloudWatch Metrics:
  - EB CPU Utilization
  - RDS CPU Utilization
- CloudWatch Alarms:
  - EB CPU > 70%
  - RDS CPU > 70%

---

## 🔄 Event-Driven Pipeline

1. File uploaded to S3
2. S3 event triggers SQS message
3. Lambda consumes SQS message
4. Logs written to CloudWatch

---

## 🚀 CI/CD (Bonus)

- GitHub Actions workflow
- Automatic deployment to Elastic Beanstalk on push
- Secure AWS credentials via GitHub Secrets

---

## 📸 Screenshots & Proof

All screenshots follow this naming convention:

```

dayX_<service>_<what>.png

```

Each day’s screenshots are available under:

```

docs/screenshots/dayX/

````

---

## ✅ Assignment Completion Status

✔ VPC & subnets  
✔ Elastic Beanstalk deployment  
✔ RDS in private subnet  
✔ Security group isolation  
✔ S3 → SQS → Lambda pipeline  
✔ CloudWatch monitoring & alarms  
✔ CI/CD automation  

---

## 🧪 How to Run Locally

```bash
npm install
npm run dev
````

Set environment variables:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

---

## 🏁 Final Notes

This project fulfills all mandatory assignment requirements and includes additional production-grade enhancements such as event-driven processing, risk analytics, and CI/CD automation.