import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

import Student from "../../models/student/student.js";

export const leaderboardHandle = async (req, res) => {
  try {
    const LEVEL_XP = 100;

    const students = await Student.find({ isActive: true })
      .select("firstName lastName avatar xp level")
      .sort({ xp: -1 })
      .limit(50)
      .lean();

    const leaderboard = await Promise.all(
      students.map(async (s, index) => {
        const xp = s.xp ?? 0;
        const level = s.level ?? 1;

        const levelBaseXp = (level - 1) * LEVEL_XP;
        const progress = Math.min(
          Math.floor(((xp - levelBaseXp) / LEVEL_XP) * 100),
          100
        );

        return {
          rank: index + 1,
          name: s.firstName,
          avatar: s.avatar
            ? await getSignedFileUrl(s.avatar)
            : process.env.DEFAULT_PROFILE_PIC,
          points: xp,
          level,
          progress: progress < 0 ? 0 : progress, // safety
        };
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, leaderboard, "Leaderboard fetched"));
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const leaderboardSummaryHandle = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select("xp level")
      .lean();

    const myRank =
      (await Student.countDocuments({ xp: { $gt: student.xp } })) + 1;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          myRank,
          totalPoints: student.xp,
          myLevel: student.level,
        },
        "Leaderboard summary fetched",
      ),
    );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
