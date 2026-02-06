import mongoose from "mongoose";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Student from "../../models/student/student.js";
import Teacher from "../../models/teacher/teacher.js";
import Lesson from "../../models/lesson/lesson.js";
import Quest from "../../models/quest/quest.js";
import Quiz from "../../models/quizz/quizz.js";
import StudentQuest from "../../models/studentQuest/studentQuest.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import BillingHistory from "../../models/billing/billingHistory.js";
import Plan from "../../models/plan/plan.js";
import { getMonthRanges, calculateGrowth } from "../../utils/helper.js";

export const contestDashboardHandle = async (req, res) => {
  try {
    // ======================
    // 📊 BASIC COUNTS
    // ======================
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalLessons,
      totalQuests,
      totalQuizzes,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments(),
      Lesson.countDocuments(),
      Quest.countDocuments(),
      Quiz.countDocuments(),
    ]);

    // ======================
    // 🎯 QUEST ENGAGEMENT
    // ======================
    const [totalAttempts, completedAttempts, avgScoreResult] =
      await Promise.all([
        StudentQuest.countDocuments(),
        StudentQuest.countDocuments({ status: "completed" }),
        StudentQuest.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, avgScore: { $avg: "$score" } } },
        ]),
      ]);

    const averageQuestScore =
      avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // ======================
    // 🏆 TOP STUDENTS
    // ======================
    const topStudents = await Student.find({ isActive: true })
      .select("firstName lastName xp level")
      .sort({ xp: -1 })
      .limit(5)
      .lean();

    // ======================
    // 💎 TOTAL XP DISTRIBUTED
    // ======================
    const totalXpResult = await Student.aggregate([
      { $group: { _id: null, totalXp: { $sum: "$xp" } } },
    ]);

    const totalXpDistributed =
      totalXpResult.length > 0 ? totalXpResult[0].totalXp : 0;

    // ======================
    // ✅ RESPONSE
    // ======================
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          overview: {
            totalStudents,
            activeStudents,
            totalTeachers,
            totalLessons,
            totalQuests,
            totalQuizzes,
          },
          engagement: {
            totalAttempts,
            completedAttempts,
            averageQuestScore,
            totalXpDistributed,
          },
          topStudents,
        },
        "Admin dashboard data fetched",
      ),
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const subscriptionAnalyticsHandle = async (req, res) => {
  try {
    const [totalSubscriptions, activeSubscriptions, cancelledSubscriptions] =
      await Promise.all([
        UserSubscription.countDocuments(),
        UserSubscription.countDocuments({ status: "active" }),
        UserSubscription.countDocuments({ status: "cancelled" }),
      ]);

    const revenueByPlan = await BillingHistory.aggregate([
      { $match: { status: "paid" } },

      {
        $group: {
          _id: "$planId",
          totalUsersSet: { $addToSet: "$userId" },
          totalRevenue: { $sum: "$amount" }, // smallest unit
          currency: { $first: "$currency" },
        },
      },

      {
        $lookup: {
          from: Plan.collection.name, // "plans"
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },

      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          price: "$plan.price",
          totalUsers: { $size: "$totalUsersSet" },
          totalRevenue: 1,
          currency: 1,
        },
      },
    ]);

    const totalRevenue = revenueByPlan.reduce(
      (sum, p) => sum + (p.totalRevenue || 0),
      0
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptions: {
            total: totalSubscriptions,
            active: activeSubscriptions,
            cancelled: cancelledSubscriptions,
          },
          revenue: {
            totalRevenue,
            revenueByPlan,
          },
        },
        Msg.SUBSCRIPTION_FETCHED
      )
    );
  } catch (error) {
    console.error("Subscription analytics error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const adminDashboardHandle = async (req, res) => {
  try {
    const { startOfThisMonth, startOfLastMonth, endOfLastMonth } =
      getMonthRanges();

    /* =======================
       ACTIVE STUDENTS
    ======================== */
    const totalStudents = await Student.countDocuments({});

    const studentsThisMonth = await Student.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });

    const studentsLastMonth = await Student.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const studentGrowth = calculateGrowth(studentsThisMonth, studentsLastMonth);

    /* =======================
       TOTAL TEACHERS
    ======================== */
    const totalTeachers = await Teacher.countDocuments({ isActive: true });

    const teachersThisMonth = await Teacher.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });

    const teachersLastMonth = await Teacher.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const teacherGrowth = calculateGrowth(teachersThisMonth, teachersLastMonth);

    /* =======================
       QUESTS COMPLETED
    ======================== */
    const totalQuestsCompleted = await StudentQuest.countDocuments({
      status: "completed",
    });

    const questsThisMonth = await StudentQuest.countDocuments({
      status: "completed",
      completedAt: { $gte: startOfThisMonth },
    });

    const questsLastMonth = await StudentQuest.countDocuments({
      status: "completed",
      completedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const questGrowth = calculateGrowth(questsThisMonth, questsLastMonth);

    /* =======================
       TOTAL LESSONS
    ======================== */
    const totalLessons = await Lesson.countDocuments({
      status: "published",
    });

    const lessonsThisMonth = await Lesson.countDocuments({
      status: "published",
      createdAt: { $gte: startOfThisMonth },
    });

    const lessonsLastMonth = await Lesson.countDocuments({
      status: "published",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const lessonGrowth = calculateGrowth(lessonsThisMonth, lessonsLastMonth);

    /* =======================
       RESPONSE
    ======================== */
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          activeStudents: {
            total: totalStudents,
            growth: studentGrowth,
          },
          totalTeachers: {
            total: totalTeachers,
            growth: teacherGrowth,
          },
          questsCompleted: {
            total: totalQuestsCompleted,
            growth: questGrowth,
          },
          totalLessons: {
            total: totalLessons,
            growth: lessonGrowth,
          },
        },
        Msg.DATA_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const learningProgressStatsHandle = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    const [totalLessons, agg] = await Promise.all([
      Lesson.countDocuments({ status: "published" }),
      StudentLessonProgress.aggregate([
        { $match: { studentId } },

        // de-dupe by lessonId; if any record says completed => completed
        {
          $group: {
            _id: "$lessonId",
            completed: {
              $max: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            inProgress: {
              $max: { $cond: [{ $eq: ["$status", "inProgress"] }, 1, 0] },
            },
          },
        },

        {
          $group: {
            _id: null,
            completed: { $sum: "$completed" },
            inProgress: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$completed", 0] }, { $eq: ["$inProgress", 1] }] },
                  1,
                  0,
                ],
              },
            },
            started: { $sum: 1 },
          },
        },
      ]),
    ]);

    const completed = agg?.[0]?.completed || 0;
    const inProgress = agg?.[0]?.inProgress || 0;
    const started = agg?.[0]?.started || 0;

    const notStarted = Math.max(0, totalLessons - started);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalLessons,
          completed,
          inProgress,
          notStarted,
        },
        Msg.DATA_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Learning progress stats error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

