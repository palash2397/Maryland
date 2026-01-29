import ffmpeg from "fluent-ffmpeg";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

export const generateThumbnail = (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        timemarks: ["1"], // ALWAYS 1 second
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "640x360",
      })
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
};
