import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Student from "../../models/student/student.js";


export const leaderboardHandle = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const leaderboard = await Student.find({ isActive: true })
      .select("firstName lastName xp coins")
      .sort({ xp: -1, coins: -1 })
      .limit(limit)
      .lean();

    // Add rank manually
    const rankedList = leaderboard.map((student, index) => ({
      rank: index + 1,
      studentId: student._id,
      name: `${student.firstName} ${student.lastName}`,
      xp: student.xp || 0,
      coins: student.coins || 0,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        rankedList,
        Msg.
      )
    );
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
