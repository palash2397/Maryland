import Router from "express";
import { auth } from "../middlewares/auth.js";
import { uploadLessonFiles, uploadQuestThumbnail } from "../middlewares/s3upload.js";

import {
  createLessonHandle,
  allLessonHandle,
  deleteLessonHandle,
  quizzHandle,
  createQuestHandle,
  deleteQuestHandle,
  getQuestsHandle,
  getQuizzHandle,
  getQuizByIdHandler,
  updateQuizHandler,
} from "../controllers/teacher/lesson.controller.js";

const lessonRouter = Router();

lessonRouter.post("/create", auth, uploadLessonFiles, createLessonHandle);
lessonRouter.get("/all", auth, allLessonHandle);
lessonRouter.post("/quizz", auth, quizzHandle);
lessonRouter.get("/get-quizz", auth, getQuizzHandle);
lessonRouter.get("/get-quizz/:quizId", auth, getQuizByIdHandler);
lessonRouter.put("/update-quizz/:quizId", auth, updateQuizHandler);
lessonRouter.delete("/delete/:id", auth, deleteLessonHandle);

lessonRouter.post("/quest", auth, uploadQuestThumbnail, createQuestHandle);
lessonRouter.delete("/quest/:id", auth, deleteQuestHandle);
lessonRouter.get("/quest", auth, getQuestsHandle);

// lessonRouter.post("/test-upload", uploadLessonFiles, (req, res) => {
//   try {
//     console.log(req.files);
//     return res.json({
//       video: req?.files?.video?.[0]?.location || null,
//       thumbnail: req?.files?.thumbnail?.[0]?.location || null,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

export default lessonRouter;
