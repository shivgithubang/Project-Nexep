import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const CoverLetterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: String,
    jobDescription: String,
    companyName: String,
    jobTitle: String,
    status: { type: String, default: "draft" },
  },
  { timestamps: true }
);

export default models.CoverLetter || model("CoverLetter", CoverLetterSchema);
