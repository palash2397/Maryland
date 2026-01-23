import Router from "express";
import { auth } from "../middlewares/auth.js";
import { uploadLessonFiles, uploadQuestThumbnail, uploadChapter } from "../middlewares/s3upload.js";

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
  deleteQuizHandler,
  updateQuestHandler,
  questByIdHandle,
  searchLessonsHandler,
  createChapterHandle,
} from "../controllers/teacher/lesson.controller.js";

const lessonRouter = Router();

lessonRouter.post("/create", auth, uploadLessonFiles, createLessonHandle);
lessonRouter.get("/all", auth, allLessonHandle);
lessonRouter.get("/search", auth, searchLessonsHandler);
lessonRouter.delete("/delete/:id", auth, deleteLessonHandle);


lessonRouter.post("/quizz", auth, quizzHandle);
lessonRouter.get("/get-quizz", auth, getQuizzHandle);
lessonRouter.get("/get-quizz/:quizId", auth, getQuizByIdHandler);
lessonRouter.delete("/delete-quizz/:quizId", auth, deleteQuizHandler);
lessonRouter.put("/update-quizz", auth, updateQuizHandler);


lessonRouter.post("/quest", auth, uploadQuestThumbnail, createQuestHandle);
lessonRouter.delete("/quest/:id", auth, deleteQuestHandle);
lessonRouter.get("/quest/:id", auth, questByIdHandle);
lessonRouter.get("/quest", auth, getQuestsHandle);
lessonRouter.put("/update-quest", auth, uploadQuestThumbnail, updateQuestHandler);



lessonRouter.post("/chapter", auth, uploadChapter, createChapterHandle);

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
