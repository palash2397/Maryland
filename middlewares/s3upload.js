import multer from "multer";
import multerS3 from "@vickos/multer-s3-transforms-v3";
import { s3Client } from "../utils/awsConfig.js";


export const s3Uploader = (folderMap = {}) =>
  multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET,

      key: (req, file, cb) => {
        const folder = folderMap[file.fieldname] || "others";
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, `${folder}/${filename}`);
      },
    }),
});

export const uploadLessonFiles = s3Uploader({
  video: "lessons/videos",
  thumbnail: "lessons/thumbnails",
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

export const uploadProfileImage = s3Uploader({
  avatar: "users/avatars",
}).single("avatar");


export const uploadCertificate = s3Uploader({
  certificate: "teachers/certificates",
}).single("certificate");

export const uploadQuestThumbnail = s3Uploader({
  thumbnail: "quests/thumbnails",
}).single("thumbnail");

