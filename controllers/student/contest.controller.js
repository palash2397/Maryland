import Joi from "joi";


import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";
import StudentQuest from "../../models/studentQuest/studentQuest.js";

// import {
//   generateRandomString,
//   getExpirationTime,
//   deleteOldImages,
// } from "../../utils/helper.js";
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

    if (studentQuest) {
      return res.status(200).json(
        new ApiResponse(
          200,
          studentQuest,
          studentQuest.status === "completed"
            ? Msg.QUEST_ALREADY_COMPLETED
            : Msg.QUEST_RESUME,
        ),
      );
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

    return res.status(201).json(
      new ApiResponse(201, studentQuest, Msg.QUEST_STARTED),
    );
  } catch (error) {
    console.error("Start quest error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const allQuestHandle = async (req, res) => {
  try {
    const quests = await Quest.find({ isPublished: true })
      .populate("teacherId", "firstName lastName");

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
