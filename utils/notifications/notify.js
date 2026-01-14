// import { sendPushNotification } from "./sendPush.js";


// export const notifyUser = async ({
//   user,
//   title,
//   body,
//   data = {},
// }) => {
//   if (!user) return;

//   if (user.fcmToken) {
//     await sendPushNotification({
//       token: user.fcmToken,
//       title,
//       body,
//       data,
//     });
//   }

  
// //   if (Array.isArray(user.fcmTokens)) {
// //     for (const token of user.fcmTokens) {
// //       await sendPushNotification({
// //         token,
// //         title,
// //         body,
// //         data,
// //       });
// //     }
// //   }
// };
