import Joi from "joi";
import fs from "fs";
import os from "os";
import path from "path";


import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import { deleteFromS3 } from "../../utils/s3delete.js";
import { generateThumbnail } from "../../utils/generateThumbnail.js";
import { downloadFromS3 } from "../../utils/downloadFromS3.js";
import { uploadThumbToS3 } from "../../utils/uploadThumbOnS3.js";

// import Teacher from "../../models/teacher/teacher.js";
import Lesson from "../../models/lesson/lesson.js";
import Video from "../../models/lesson/video.js";
import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";

export const createLessonHandle = async (req, res) => {
  try {
    const { title, topic, difficultyLevel, description } = req.body;

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

    const lesson = await Lesson.create({
      teacherId: req.user.id,
      title,
      topic,
      difficultyLevel,
      description,
      thumbnail: null,
    });

    return res.status(201).json(new ApiResponse(201, lesson, Msg.DATA_ADDED));
  } catch (error) {
    console.error("Error creating lesson:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const createChapterHandle = async (req, res) => {
  try {
    const { title, lessonId, duration, description, accessType, status } =
      req.body;

    // Validation
    const schema = Joi.object({
      title: Joi.string().required(),
      lessonId: Joi.string().required(),
      description: Joi.string().optional(),
      duration: Joi.number().required(),
      accessType: Joi.string().valid("free", "pro", "premium").default("free"),
      status: Joi.string().valid("draft", "published").default("published"),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    console.log("--------->", req.file);

    if (!req.file?.key) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.DATA_NOT_FOUND));
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      teacherId: req.user.id,
    });
    if (!lesson) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.LESSON_NOT_FOUND));
    }

    const video = await Video.create({
      teacherId: req.user.id,
      lessonId,
      title,
      description,
      duration,
      accessType,
      videoUrl: req.file?.key || null,
      status,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, Msg.CHAPTER_CREATED));
  } catch (error) {
    console.error("Error creating chapter:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const generateChapterThumbnail = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.thumbnail) {
      return res.json({ message: "Thumbnail already exists" });
    }

    const videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${video.videoUrl}`;

    const tempVideo = path.join(os.tmpdir(), `${Date.now()}.mp4`);
    const tempThumb = path.join(os.tmpdir(), `${Date.now()}.png`);

    // 1️⃣ download video
    await downloadFromS3(video.videoUrl, tempVideo);

    // 2️⃣ generate thumbnail
    await generateThumbnail(tempVideo, tempThumb);

    // 3️⃣ upload to S3
    const thumbKey = `lesson/thumbnails/${Date.now()}.png`;
    await uploadThumbToS3(tempThumb, thumbKey);

    // 4️⃣ update DB
    video.thumbnail = thumbKey;
    await video.save();

    // cleanup
    fs.unlinkSync(tempVideo);
    fs.unlinkSync(tempThumb);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, Msg.THUMBNAIL_GENERATED));
  } catch (err) {
    console.error("Error generating thumbnail:", err);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allChaptersByLessonId = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const chapters = await Video.find({ lessonId: id, teacherId }).lean();

    if (!chapters || chapters.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, chapters, Msg.CHAPTERS_FETCHED));
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteChapterHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const chapter = await Video.findOneAndDelete({ _id: id, teacherId });
    if (!chapter) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.CHAPTER_NOT_FOUND));
    }

    return res.status(200).json(new ApiResponse(200, {}, Msg.CHAPTER_DELETE));
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allLessonHandle = async (req, res) => {
  try {
    const { id } = req.body;
    const teacherId = req.user.id;

    /* ---------------- HELPER ---------------- */
    const formatLessonWithChapters = async (lesson) => {
      const chapters = await Video.find({ lessonId: lesson._id }).lean();

      return {
        ...lesson,
        thumbnail: lesson.thumbnail
          ? await getSignedFileUrl(lesson.thumbnail, 3600)
          : null,
        chapters: await Promise.all(
          chapters.map(async (chapter) => ({
            ...chapter,
            videoUrl: chapter.videoUrl
              ? await getSignedFileUrl(chapter.videoUrl, 3600)
              : null,
          })),
        ),
      };
    };

    /* ---------------- SINGLE LESSON ---------------- */
    if (id) {
      const lesson = await Lesson.findOne({ _id: id, teacherId })
        .lean()
        .select("-__v -updatedAt");

      if (!lesson) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
      }

      const data = await formatLessonWithChapters(lesson);

      return res.status(200).json(new ApiResponse(200, data, Msg.DATA_FETCHED));
    }

    /* ---------------- ALL LESSONS ---------------- */
    const lessons = await Lesson.find({ teacherId }).lean();

    if (!lessons.length) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const data = await Promise.all(
      lessons.map((lesson) => formatLessonWithChapters(lesson)),
    );

    return res.status(200).json(new ApiResponse(200, data, Msg.DATA_FETCHED));
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
    await Video.deleteMany({ lessonId: id });
    return res.status(200).json(new ApiResponse(200, data, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const searchLessonsHandler = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { search, status, page = 1, limit = 10 } = req.query;

    const filter = { teacherId };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const lessons = await Lesson.find(filter)
      .sort({ updatedAt: -1 }) // latest first
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Lesson.countDocuments(filter);

    lessons.map(async (Les) => {
      Les.video = Les.video ? await getSignedFileUrl(Les.video) : null;
      Les.thumbnail = Les.thumbnail
        ? await getSignedFileUrl(Les.thumbnail)
        : null;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          lessons,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        },
        Msg.DATA_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Error searching lessons:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const quizzHandle = async (req, res) => {
  try {
    const { title, lessonId, questId, questions } = req.body;
    console.log(typeof(questId));

    const schema = Joi.object({
      title: Joi.string().required(),
      lessonId: Joi.string().required(),
      questId: Joi.string().required(),
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
          }),
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
      return res.status(404).json(new ApiResponse(404, {}, Msg.LESSON_NOT_FOUND));
    }


    const quest = await Quest.findOne({ _id: questId });
    if (!quest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.QUEST_NOT_FOUND));
    }

    const quiz = await Quiz.create({
      teacherId: req.user.id,
      lessonId,
      questId,
      title,
      questions,
    });

    return res.status(201).json(new ApiResponse(201, quiz, Msg.QUIZZ_CREATED));
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
      return res.status(404).json(new ApiResponse(404, [], Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, quizzes, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res.status(200).json(new ApiResponse(200, quiz, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching quiz by id:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateQuizHandler = async (req, res) => {
  try {
    const { quizId, title, questions, isPublished } = req.body;

    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: req.user.id,
    });

    if (!quiz) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // Update basic fields
    if (title !== undefined) quiz.title = title;
    if (isPublished !== undefined) quiz.isPublished = isPublished;

    // Update questions (add / edit / delete)
    if (Array.isArray(questions)) {
      quiz.questions = questions;
    }

    await quiz.save();

    return res.status(200).json(new ApiResponse(200, quiz, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error updating quiz:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    await deleteFromS3(quiz.thumbnail);

    return res.status(200).json(new ApiResponse(200, {}, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

// export const createQuestHandle = async (req, res) => {
//   let thumbnailPath = null;

//   if (req.file) {
//     thumbnailPath = {
//       key: req.file.key,
//       url: req.file.location,
//     };
//   }
//   try {
//     const {
//       title,
//       description,
//       difficulty,
//       rewardPoints,
//       numberOfTasks,
//       timeLimit,
//       lessonId,
//       quizId,
//     } = req.body;

//     const schema = Joi.object({
//       title: Joi.string().required(),
//       description: Joi.string().required(),
//       difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
//       rewardPoints: Joi.number().required().min(0),
//       numberOfTasks: Joi.number().required().min(1),
//       timeLimit: Joi.number().required().min(1),
//       lessonId: Joi.string().optional(),
//       quizId: Joi.string().optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, error.details[0].message));
//     }

//     const lesson = await Lesson.findOne({
//       _id: lessonId,
//       teacherId: req.user.id,
//     });
//     if (!lesson) {
//       return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
//     }

//     const quiz = await Quiz.findOne({ _id: quizId, teacherId: req.user.id });
//     if (!quiz) {
//       return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
//     }

//     const quest = await Quest.create({
//       teacherId: req.user.id,
//       title,
//       description,
//       difficulty,
//       rewardPoints,
//       numberOfTasks,
//       timeLimit,
//       lessonId,
//       quizId,
//       thumbnail: thumbnailPath || null,
//     });

//     return res.status(201).json(new ApiResponse(201, quest, Msg.DATA_ADDED));
//   } catch (error) {
//     console.error("Error creating quest:", error);
//     return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
//   }
// };

export const createQuestHandle = async (req, res) => {
  try {
    // Thumbnail handling
    let thumbnail = null;
    if (req.file) {
      thumbnail = req.file.key;
    }

    const {
      title,
      description,
      questType,
      targetGrade,
      ageGroup,

      difficulty,
      timeLimit,
      maxAttempts,
      questionCount,
      passingScore,

      xpPoints,
      coins,
      badge,
      bonusCondition,

      prerequisiteLessons,
      minimumPreviousScore,

      lessonId,
      isPublished,
      isFeatured,
      leaderboardEnabled,
    } = req.body;

    // ✅ Validation
    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),

      questType: Joi.string().valid("solo").default("solo"),
      targetGrade: Joi.string().required(),
      ageGroup: Joi.string().required(),

      difficulty: Joi.string().valid("easy", "medium", "hard").default("easy"),
      timeLimit: Joi.number().min(1).required(),
      maxAttempts: Joi.number().min(1).default(1),
      questionCount: Joi.number().min(1).required(),
      passingScore: Joi.number().min(1).max(100).required(),

      xpPoints: Joi.number().min(0).default(0),
      coins: Joi.number().min(0).default(0),
      badge: Joi.string().allow(null, ""),
      bonusCondition: Joi.string().allow(null, ""),

      prerequisiteLessons: Joi.array().items(Joi.string()),
      minimumPreviousScore: Joi.number().min(0).max(100).default(0),

      lessonId: Joi.string().allow(null),

      isPublished: Joi.boolean().default(false),
      isFeatured: Joi.boolean().default(false),
      leaderboardEnabled: Joi.boolean().default(false),
    });

    const { error, value } = schema.validate(req.body);
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
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.LESSON_NOT_FOUND));
    }

    // ✅ Create quest
    const quest = await Quest.create({
      teacherId: req.user.id,

      title,
      description,
      questType,
      targetGrade,
      ageGroup,

      difficulty,
      timeLimit,
      maxAttempts,
      questionCount,
      passingScore,

      rewards: {
        xpPoints,
        coins,
        badge: badge || null,
        bonusCondition: bonusCondition || null,
      },

      prerequisites: {
        lessons: prerequisiteLessons || [],
        minimumScore: minimumPreviousScore,
      },

      lessonId: lessonId || null,

      thumbnail,

      isPublished,
      isFeatured,
      leaderboardEnabled,
    });

    return res.status(201).json(new ApiResponse(201, quest, Msg.QUEST_CREATED));
  } catch (error) {
    console.error("Error creating quest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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
    await Quiz.deleteMany({ questId: id, teacherId: req.user.id });
    return res.status(200).json(new ApiResponse(200, { id }, Msg.DATA_DELETED));
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

    const questsWithSignedUrls = await Promise.all(
      quests.map(async (quest) => {
        if (quest.thumbnail?.key) {
          quest.thumbnail.key = await getSignedFileUrl(quest.thumbnail.key);
        }
        return quest;
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, questsWithSignedUrls, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting quests:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const questByIdHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const quest = await Quest.findOne({ _id: id, teacherId: req.user.id });
    if (!quest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    quest.thumbnail.key = await getSignedFileUrl(quest.thumbnail?.key);
    return res.status(200).json(new ApiResponse(200, quest, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting quest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateQuestHandler = async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      difficulty,
      rewardPoints,
      numberOfTasks,
      timeLimit,
      lessonId,
      quizId,
    } = req.body;

    const schema = Joi.object({
      id: Joi.string().optional(),
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      difficulty: Joi.string().optional(),
      rewardPoints: Joi.number().optional(),
      numberOfTasks: Joi.number().optional(),
      timeLimit: Joi.number().optional(),
      lessonId: Joi.string().optional(),
      quizId: Joi.string().optional(),
    });

    const { error } = schema.validate({
      id,
      title,
      description,
      difficulty,
      rewardPoints,
      numberOfTasks,
      timeLimit,
      lessonId,
      quizId,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const quest = await Quest.findOne({ _id: id, teacherId: req.user.id });
    if (!quest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const quizz = await Quiz.findOne({ _id: quizId, teacherId: req.user.id });
    if (!quizz) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      teacherId: req.user.id,
    });
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    quest.title = title || quest.title;
    quest.description = description || quest.description;
    quest.difficulty = difficulty || quest.difficulty;
    quest.rewardPoints = rewardPoints || quest.rewardPoints;
    quest.numberOfTasks = numberOfTasks || quest.numberOfTasks;
    quest.timeLimit = timeLimit || quest.timeLimit;
    quest.lessonId = lessonId || quest.lessonId;
    quest.quizId = quizId || quest.quizId;
    if (req.file) {
      await deleteFromS3(quest.thumbnail?.key);
      quest.thumbnail = {
        url: req.file.location,
        key: req.file.key,
      };
    } else {
      quest.thumbnail = quest.thumbnail;
    }

    await quest.save();

    return res.status(200).json(new ApiResponse(200, quest, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error updating quest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const quizzByQuestIdHandle = async(req, res)=>{
  try {
    const {id}= req.params;
    const quest = await Quest.findById(id);
    if (!quest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.QUEST_NOT_FOUND));
      
    }

    quest.thumbnail = await getSignedFileUrl(quest.thumbnail);
    const quizz = await Quiz.find({questId: id});
    if (!quizz) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.QUIZZ_NOT_FOUND));
      
    }

    const formattedObj  = {
      quest,
      quizz,
    };


    return res.status(200).json(new ApiResponse(200, formattedObj, Msg.DATA_FETCHED));

    
  } catch (error) {
    console.log(`Error getting quizz by quest id: ${error}`)
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    
  }
}
