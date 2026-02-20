import AWS from 'aws-sdk';

// AWS SDK will automatically use IAM role when running on Elastic Beanstalk.
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const s3 = new AWS.S3();
export const sqs = new AWS.SQS();

export const PUBLIC_BUCKET  = process.env.S3_PUBLIC_BUCKET  || 'security-logs-public';
export const PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'security-logs-private';
export const SQS_URL        = process.env.SQS_URL           || '';
