import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export const generateThumbnail = (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["10%"],
        filename: outputPath.split("/").pop(),
        folder: "uploads",
        size: "640x360",
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
};
