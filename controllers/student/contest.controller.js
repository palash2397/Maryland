import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Badge from "../../models/badges/badge.js";
import StudentBadge from "../../models/badges/studentBadges.js";

import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";
import StudentQuest from "../../models/studentQuest/studentQuest.js";


import Teacher from "../../models/teacher/teacher.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import Student from "../../models/student/student.js";

export const startQuestHandle = async (req, res) => {
  try {
    const { questId } = req.params;

    // 1. Fetch quest
    const quest = await Quest.findById(questId);
    console.log("quest", quest);
    if (!quest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUEST_NOT_FOUND));
    }

    // 2. Fetch quiz linked to quest
    const quiz = await Quiz.findOne({ questId: quest.quizId });
    if (!quiz) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.QUIZZ_NOT_FOUND));
    }

    // 3. Check if already started
    let studentQuest = await StudentQuest.findOne({
      studentId: req.user.id,
      questId,
    });

    console.log("studentQuest", studentQuest);

    if (studentQuest) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            studentQuest,
            studentQuest.status === "completed"
              ? Msg.QUEST_ALREADY_COMPLETED
              : Msg.QUEST_RESUME,
          ),
        );
    }

    const attemptsCount = await StudentQuest.countDocuments({
      studentId: req.user.id,
      questId,
    });

    if (attemptsCount >= quest.maxAttempts) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.QUEST_MAX_ATTEMPTS_REACHED));
    }

    // 4. Create new StudentQuest
    studentQuest = await StudentQuest.create({
      studentId: req.user.id,
      questId,
      quizId: quiz._id,
      totalQuestions: quiz.questions.length,
      status: "inProgress",
      startedAt: new Date(),
    });

    console.log("rewardPoints", quest.rewardPoints);

    await Student.updateOne(
      { _id: req.user.id },
      {
        $inc: {
          xp: quest.rewardPoints.xpPoints,
          coins: quest.rewardPoints.coins || 0,
        },
      },
    );

    return res
      .status(201)
      .json(new ApiResponse(201, studentQuest, Msg.QUEST_STARTED));
  } catch (error) {
    console.error("Start quest error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allQuestHandle = async (req, res) => {
  try {
    const quests = await Quest.find({ isPublished: true }).populate(
      "teacherId",
      "firstName lastName",
    );

    if (!quests.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUEST_NOT_FOUND));
    }

    const studentQuests = await StudentQuest.find({
      studentId: req.user.id,
    }).lean();

    const questMap = {};
    studentQuests.forEach((sq) => {
      questMap[sq.questId.toString()] = sq;
    });

    const response = await Promise.all(
      quests.map(async (quest) => {
        const sq = questMap[quest._id.toString()];

        let thumbnail = null;
        if (quest.thumbnail) {
          thumbnail = await getSignedFileUrl(quest.thumbnail);
        }

        return {
          _id: quest._id,
          title: quest.title,
          description: quest.description,
          difficulty: quest.difficulty,
          totalTasks: quest.numberOfTasks,
          thumbnail,
          progress: sq
            ? Math.round((sq.completedTasks / quest.numberOfTasks) * 100)
            : 0,
          status: sq
            ? sq.status // inProgress | completed
            : "notStarted",
          action: sq
            ? sq.status === "completed"
              ? "completed"
              : "continue"
            : "start",
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, response, Msg.QUEST_FETCHED));
  } catch (error) {
    console.error("Error getting quests:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const currentQuestQuestionHandle = async (req, res) => {
  try {
    const { questId } = req.params;

    // 1️⃣ Find student quest progress
    const studentQuest = await StudentQuest.findOne({
      studentId: req.user.id,
      questId,
      status: "inProgress",
    });

    if (!studentQuest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUEST_QUESTION_NOT_STARTED));
    }

    // 2️⃣ Fetch quiz
    const quiz = await Quiz.findById(studentQuest.quizId).lean();
    if (!quiz) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUIZZ_NOT_FOUND));
    }

    const index = studentQuest.currentQuestionIndex;

    // 3️⃣ Safety check
    if (index >= quiz.questions.length) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.QUEST_NO_MORE_QUESTIONS));
    }

    const question = quiz.questions[index];

    // 4️⃣ Remove correct answer before sending
    const { correctAnswer, ...safeQuestion } = question.toObject
      ? question.toObject()
      : question;

    // 5️⃣ Send response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          question: safeQuestion,
          currentIndex: index + 1,
          totalQuestions: quiz.questions.length,
          progress: Math.round((index / quiz.questions.length) * 100),
        },
        Msg.QUEST_QUESTION_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Get quest question error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const submitQuestAnswerHandle = async (req, res) => {
  try {
    const { questId, selectedOption } = req.body;

    // 🔹 Validation
    const schema = Joi.object({
      questId: Joi.string().required(),
      selectedOption: Joi.string().required(),
    });

    const { error } = schema.validate({ questId, selectedOption });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // 1️⃣ Fetch student quest
    const studentQuest = await StudentQuest.findOne({
      studentId: req.user.id,
      questId,
      status: "inProgress",
    });

    if (!studentQuest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUEST_QUESTION_NOT_STARTED));
    }

    // 2️⃣ Fetch quiz
    const quiz = await Quiz.findById(studentQuest.quizId).lean();
    if (!quiz) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.QUIZZ_NOT_FOUND));
    }

    const currentIndex = studentQuest.currentQuestionIndex;
    const question = quiz.questions[currentIndex];

    if (!question) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.QUEST_QUESTION_NOT_FOUND));
    }

    // 3️⃣ Check answer
    const isCorrect = question.correctAnswer === selectedOption;
    if (isCorrect) {
      studentQuest.correctAnswers += 1;
    }

    // 4️⃣ Move to next question
    studentQuest.currentQuestionIndex += 1;

    const isCompleted =
      studentQuest.currentQuestionIndex >= quiz.questions.length;

    // ===========================
    // 🎯 QUEST COMPLETION LOGIC
    // ===========================
    if (isCompleted) {
      const score = Math.round(
        (studentQuest.correctAnswers / quiz.questions.length) * 100
      );

      studentQuest.score = score;
      studentQuest.status = "completed";
      studentQuest.completedAt = new Date();

      await studentQuest.save();

      // 5️⃣ Fetch quest rewards
      const quest = await Quest.findById(questId).lean();

      // 6️⃣ Update XP, coins & level
      const LEVEL_XP = 100;

      const student = await Student.findById(req.user.id).select("xp level");

      const currentXp = student.xp || 0;
      const earnedXp = quest?.rewards?.xpPoints || 0;
      const earnedCoins = quest?.rewards?.coins || 0;

      const newXp = currentXp + earnedXp;
      const newLevel = Math.floor(newXp / LEVEL_XP) + 1;

      await Student.updateOne(
        { _id: req.user.id },
        {
          $set: {
            xp: newXp,
            level: newLevel,
          },
          $inc: {
            coins: earnedCoins,
          },
        }
      );

      // ===========================
      // 🏅 BADGE UNLOCK LOGIC
      // ===========================

      // Total completed quests
      const completedQuestCount = await StudentQuest.countDocuments({
        studentId: req.user.id,
        status: "completed",
      });

      const badges = await Badge.find({ isActive: true });

      for (const badge of badges) {
        let shouldUnlock = false;

        if (badge.type === "quest") {
          shouldUnlock = completedQuestCount >= badge.conditionValue;
        }

        if (badge.type === "level") {
          shouldUnlock = newLevel >= badge.conditionValue;
        }

        if (shouldUnlock) {
          await StudentBadge.updateOne(
            {
              studentId: req.user.id,
              badgeId: badge._id,
            },
            {
              $setOnInsert: { unlockedAt: new Date() },
            },
            { upsert: true }
          );
        }
      }

      // ✅ Final response on completion
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            completed: true,
            score,
            correctAnswers: studentQuest.correctAnswers,
            totalQuestions: quiz.questions.length,
            earnedXp,
            earnedCoins,
            newLevel,
          },
          Msg.QUEST_COMPLETED
        )
      );
    }

    // ===========================
    // ⏭️ CONTINUE QUEST
    // ===========================
    await studentQuest.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          completed: false,
          nextQuestionIndex: studentQuest.currentQuestionIndex,
          correct: isCorrect,
        },
        "Answer submitted"
      )
    );
  } catch (error) {
    console.error("Submit quest answer error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
