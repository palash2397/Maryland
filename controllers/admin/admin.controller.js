import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import Plan from "../../models/plan/plan.js";

// import Teacher from "../../models/teacher/teacher.js";

// import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

// import Student from "../../models/student/student.js";
// import Lesson from "../../models/lesson/lesson.js";
// import TeacherReview from "../../models/review/review.js";

export const createPlanHandle = async (req, res) => {
  try {
    const { name, title, price, duration, features, interval, description } = req.body;
    const planSchema = Joi.object({
      name: Joi.string().required(),
      title: Joi.string().required(),
      price: Joi.number().required(),
      duration: Joi.number().required(),
      interval: Joi.string().valid("month", "year", "lifetime").required(),
      features: Joi.array().items(Joi.string()).required(),
      description: Joi.string().required(),
    });

    const { error } = planSchema.validate({
      name,
      title,
      price,
      duration,
      interval,
      features,
      description,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await Plan.create({
      name,
      title,
      price,
      duration,
      interval,
      features,
      description,
    });

    return res.status(201).json(new ApiResponse(201, plan, Msg.DATA_ADDED));
  } catch (error) {
    console.error("Error creating plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getPlansHandle = async (req, res) => {
  try {
    const plans = await Plan.find();
    if (!plans) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plans, Msg.PLAN_LIST));
  } catch (error) {
    console.error("Error getting plans:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

