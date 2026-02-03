// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Badge from "./models/badges/badge.js";

// dotenv.config();

// const badges = [
//   {
//     key: "FIRST_QUEST",
//     title: "First Quest Completed",
//     description: "Complete your first quest",
//     type: "quest",
//     conditionValue: 1,
//   },
//   {
//     key: "FIVE_QUESTS",
//     title: "Quest Explorer",
//     description: "Complete 5 quests",
//     type: "quest",
//     conditionValue: 5,
//   },
//   {
//     key: "LEVEL_3",
//     title: "Rising Star",
//     description: "Reach Level 3",
//     type: "level",
//     conditionValue: 3,
//   },
//   {
//     key: "LEVEL_5",
//     title: "Master Learner",
//     description: "Reach Level 5",
//     type: "level",
//     conditionValue: 5,
//   },
// ];

// const seedBadges = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     for (const badge of badges) {
//       await Badge.updateOne(
//         { key: badge.key },
//         { $setOnInsert: badge },
//         { upsert: true }
//       );
//     }

//     console.log("✅ Badges seeded successfully");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Error seeding badges:", error);
//     process.exit(1);
//   }
// };

// seedBadges();



import mongoose from "mongoose";
import dotenv from "dotenv";
import ContactSettings from "./models/contact/contactSetting.js";