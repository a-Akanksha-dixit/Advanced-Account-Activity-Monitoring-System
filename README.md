# Advanced Account Activity Monitoring System on AWS

Scalable Event-Driven Web Application with Monitoring, Automation, and Secure Infrastructure

---

# Executive Summary

This project presents an **advanced implementation of the Account Activity Monitoring System originally developed in the Fundamental AWS assessment**, enhanced with additional cloud architecture capabilities and operational features. The application is a **Node.js web service deployed on AWS Elastic Beanstalk** that allows users to upload activity logs through a dashboard interface for analysis.

Uploaded logs are stored in **Amazon S3 and processed through an event-driven pipeline using Amazon SQS, Amazon SNS, and AWS Lambda**, enabling automated log processing and suspicious activity detection. Processed results are persisted in **Amazon RDS for relational analytics and Amazon DynamoDB for metadata tracking**.

The architecture follows **secure and scalable cloud design practices**, including private subnet database deployment, credential management with AWS Secrets Manager, and least-privilege IAM roles. Additional capabilities such as **CloudWatch monitoring, EventBridge scheduled analytics, and CI/CD automation with Jenkins** demonstrate a production-oriented cloud application built on top of the foundational system.

---

## Architecture Evolution

This project extends the **Fundamental AWS assignment** by enhancing the original monitoring system with additional cloud services, automation, and event-driven processing.

**Architecture Progression**

```
Fundamental Architecture
User → Elastic Beanstalk → RDS
S3 → SQS → Lambda → CloudWatch

            ↓

Advanced Architecture
User → Elastic Beanstalk Dashboard
      ↓
      S3 (Logs Storage)
      ↓
 SNS Topic        SQS Queue
     ↓                ↓
 Notification     Log Processing
     Lambda           Lambda
        ↓               ↓
    DynamoDB        Amazon RDS
          ↓
   EventBridge Scheduled Analytics
          ↓
      CloudWatch Monitoring
```

---

# 📌 Objective

This project demonstrates the design and deployment of an **advanced scalable cloud application on AWS** using modern infrastructure patterns.

The system allows users to:

* Upload account activity logs through a web dashboard
* Process logs through an **event-driven architecture**
* Compute **risk scores for suspicious behavior or password sharing**
* Monitor system performance using centralized AWS monitoring services

The architecture incorporates **secure networking, automation, monitoring, and scalable cloud services**.

---

# 🏗️ System Architecture

The following diagram illustrates the high-level architecture of the system including the web application layer, storage services, and event-driven processing pipeline.

![Architecture Diagram](docs/architecture/advanced-architecture.png)

---

# 🧱 AWS Services Used

| Category           | Services                                               |
| ------------------ | ------------------------------------------------------ |
| Networking         | VPC, Public Subnets, Private Subnets, Internet Gateway |
| Compute            | Elastic Beanstalk (Node.js)                            |
| Databases          | Amazon RDS                                             |
| NoSQL Storage      | Amazon DynamoDB                                        |
| Object Storage     | Amazon S3                                              |
| Messaging          | Amazon SQS, Amazon SNS                                 |
| Serverless         | AWS Lambda                                             |
| Automation         | Amazon EventBridge                                     |
| Monitoring         | Amazon CloudWatch                                      |
| Security           | IAM Roles, Security Groups                             |
| Secrets Management | AWS Secrets Manager                                    |
| CI/CD              | Jenkins                                         |

---

# 🌐 Infrastructure Design

## VPC Architecture

The system is deployed inside a **custom VPC with multi-AZ configuration**.

```
VPC
 ├ Public Subnet AZ1
 │   └ Elastic Beanstalk Instances
 ├ Public Subnet AZ2
 │   └ Elastic Beanstalk Instances
 ├ Private Subnet AZ1
 │   └ Amazon RDS
 └ Private Subnet AZ2
     └ Amazon RDS
```

### Security Design

* RDS deployed in **private subnets**
* No public database access
* Security group allows **only Elastic Beanstalk instances to connect**
* IAM roles configured using **least privilege principle**

---

# 🖥️ Application Features

## Node.js + Express Backend

Main API endpoints:

```
/health
```

Elastic Beanstalk health check endpoint.

```
/api/activity
```

Uploads activity logs to S3.

```
/api/summary
```

Fetches computed risk summaries from RDS.

---

# Dashboard Panel

The application includes a **web dashboard** where users can:

* Upload activity log files
* Trigger log processing
* View computed risk scores
* Monitor suspicious user behavior

---

# 📊 Event-Driven Processing Pipeline

1. User uploads activity logs via the dashboard.

2. Logs are stored in **Amazon S3**.

3. S3 triggers:

   * **SNS Topic**
   * **SQS Queue**

4. **Lambda functions process the events**

5. Processed data:

   * Updates **risk scores in Amazon RDS**
   * Stores metadata in **Amazon DynamoDB**

6. System logs and metrics are collected in **CloudWatch**.

---

# 🗄️ Storage Design

## Amazon RDS

Used for:

* User records
* Risk score summaries
* Analytical queries

Configuration:

* Instance type: `db.t3.micro`
* Deployed in **private subnet**
* Automated backups enabled
* Backup retention period: **7 days**

---

## Amazon DynamoDB

Used for storing:

* Activity metadata
* Processed log records
* Event tracking data

Example item:

```
userId: user123
timestamp: 1710001234
riskScore: 78
ipAddress: 192.168.1.10
sourceFile: activity-log.json
```

---

# 🗂️ S3 Configuration

S3 is used to store uploaded activity logs.

### Features Enabled

✔ Versioning
✔ Lifecycle Policies
✔ Access Logging

### Lifecycle Example

| After    | Action              |
| -------- | ------------------- |
| 30 days  | Move to Standard-IA |
| 60 days  | Move to Glacier     |
| 365 days | Delete              |

---

# 🔐 Secrets Management

Database credentials are securely stored in **AWS Secrets Manager**.

Example secret structure:

```
{
 "host": "rds-endpoint",
 "username": "admin",
 "password": "password",
 "database": "activitydb"
}
```

Elastic Beanstalk retrieves the secret at runtime.

---

# ⚙️ Automation with EventBridge

EventBridge triggers a **scheduled Lambda function** for automated analytics.

Example tasks:

* Detect high-risk users
* Generate usage summaries
* Update analytics tables in RDS

Example schedule:

```
rate(10 minutes)
```

---

# 📈 Monitoring & Logging

## CloudWatch Logs

Logs collected from:

* Elastic Beanstalk application logs
* Lambda execution logs
* Event processing logs

---

## CloudWatch Metrics

| Service           | Metrics               |
| ----------------- | --------------------- |
| Elastic Beanstalk | CPU Utilization       |
| RDS               | CPU Utilization       |
| Lambda            | Invocations / Errors  |
| DynamoDB          | Read / Write Capacity |
| S3                | Object Count          |

---

## CloudWatch Alarms

Alerts configured for:

```
Elastic Beanstalk CPU > 70%
RDS CPU > 70%
Lambda Errors
DynamoDB Throttling
```

---

## CloudWatch Dashboard

A centralized dashboard visualizes metrics from:

* Elastic Beanstalk
* RDS
* Lambda
* DynamoDB
* S3

---
# 🔄 CI/CD Pipeline (Bonus)

Continuous Integration and Deployment is implemented using **Jenkins**.

The pipeline automatically builds and deploys the application whenever changes are pushed to the repository.

### Pipeline Workflow

Developer Push
↓
Jenkins Pipeline Trigger
↓
Install Dependencies
↓
Build Application
↓
Deploy to Elastic Beanstalk

Jenkins securely manages AWS credentials and automates the deployment process, ensuring consistent and repeatable application releases.

---

# 📂 Repository Structure

```
.
├── server.js
├── package.json
├── routes/
├── dashboard/
├── lambda/
│   ├ processLogs.js
│   ├ notificationHandler.js
│   └ scheduledAnalytics.js
├── dynamodb/
│   └ activityLogger.js
├── secrets/
│   └ secretsManager.js
├── .github/workflows/
├── docs/
│   ├ architecture/
│   │   └ advanced-architecture.png
│   └ screenshots/
└── README.md
```

---

# 📸 Screenshots & Proof

Screenshots demonstrating each completed task are available in:

```
docs/screenshots/
```

Examples include:

* VPC configuration
* Elastic Beanstalk deployment
* RDS private subnet setup
* S3 versioning and lifecycle policies
* Event triggers (SNS/SQS)
* Lambda processing
* DynamoDB records
* CloudWatch monitoring
* CI/CD pipeline execution

---

# 🧪 Running the Application Locally

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Set environment variables:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

---

# 🛡️ Security Best Practices

* Database deployed in **private subnets**
* IAM roles configured using **least privilege**
* Secrets stored securely in **AWS Secrets Manager**
* Security groups restrict database access to **Elastic Beanstalk only**
* S3 access logging enabled for audit tracking

---

# 💰 Cost Optimization

The architecture is designed to operate within **AWS Free Tier where possible**:

* `t3.micro` compute instances
* DynamoDB on-demand capacity
* Serverless Lambda execution
* S3 lifecycle policies for storage cost reduction

---

# ✅ Assignment Completion Checklist

✔ Multi-AZ VPC with public and private subnets
✔ Elastic Beanstalk application deployment
✔ Auto-scaling configuration
✔ Amazon RDS in private subnet
✔ Automated RDS backups
✔ Secure security group configuration
✔ S3 bucket with versioning
✔ Lifecycle policies for S3 storage
✔ S3 event triggers for SNS and SQS
✔ Lambda functions for event processing
✔ DynamoDB metadata storage
✔ Secrets Manager integration
✔ EventBridge scheduled Lambda
✔ CloudWatch monitoring and alarms
✔ CloudWatch dashboard
✔ S3 access logging
✔ CI/CD pipeline using Jenkins

---

# 🏁 Final Notes

This project demonstrates **advanced AWS cloud architecture concepts**, including:

* Event-driven system design
* Scalable web application deployment
* Secure infrastructure patterns
* Automated monitoring and alerting
* Cost-optimized storage lifecycle
* Continuous deployment using Jenkins CI/CD pipelines

The solution follows **production-oriented cloud engineering practices** for building scalable and secure cloud applications.

---
