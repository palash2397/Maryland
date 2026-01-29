import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./awsConfig.js";

export const uploadThumbToS3 = async (filePath, key) => {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: "image/png",
  });

  await s3Client.send(command);

  return key;
};
