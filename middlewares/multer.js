import multer from "multer";
import path from "path";
import fs from "fs";

// Dynamic storage function
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    let folderType = req.folderType || "profile";

    let uploadPath = path.join("./public", folderType);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage })