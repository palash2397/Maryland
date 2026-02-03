import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import Plan from "../../models/plan/plan.js";
import Lesson from "../../models/lesson/lesson.js";
import Video from "../../models/lesson/video.js";
import ContactSettings from "../../models/contact/contactSetting.js";

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

export const studentHandle = async (req, res) => {
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

    const student = await Student.findById(id).select(
      "-password -__v -stripeCustomerId -googleId -passwordResetToken -linkExpireAt -actToken -updatedAt",
    );
    if (!student) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    student.avatar = student.avatar
      ? await getSignedFileUrl(student.avatar)
      : `${process.env.DEFAULT_PROFILE_PIC}`;

    return res
      .status(200)
      .json(new ApiResponse(200, student, Msg.USER_FETCHED));
  } catch (error) {
    console.error("error while getting student", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const changeAccountStatusHandle = async (req, res) => {
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

    const user = await Student.findById(id);
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

export const allLessonHandle = async (req, res) => {
  try {
    const data = await Lesson.find().populate(
      "teacherId",
      "firstName lastName email avatar",
    );
    if (!data || data.length == 0)
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.LESSON_NOT_FOUND));

    const formattedData = await Promise.all(
      data.map(async (lesson) => {
        return {
          ...lesson.toObject(),
          thumbnail: lesson.thumbnail
            ? await getSignedFileUrl(lesson.thumbnail)
            : null,
          teacherId: {
            ...lesson.teacherId.toObject(),
            avatar: lesson.teacherId.avatar
              ? await getSignedFileUrl(lesson.teacherId.avatar)
              : `${process.env.DEFAULT_PROFILE_PIC}`,
          },
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, formattedData, Msg.LESSON_FETCHED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const lessonHandle = async (req, res) => {
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

    const lesson = await Lesson.findById(id).populate(
      "teacherId",
      "firstName lastName email avatar",
    );
    if (!lesson) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.LESSON_NOT_FOUND));
    }

    lesson.thumbnail = lesson.thumbnail
      ? await getSignedFileUrl(lesson.thumbnail)
      : null;
    lesson.teacherId.avatar = lesson.teacherId.avatar
      ? await getSignedFileUrl(lesson.teacherId.avatar)
      : `${process.env.DEFAULT_PROFILE_PIC}`;

    return res
      .status(200)
      .json(new ApiResponse(200, lesson, Msg.LESSON_FETCHED));
  } catch (error) {
    console.log(`error while getting lesson`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allChapterHandle = async (req, res) => {
  try {
    const chapters = await Video.find({})
      .populate("lessonId", "title")
      .populate("teacherId", "firstName lastName email avatar");

    if (!chapters || chapters.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.CHAPTER_NOT_FOUND));
    }

    const formattedData = await Promise.all(
      chapters.map(async (chapter) => {
        return {
          ...chapter.toObject(),
          videoUrl: chapter.videoUrl
            ? await getSignedFileUrl(chapter.videoUrl)
            : null,
          thumbnail: chapter.thumbnail
            ? await getSignedFileUrl(chapter.thumbnail)
            : null,
          teacherId: {
            ...chapter.teacherId.toObject(),
            avatar: chapter.teacherId.avatar
              ? await getSignedFileUrl(chapter.teacherId.avatar)
              : `${process.env.DEFAULT_PROFILE_PIC}`,
          },
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, formattedData, Msg.CHAPTERS_FETCHED));
  } catch (error) {
    console.log(`error while getting chapters`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const chapterHandle = async(req, res)=>{
  try {
    const {id} = req.params

    const schema = Joi.object({
      id: Joi.string().required(),
    })
    
    const {error} = schema.validate(req.params)
    if(error){
      return res.status(400).json(new ApiResponse(400, {}, Msg.ID_REQUIRED))
    }
    
    const chapter = await Video.findById(id)
      .populate("lessonId", "title")
      .populate("teacherId", "firstName lastName email avatar");
    
    if(!chapter){
      return res.status(404).json(new ApiResponse(404, {}, Msg.CHAPTER_NOT_FOUND));
    }

    chapter.thumbnail = chapter.thumbnail ? await getSignedFileUrl(chapter.thumbnail) : null;
    chapter.videoUrl = chapter.videoUrl ? await getSignedFileUrl(chapter.videoUrl) : null;
    chapter.teacherId.avatar = chapter.teacherId.avatar ? await getSignedFileUrl(chapter.teacherId.avatar) : `${process.env.DEFAULT_PROFILE_PIC}`;
    
    return res.status(200).json(new ApiResponse(200, chapter, Msg.CHAPTER_FETCHED));
    
  } catch (error) {
    console.log(`error while getting chapter`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
}


export const contactSettingHandle = async(req, res)=>{
  try {
    const {address, email, phone} = req.body
    const schema = Joi.object({
      address: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
    })
    
    const {error} = schema.validate(req.body)
    if(error){
      return res.status(400).json(new ApiResponse(400, {}, error.details[0].message))
    }
    
    const contactSetting = await ContactSettings.findOne()
    if(!contactSetting){
      return res.status(404).json(new ApiResponse(404, {}, Msg.CONTACT_SETTING_NOT_FOUND))
    }
    
    contactSetting.address = address
    contactSetting.email = email
    contactSetting.phone = phone
    await contactSetting.save()
    
    return res.status(200).json(new ApiResponse(200, contactSetting, Msg.C))
    
  } catch (error) {
    console.log(`error while getting contact settings`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
}
