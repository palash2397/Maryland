import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import ContactUs from "../../models/contact/contact.js";
import { sendContactUsMail } from "../../utils/email.js";


export const contactUsHandle = async(req, res)=>{
    try {
        const { name, email, subject, message}= req.body
        const Schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().required(),
            subject: Joi.string().required(),
            message: Joi.string().required(),
        })

        const { error } = Schema.validate({ name, email, subject, message })
        if (error) {
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message))
        }
        
        
    } catch (error) {
        console.log(`error while contact us`, error)
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR))
        
    }
}