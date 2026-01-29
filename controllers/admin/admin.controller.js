import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import Plan from "../../models/plan/plan.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

import Student from "../../models/student/student.js";
import Teacher from "../../models/teacher/teacher.js";

export const allStudentHandle = async (req, res) => {
  try {
    const students = await Student.find({}).select(
      "-password -__v -stripeCustomerId -googleId -passwordResetToken -linkExpireAt -actToken",
    );
    if (!students || students.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    const formattedData = await Promise.all(
      students.map(async (student) => ({
        ...(student.toObject?.() ?? student),
        avatar: student.avatar
          ? await getSignedFileUrl(student.avatar)
          : `${process.env.DEFAULT_PROFILE_PIC}`,
      })),
    );
    return res
      .status(200)
      .json(new ApiResponse(200, formattedData, Msg.USERS_FETCHED));
  } catch (error) {
    console.error("error while getting all students", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const studentHandle = async(req, res)=>{
    try {
        const { id } = req.params;
        const schema = Joi.object({
            id: Joi.string().required(),
        });

        const { error } = schema.validate(req.params);
        if (error) {
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));
        }

        const student = await Student.findById(id).select(
            "-password -__v -stripeCustomerId -googleId -passwordResetToken -linkExpireAt -actToken",
        );
        if (!student) {
            return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
        }

        student.avatar = student.avatar
          ? await getSignedFileUrl(student.avatar)
          : `${process.env.DEFAULT_PROFILE_PIC}`;

        return res.status(200).json(new ApiResponse(200, student, Msg.USER_FETCHED));
    } catch (error) {
        console.error("error while getting student", error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
}
