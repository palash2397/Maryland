export const Msg = {
  // General
  SERVER_ERROR: `Internal server error`,
  SUCCESS: `Success`,
  VALIDATION_ERROR: `Validation failed`,
  BAD_REQUEST: `Bad request`,

  // User
  USER_REGISTER: `User registered successfully`,
  USER_LOGIN: `User logged in successfully`,
  USER_EXISTS: `User already exists`,
  USER_ALREADY_VERIFIED: `User Already verified`,
  USER_NOT_VERIFIED: `User not verified`,
  USER_NOT_FOUND: `User not found`,
  ACCOUNT_DEACTIVATED: `Account has been temporarily deactivated`,
  ACCOUNT_VERIFIED: `User account verified successfully.`,
  USER_FETCHED: `User fetched successfully`,
  USERS_FETCHED: `Users fetched successfully`,
  USER_DELETED: `User deleted successfully`,
  USER_UPDATED: `User updated successfully`,
  USER_ADDED: `User added successfully`,


  // Authentication
  INVALID_CREDENTIALS: `Invalid Credentials`,
  LOGIN_SUCCESS: `Login successful`,
  LOGOUT_SUCCESS: `Logout successful`,
  UNAUTHORIZED: `Unauthorized access`,
  FORBIDDEN: `Access forbidden`,
  TOKEN_EXPIRED: `Token has expired`,
  TOKEN_INVALID: `Invalid token`,
  PASSWORD_CHANGED: `Password changed successfully`,
  PASSWORD_INCORRECT: `Incorrect password`,
  PASSWORD_OLD_INCORRECT: `Incorrect old password`,
  ENTERED_OLD_PASSWORD: `You have entered your old password. Please enter a new password`,

  // Data
  DATA_FETCHED: `Data fetched successfully`,
  DATA_GENERATED: `Data generated successfully`,
  DATA_NOT_FOUND: `No data found`,
  DATA_UPDATED: `Data updated successfully`,
  DATA_DELETED: `Data deleted successfully`,
  DATA_ADDED: `Data added successfully`,
  DATA_REQUIRED: `Data is required`,
  DATA_ALREADY_EXISTS: `Data  already exists`,


  // Id
  ID_REQUIRED: `Id is required`,

  // Profile
  USERNAME_EXISTS: `Username already exists`,

  // OTP
  OTP_SENT: `The OTP has been successfully sent to your registered email. Please check your inbox.`,
  OTP_VERIFIED: `OTP verified successfully`,
  OTP_NOT_VERIFIED: `OTP not verified. Please verify OTP.`,
  OTP_EXPIRED: `OTP has expired`,
  OTP_INVALID: `Invalid or expired OTP`,
  OTP_RESENT: `OTP resent successfully`,
  OTP_LIMIT_EXCEEDED: `OTP request limit exceeded, please try again later`,
  OTP_NOT_FOUND: `OTP not found. Please request a new OTP.`,

  // Verification
  EMAIL_VERIFICATION_SENT: `The verification link has been successfully sent to your registered email. Please check your inbox.`,
  EMAIL_VERIFIED: `Email verified successfully`,
  EMAIL_SENT: `Email sent successfully`,
  EMAIL_RESET_PASSWORD_LINK_SENT: `Password reset link has been sent to your email.`,
  EMAIL_ALREADY_VERIFIED: `Email already verified`,
  PHONE_VERIFIED: `Phone number verified successfully`,
  PHONE_ALREADY_VERIFIED: `Phone number already verified`,


  // Lesson
  LESSON_CREATED: `Lesson created successfully`,
  LESSON_NOT_FOUND: `Lesson not found`,
  LESSON_DELETE: `Lesson deleted successfully`,
  LESSON_UPDATE: `Lesson updated successfully`,
  LESSON_FETCHED: `Lessons fetched successfully`,
  LESSON_LIST: `Lesson list fetched successfully`,
  LESSON_DETAIL: `Lesson detail fetched successfully`,
  LESSON_NOT_STARTED: `Lesson not started yet`,

  // chapter 
  CHAPTER_CREATED: `Chapter created successfully`,
  CHAPTER_NOT_FOUND: `Chapter not found`,
  CHAPTER_DELETE: `Chapter deleted successfully`,
  CHAPTER_UPDATE: `Chapter updated successfully`,
  CHAPTER_LIST: `Chapter list fetched successfully`,
  CHAPTER_DETAIL: `Chapter detail fetched successfully`,
  CHAPTER_FETCHED: `Chapter fetched successfully`,
  CHAPTERS_FETCHED: `Chapters fetched successfully`,
  CHAPTER_ALREADY_COMPLETED: `Chapter already completed`,
  CHAPTER_COMPLETED: `Chapter completed successfully`,

  // Thumbnail
  THUMBNAIL_GENERATED: `Thumbnail generated successfully`,
  THUMBNAIL_GENERATION_FAILED: `Thumbnail generation failed`,
  THUMBNAIL_GENERATION_ERROR: `Thumbnail generation error`,
  THUMBNAIL_GENERATION_LIMIT_EXCEEDED: `Thumbnail generation limit exceeded`,

  // Subscription
  SUBSCRIPTION_FETCHED: `Subscription fetched successfully`,
  SUBSCRIPTION_CREATED: `Subscription created successfully`,
  SUBSCRIPTION_NOT_FOUND: `Subscription not found`,
  SUBSCRIPTION_EXPIRED: `Subscription expired`,
  SUBSCRIPTION_ERROR: `Error fetching subscription`,
  SUBSCRIPTION_CANCELLED: `Subscription cancelled successfully`,
  SUBSCRIPTION_CANCEL_ERROR: `Error cancelling subscription`,
  SUBSCRIPTION_ACTIVE: `Subscription is already active`,
  SUBSCRIPTION_INACTIVE: `Subscription is inactive`,
  SUBSCRIPTION_PLAN_NOT_FOUND: `Subscription plan not found`,
  SUBSCRIPTION_CUSTOMER_NOT_FOUND: `Subscription customer not found`,
  SUBSCRIPTION_CUSTOMER_ALREADY_EXISTS: `Subscription customer already exists`,
  SUBSCRIPTION_ACTIVE_REQUIRED: `active subscrition is required`,
  SUBSCRIPTION_CANCELLED_AT_PERIOD_END: `Subscription will be cancelled at end of billing period`,
  SUBSCRIPTION_PLAN_REQUIRED: `Subscription plan required`,


  // Plan
  PLAN_CREATED: `Plan created successfully`,
  PLAN_NOT_FOUND: `Plan not found`,
  PLAN_DELETE: `Plan deleted successfully`,
  PLAN_UPDATE: `Plan updated successfully`,
  PLAN_LIST: `Plan list fetched successfully`,
  INVALID_OR_UNPAID_PLAN: `Invalid or unpaid plan`,
  PLAN_DETAIL: `Plan detail fetched successfully`,


  // Quest
  QUEST_CREATED: `Quest created successfully`,
  QUEST_NOT_FOUND: `Quest not found`,
  QUEST_DELETE: `Quest deleted successfully`,
  QUEST_UPDATE: `Quest updated successfully`,
  QUEST_LIST: `Quest list fetched successfully`,
  QUEST_DETAIL: `Quest detail fetched successfully`,
  QUEST_FETCHED: `Quest fetched successfully`,


  // Quizz
  QUIZZ_CREATED: `Quizz created successfully`,
  QUIZZ_NOT_FOUND: `Quizz not found`,
  QUIZZ_DELETE: `Quizz deleted successfully`,
  QUIZZ_UPDATE: `Quizz updated successfully`,
  QUIZZ_LIST: `Quizz list fetched successfully`,
  QUIZZ_DETAIL: `Quizz detail fetched successfully`,
  QUIZZ_FETCHED: `Quizz fetched successfully`,


  // Quest Question
  QUEST_QUESTION_FETCHED: `Quest question fetched successfully`,
  QUEST_COMPLETED: `Quest completed successfully`,
  QUEST_QUESTION_NOT_FOUND: `Quest question not found`,
  QUEST_QUESTION_ERROR: `Error fetching quest question`,
  QUEST_QUESTION_LIMIT_EXCEEDED: `Quest question limit exceeded`,
  QUEST_QUESTION_REQUIRED: `Quest question required`,
  QUEST_QUESTION_DELETED: `Quest question deleted successfully`,
  QUEST_QUESTION_UPDATED: `Quest question updated successfully`,
  QUEST_QUESTION_ADDED: `Quest question added successfully`,
  QUEST_QUESTION_NOT_STARTED: `Quest not started or already completed`,
  QUEST_NO_MORE_QUESTIONS: `No more questions available`,
  QUEST_ALREADY_COMPLETED: `Quest already completed`,
  QUEST_RESUME: `Resume quest`,

  // Qust Question Answer
  ANSWER_SUBMITTED: `Answer submitted successfully`,
  ANSWER_NOT_FOUND: `Answer not found`,
  ANSWER_FETCHED: `Answer fetched successfully`,
  ANSWER_ERROR: `Error fetching answer`,
  ANSWER_DELETED: `Answer deleted successfully`,
  ANSWER_UPDATED: `Answer updated successfully`,
  ANSWER_ADDED: `Answer added successfully`,
  ANSWER_REQUIRED: `Answer required`,
  ANSWER_LIMIT_EXCEEDED: `Answer limit exceeded`,
  ANSWER_NOT_STARTED: `Answer not started`,


  // Leaderboard
  LEADERBOARD_FETCHED: `Leaderboard fetched successfully`,
  LEADERBOARD_NOT_FOUND: `Leaderboard not found`,
  LEADERBOARD_ERROR: `Error fetching leaderboard`,
  LEADERBOARD_DELETED: `Leaderboard deleted successfully`,
  LEADERBOARD_UPDATED: `Leaderboard updated successfully`,
  LEADERBOARD_ADDED: `Leaderboard added successfully`,


  // Payment History
  BILLING_HISTORY_FETCHED: `Billing history fetched successfully`,
  BILLING_HISTORY_NOT_FOUND: `Billing history not found`,
  BILLING_HISTORY_ERROR: `Error fetching billing history`,
  BILLING_HISTORY_DELETED: `Billing history deleted successfully`,
  BILLING_HISTORY_UPDATED: `Billing history updated successfully`,
  BILLING_HISTORY_ADDED: `Billing history added successfully`,


  // Rewards
  REWARDS_FETCHED: `Rewards fetched successfully`,
  REWARD_NOT_FOUND: `Reward not found`,
  REWARD_ERROR: `Error fetching reward`,
  REWARD_DELETED: `Reward deleted successfully`,
  REWARD_UPDATED: `Reward updated successfully`,
  REWARD_ADDED: `Reward added successfully`,


};
