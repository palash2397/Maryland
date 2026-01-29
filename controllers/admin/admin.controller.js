import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import Plan from "../../models/plan/plan.js";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import Student from "../../models/student/student.js";
import Teacher from "../../models/teacher/teacher.js";

export const allStudentHandle = async (req, res) => {
  try {
    const students = await Student.find({});
    if (!students || students.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, students, Msg.USERS_FETCHED));
  } catch (error) {
    console.error("error while getting all students", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
