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
    const [
      totalAttempts,
      completedAttempts,
      avgScoreResult,
    ] = await Promise.all([
      StudentQuest.countDocuments(),
      StudentQuest.countDocuments({ status: "completed" }),
      StudentQuest.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, avgScore: { $avg: "$score" } } },
      ]),
    ]);

    const averageQuestScore =
      avgScoreResult.length > 0
        ? Math.round(avgScoreResult[0].avgScore)
        : 0;

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
        "Admin dashboard data fetched"
      )
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const subscriptionAnalyticsHandle = async (req, res) => {
  try {
    // ======================
    // 📦 SUBSCRIPTION COUNTS
    // ======================
    const [
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
    ] = await Promise.all([
      UserSubscription.countDocuments(),
      UserSubscription.countDocuments({ status: "active" }),
      UserSubscription.countDocuments({ status: "cancelled" }),
    ]);

    // ======================
    // 💵 REVENUE BY PLAN
    // ======================
    const revenueByPlan = await UserSubscription.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $group: {
          _id: "$planId",
          totalUsers: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "_id",
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
          totalRevenue: 1,
        },
      },
    ]);

    // ======================
    // 💰 TOTAL REVENUE
    // ======================
    const totalRevenue = revenueByPlan.reduce(
      (sum, p) => sum + p.totalRevenue,
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
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};



export const adminDashboardHandle = async (req, res) => {
  try {
    const { startOfThisMonth, startOfLastMonth, endOfLastMonth } = getMonthRanges();

    /* =======================
       STUDENTS (TOTAL + MONTHLY NEW + GROWTH)
    ======================== */
    const totalStudents = await Student.countDocuments({});
    const newStudentsThisMonth = await Student.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const newStudentsLastMonth = await Student.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const studentsGrowth = calculateGrowth(newStudentsThisMonth, newStudentsLastMonth);

    /* =======================
       ACTIVE STUDENTS (TOTAL + MONTHLY NEW ACTIVE + GROWTH)
       If you want "active" by isActive flag only, totals are isActive:true
       Growth uses "new active students created this month vs last month"
    ======================== */
    const totalActiveStudents = await Student.countDocuments({ isActive: true });
    const newActiveStudentsThisMonth = await Student.countDocuments({
      isActive: true,
      createdAt: { $gte: startOfThisMonth },
    });
    const newActiveStudentsLastMonth = await Student.countDocuments({
      isActive: true,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const activeStudentsGrowth = calculateGrowth(
      newActiveStudentsThisMonth,
      newActiveStudentsLastMonth
    );

    /* =======================
       TEACHERS (TOTAL + MONTHLY NEW + GROWTH)
    ======================== */
    const totalTeachers = await Teacher.countDocuments({});
    const newTeachersThisMonth = await Teacher.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const newTeachersLastMonth = await Teacher.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const teachersGrowth = calculateGrowth(newTeachersThisMonth, newTeachersLastMonth);

    /* =======================
       LESSONS (TOTAL + MONTHLY NEW + GROWTH)
    ======================== */
    const totalLessons = await Lesson.countDocuments({});
    const newLessonsThisMonth = await Lesson.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const newLessonsLastMonth = await Lesson.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lessonsGrowth = calculateGrowth(newLessonsThisMonth, newLessonsLastMonth);

    /* =======================
       QUESTS COMPLETED (TOTAL COMPLETED ALL TIME + MONTHLY COMPLETED + GROWTH)
    ======================== */
    const totalQuestsCompleted = await StudentQuest.countDocuments({ status: "completed" });

    const questsCompletedThisMonth = await StudentQuest.countDocuments({
      status: "completed",
      completedAt: { $gte: startOfThisMonth },
    });

    const questsCompletedLastMonth = await StudentQuest.countDocuments({
      status: "completed",
      completedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const questsGrowth = calculateGrowth(questsCompletedThisMonth, questsCompletedLastMonth);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          students: {
            total: totalStudents,
            month: newStudentsThisMonth,
            growth: studentsGrowth,
          },
          activeStudents: {
            total: totalActiveStudents,
            month: newActiveStudentsThisMonth,
            growth: activeStudentsGrowth,
          },
          teachers: {
            total: totalTeachers,
            month: newTeachersThisMonth,
            growth: teachersGrowth,
          },
          lessons: {
            total: totalLessons,
            month: newLessonsThisMonth,
            growth: lessonsGrowth,
          },
          questsCompleted: {
            total: totalQuestsCompleted,
            month: questsCompletedThisMonth,
            growth: questsGrowth,
          },
        },
        Msg.DATA_FETCHED
      )
    );
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

