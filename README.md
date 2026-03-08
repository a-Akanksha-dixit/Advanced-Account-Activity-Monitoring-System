# Advanced Account Activity Monitoring System on AWS
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazonaws)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)
![Elastic Beanstalk](https://img.shields.io/badge/AWS-ElasticBeanstalk-green)
![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-blue?logo=jenkins)
![Architecture](https://img.shields.io/badge/Architecture-Event%20Driven-purple)
![License](https://img.shields.io/badge/License-MIT-blue)

Scalable Event-Driven Web Application with Monitoring, Automation, and Secure Infrastructure
# 🌍 Live Demo

Application URL

http://account-activity-monitor.us-east-1.elasticbeanstalk.com/

Example endpoints

/health  
/api/activity  
/api/summary

---

# Executive Summary

This project presents an **advanced implementation of the Account Activity Monitoring System originally developed in the Fundamental AWS assessment**, enhanced with additional cloud architecture capabilities and operational features. The application is a **Node.js web service deployed on AWS Elastic Beanstalk** that allows users to upload activity logs through a dashboard interface for analysis.

Uploaded logs are stored in **Amazon S3 and processed through an event-driven pipeline using Amazon SQS, Amazon SNS, and AWS Lambda**, enabling automated log processing and suspicious activity detection. Processed results are persisted in **Amazon RDS for relational analytics**, while **Amazon DynamoDB is used to store security audit events such as S3 object deletion activity**, helping detect potential log tampering or unauthorized actions.

The architecture follows **secure and scalable cloud design practices**, including private subnet database deployment, credential management with AWS Secrets Manager, and least-privilege IAM roles. Additional capabilities such as **CloudWatch monitoring, EventBridge scheduled analytics, and CI/CD automation with Jenkins** demonstrate a production-oriented cloud application built on top of the foundational system.

---
# ⭐ Key Architecture Highlights

• Event-driven architecture using **S3, SQS, SNS, and Lambda**

• **Secure multi-AZ VPC design** with public and private subnets

• **Elastic Beanstalk deployment** for scalable Node.js backend

• **RDS for relational analytics** and **DynamoDB for security audit events**

• **CloudWatch monitoring, alarms, and dashboards**

• **EventBridge scheduled analytics automation**

• **CI/CD pipeline using Jenkins**

• **Security-focused logging with S3 object deletion audit tracking**


---
# Architecture Evolution

This project extends the **Fundamental AWS assignment** by enhancing the original monitoring system with additional cloud services, automation, and event-driven processing.

### Architecture Progression

```
Fundamental Architecture
User → Elastic Beanstalk → RDS
S3 → SQS → Lambda → CloudWatch

            ↓

Advanced Architecture
User → Elastic Beanstalk Dashboard
      ↓
      S3 (Logs Storage)

      ├── ObjectCreated → SQS → Lambda (Log Processing) → RDS
      │
      └── ObjectRemoved → SNS → Lambda (Security Audit) → DynamoDB

                     ↓
              EventBridge Analytics
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
* Track **security-sensitive events such as log deletions**

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
| CI/CD              | Jenkins                                                |

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

### 1️⃣ Log Processing Pipeline

1. User uploads activity logs via the dashboard.
2. Logs are stored in **Amazon S3**.
3. S3 triggers **Amazon SQS**.
4. A **Lambda function processes the log file**.
5. Processed data updates **risk scores in Amazon RDS**.

### 2️⃣ Security Audit Pipeline

To improve system security monitoring, **S3 ObjectRemoved events** are tracked.

1. When a log file is deleted from S3
2. S3 triggers an **SNS Topic**
3. A **Lambda function processes the deletion event**
4. The event metadata is stored in **Amazon DynamoDB**

This enables **audit tracking of potentially suspicious actions such as log deletion or tampering**.

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

DynamoDB is used as a **security audit store** for S3 object deletion events.

Tracking deletion events helps detect:

* Unauthorized log removal
* Suspicious administrative activity
* Potential evidence tampering

Example record stored in DynamoDB:

```
eventId: evt-10231
eventType: OBJECT_DELETED
bucketName: activity-logs-bucket
objectKey: logs/user123/activity-log.json
deletedAt: 2026-03-08T10:45:12Z
sourceIP: 54.201.22.10
```

---

# 🗂️ S3 Configuration

S3 is used to store uploaded activity logs.

### Features Enabled

✔ Versioning
✔ Lifecycle Policies
✔ Access Logging
✔ Event Notifications (ObjectCreated and ObjectRemoved)

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

```
Developer Push
      ↓
Jenkins Pipeline Trigger
      ↓
Install Dependencies
      ↓
Build Application
      ↓
Deploy to Elastic Beanstalk
```

Jenkins securely manages AWS credentials and automates the deployment process, ensuring consistent and repeatable application releases.

---
# 🧠 Skills Demonstrated

Cloud Architecture  
• AWS VPC design (public/private subnets, security groups)  
• Event-driven system architecture  
• Multi-service AWS integration  

Backend Development  
• Node.js and Express API development  
• Asynchronous log processing pipelines  

Serverless Computing  
• AWS Lambda event-driven processing  
• EventBridge scheduled automation  

Cloud Security  
• IAM least-privilege roles  
• Secrets Manager credential storage  
• Private subnet database architecture  

Monitoring & Operations  
• CloudWatch dashboards and alarms  
• Application and infrastructure logging  

DevOps  
• CI/CD pipeline implementation using Jenkins  
• Automated deployment to Elastic Beanstalk

---
# 🏁 Final Notes

This project demonstrates **advanced AWS cloud architecture concepts**, including:

* Event-driven system design
* Scalable web application deployment
* Secure infrastructure patterns
* Automated monitoring and alerting
* Security audit logging for destructive actions
* Cost-optimized storage lifecycle
* Continuous deployment using Jenkins CI/CD pipelines

The solution follows **production-oriented cloud engineering practices** for building scalable and secure cloud applications.

---
