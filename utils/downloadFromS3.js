import fs from "fs";
import axios from "axios";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./awsConfig.js";

export const downloadFromS3 = async (key, outputPath) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  const response = await axios({
    url: signedUrl,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      console.log("✅ Download complete:", outputPath);
      resolve();
    });

    writer.on("error", reject);
  });
};
