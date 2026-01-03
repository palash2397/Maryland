import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export const generateRandomString = async(num)=>{
    console.log(`nano code -------------->`, nanoid(num).toUpperCase());
    return  nanoid(num).toUpperCase()
    
}

export const getExpirationTime = () => {
    return new Date(Date.now() + 5 * 60 * 1000); // Current time + 5 minutes
};


export const setUploadPath = (folder) => {
  return (req, res, next) => {
    req.folderType = folder;
    next();
  };
};




export const deleteOldImages = (folder, file) => {
  try {
    if (!file) return;
    const p = path.join(__dirname, "..", "public", folder, file);
    fs.existsSync(p)
      ? (fs.unlinkSync(p), console.log("Deleted:", p))
      : console.log("No file:", p);
  } catch (error) {
    console.log("error while deleting file --------->", error);
  }
};