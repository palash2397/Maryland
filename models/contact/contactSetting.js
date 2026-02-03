import mongoose from "mongoose";

const contactSettingsSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const ContactSettings = mongoose.model("ContactSettings", contactSettingsSchema);
export default ContactSettings;
