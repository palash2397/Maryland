// import { firebaseAdmin } from "./firebase.js";

// export const sendPushNotification = async ({
//   token,
//   title,
//   body,
//   data = {},
// }) => {
//   if (!token) return;

//   const message = {
//     token,
//     notification: {
//       title,
//       body,
//     },
//     data: Object.fromEntries(
//       Object.entries(data).map(([k, v]) => [k, String(v)])
//     ),
//   };

//   try {
//     return await firebaseAdmin.messaging().send(message);
//   } catch (error) {
//     console.error("FCM send error:", error.message);
//   }
// };
