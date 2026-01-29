import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import Teacher from "../../models/teacher/teacher.js";

export const allTeacherHandle = async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select(
      "-password -__v -stripeCustomerId -googleId -passwordResetToken -linkExpireAt -actToken",
    );
    if (!teachers || teachers.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    const formattedData = await Promise.all(
      teachers.map(async (teacher) => ({
        ...(teacher.toObject?.() ?? teacher),
        certificate: teacher.certificate.key
          ? await getSignedFileUrl(teacher.certificate.key)
          : `${process.env.DEFAULT_CERTIFICATE}`,
        avatar: teacher.avatar
          ? await getSignedFileUrl(teacher.avatar)
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

export const teacherHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const teacher = await Teacher.findById(id).select(
      "-password -__v -googleId -passwordResetToken -linkExpireAt -actToken -updatedAt",
    );
    if (!teacher) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    console.log("teacher --->", teacher);

    const teacherDoc = teacher.toObject();
    teacherDoc.certificate = teacherDoc.certificate?.key
      ? await getSignedFileUrl(teacherDoc.certificate.key)
      : `${process.env.DEFAULT_CERTIFICATE}`;

    teacherDoc.avatar = teacherDoc.avatar
      ? await getSignedFileUrl(teacherDoc.avatar)
      : `${process.env.DEFAULT_PROFILE_PIC}`;

    // console.log(teacherDoc);

    return res
      .status(200)
      .json(new ApiResponse(200, teacherDoc, Msg.USER_FETCHED));
  } catch (error) {
    console.error("error while getting teacher", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const teacherAccountStatusHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const user = await Teacher.findById(id);
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    user.isActive = user.isActive ? false : true;
    await user.save();
    let status = user.isActive ? `activated` : `deactivated`;

    return res
      .status(200)
      .json(new ApiResponse(200, {}, `Users account ${status} successfully`));
  } catch (error) {
    console.log(`error while deactivating account`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
