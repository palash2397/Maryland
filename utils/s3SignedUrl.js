import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./awsConfig.js";
import mime from "mime-types";

export const getSignedFileUrl = async (key, expiresIn = 3600) => {
  const contentType = mime.lookup(key) || "application/octet-stream";

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,

    ResponseContentDisposition: "inline",

    ResponseContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

// export const getSignedFileUrl = async (key, expiresIn = 3600, inline = true) => {
//   const command = new GetObjectCommand({
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: key,

//     // 👇 THIS IS THE KEY PART
//     ...(inline && {
//       ResponseContentDisposition: "inline",
//     }),
//   });

//   return await getSignedUrl(s3Client, command, { expiresIn });
// };

// to download inline will be false
