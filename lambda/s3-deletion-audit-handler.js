/**
 * Lambda Function: s3-deletion-audit-logger
 *
 * Trigger: SNS Topic (fed by S3 ObjectRemoved event notifications)
 *
 * Flow:
 *   1. An object is deleted from the S3 logs bucket
 *   2. S3 sends an ObjectRemoved event to an SNS topic
 *   3. SNS triggers this Lambda function
 *   4. Lambda extracts the bucket and object key from the event
 *   5. A deletion audit record is stored in DynamoDB
 *   6. CloudWatch Logs captures execution logs automatically
 *
 * Purpose:
 *   Maintains an immutable audit trail of deleted log files to improve
 *   security monitoring and help detect suspicious log tampering.
 *
 * Environment Variables (Optional but Recommended):
 *   AUDIT_TABLE      — DynamoDB table name for deletion audit records
 *   AWS_REGION       — AWS region where resources are deployed
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Create DynamoDB client
// This client will be reused across Lambda invocations for better performance
const client = new DynamoDBClient({});

// DynamoDBDocumentClient simplifies working with JSON instead of DynamoDB types
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {

    // SNS sends the message as a string, so we parse it to JSON
    // The message contains details about the deleted S3 object
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    const record = snsMessage.Records[0];
    const bucket = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key);
    // Prepare the audit record to store in DynamoDB
    const item = {
      eventId: Date.now().toString(), // Unique ID for this deletion event
      eventType: "OBJECT_DELETED", // Type of event being recorded
      bucket: bucket,              // Name of the S3 bucket where the object was deleted
      objectKey: objectKey,        // Key (path) of the deleted object
      timestamp: new Date().toISOString()
    };

    // Parameters for DynamoDB PutItem operation
    const params = {
      TableName: "DeletedObjectsAudit",
      Item: item
    };

    // Insert the audit record into DynamoDB
    // This creates a permanent log of deletion events
    await dynamodb.send(new PutCommand(params));

    // Log success message to CloudWatch for monitoring
    console.log("Deleted object logged successfully:", item);

    // Return success response
    return {
      statusCode: 200,
      body: "Deletion event recorded"
    };

  } catch (error) {

    // If anything fails, log the error to CloudWatch
    console.error("Error processing deletion event:", error);

    // Re-throw error so Lambda marks execution as failed
    throw error;
  }
};