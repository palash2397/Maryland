import Joi from "joi";
import Jwt from "jsonwebtoken";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import { deleteFromS3 } from "../../utils/s3delete.js";

import Teacher from "../../models/teacher/teacher.js";
import Lesson from "../../models/lesson/lesson.js";
import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";

export const createLessonHandle = async (req, res) => {
  try {
    const { title, topic, difficultyLevel, description, videoLink } = req.body;

    // Validation
    const schema = Joi.object({
      title: Joi.string().required(),
      topic: Joi.string().required(),
      difficultyLevel: Joi.string().required(),
      description: Joi.string().required(),
      videoLink: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // Extract uploaded files
    const videoFile = req.files?.video?.[0] || null;
    const thumbnailFile = req.files?.thumbnail?.[0] || null;

    const lesson = await Lesson.create({
      teacherId: req.user.id,
      title,
      topic,
      difficultyLevel,
      description,
      videoLink: videoLink || null,

      // Store S3 KEYS (not URLs)
      video: videoFile ? videoFile.key : null,
      thumbnail: thumbnailFile ? thumbnailFile.key : null,
    });

    return res.status(201).json(new ApiResponse(201, lesson, Msg.DATA_ADDED));
  } catch (error) {
    console.error("Error creating lesson:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allLessonHandle = async (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      const lesson = await Lesson.findOne({
        _id: id,
        teacherId: req.user.id,
      })
        .lean()
        .select("-__v -updatedAt");

      if (!lesson) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
      }

      const updatedLesson = {
        ...lesson,
        thumbnail: lesson.thumbnail
          ? await getSignedFileUrl(lesson.thumbnail, 3600)
          : null,
        video: lesson.video ? await getSignedFileUrl(lesson.video, 3600) : null,
      };

      return res
        .status(200)
        .json(new ApiResponse(200, updatedLesson, Msg.DATA_FETCHED));
    }
    const lessons = await Lesson.find({ teacherId: req.user.id }).lean();
    if (!lessons || lessons.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const updatedLessons = await Promise.all(
      lessons.map(async (lesson) => ({
        ...lesson,
        thumbnail: lesson.thumbnail
          ? await getSignedFileUrl(lesson.thumbnail, 3600)
          : null,
        video: lesson.video ? await getSignedFileUrl(lesson.video, 3600) : null,
      }))
    );
    return res
      .status(200)
      .json(new ApiResponse(200, updatedLessons, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteLessonHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const lesson = await Lesson.findOne({ _id: id, teacherId: req.user.id });
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // Delete files from S3 if they exist
    if (lesson.video) {
      await deleteFromS3(lesson.video);
    }
    if (lesson.thumbnail) {
      await deleteFromS3(lesson.thumbnail);
    }

    const data = await Lesson.findByIdAndDelete(id);
    await Quiz.deleteMany({ lessonId: id });
    await Quest.deleteMany({ lessonId: id });
    return res.status(200).json(new ApiResponse(200, data, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const quizzHandle = async (req, res) => {
  try {
    const { title, lessonId, questions } = req.body;

    const schema = Joi.object({
      title: Joi.string().required(),
      lessonId: Joi.string().required(),
      questions: Joi.array()
        .items(
          Joi.object({
            question: Joi.string().required(),
            options: Joi.object({
              A: Joi.string().required(),
              B: Joi.string().required(),
              C: Joi.string().required(),
              D: Joi.string().required(),
            }).required(),
            correctAnswer: Joi.string().valid("A", "B", "C", "D").required(),
            difficulty: Joi.string()
              .valid("easy", "medium", "hard")
              .default("easy"),
          })
        )
        .min(1)
        .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      teacherId: req.user.id,
    });
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const quiz = await Quiz.create({
      teacherId: req.user.id,
      lessonId,
      title,
      questions,
    });

    return res.status(201).json(new ApiResponse(201, quiz, Msg.DATA_ADDED));
  } catch (error) {
    console.error("Error creating quiz:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getQuizzHandle = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacherId: req.user.id })
      .populate("lessonId", "title")
      .sort({ createdAt: -1 });

    if (!quizzes.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, quizzes, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getQuizByIdHandler = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: req.user.id,
    }).populate("lessonId", "title");

    if (!quiz) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, quiz, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching quiz by id:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateQuizHandler = async (req, res) => {
  try {
    const { title, questions, isPublished , quizId} = req.body;
    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: req.user.id,
    });

    if (!quiz) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // Update only provided fields
    if (title !== undefined) quiz.title = title;
    if (questions !== undefined) quiz.questions = questions;
    if (isPublished !== undefined) quiz.isPublished = isPublished;
    await quiz.save();
    return res
      .status(200)
      .json(new ApiResponse(200, quiz, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error updating quiz:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteQuizHandler = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Find and delete in ONE step (secure)
    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      teacherId: req.user.id,
    });

    if (!quiz) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const createQuestHandle = async (req, res) => {
  let thumbnailPath = null;

  if (req.file) {
    thumbnailPath = {
      key: req.file.key,
      url: req.file.location,
    };
  }
  try {
    const { title, description, difficulty, rewardPoints, numberOfTasks, timeLimit, lessonId, quizId} = req.body;

    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
      rewardPoints: Joi.number().required().min(0),
      numberOfTasks: Joi.number().required().min(1),
      timeLimit: Joi.number().required().min(1),
      lessonId: Joi.string().optional(),
      quizId: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const lesson = await Lesson.findOne({ _id: lessonId, teacherId: req.user.id });
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const quiz = await Quiz.findOne({ _id: quizId, teacherId: req.user.id });
    if (!quiz) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const quest = await Quest.create({
      teacherId: req.user.id,
      title,
      description,
      difficulty,
      rewardPoints,
      numberOfTasks,
      timeLimit,
      lessonId,
      quizId,
      thumbnail: thumbnailPath || null,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, quest, Msg.DATA_ADDED));

  } catch (error) {
    console.error("Error creating quest:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteQuestHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const quest = await Quest.findOne({ _id: id, teacherId: req.user.id });
    if (!quest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }
    await deleteFromS3(quest.thumbnail?.key);
    await Quest.deleteOne({ _id: id, teacherId: req.user.id });
    return res.status(200).json(new ApiResponse(200, {id}, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error deleting quest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getQuestsHandle = async (req, res) => {
  try {
    const quests = await Quest.find({ teacherId: req.user.id });
    if (!quests || quests.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, quests, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting quests:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
