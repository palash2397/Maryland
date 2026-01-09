import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./awsConfig.js";

export const deleteFromS3 = async (key) => {
  if (!key) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
  );
};