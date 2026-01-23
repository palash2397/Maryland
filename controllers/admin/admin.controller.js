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
    if (!plans || plans.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plans, Msg.PLAN_LIST));
  } catch (error) {
    console.error("Error getting plans:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getPlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plan, Msg.PLAN_DETAIL));
  } catch (error) {
    console.error("Error getting plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const deletePlanHandle = async(req, res)=>{
    try {
        const {id} = req.params;
        const Schema = Joi.object({
            id: Joi.string().required(),
        });
        const { error } = Schema.validate({ id });
        if (error) {
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));
        }
        const plan = await Plan.findByIdAndDelete(id);
        if (!plan) {
            return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
        }
        return res.status(200).json(new ApiResponse(200, {}, Msg.PLAN_DELETE));
    } catch (error) {
        console.error("Error deleting plan:", error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
}

export const updatePlanHandle = async(req, res)=>{
    try {
        const {id} = req.params;
        const {name, price, interval, features, description} = req.body;
        const Schema = Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            interval: Joi.string().required(),
            features: Joi.array().required(),
            description: Joi.string().required(),
        });
        const { error } = Schema.validate({ name, price, interval, features, description });
        if (error) {
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));
        }
        const plan = await Plan.findByIdAndUpdate(id, {
            name: name || plan.name,
            price: price || plan.price,
            interval: interval || plan.interval,
            features: features || plan.features,
            description: description || plan.description,
        });
        if (!plan) {
            return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
        }
        return res.status(200).json(new ApiResponse(200, plan, Msg.PLAN_UPDATE));
    } catch (error) {
        console.error("Error updating plan:", error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
}


