import fs from "fs";
import { s3Client } from "./awsConfig.js";

export const uploadThumbToS3 = async (filePath, key) => {
  const fileContent = fs.readFileSync(filePath);

  await s3Client.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: "image/png",
  });

  return key;
};
