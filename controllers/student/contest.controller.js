import Joi from "joi";


import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";
import StudentQuest from "../../models/studentQuest/studentQuest.js";

// import {
//   generateRandomString,
//   getExpirationTime,
//   deleteOldImages,
// } from "../../utils/helper.js";
import Teacher from "../../models/teacher/teacher.js";


import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

import Student from "../../models/student/student.js";
