import Joi from "joi";

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
    // ======================
    // 📦 SUBSCRIPTION COUNTS
    // ======================
    const [totalSubscriptions, activeSubscriptions, cancelledSubscriptions] =
      await Promise.all([
        UserSubscription.countDocuments(),
        UserSubscription.countDocuments({ status: "active" }),
        UserSubscription.countDocuments({ status: "cancelled" }),
      ]);

    // ======================
    // 💵 REVENUE BY PLAN
    // ======================
    const revenueByPlan = await BillingHistory.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$planId",
          totalUsers: { $addToSet: "$userId" }, // unique payers
          totalRevenue: { $sum: "$amount" }, // cents
        },
      },
      {
        $project: {
          planId: "$_id",
          totalUsers: { $size: "$totalUsers" },
          totalRevenue: 1,
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: "$plan" },
      {
        $project: {
          planName: "$plan.name",
          price: "$plan.price",
          totalUsers: 1,
          totalRevenue: 1, // cents
        },
      },
    ]);

    const totalRevenue = revenueByPlan.reduce(
      (sum, p) => sum + p.totalRevenue,
      0,
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
        Msg.SUBSCRIPTION_FETCHED,
      ),
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
