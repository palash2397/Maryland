import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Student from "../../models/student/student.js";


export const leaderboardHandle = async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .select("firstName lastName avatar xp level")
      .sort({ xp: -1 })
      .limit(50)
      .lean();

    const leaderboard = students.map((s, index) => ({
      rank: index + 1,
      name: `${s.firstName}`,
      avatar: s.avatar,
      points: s.xp,
      level: s.level,
      progress: Math.min((s.xp % 100), 100),
    }));

    return res.status(200).json(
      new ApiResponse(200, leaderboard, "Leaderboard fetched")
    );
  } catch (error) {
    return res.status(500).json(
      new ApiResponse(500, {}, Msg.SERVER_ERROR)
    );
  }
};
